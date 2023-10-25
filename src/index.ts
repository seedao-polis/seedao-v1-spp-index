import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { snsAPI } from "./api/sns";
import { snsMetadataAPI } from "./api/sns_metadata";
import { Contract, queryHistoryEvents, subscribeNewEvents } from "./events";
// @ts-ignore
import conf from "../conf.json";
import { sendWebhook } from "./webhook";

async function main() {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  // init database
  const client = new PrismaClient();

  //
  const contracts: Contract[] = [
    {
      name: "MMERC20",
      addr: conf.contracts.mmerc20.addr,
      fromBlock: 0,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Paused(address account)",
        "event Unpaused(address account)",
      ],
      chainRPC: conf.contracts.mmerc20.chainRPC,
      events: ["Transfer", "Paused", "Unpaused"],
      callbacks: [
        async (args, blockNumber) => {
          // [[from, to, value], , ]

          // save to database
          for (const arg of args) {
            console.log(
              `[Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber}`,
            );
          }

          // send webhook
          const params: { from: string; to: string; value: number }[] =
            args.map((arg) => {
              return {
                from: arg[0],
                to: arg[1],
                value: arg[2],
              };
            });
          await sendWebhook(
            {
              contract: "MMERC20",
              event: "Transfer",
              params,
              blockNumber,
            },
            conf.contracts.mmerc20.webhooks.Transfer,
          );
        },
        async (args, blockNumber) => {
          // [[account], , ]

          for (const arg of args) {
            console.log(`[Paused] Event: ${arg[0]} ${blockNumber}`);
          }
        },
        async (args, blockNumber) => {
          // [[account], , ]

          for (const arg of args) {
            console.log(`[Unpaused] Event: ${arg[0]} ${blockNumber}`);
          }
        },
      ],
    },
    {
      name: "SCR",
      addr: conf.contracts.scr.addr,
      fromBlock: 17998600,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 value)",
      ],
      chainRPC: conf.contracts.scr.chainRPC,
      events: ["Transfer"],
      callbacks: [
        async (args, blockNumber) => {
          // [[from, to, value], , ]

          // save to database
          for (const arg of args) {
            console.log(
              `[Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber}`,
            );
          }

          // send webhook
          const params: { from: string; to: string; value: number }[] =
            args.map((arg) => {
              return {
                from: arg[0],
                to: arg[1],
                value: arg[2],
              };
            });
          await sendWebhook(
            {
              contract: "SCR",
              event: "Transfer",
              params,
              blockNumber,
            },
            conf.contracts.scr.webhooks.Transfer,
          );
        },
      ],
    },
    {
      name: "SEED",
      addr: conf.contracts.seed.addr,
      fromBlock: 18360511,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ],
      chainRPC: conf.contracts.seed.chainRPC,
      events: ["Transfer"],
      callbacks: [
        async (args, blockNumber) => {
          // [[from, to, tokenId], , ]

          // save to database
          for (const arg of args) {
            console.log(
              `[Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber}`,
            );
          }

          // send webhook
          const params: { from: string; to: string; tokenId: number }[] =
            args.map((arg) => {
              return {
                from: arg[0],
                to: arg[1],
                tokenId: arg[2],
              };
            });
          await sendWebhook(
            {
              contract: "SEED",
              event: "Transfer",
              params,
              blockNumber,
            },
            conf.contracts.seed.webhooks.Transfer,
          );
        },
      ],
    },
    {
      name: "SNS_SeeDAORegistrarController",
      addr: conf.contracts.snsSeeDAORegistrarController.addr, // SeeDAORegistrarController's address
      fromBlock: 4526514,
      abi: ["event NameRegistered(string name, address owner)"],
      chainRPC: conf.contracts.snsSeeDAORegistrarController.chainRPC,
      events: ["NameRegistered"],
      callbacks: [
        async (args, blockNumber) => {
          // [[name, owner], , ]

          // save to database
          for (const arg of args) {
            console.log(
              `[NameRegistered] Event: ${arg[0]} ${arg[1]} ${blockNumber}`,
            );

            //   const tokenId = BigInt(
            //     ethers.keccak256(ethers.toUtf8Bytes(arg[0])),
            //   ).toString();
            //
            //   // TODO save latestBlockNumber to database
            //
            //   const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });
            //   if (sns === null) {
            //     await client.sns.create({
            //       data: {
            //         tokenId: tokenId,
            //         sns: arg[0] + ".seedao",
            //         owner: arg[1],
            //         registeredDate: Date.now(),
            //         length: getCodePointLength(arg[0]),
            //         segmentLength: getSegmentLength(arg[0]),
            //         characterSet: findCharacterSet(arg[0]),
            //       },
            //     });
            //   }
          }

          // send webhook
          const params: { name: string; owner: string }[] = args.map((arg) => {
            return {
              name: arg[0],
              owner: arg[1],
            };
          });
          await sendWebhook(
            {
              contract: "SNS",
              event: "NameRegistered",
              params,
              blockNumber,
            },
            conf.contracts.snsSeeDAORegistrarController.webhooks.NameRegistered,
          );
        },
      ],
    },
    {
      name: "SNS_BaseRegistrar",
      addr: conf.contracts.snsBaseRegistrar.addr, // BaseRegistrar's address
      fromBlock: 0,
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ],
      chainRPC: conf.contracts.snsBaseRegistrar.chainRPC,
      events: ["Transfer"],
      callbacks: [], // [async (args, blockNumber) => {}], // TODO implements this function
    },
  ];
  for (const contract of contracts) {
    await queryHistoryEvents(contract); // TODO read fromBlock from database
    await subscribeNewEvents(contract);
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
