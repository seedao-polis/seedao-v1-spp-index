import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";

export namespace sns {
  const addr: string = "0x9B4941c54E2F9ABBD33be8C596277D5E11b62bA9";
  const ABI: string[] = ["event NameRegistered(string name, address owner)"];

  // history get all `NameRegistered` events start at `fromBlock`
  export async function history(
    fromBlock?: number,
  ): Promise<[name: string, owner: string][]> {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new JsonRpcProvider(
        "https://eth-sepolia.g.alchemy.com/v2/H43zK7UnIN2v7u2ZoTbizIPnXkylKIZl",
      ),
    );

    const filter = contract.filters.NameRegistered();
    const events = await contract.queryFilter(filter, fromBlock);
    return events.map((event) => {
      const result = contract.interface.decodeEventLog(
        "NameRegistered",
        event.data,
      );
      console.log(
        `History NameRegistered: ${result[0]} ${result[1]} ${event.blockNumber}`,
      );
      return [result[0], result[1]]; // named type: [name: string, owner: string]
    });
  }

  // subscribe new `NameRegistered` events
  export async function subscribe(
    callback: (name: string, owner: string, blockNumber: number) => void,
  ) {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new WebSocketProvider(
        "wss://eth-sepolia.g.alchemy.com/v2/H43zK7UnIN2v7u2ZoTbizIPnXkylKIZl",
      ),
    );

    await contract.on("NameRegistered", (name, owner, event) => {
      console.log(
        `New NameRegistered: ${name} ${owner} ${event.log.blockNumber}`,
      );
      callback(name, owner, event.log.blockNumber);
    });
  }
}
