import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";

export type CallbackParam = {
  args: any[];
  blockNumber: number;
  tx: string;
  timestamp: number;
};
export type CallbackHandler = "query" | "on"; // `query`: `Contract.queryFilter(...)`, `on`: `Contract.on(...)`

export function toggle(handler: CallbackHandler) {
  return handler == "query" ? "on" : "query";
}

export interface Contract {
  name: string;
  addr: string;
  fromBlock: number;
  abi: string[];
  chainRPC: string;
  events: string[]; // want to listen events
  callbacks: ((
    param: CallbackParam[],
    handler: CallbackHandler,
  ) => Promise<void>)[]; // callbacks for wanting to listen events
}

export async function queryHistoryEvents(contract: Contract) {
  if (contract.events.length == 0 || contract.callbacks.length == 0) {
    return;
  }

  if (contract.events.length != contract.callbacks.length) {
    throw new Error("events and callbacks length not match");
  }

  const provider = new JsonRpcProvider(contract.chainRPC);
  let latestBlockNumber = await provider.getBlockNumber();
  latestBlockNumber =
    latestBlockNumber > contract.fromBlock + 1
      ? latestBlockNumber
      : contract.fromBlock + 1;

  const c = new ethers.Contract(contract.addr, contract.abi, provider);

  // cache chain's block data
  const blocks = new Map<number, ethers.Block>();

  for (let i = 0; i < contract.events.length; i++) {
    console.log(
      `query ${contract.name}'s ${contract.events[i]} event from block[${
        contract.fromBlock + 1
      }] to block[${latestBlockNumber}]`,
    );

    const filter = c.filters[contract.events[i]]();
    const events = await c.queryFilter(
      filter,
      contract.fromBlock + 1,
      latestBlockNumber,
    );

    if (events.length == 0) {
      continue;
    }

    const param: CallbackParam[] = [];
    for (const event of events) {
      const result = c.interface.decodeEventLog(
        contract.events[i],
        event.data,
        event.topics,
      );
      // console.log(
      //   `${contract.name}'s History ${
      //     contract.events[i]
      //   } Event: ${result.toArray()} ${event.blockNumber} ${event.transactionHash}`,
      // );
      let block = blocks.get(event.blockNumber);
      if (block == undefined) {
        const b = await provider.getBlock(event.blockNumber);
        if (b == null) {
          throw new Error(`call 'getBlock(${event.blockNumber})' failed`);
        }

        block = b;
        // cache block data
        blocks.set(event.blockNumber, block);
        console.log(
          `save block[${event.blockNumber}] to cache, block's timestamp=${block.timestamp}`,
        );
        // } else {
        //   console.log(
        //     `get block[${event.blockNumber}] from cache, block's timestamp=${block.timestamp}`,
        //   );
      }

      param.push({
        args: result.toArray(),
        blockNumber: event.blockNumber,
        tx: event.transactionHash,
        timestamp: block!!.timestamp,
      });
    }
    console.log(
      `----- execute [HISTORY] ${contract.name}'s callback[${i}] (HistoryEventCount=${param.length}) -----`,
    );
    await contract.callbacks[i](param, "query");
  }
}

export async function subscribeNewEvents(contract: Contract) {
  if (contract.events.length == 0 || contract.callbacks.length == 0) {
    return;
  }

  if (contract.events.length != contract.callbacks.length) {
    throw new Error("events and callbacks length not match");
  }

  const provider = new WebSocketProvider(
    contract.chainRPC.startsWith("https://")
      ? contract.chainRPC.replace("https://", "wss://")
      : contract.chainRPC.replace("http://", "ws://"),
  );
  const c = new ethers.Contract(contract.addr, contract.abi, provider);

  for (let i = 0; i < contract.events.length; i++) {
    console.log(`subscribe ${contract.name}'s ${contract.events[i]} event`);

    await c.on(contract.events[i], async (...args) => {
      // console.log(
      //   `${contract.name}'s New ${contract.events[i]} Event: ${args}`,
      // );
      console.log(
        `----- execute [NEW] ${contract.name}'s callback[${i}] -----`,
      );
      const blockNumber = args[args.length - 1].log.blockNumber;
      const tx = args[args.length - 1].log.transactionHash;
      const timestamp =
        (await provider.getBlock(blockNumber))?.timestamp || Date.now();
      await contract.callbacks[i](
        [
          {
            args: [args.slice(0, args.length - 1)],
            blockNumber: blockNumber,
            tx: tx,
            timestamp: timestamp,
          },
        ],
        "on",
      );
    });
  }
}
