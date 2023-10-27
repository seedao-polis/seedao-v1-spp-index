import { ethers, WebSocketProvider, JsonRpcProvider } from "ethers";

export interface Contract {
  name: string;
  addr: string;
  fromBlock: number;
  abi: string[];
  chainRPC: string;
  events: string[];
  callbacks: ((
    args: any[][],
    blockNumber: number,
    tx: string,
  ) => Promise<void>)[];
}

export async function queryHistoryEvents(contract: Contract) {
  if (contract.events.length == 0 || contract.callbacks.length == 0) {
    return;
  }

  if (contract.events.length != contract.callbacks.length) {
    throw new Error("events and callbacks length not match");
  }

  const c = new ethers.Contract(
    contract.addr,
    contract.abi,
    new JsonRpcProvider(contract.chainRPC),
  );

  for (let i = 0; i < contract.events.length; i++) {
    console.log(
      `query ${contract.name}'s ${contract.events[i]} event from block [${contract.fromBlock}]`,
    );

    const filter = c.filters[contract.events[i]]();
    const events = await c.queryFilter(filter, contract.fromBlock);

    if (events.length == 0) {
      continue;
    }

    const args = events.map((event) => {
      const result = c.interface.decodeEventLog(
        contract.events[i],
        event.data,
        event.topics,
      );
      // console.log(
      //   `${contract.name}'s History ${
      //     contract.events[i]
      //   } Event: ${result.toArray()} ${event.blockNumber}`,
      // );
      return result.toArray();
    });
    console.log(
      `----- execute [HISTORY] ${contract.name}'s callback[${i}] -----`,
    );
    await contract.callbacks[i](
      args,
      events[events.length - 1].blockNumber,
      events[events.length - 1].transactionHash,
    );
  }
}

export async function subscribeNewEvents(contract: Contract) {
  if (contract.events.length == 0 || contract.callbacks.length == 0) {
    return;
  }

  if (contract.events.length != contract.callbacks.length) {
    throw new Error("events and callbacks length not match");
  }

  const c = new ethers.Contract(
    contract.addr,
    contract.abi,
    new WebSocketProvider(
      contract.chainRPC.startsWith("https://")
        ? contract.chainRPC.replace("https://", "wss://")
        : contract.chainRPC.replace("http://", "ws://"),
    ),
  );

  for (let i = 0; i < contract.events.length; i++) {
    console.log(`subscribe ${contract.name}'s ${contract.events[i]} event`);

    await c.on(contract.events[i], async (...args) => {
      // console.log(
      //   `${contract.name}'s New ${contract.events[i]} Event: ${args}`,
      // );
      console.log(`----- execute [NEW] ${contract.name}'s callback[${i}] -----`);
      await contract.callbacks[i](
        [args.slice(0, args.length - 1)],
        args[args.length - 1].log.blockNumber,
        args[args.length - 1].log.transactionHash,
      );
    });
  }
}
