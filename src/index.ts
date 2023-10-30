import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { snsAPI } from "./api/sns";
import { snsMetadataAPI } from "./api/sns_metadata";
import { Contract, queryHistoryEvents, subscribeNewEvents } from "./events";
// @ts-ignore
import conf from "../conf.json";
import { sendWebhook } from "./webhook";
import {
  ERC20TokenService,
  ERC20TokenTransferTxService,
} from "./api/service/erc20";
import {
  ERC721TokenService,
  ERC721TokenTransferTxService,
} from "./api/service/erc721";
import {
  ERC1155TokenService,
  ERC1155TokenTransferTxService,
} from "./api/service/erc1155";
import { SNSNameregisteredTxService, SNSService } from "./api/service/sns";
import { ethers } from "ethers";
import {
  findCharacterSet,
  getCodePointLength,
  getSegmentLength,
} from "./helper/sns_attr";

interface ContractConf {
  name: string;
  addr: string;
  chainRPC: string;
  webhooks: {
    TransferEvent: string[];
  };
}

interface ERC20Conf extends ContractConf {
  decimals: number;
}

interface SNSConf {
  snsSeeDAORegistrarController: {
    addr: string;
    chainRPC: string;
  };
  snsBaseRegistrar: {
    addr: string;
    chainRPC: string;
  };
  webhooks: {
    TransferEvent: string[];
  };
}

async function main() {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  // init database
  const client = new PrismaClient();

  // contracts need to indexed
  const ERC20Contracts: Contract[] = conf.contracts.ERC20.map(
    (c: ERC20Conf) => {
      let latestBlockNumber = 0;
      ERC20TokenTransferTxService.getLatestBlockNumber(client, c.addr).then(
        (r) => {
          latestBlockNumber = r;
        },
      );

      return {
        name: c.name,
        addr: c.addr,
        fromBlock: latestBlockNumber,
        abi: [
          "event Transfer(address indexed from, address indexed to, uint256 value)",
        ],
        chainRPC: c.chainRPC,
        events: ["Transfer"],
        callbacks: [
          async (args, blockNumber, tx) => {
            // [[from, to, value], , ]

            const unHandleEvents: {
              from: string;
              to: string;
              value: bigint;
            }[] = [];

            for (const arg of args) {
              console.log(
                `[${c.name}.Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber} ${tx}`,
              );

              const transferTx =
                await ERC20TokenTransferTxService.getByContractAndTx(
                  client,
                  c.addr,
                  tx,
                );
              if (transferTx == null) {
                // save tx
                await ERC20TokenTransferTxService.create(client, {
                  id: 0,
                  contractAddress: c.addr,
                  tx: tx,
                  blockNumber: blockNumber,
                  paramFrom: arg[0],
                  paramTo: arg[1],
                  paramValue: arg[2],
                });

                // save data
                // don't forget to using `c.decimals`
                const value = ethers.parseUnits(arg[2], c.decimals);
                if (arg[0] === ethers.ZeroAddress) {
                  await ERC20TokenService.create(client, {
                    id: 0,
                    contractAddress: c.addr,
                    owner: arg[1],
                    amount: value,
                  });
                } else {
                  // `decrementAmount` for `from` address
                  await ERC20TokenService.decrementAmount(
                    client,
                    c.addr,
                    arg[0],
                    value,
                  );
                  // `incrementAmount` for `to` address
                  await ERC20TokenService.incrementAmount(
                    client,
                    c.addr,
                    arg[1],
                    value,
                  );
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  from: arg[0],
                  to: arg[1],
                  value: value,
                });
              }
            }

            // send webhook
            if (
              unHandleEvents.length != 0 &&
              c.webhooks.TransferEvent.length != 0
            ) {
              await sendWebhook(
                {
                  contractName: c.name,
                  contractAddress: c.addr,
                  event: "Transfer",
                  data: unHandleEvents,
                  blockNumber,
                  tx,
                },
                c.webhooks.TransferEvent,
              );
            }
          },
        ],
      };
    },
  );
  const ERC721Contracts: Contract[] = conf.contracts.ERC721.map(
    (c: ContractConf) => {
      let latestBlockNumber = 0;
      ERC721TokenTransferTxService.getLatestBlockNumber(client, c.addr).then(
        (r) => {
          latestBlockNumber = r;
        },
      );

      return {
        name: c.name,
        addr: c.addr,
        fromBlock: latestBlockNumber,
        abi: [
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        ],
        chainRPC: c.chainRPC,
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
                `[${c.name}.Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber} ${tx}`,
              );

              const transferTx =
                await ERC721TokenTransferTxService.getByContractAndTx(
                  client,
                  c.addr,
                  tx,
                );
              if (transferTx == null) {
                // save tx
                await ERC721TokenTransferTxService.create(client, {
                  id: 0,
                  contractAddress: c.addr,
                  tx: tx,
                  blockNumber: blockNumber,
                  paramFrom: arg[0],
                  paramTo: arg[1],
                  paramTokenId: arg[2],
                });

                // save data
                if (arg[0] === ethers.ZeroAddress) {
                  await ERC721TokenService.create(client, {
                    id: 0,
                    contractAddress: c.addr,
                    owner: arg[1],
                    tokenId: arg[2],
                  });
                } else {
                  await ERC721TokenService.updateOwnerByTokenId(
                    client,
                    c.addr,
                    arg[2],
                    arg[1],
                  );
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  from: arg[0],
                  to: arg[1],
                  tokenId: arg[2],
                });
              }
            }

            // send webhook
            if (
              unHandleEvents.length != 0 &&
              c.webhooks.TransferEvent.length != 0
            ) {
              await sendWebhook(
                {
                  contractName: c.name,
                  contractAddress: c.addr,
                  event: "Transfer",
                  data: unHandleEvents,
                  blockNumber,
                  tx,
                },
                c.webhooks.TransferEvent,
              );
            }
          },
        ],
      };
    },
  );
  const ERC1155Contracts: Contract[] = conf.contracts.ERC1155.map(
    (c: ContractConf) => {
      let latestBlockNumber = 0;
      ERC1155TokenTransferTxService.getLatestBlockNumber(client, c.addr).then(
        (r) => {
          latestBlockNumber = r;
        },
      );

      return {
        name: c.name,
        addr: c.addr,
        fromBlock: latestBlockNumber,
        abi: [
          "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
          "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
        ],
        chainRPC: c.chainRPC,
        events: ["TransferSingle", "TransferBatch"],
        callbacks: [
          async (args, blockNumber, tx) => {
            // [[operator, from, to, id, value], , ]

            const unHandleEvents: {
              operator: string;
              from: string;
              to: string;
              ids: string[];
              values: number[];
            }[] = [];
            for (const arg of args) {
              console.log(
                `[${c.name}.TransferSingle] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${arg[3]} ${arg[4]} ${blockNumber} ${tx}`,
              );

              const transferTx =
                await ERC1155TokenTransferTxService.getByContractAndTx(
                  client,
                  c.addr,
                  tx,
                );
              if (transferTx == null) {
                // save tx
                await ERC1155TokenTransferTxService.create(client, {
                  id: 0,
                  contractAddress: c.addr,
                  tx: tx,
                  blockNumber: blockNumber,
                  paramOperator: arg[0],
                  paramFrom: arg[1],
                  paramTo: arg[2],
                  paramIds: arg[3],
                  paramValues: arg[4],
                });

                // save data
                if (arg[1] === ethers.ZeroAddress) {
                  await ERC1155TokenService.create(client, {
                    id: 0,
                    contractAddress: c.addr,
                    owner: arg[2],
                    tokenId: arg[3],
                    tokenValue: arg[4],
                  });
                } else {
                  // `decrementValueByTokenId` for `from` address
                  await ERC1155TokenService.decrementValueByTokenId(
                    client,
                    c.addr,
                    arg[3],
                    arg[1],
                    BigInt(arg[4]),
                  );
                  // `incrementValueByTokenId` for `to` address
                  await ERC1155TokenService.incrementValueByTokenId(
                    client,
                    c.addr,
                    arg[3],
                    arg[2],
                    BigInt(arg[4]),
                  );
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  operator: arg[0],
                  from: arg[1],
                  to: arg[2],
                  ids: [arg[3]], // convert string to array
                  values: [arg[4]],
                });
              }
            }

            // send webhook
            if (
              unHandleEvents.length != 0 &&
              c.webhooks.TransferEvent.length != 0
            ) {
              await sendWebhook(
                {
                  contractName: c.name,
                  contractAddress: c.addr,
                  event: "Transfer",
                  data: unHandleEvents,
                  blockNumber,
                  tx,
                },
                c.webhooks.TransferEvent,
              );
            }
          },
          async (args, blockNumber, tx) => {
            // [[operator, from, to, ids, values], , ]

            const unHandleEvents: {
              operator: string;
              from: string;
              to: string;
              ids: string[];
              values: number[];
            }[] = [];
            for (const arg of args) {
              console.log(
                `[${c.name}.TransferBatch] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${arg[3]} ${arg[4]} ${blockNumber} ${tx}`,
              );

              const transferTx =
                await ERC1155TokenTransferTxService.getByContractAndTx(
                  client,
                  c.addr,
                  tx,
                );
              if (transferTx == null) {
                // save tx
                await ERC1155TokenTransferTxService.create(client, {
                  id: 0,
                  contractAddress: c.addr,
                  tx: tx,
                  blockNumber: blockNumber,
                  paramOperator: arg[0],
                  paramFrom: arg[1],
                  paramTo: arg[2],
                  paramIds: arg[3].toString(), // convert array to string
                  paramValues: arg[4].toString(),
                });

                // save data
                const ids = arg[3] as string[];
                const values = arg[4] as bigint[];
                if (arg[1] === ethers.ZeroAddress) {
                  for (let i = 0; i < ids.length; i++) {
                    await ERC1155TokenService.create(client, {
                      id: 0,
                      contractAddress: c.addr,
                      owner: arg[2],
                      tokenId: ids[i],
                      tokenValue: values[i],
                    });
                  }
                } else {
                  for (let i = 0; i < ids.length; i++) {
                    // `decrementValueByTokenId` for `from` address
                    await ERC1155TokenService.decrementValueByTokenId(
                      client,
                      c.addr,
                      ids[i],
                      arg[1],
                      values[i],
                    );
                    // `incrementValueByTokenId` for `to` address
                    await ERC1155TokenService.incrementValueByTokenId(
                      client,
                      c.addr,
                      ids[i],
                      arg[2],
                      values[i],
                    );
                  }
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  operator: arg[0],
                  from: arg[1],
                  to: arg[2],
                  ids: arg[3], // `arg[3]` is array
                  values: arg[4],
                });
              }
            }

            // send webhook
            if (
              unHandleEvents.length != 0 &&
              c.webhooks.TransferEvent.length != 0
            ) {
              await sendWebhook(
                {
                  contractName: c.name,
                  contractAddress: c.addr,
                  event: "Transfer",
                  data: unHandleEvents,
                  blockNumber,
                  tx,
                },
                c.webhooks.TransferEvent,
              );
            }
          },
        ],
      };
    },
  );
  const snsConf = conf.contracts.NO_ERC_STD.sns;
  const SNSContracts: Contract[] = [
    {
      name: "SeeDAORegistrarController",
      addr: snsConf.snsSeeDAORegistrarController.addr,
      fromBlock: await SNSNameregisteredTxService.getLatestBlockNumber(client),
      abi: ["event NameRegistered(string name, address owner)"],
      chainRPC: snsConf.snsSeeDAORegistrarController.chainRPC,
      events: ["NameRegistered"],
      callbacks: [
        async (args, blockNumber, tx) => {
          // [[name, owner], , ]

          const unHandleEvents: {
            from: string;
            to: string;
            tokenId: string;
            sns: string;
          }[] = [];

          for (const arg of args) {
            console.log(
              `[SeeDAORegistrarController.NameRegistered] Event: ${arg[0]} ${arg[1]} ${blockNumber} ${tx}`,
            );

            const transferTx = await SNSNameregisteredTxService.getByTx(
              client,
              tx,
            );
            if (transferTx == null) {
              // save tx
              await SNSNameregisteredTxService.create(client, {
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
              await SNSService.create(client, {
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
                tokenId: tokenId,
                sns: arg[0] + ".seedao",
              });
            }
          }

          // send webhook
          if (
            unHandleEvents.length != 0 &&
            snsConf.webhooks.TransferEvent.length != 0
          ) {
            await sendWebhook(
              {
                contractName: "SeeDAORegistrarController",
                contractAddress: snsConf.snsSeeDAORegistrarController.addr,
                event: "Transfer",
                data: unHandleEvents,
                blockNumber,
                tx,
              },
              snsConf.webhooks.TransferEvent,
            );
          }
        },
      ],
    },
    {
      name: "BaseRegistrar",
      addr: snsConf.snsBaseRegistrar.addr,
      fromBlock: await ERC20TokenTransferTxService.getLatestBlockNumber(
        client,
        snsConf.snsBaseRegistrar.addr,
      ),
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ],
      chainRPC: snsConf.snsBaseRegistrar.chainRPC,
      events: ["Transfer"],
      callbacks: [
        async (args, blockNumber, tx) => {
          // [[from, to, tokenId], , ]

          const unHandleEvents: {
            from: string;
            to: string;
            tokenId: string;
            sns: string;
          }[] = [];

          for (const arg of args) {
            console.log(
              `[BaseRegistrar.Transfer] Event: ${arg[0]} ${arg[1]} ${arg[2]} ${blockNumber} ${tx}`,
            );

            const transferTx =
              await ERC721TokenTransferTxService.getByContractAndTx(
                client,
                snsConf.snsBaseRegistrar.addr,
                tx,
              );
            if (transferTx == null) {
              // save tx
              await ERC721TokenTransferTxService.create(client, {
                id: 0,
                contractAddress: snsConf.snsBaseRegistrar.addr,
                tx: tx,
                blockNumber: blockNumber,
                paramFrom: arg[0],
                paramTo: arg[1],
                paramTokenId: arg[2],
              });

              // save data
              const sns = await SNSService.getByTokenId(client, arg[2]);
              if (sns == null) {
                return;
              }
              // Don't handle the event of minting
              if (arg[0] !== ethers.ZeroAddress) {
                await SNSService.updateOwnerByTokenId(client, arg[2], arg[1]);
              }

              // add to unHandleEvents
              unHandleEvents.push({
                from: arg[0],
                to: arg[1],
                tokenId: arg[2],
                sns: sns.sns,
              });
            }
          }

          // send webhook
          if (
            unHandleEvents.length != 0 &&
            snsConf.webhooks.TransferEvent.length != 0
          ) {
            await sendWebhook(
              {
                contractName: "BaseRegistrar",
                contractAddress: snsConf.snsBaseRegistrar.addr,
                event: "Transfer",
                data: unHandleEvents,
                blockNumber,
                tx,
              },
              snsConf.webhooks.TransferEvent,
            );
          }
        },
      ],
    },
  ];

  // subscribe events first, and then query history events
  const contracts = [
    ...ERC20Contracts,
    ...ERC721Contracts,
    ...ERC1155Contracts,
    ...SNSContracts,
  ];
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
