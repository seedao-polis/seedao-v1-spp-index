import {
  ethers,
  WebSocketProvider,
  JsonRpcProvider,
} from "ethers";
import { SeepassAPI, UserChainData } from "./seepass_api";
import { SCRAddr } from "../addr_and_rpc";

export namespace scr {
  const ABI: string[] = [
    "event Transfer(address indexed,address indexed,uint256)",
  ];

  export interface TransferEvent {
    from: string;
    to: string;
    amount: bigint;
    blockNumber: number;
  }

  var userScrRecords: Record<string, bigint> = {};

  // history get all `Transfer` events start at `fromBlock`
  // `amount`'s decimals is `18`
  export async function history(
    addr: string,
    httpRPC: string,
    fromBlock?: number,
  ): Promise<TransferEvent[]> {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new JsonRpcProvider(httpRPC),
    );

    const filter = contract.filters.Transfer();
    const events = await contract.queryFilter(filter, fromBlock);
    return events.map((event) => {
      const result = contract.interface.decodeEventLog(
        "Transfer",
        event.data,
        event.topics,
      );
      // console.log(
      //   `History Transfer Event: ${result[0]} ${result[1]} ${result[2]} ${event.blockNumber}`,
      // );
      return {
        from: result[0],
        to: result[1],
        amount: result[2],
        blockNumber: event.blockNumber,
      };
    });
  }

  // subscribe new `Transfer` events
  export async function subscribe(
    addr: string,
    wsRPC: string,
    callback: (r: TransferEvent) => void,
  ) {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new WebSocketProvider(wsRPC),
    );

    await contract.on("Transfer", (from, to, amount, event) => {
      console.log(
        `New Transfer Event: ${from} ${to} ${amount} ${event.log.blockNumber}`,
      );
      callback({
        from: ethers.getAddress(from),
        to: ethers.getAddress(to),
        amount: amount,
        blockNumber: event.log.blockNumber,
      });
      // callback(from, to, amount, event.log.blockNumber);
    });
  }

  // Parse scr records collected by history or subscriber and filter out changed user data
  // The returned records will be used to generate seepass request to update user SCR amount in DB
  export function getUpdatedScrRecords(
    records: TransferEvent[],
  ): Record<string, bigint> {
    var changedScrAccounts: Record<string, boolean> = {};

    for (const r of records) {
      if (ethers.getAddress(r.from) === ethers.ZeroAddress) {
        if (userScrRecords[ethers.getAddress(r.to)] === undefined) {
          userScrRecords[ethers.getAddress(r.to)] = 0n;
        }
        userScrRecords[ethers.getAddress(r.to)] += r.amount;
        changedScrAccounts[ethers.getAddress(r.to)] = true;
      } else {
        console.log(`found transfer: ${r.from}, ${r.to}, ${r.amount}`);
        userScrRecords[ethers.getAddress(r.from)] -= r.amount;
        userScrRecords[ethers.getAddress(r.to)] += r.amount;
        changedScrAccounts[ethers.getAddress(r.from)] = true;
        changedScrAccounts[ethers.getAddress(r.to)] = true;
      }
    }

    var updatedRecords = Object.fromEntries(
      Object.entries(userScrRecords).filter((r) => {
        return changedScrAccounts[r[0]];
      }),
    );
    return updatedRecords;
  }

  // Buid Spp data service API request and update user's scr data
  export async function sendDataToSpp(
    seepassApi: SeepassAPI,
    updatedRecords: Record<string, bigint>,
  ) {
    const payload: UserChainData[] = Object.entries(updatedRecords).map((r) => {
      return {
        wallet: r[0],
        chainId: 1,
        contractAddr: SCRAddr,
        contractType: "erc20",
        amount: (r[1] / BigInt(10 ** 18)).toString(),
        tokenId: "",
        tokenUri: "",
        name: "SCR",
        symbol: "SCR",
      };
    });

    await seepassApi.batchUpdateUserChainAssets(payload);
  }
}
