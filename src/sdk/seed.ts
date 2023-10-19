import { ethers, JsonRpcProvider, WebSocketProvider } from "ethers";

export namespace seed {
  const ABI: string[] = [
    "event Transfer(address indexed,address indexed,uint256 indexed)",
  ];

  export interface TransferEvent {
    from: string;
    to: string;
    tokenId: bigint;
    blockNumber: number;
  }

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
        tokenId: result[2],
        blockNumber: event.blockNumber,
      };
    });
  }

  export async function subscribe(
    addr: string,
    wsRPC: string,
    callback: (event: TransferEvent) => void,
  ) {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new WebSocketProvider(wsRPC),
    );

    await contract.on("Transfer", (from, to, tokenId, event) => {
      // console.log(
      //   `New Transfer Event: ${from} ${to} ${tokenId} ${event.log.blockNumber}`,
      // );
      callback({
        from: ethers.getAddress(from),
        to: ethers.getAddress(to),
        tokenId: tokenId,
        blockNumber: event.log.blockNumber,
      });
    });
  }
}
