import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";

export namespace scr {
  const ABI: string[] = [
    "event Transfer(address indexed,address indexed,uint256)",
  ];

  // history get all `Transfer` events start at `fromBlock`
  // `amount`'s decimals is `18`
  export async function history(
    addr: string,
    httpRPC: string,
    fromBlock?: number,
  ): Promise<
    [from: string, to: string, amount: bigint, blockNumber: number][]
  > {
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
      console.log(
        `History Transfer Event: ${result[0]} ${result[1]} ${result[2]} ${event.blockNumber}`,
      );
      return [result[0], result[1], result[2], event.blockNumber]; // named type: [from: string, to: string, amount: bigint, blockNumber: number]
    });
  }

  // subscribe new `Transfer` events
  export async function subscribe(
    addr: string,
    wsRPC: string,
    callback: (
      from: string,
      to: string,
      amount: bigint,
      blockNumber: number,
    ) => void,
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
      callback(from, to, amount, event.log.blockNumber);
    });
  }
}
