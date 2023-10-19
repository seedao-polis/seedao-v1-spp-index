import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";

export namespace sns {
  const ABI: string[] = ["event NameRegistered(string name, address owner)"];

  interface NameRegisteredEvent {
    name: string;
    owner: string;
    blockNumber: number;
  }

  // history get all `NameRegistered` events start at `fromBlock`
  export async function history(
    addr: string,
    httpRPC: string,
    fromBlock?: number,
  ): Promise<NameRegisteredEvent[]> {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new JsonRpcProvider(httpRPC),
    );

    const filter = contract.filters.NameRegistered();
    const events = await contract.queryFilter(filter, fromBlock);
    return events.map((event) => {
      const result = contract.interface.decodeEventLog(
        "NameRegistered",
        event.data,
        event.topics,
      );
      console.log(
        `History NameRegistered Event: ${result[0]} ${result[1]} ${event.blockNumber}`,
      );
      return {
        name: result[0],
        owner: result[1],
        blockNumber: event.blockNumber,
      };
    });
  }

  // subscribe new `NameRegistered` events
  export async function subscribe(
    addr: string,
    wsRPC: string,
    callback: (event: NameRegisteredEvent) => void,
  ) {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new WebSocketProvider(wsRPC),
    );

    await contract.on("NameRegistered", (name, owner, event) => {
      console.log(
        `New NameRegistered Event: ${name} ${owner} ${event.log.blockNumber}`,
      );
      callback({ name, owner, blockNumber: event.log.blockNumber });
    });
  }
}
