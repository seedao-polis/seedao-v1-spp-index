import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";

export namespace scr {
  const ABI: string[] = [
    "event Transfer(address indexed,address indexed,uint256)",
  ];

  interface TransferEvent {
    from: string;
    to: string;
    amount: bigint;
    blockNumber: number;
  }

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
      // console.log(
      //   `New Transfer Event: ${from} ${to} ${amount} ${event.log.blockNumber}`,
      // );
      callback({
        from: ethers.getAddress(from),
        to: ethers.getAddress(to),
        amount: amount,
        blockNumber: event.log.blockNumber,
      });
    });
  }
}
