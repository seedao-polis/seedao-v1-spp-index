import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";

export namespace scr {
  const addr: string = "0xc74DEE15a4700D5df797bDD3982EE649A3Bb8c6C";
  const ABI: string[] = [
    "event Transfer(address indexed,address indexed,uint256)",
  ];

  // history get all `Transfer` events start at `fromBlock`
  // `amount`'s decimals is `18`
  export async function history(
    fromBlock?: number,
  ): Promise<[from: string, to: string, amount: bigint][]> {
    const contract = new ethers.Contract(
      addr,
      ABI,
      new JsonRpcProvider(
        "https://eth-mainnet.g.alchemy.com/v2/FU0ujCat3OQd5hIqpddJ94SngVaeSxad",
      ),
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
        `History Transfer: ${result[0]} ${result[1]} ${result[2]} ${event.blockNumber}`,
      );
      return [result[0], result[1], result[2]]; // named type: [from: string, to: string, amount: bigint]
    });
  }

  // subscribe new `Transfer` events
  export async function subscribe(
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
      new WebSocketProvider(
        "wss://eth-sepolia.g.alchemy.com/v2/H43zK7UnIN2v7u2ZoTbizIPnXkylKIZl",
      ),
    );

    await contract.on("Transfer", (from, to, amount, event) => {
      console.log(
        `New Transfer: ${from} ${to} ${amount} ${event.log.blockNumber}`,
      );
      callback(from, to, amount, event.log.blockNumber);
    });
  }
}
