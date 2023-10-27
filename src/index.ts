import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { snsAPI } from "./api/sns";
import { snsMetadataAPI } from "./api/sns_metadata";
import { Contract, queryHistoryEvents, subscribeNewEvents } from "./events";
// @ts-ignore
import conf from "../conf.json";
import { sendWebhook } from "./webhook";
import { erc20TestTransferTxService } from "./api/service/erc20_test";
import { scrTransferTxService } from "./api/service/scr";
import { seedTransferTxService } from "./api/service/seed";
import {
  snsNameregisteredTxService,
  snsService,
  snsTransferTxService,
} from "./api/service/sns";
import { ethers } from "ethers";
import {
  findCharacterSet,
  getCodePointLength,
  getSegmentLength,
} from "./helper/sns_attr";

async function main() {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  // init database
  const client = new PrismaClient();

  // read latestBlockNumber from database
  const erc20TestTransferTxLatestBlockNumber: number =
    await erc20TestTransferTxService.getLatestBlockNumber(client);
  const scrTransferTxLatestBlockNumber: number =
    await scrTransferTxService.getLatestBlockNumber(client);
  const seedTransferTxLatestBlockNumber: number =
    await seedTransferTxService.getLatestBlockNumber(client);
  const snsNameregisteredTxLatestBlockNumber: number =
    await snsNameregisteredTxService.getLatestBlockNumber(client);
  const snsTransferTxLatestBlockNumber: number =
    await snsTransferTxService.getLatestBlockNumber(client);

  // prepare target contracts
  const contracts: Contract[] = [
    {
      name: "MMERC20",
      addr: conf.contracts.mmerc20.addr,
      fromBlock: erc20TestTransferTxLatestBlockNumber,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Paused(address account)",
        "event Unpaused(address account)",
      ],
      chainRPC: conf.contracts.mmerc20.chainRPC,
      events: ["Transfer", "Paused", "Unpaused"],
      callbacks: [
        async (args, blockNumber, tx) => {
          // [[from, to, value], , ]

          const unHandleEvents: { from: string; to: string; value: bigint }[] =
            [];

          for (const arg of args) {
            console.log(
              `[Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber} ${tx}`,
            );

            const transferTx = await erc20TestTransferTxService.getByTx(
              client,
              tx,
            );
            if (transferTx == null) {
              // save data

              // save tx
              await erc20TestTransferTxService.create(client, {
                id: 0,
                tx: tx,
                blockNumber: blockNumber,
                paramFrom: arg[0],
                paramTo: arg[1],
                paramValue: arg[2],
              });

              // add to unHandleEvents
              unHandleEvents.push({
                from: arg[0],
                to: arg[1],
                value: arg[2],
              });
            }
          }

          // send webhook
          if (unHandleEvents.length != 0) {
            await sendWebhook(
              {
                contract: "MMERC20",
                event: "Transfer",
                data: unHandleEvents,
                blockNumber,
                tx,
              },
              conf.contracts.mmerc20.webhooks.Transfer,
            );
          }
        },
        async (args, blockNumber, tx) => {
          // [[account], , ]

          for (const arg of args) {
            console.log(`[Paused] Event: ${arg[0]} ${blockNumber} ${tx}`);
          }
        },
        async (args, blockNumber, tx) => {
          // [[account], , ]

          for (const arg of args) {
            console.log(`[Unpaused] Event: ${arg[0]} ${blockNumber} ${tx}`);
          }
        },
      ],
    },
    {
      name: "SCR",
      addr: conf.contracts.scr.addr,
      fromBlock: scrTransferTxLatestBlockNumber,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ],
      chainRPC: conf.contracts.scr.chainRPC,
      events: ["Transfer"],
      callbacks: [
        async (args, blockNumber, tx) => {
          // [[from, to, value], , ]

          const unHandleEvents: { from: string; to: string; value: bigint }[] =
            [];

          for (const arg of args) {
            console.log(
              `[Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber} ${tx}`,
            );

            const transferTx = await scrTransferTxService.getByTx(client, tx);
            if (transferTx == null) {
              // save tx
              await scrTransferTxService.create(client, {
                id: 0,
                tx: tx,
                blockNumber: blockNumber,
                paramFrom: arg[0],
                paramTo: arg[1],
                paramValue: arg[2],
              });

              // save data TODO

              // add to unHandleEvents
              unHandleEvents.push({
                from: arg[0],
                to: arg[1],
                value: arg[2],
              });
            }
          }

          // send webhook
          if (unHandleEvents.length != 0) {
            await sendWebhook(
              {
                contract: "SCR",
                event: "Transfer",
                data: unHandleEvents,
                blockNumber,
                tx,
              },
              conf.contracts.scr.webhooks.Transfer,
            );
          }
        },
      ],
    },
    {
      name: "SEED",
      addr: conf.contracts.seed.addr,
      fromBlock: seedTransferTxLatestBlockNumber,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ],
      chainRPC: conf.contracts.seed.chainRPC,
      events: ["Transfer"],
      callbacks: [
        async (args, blockNumber, tx) => {
          // [[from, to, tokenId], , ]

          const unHandleEvents: {
            from: string;
            to: string;
            tokenId: string;
          }[] = [];
          for (const arg of args) {
            console.log(
              `[Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber} ${tx}`,
            );

            const transferTx = await seedTransferTxService.getByTx(client, tx);
            if (transferTx == null) {
              // save data TODO

              // save tx
              await seedTransferTxService.create(client, {
                id: 0,
                tx: tx,
                blockNumber: blockNumber,
                paramFrom: arg[0],
                paramTo: arg[1],
                paramTokenId: arg[2],
              });

              // add to unHandleEvents
              unHandleEvents.push({
                from: arg[0],
                to: arg[1],
                tokenId: arg[2],
              });
            }
          }

          // send webhook
          if (unHandleEvents.length != 0) {
            await sendWebhook(
              {
                contract: "SEED",
                event: "Transfer",
                data: unHandleEvents,
                blockNumber,
                tx,
              },
              conf.contracts.seed.webhooks.Transfer,
            );
          }
        },
      ],
    },
    {
      name: "SNS_SeeDAORegistrarController",
      addr: conf.contracts.sns.snsSeeDAORegistrarController.addr, // SeeDAORegistrarController's address
      fromBlock: snsNameregisteredTxLatestBlockNumber,
      abi: ["event NameRegistered(string name, address owner)"],
      chainRPC: conf.contracts.sns.snsSeeDAORegistrarController.chainRPC,
      events: ["NameRegistered"],
      callbacks: [
        async (args, blockNumber, tx) => {
          // [[name, owner], , ]

          const unHandleEvents: { from: string; to: string; sns: string }[] =
            [];

          for (const arg of args) {
            console.log(
              `[NameRegistered] Event: ${arg[0]} ${arg[1]} ${blockNumber} ${tx}`,
            );

            // save tx
            await snsNameregisteredTxService.create(client, {
              id: 0,
              tx: tx,
              blockNumber: blockNumber,
              paramName: arg[0],
              paramOwner: arg[1],
            });

            // save data
            const tokenId = BigInt(
              ethers.keccak256(ethers.toUtf8Bytes(arg[0])),
            ).toString();
            await snsService.create(client, {
              id: 0,
              tokenId: tokenId,
              sns: arg[0] + ".seedao",
              owner: arg[1],
              registeredDate: BigInt(Date.now()),
              length: getCodePointLength(arg[0]),
              segmentLength: getSegmentLength(arg[0]),
              characterSet: findCharacterSet(arg[0]),
            });

            // add to unHandleEvents
            unHandleEvents.push({
              from: ethers.ZeroAddress,
              to: arg[1],
              sns: arg[0] + ".seedao",
            });
          }

          // send webhook
          if (unHandleEvents.length != 0) {
            await sendWebhook(
              {
                contract: "SNS",
                event: "Transfer", // NOTICE HERE!
                data: unHandleEvents,
                blockNumber,
                tx,
              },
              conf.contracts.sns.webhooks.Transfer,
            );
          }
        },
      ],
    },
    {
      name: "SNS_BaseRegistrar",
      addr: conf.contracts.sns.snsBaseRegistrar.addr, // BaseRegistrar's address
      fromBlock: snsTransferTxLatestBlockNumber,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ],
      chainRPC: conf.contracts.sns.snsBaseRegistrar.chainRPC,
      events: ["Transfer"],
      callbacks: [
        async (args, blockNumber, tx) => {
          // [[from, to, tokenId], , ]

          const unHandleEvents: { from: string; to: string; sns: string }[] =
            [];

          for (const arg of args) {
            console.log(
              `[Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber} ${tx}`,
            );

            // save tx
            await snsTransferTxService.create(client, {
              id: 0,
              tx: tx,
              blockNumber: blockNumber,
              paramFrom: arg[0],
              paramTo: arg[1],
              paramTokenId: arg[2],
            });

            // save data
            const sns = await snsService.getByTokenId(client, arg[2]);
            if (sns == null) {
              return;
            }
            // Don't handle the event of minting
            if (arg[0] !== ethers.ZeroAddress) {
              await snsService.updateOwnerByTokenId(client, arg[2], arg[1]);
            }

            // add to unHandleEvents
            unHandleEvents.push({
              from: arg[0],
              to: arg[1],
              sns: sns.sns,
            });
          }

          // send webhook
          // SeeDAORegistrarController's 'NameRegistered' Event and BaseRegistrar's 'Transfer' Event send to the same webhook
          if (unHandleEvents.length != 0) {
            await sendWebhook(
              {
                contract: "SNS",
                event: "Transfer", // NOTICE HERE!
                data: unHandleEvents,
                blockNumber,
                tx,
              },
              conf.contracts.sns.webhooks.Transfer,
            );
          }
        },
      ],
    },
  ];
  // subscribe events first, and then query history events
  for (const contract of contracts) {
    await subscribeNewEvents(contract);
    await queryHistoryEvents(contract);
  }

  // instance Express App
  const app = express();

  // middleware
  app.use((req: Request, resp: Response, next: NextFunction) => {
    resp.locals.client = client;
    next();
  });
  // sns apis
  app.get("/sns/all", snsAPI.all);
  app.get("/sns/by_token_id/:tokenId", snsAPI.byTokenId);
  app.get("/sns/by_name", snsAPI.byName);
  // sns metadata apis
  app.get("/metadata/:tokenId", snsMetadataAPI.metadata);
  app.get("/metadata/:tokenId/image", snsMetadataAPI.image);

  // start server
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
