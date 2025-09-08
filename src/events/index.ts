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
  fromBlock: (contractAddr: string) => Promise<number>;
  abi: string[];
  chainRPC: string;
  events: string[]; // want to listen events
  callbacks: ((
    param: CallbackParam[],
    handler: CallbackHandler,
  ) => Promise<void>)[]; // callbacks for wanting to listen events
}

// blockCount 指定需要索引的区块数量，0表示全部
export async function queryHistoryEvents(contract: Contract, blockCount: number = 0) {
  if (contract.events.length == 0 || contract.callbacks.length == 0) {
    return;
  }

  if (contract.events.length != contract.callbacks.length) {
    throw new Error("events and callbacks length not match");
  }

  const provider = new JsonRpcProvider(contract.chainRPC);
  const fromBlock = await contract.fromBlock(contract.addr);
  let latestBlockNumber = await provider.getBlockNumber();
  latestBlockNumber =
    latestBlockNumber > fromBlock + 1 ? latestBlockNumber : fromBlock + 1;

  const c = new ethers.Contract(contract.addr, contract.abi, provider);

  // cache chain's block data
  const blocks = new Map<number, ethers.Block>();

  // Process events in batches of 500 blocks if the range is too large
  // const BATCH_SIZE = 450;
  const BATCH_SIZE = 10; // for fix "Under the Free tier plan, you can make eth_getLogs requests with up to a 10 block range. Based on your parameters, this block range should work: [0x48993ae, 0x48993b7]. Upgrade to PAYG for expanded block range."
  let startBlock = fromBlock + 1;

  if (blockCount != 0) {
    startBlock = latestBlockNumber - blockCount;
  }

  for (let i = 0; i < contract.events.length; i++) {
    console.log(
      `query ${contract.name}'s ${contract.events[i]} event from block[${startBlock}] to block[${latestBlockNumber}]`,
    );

    const filter = c.filters[contract.events[i]]();
    let allEvents: ethers.Log[] = [];

    if (latestBlockNumber - startBlock > BATCH_SIZE) {
      // Process in batches
      for (let currentBlock = startBlock; currentBlock < latestBlockNumber; currentBlock += BATCH_SIZE) {
        const endBlock = Math.min(currentBlock + BATCH_SIZE - 1, latestBlockNumber);
        console.log(`Processing batch from block[${currentBlock}] to block[${endBlock}]`);
        const batchEvents = await c.queryFilter(filter, currentBlock, endBlock);
        if (batchEvents.length == 0) {
          continue;
        }
        allEvents = allEvents.concat(batchEvents);
      }
    } else {
      // Process in single batch
      allEvents = await c.queryFilter(filter, startBlock, latestBlockNumber);
    }

    if (allEvents.length == 0) {
      continue;
    }

    const param: CallbackParam[] = [];
    for (const event of allEvents) {
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

export async function subscribeNewEvents(
  contract: Contract,
  provider: WebSocketProvider,
) {
  if (contract.events.length == 0 || contract.callbacks.length == 0) {
    return;
  }

  if (contract.events.length != contract.callbacks.length) {
    throw new Error("events and callbacks length not match");
  }

  // const provider = new WebSocketProvider(
  //   contract.chainRPC.startsWith("https://")
  //     ? contract.chainRPC.replace("https://", "wss://")
  //     : contract.chainRPC.replace("http://", "ws://"),
  // );

  const c = new ethers.Contract(contract.addr, contract.abi, provider);

  for (let i = 0; i < contract.events.length; i++) {
    console.log(`subscribe ${contract.name}'s ${contract.events[i]} event`);

    await c.on(contract.events[i], async (...args) => {
      // console.log(
      //   `${contract.name}'s New ${contract.events[i]} Event: ${args}`,
      // );
      console.log(
        `----- execute [NEW] ${
          contract.name
        }'s callback[${i}] (${new Date().toString()}) -----`,
      );
      const blockNumber = args[args.length - 1].log.blockNumber;
      const tx = args[args.length - 1].log.transactionHash;
      const timestamp =
        (await provider.getBlock(blockNumber))?.timestamp || Date.now();
      await contract.callbacks[i](
        [
          {
            args: [args.slice(0, args.length - 1)][0],
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
