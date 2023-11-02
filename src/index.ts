import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { snsAPI } from "./api/sns";
import { snsMetadataAPI } from "./api/sns_metadata";
import {
  Contract,
  queryHistoryEvents,
  subscribeNewEvents,
  toggle,
} from "./events";
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
  ERC1155TokenTransferSingleTxService,
  ERC1155TokenTransferBatchTxService,
} from "./api/service/erc1155";
import { SNSNameregisteredTxService, SNSService } from "./api/service/sns";
import { ethers } from "ethers";
import {
  findCharacterSet,
  getCodePointLength,
  getSegmentLength,
} from "./helper/sns_attr";
import { insightAPI } from "./api/insight";

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

async function main() {
  // @ts-ignore
  BigInt.prototype.toJSON = function () {
    return this.toString();
  };

  // init database
  const client = new PrismaClient();

  // contracts need to indexed
  const ERC20Contracts: Contract[] = await Promise.all(
    conf.contracts.ERC20.map(async (c: ERC20Conf): Promise<Contract> => {
      return {
        name: c.name,
        addr: c.addr,
        fromBlock: await ERC20TokenTransferTxService.getLatestBlockNumber(
          client,
          c.addr,
        ),
        abi: [
          "event Transfer(address indexed from, address indexed to, uint256 value)",
        ],
        chainRPC: c.chainRPC,
        events: ["Transfer"],
        callbacks: [
          async (params, handler) => {
            const unHandleEvents: {
              metadata: {
                blockNumber: number;
                tx: string;
              };
              parameters: {
                from: string;
                to: string;
                value: bigint;
              };
            }[] = [];

            for (const param of params) {
              // [[from, to, value], , ]
              const from: string = param.args[0] as string;
              const to: string = param.args[1] as string;
              const value: bigint = BigInt(1); // TODO
              //   ethers.parseEther(
              //   String(arg[2]),
              // );

              console.log(
                `[${c.name}.Transfer] Event: ${from} ${to} ${value} ${param.blockNumber} ${param.tx}`,
              );

              // check if the event has been handled
              const transferTx =
                await ERC20TokenTransferTxService.getByContractAndTxAndHandler(
                  client,
                  c.addr,
                  param.tx,
                  from,
                  to,
                  toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
                );
              if (transferTx == null) {
                // save tx
                await ERC20TokenTransferTxService.create(client, {
                  contractAddress: c.addr,
                  tx: param.tx,
                  blockNumber: param.blockNumber,
                  handler: handler,
                  paramFrom: from,
                  paramTo: to,
                  paramValue: value,
                });

                // save data
                if (from !== ethers.ZeroAddress) {
                  // `decrementAmount` for `from` address
                  await ERC20TokenService.decrementAmount(
                    client,
                    c.addr,
                    from,
                    value,
                  );
                }
                if (to !== ethers.ZeroAddress) {
                  const row = await ERC20TokenService.getByContractAndOwner(
                    client,
                    c.addr,
                    to,
                  );
                  if (row == null) {
                    // `create` for `to` address
                    await ERC20TokenService.create(client, {
                      contractAddress: c.addr,
                      owner: to,
                      amount: value,
                    });
                  } else {
                    // `incrementAmount` for `to` address
                    await ERC20TokenService.incrementAmount(
                      client,
                      c.addr,
                      to,
                      value,
                    );
                  }
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  metadata: {
                    blockNumber: param.blockNumber,
                    tx: param.tx,
                  },
                  parameters: {
                    from: from,
                    to: to,
                    value: value,
                  },
                });
              } else {
                console.log(
                  `[${c.name}.Transfer] Event: ${from} ${to} ${value} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
                );
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
                },
                c.webhooks.TransferEvent,
              );
            }
          },
        ],
      };
    }),
  );
  const ERC721Contracts: Contract[] = await Promise.all(
    conf.contracts.ERC721.map(async (c: ContractConf): Promise<Contract> => {
      return {
        name: c.name,
        addr: c.addr,
        fromBlock: await ERC721TokenTransferTxService.getLatestBlockNumber(
          client,
          c.addr,
        ),
        abi: [
          "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
        ],
        chainRPC: c.chainRPC,
        events: ["Transfer"],
        callbacks: [
          async (params, handler) => {
            const unHandleEvents: {
              metadata: {
                blockNumber: number;
                tx: string;
              };
              parameters: {
                from: string;
                to: string;
                tokenId: bigint;
              };
            }[] = [];
            for (const param of params) {
              // [[from, to, tokenId], , ]
              const from: string = param.args[0] as string;
              const to: string = param.args[1] as string;
              const tokenId: bigint = param.args[2] as bigint;

              console.log(
                `[${c.name}.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx}`,
              );

              // check if the event has been handled
              const transferTx =
                await ERC721TokenTransferTxService.getByContractAndTxAndHandler(
                  client,
                  c.addr,
                  param.tx,
                  from,
                  to,
                  tokenId,
                  toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
                );
              if (transferTx == null) {
                // save tx
                await ERC721TokenTransferTxService.create(client, {
                  contractAddress: c.addr,
                  tx: param.tx,
                  blockNumber: param.blockNumber,
                  handler: handler,
                  paramFrom: from,
                  paramTo: to,
                  paramTokenId: tokenId,
                });

                // save data
                if (from === ethers.ZeroAddress) {
                  await ERC721TokenService.create(client, {
                    contractAddress: c.addr,
                    owner: to,
                    tokenId: tokenId,
                  });
                } else if (to === ethers.ZeroAddress) {
                  await ERC721TokenService.deleteByContractAndTokenId(
                    client,
                    c.addr,
                    tokenId,
                  );
                } else {
                  await ERC721TokenService.updateOwnerByContractAndTokenId(
                    client,
                    c.addr,
                    tokenId,
                    to,
                  );
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  metadata: {
                    blockNumber: param.blockNumber,
                    tx: param.tx,
                  },
                  parameters: {
                    from: from,
                    to: to,
                    tokenId: tokenId,
                  },
                });
              } else {
                console.log(
                  `[${c.name}.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
                );
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
                },
                c.webhooks.TransferEvent,
              );
            }
          },
        ],
      };
    }),
  );
  const ERC1155Contracts: Contract[] = await Promise.all(
    conf.contracts.ERC1155.map(async (c: ContractConf): Promise<Contract> => {
      return {
        name: c.name,
        addr: c.addr,
        fromBlock: Math.max(
          0,
          await ERC1155TokenTransferSingleTxService.getLatestBlockNumber(
            client,
            c.addr,
          ),
          await ERC1155TokenTransferBatchTxService.getLatestBlockNumber(
            client,
            c.addr,
          ),
        ), // use the biggest block number of `TransferSingle` and `TransferBatch` events
        abi: [
          "event TransferSingle(address indexed operator, address indexed from, address indexed to, uint256 id, uint256 value)",
          "event TransferBatch(address indexed operator, address indexed from, address indexed to, uint256[] ids, uint256[] values)",
        ],
        chainRPC: c.chainRPC,
        events: ["TransferSingle", "TransferBatch"],
        callbacks: [
          async (params, handler) => {
            const unHandleEvents: {
              metadata: {
                blockNumber: number;
                tx: string;
              };
              parameters: {
                operator: string;
                from: string;
                to: string;
                ids: bigint[];
                values: bigint[];
              };
            }[] = [];
            for (const param of params) {
              // [[operator, from, to, id, value], , ]
              const operator: string = param.args[0] as string;
              const from: string = param.args[1] as string;
              const to: string = param.args[2] as string;
              const id: bigint = param.args[3] as bigint;
              const value: bigint = param.args[4] as bigint;

              console.log(
                `[${c.name}.TransferSingle] Event: ${operator} ${from} ${to} ${id} ${value} ${param.blockNumber} ${param.tx}`,
              );

              // check if the event has been handled
              const transferTx =
                await ERC1155TokenTransferSingleTxService.getByContractAndTxAndHandler(
                  client,
                  c.addr,
                  param.tx,
                  from,
                  to,
                  id,
                  toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
                );
              if (transferTx == null) {
                // save tx
                await ERC1155TokenTransferSingleTxService.create(client, {
                  contractAddress: c.addr,
                  tx: param.tx,
                  blockNumber: param.blockNumber,
                  handler: handler,
                  paramOperator: operator,
                  paramFrom: from,
                  paramTo: to,
                  paramId: id,
                  paramValue: value,
                });

                // save data
                if (from !== ethers.ZeroAddress) {
                  // `decrementValueByTokenId` for `from` address
                  await ERC1155TokenService.decrementValueByTokenId(
                    client,
                    c.addr,
                    id,
                    from,
                    value,
                  );
                }
                if (to !== ethers.ZeroAddress) {
                  let row =
                    await ERC1155TokenService.getByContractAndTokenIdAndOwner(
                      client,
                      c.addr,
                      id,
                      to,
                    );
                  if (row == null) {
                    // `create` for `to` address
                    await ERC1155TokenService.create(client, {
                      contractAddress: c.addr,
                      owner: to,
                      tokenId: id,
                      tokenValue: value,
                    });
                  } else {
                    // `incrementValueByTokenId` for `to` address
                    await ERC1155TokenService.incrementValueByTokenId(
                      client,
                      c.addr,
                      id,
                      to,
                      value,
                    );
                  }
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  metadata: {
                    blockNumber: param.blockNumber,
                    tx: param.tx,
                  },
                  parameters: {
                    operator: operator,
                    from: from,
                    to: to,
                    ids: [id], // convert string to array
                    values: [value],
                  },
                });
              } else {
                console.log(
                  `[${c.name}.TransferSingle] Event: ${operator} ${from} ${to} ${id} ${value} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
                );
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
                },
                c.webhooks.TransferEvent,
              );
            }
          },
          async (params, handler) => {
            const unHandleEvents: {
              metadata: {
                blockNumber: number;
                tx: string;
              };
              parameters: {
                operator: string;
                from: string;
                to: string;
                ids: bigint[];
                values: bigint[];
              };
            }[] = [];
            for (const param of params) {
              // [[operator, from, to, ids, values], , ]
              const operator: string = param.args[0] as string;
              const from: string = param.args[1] as string;
              const to: string = param.args[2] as string;
              const ids: bigint[] = param.args[3] as bigint[];
              const values: bigint[] = param.args[4] as bigint[];

              console.log(
                `[${c.name}.TransferBatch] Event: ${operator} ${from} ${to} ${ids} ${values} ${param.blockNumber} ${param.tx}`,
              );

              // check if the event has been handled
              const transferTx =
                await ERC1155TokenTransferBatchTxService.getByContractAndTxAndHandler(
                  client,
                  c.addr,
                  param.tx,
                  from,
                  to,
                  toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
                );
              if (transferTx == null) {
                // save tx
                await ERC1155TokenTransferBatchTxService.create(client, {
                  contractAddress: c.addr,
                  tx: param.tx,
                  blockNumber: param.blockNumber,
                  handler: handler,
                  paramOperator: operator,
                  paramFrom: from,
                  paramTo: to,
                  paramIds: ids.toString(), // convert array to string
                  paramValues: values.toString(),
                });

                // save data
                if (from === ethers.ZeroAddress) {
                  for (let i = 0; i < ids.length; i++) {
                    await ERC1155TokenService.create(client, {
                      contractAddress: c.addr,
                      owner: to,
                      tokenId: ids[i],
                      tokenValue: values[i],
                    });
                  }
                } else if (to === ethers.ZeroAddress) {
                  for (let i = 0; i < ids.length; i++) {
                    // `decrementValueByTokenId` for `from` address
                    await ERC1155TokenService.decrementValueByTokenId(
                      client,
                      c.addr,
                      ids[i],
                      from,
                      values[i],
                    );
                  }
                } else {
                  for (let i = 0; i < ids.length; i++) {
                    // `decrementValueByTokenId` for `from` address
                    await ERC1155TokenService.decrementValueByTokenId(
                      client,
                      c.addr,
                      ids[i],
                      from,
                      values[i],
                    );

                    const row =
                      await ERC1155TokenService.getByContractAndTokenIdAndOwner(
                        client,
                        c.addr,
                        ids[i],
                        to,
                      );
                    if (row == null) {
                      // `create` for `to` address
                      await ERC1155TokenService.create(client, {
                        contractAddress: c.addr,
                        owner: to,
                        tokenId: ids[i],
                        tokenValue: values[i],
                      });
                    } else {
                      // `incrementValueByTokenId` for `to` address
                      await ERC1155TokenService.incrementValueByTokenId(
                        client,
                        c.addr,
                        ids[i],
                        to,
                        values[i],
                      );
                    }
                  }
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  metadata: {
                    blockNumber: param.blockNumber,
                    tx: param.tx,
                  },
                  parameters: {
                    operator: operator,
                    from: from,
                    to: to,
                    ids: ids, // `arg[3]` is array
                    values: values,
                  },
                });
              } else {
                console.log(
                  `[${c.name}.TransferBatch] Event: ${operator} ${from} ${to} ${ids} ${values} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
                );
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
                },
                c.webhooks.TransferEvent,
              );
            }
          },
        ],
      };
    }),
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
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              tx: string;
            };
            parameters: {
              from: string;
              to: string;
              tokenId: bigint;
              sns: string;
            };
          }[] = [];

          for (const param of params) {
            // [[name, owner], , ]
            const name: string = param.args[0] as string;
            const owner: string = param.args[1] as string;

            console.log(
              `[SeeDAORegistrarController.NameRegistered] Event: ${name} ${owner} ${param.blockNumber} ${param.tx}`,
            );

            // check if the event has been handled
            const transferTx =
              await SNSNameregisteredTxService.getByTxAndHandler(
                client,
                param.tx,
                name,
                owner,
                toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
              );
            if (transferTx == null) {
              // save tx
              await SNSNameregisteredTxService.create(client, {
                tx: param.tx,
                blockNumber: param.blockNumber,
                handler: handler,
                paramName: name,
                paramOwner: owner,
              });

              // save data
              const tokenId = BigInt(
                ethers.keccak256(ethers.toUtf8Bytes(name)),
              );
              await SNSService.create(client, {
                tokenId: tokenId,
                sns: name + ".seedao",
                owner: owner,
                registeredDate: BigInt(Date.now()),
                length: getCodePointLength(name),
                segmentLength: getSegmentLength(name),
                characterSet: findCharacterSet(name),
              });

              // add to unHandleEvents
              unHandleEvents.push({
                metadata: {
                  blockNumber: param.blockNumber,
                  tx: param.tx,
                },
                parameters: {
                  from: ethers.ZeroAddress,
                  to: owner,
                  tokenId: tokenId,
                  sns: name + ".seedao",
                },
              });
            } else {
              console.log(
                `[SeeDAORegistrarController.NameRegistered] Event: ${name} ${owner} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
              );
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
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              tx: string;
            };
            parameters: {
              from: string;
              to: string;
              tokenId: bigint;
              sns: string;
            };
          }[] = [];

          for (const param of params) {
            // [[from, to, tokenId], , ]
            const from: string = param.args[0] as string;
            const to: string = param.args[1] as string;
            const tokenId: bigint = param.args[2] as bigint;

            console.log(
              `[BaseRegistrar.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx}`,
            );

            // check if the event has been handled
            const transferTx =
              await ERC721TokenTransferTxService.getByContractAndTxAndHandler(
                client,
                snsConf.snsBaseRegistrar.addr,
                param.tx,
                from,
                to,
                tokenId,
                toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
              );
            if (transferTx == null) {
              // save tx
              await ERC721TokenTransferTxService.create(client, {
                contractAddress: snsConf.snsBaseRegistrar.addr,
                tx: param.tx,
                blockNumber: param.blockNumber,
                handler: handler,
                paramFrom: from,
                paramTo: to,
                paramTokenId: tokenId,
              });

              // save data
              const sns = await SNSService.getByTokenId(client, tokenId);
              if (sns == null) {
                return;
              }
              // Don't handle the event of minting
              if (from !== ethers.ZeroAddress) {
                if (to === ethers.ZeroAddress) {
                  await SNSService.deleteByTokenId(client, tokenId);
                } else {
                  await SNSService.updateOwnerByTokenId(client, tokenId, to);
                }
              }

              // add to unHandleEvents
              unHandleEvents.push({
                metadata: {
                  blockNumber: param.blockNumber,
                  tx: param.tx,
                },
                parameters: {
                  from: from,
                  to: to,
                  tokenId: tokenId,
                  sns: sns.sns,
                },
              });
            } else {
              console.log(
                `[BaseRegistrar.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
              );
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
  // insight apis
  app.get(
    "/insight/erc20/total_supply/:contractAddress",
    insightAPI.ERC20TotalSupply,
  );
  app.get(
    "/insight/erc721/total_supply/:contractAddress",
    insightAPI.ERC721TotalSupply,
  );
  app.get(
    "/insight/erc1155/total_supply_of_tokenId/:contractAddress/:tokenId",
    insightAPI.ERC1155TotalSupplyOfTokenId,
  );
  app.get(
    "/insight/erc1155/total_supply/:contractAddress",
    insightAPI.ERC1155TotalSupply,
  );

  // start server
  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
