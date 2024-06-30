import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";
import cron from "node-cron";
import { snsAPI } from "./api/sns";
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
import { ethers, WebSocketProvider } from "ethers";
import { WebSocket } from "ws";
import {
  findCharacterSet,
  getCodePointLength,
  getSegmentLength,
} from "./helper/sns_attr";
import { insightAPI } from "./api/insight";
import { snsSnapshotAPI } from "./api/sns_snapshot";
import { erc721SnapshotAPI } from "./api/erc721_snapshot";
import { erc20SnapshotAPI } from "./api/erc20_snapshot";
import { erc1155SnapshotAPI } from "./api/erc1155_snapshot";
import { seedImageAPI } from "./api/seed_image";
import {
  SNSAddressResolverService,
  SNSNameResolverService,
  SNSResolverAddrChangedTxService,
  SNSResolverNameChangedTxService,
} from "./api/service/sns_resolver";
import { snsResolverAPI } from "./api/sns_resolver";
import { clearInterval } from "timers";
import {
  ScoreLendBorrowTxService,
  ScoreLendPaybackTxService,
  ScoreLendService,
} from "./api/service/score_lend";
import { scoreLendAPI } from "./api/score_lend";

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

  // 'ERC20' 'ERC721' 'ERC1155' Contracts
  const ERC20Contracts: Contract[] = await Promise.all(
    conf.contracts.ERC20.map(async (c: ERC20Conf): Promise<Contract> => {
      const decimalD = new Prisma.Decimal(Math.pow(10, c.decimals));
      return {
        name: c.name,
        addr: c.addr,
        fromBlock: (contractAddr: string): Promise<number> => {
          return ERC20TokenTransferTxService.getLatestBlockNumber(
            client,
            contractAddr,
          );
        },
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
                timestamp: number;
                tx: string;
              };
              parameters: {
                from: string;
                to: string;
                value: Prisma.Decimal;
              };
            }[] = [];

            for (const param of params) {
              // [[from, to, value], , ]
              const from: string = param.args[0] as string;
              const to: string = param.args[1] as string;
              const value: Prisma.Decimal = new Prisma.Decimal(
                param.args[2].toString(),
              ).dividedBy(decimalD);

              console.log(
                `[${c.name}.Transfer] Event: ${from} ${to} ${value} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
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
                  timestamp: param.timestamp,
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
                    timestamp: param.timestamp,
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
        fromBlock: (contractAddr: string): Promise<number> => {
          return ERC721TokenTransferTxService.getLatestBlockNumber(
            client,
            contractAddr,
          );
        },
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
                timestamp: number;
                tx: string;
              };
              parameters: {
                from: string;
                to: string;
                tokenId: string;
              };
            }[] = [];
            for (const param of params) {
              // [[from, to, tokenId], , ]
              const from: string = param.args[0] as string;
              const to: string = param.args[1] as string;
              const tokenId: string = param.args[2].toString();

              console.log(
                `[${c.name}.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
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
                  timestamp: param.timestamp,
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
                    timestamp: param.timestamp,
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
                    param.timestamp,
                  );
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  metadata: {
                    blockNumber: param.blockNumber,
                    timestamp: param.timestamp,
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
        fromBlock: async (contractAddr: string): Promise<number> => {
          return Math.max(
            0,
            await ERC1155TokenTransferSingleTxService.getLatestBlockNumber(
              client,
              c.addr,
            ),
            await ERC1155TokenTransferBatchTxService.getLatestBlockNumber(
              client,
              c.addr,
            ),
          );
        }, // use the biggest block number of `TransferSingle` and `TransferBatch` events
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
                timestamp: number;
                tx: string;
              };
              parameters: {
                operator: string;
                from: string;
                to: string;
                ids: string[];
                values: bigint[];
              };
            }[] = [];
            for (const param of params) {
              // [[operator, from, to, id, value], , ]
              const operator: string = param.args[0] as string;
              const from: string = param.args[1] as string;
              const to: string = param.args[2] as string;
              const id: string = param.args[3].toString();
              const value: bigint = param.args[4] as bigint;

              console.log(
                `[${c.name}.TransferSingle] Event: ${operator} ${from} ${to} ${id} ${value} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
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
                  timestamp: param.timestamp,
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
                    timestamp: param.timestamp,
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
                timestamp: number;
                tx: string;
              };
              parameters: {
                operator: string;
                from: string;
                to: string;
                ids: string[];
                values: bigint[];
              };
            }[] = [];
            for (const param of params) {
              // [[operator, from, to, ids, values], , ]
              const operator: string = param.args[0] as string;
              const from: string = param.args[1] as string;
              const to: string = param.args[2] as string;
              const ids: string[] = (param.args[3] as bigint[]).map((id) => {
                return id.toString();
              });
              const values: bigint[] = param.args[4] as bigint[];

              console.log(
                `[${c.name}.TransferBatch] Event: ${operator} ${from} ${to} ${ids} ${values} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
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
                  timestamp: param.timestamp,
                  handler: handler,
                  paramOperator: operator,
                  paramFrom: from,
                  paramTo: to,
                  paramIds: ids.join("##"), // convert array to string
                  paramValues: values.join("##"),
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
                    timestamp: param.timestamp,
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
  // 'SeeDAORegistrarController' 'BaseRegistrar' Contract
  const snsConf = conf.contracts.NO_ERC_STD.sns;
  const SNSContracts: Contract[] = [
    {
      name: "SeeDAORegistrarController",
      addr: snsConf.SeeDAORegistrarController.addr,
      fromBlock: (_: string): Promise<number> => {
        return SNSNameregisteredTxService.getLatestBlockNumber(client);
      },
      abi: [
        "event NameRegistered(uint256 indexed id, string name, address owner)",
      ],
      chainRPC: snsConf.chainRPC,
      events: ["NameRegistered"],
      callbacks: [
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              timestamp: number;
              tx: string;
            };
            parameters: {
              from: string;
              to: string;
              tokenId: string;
              sns: string;
            };
          }[] = [];

          for (const param of params) {
            // [[id, name, owner], , ]
            const tokenId: string = param.args[0].toString();
            const name: string = param.args[1] as string;
            const owner: string = param.args[2] as string;

            console.log(
              `[SeeDAORegistrarController.NameRegistered] Event: ${tokenId} ${name} ${owner} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
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
                timestamp: param.timestamp,
                handler: handler,
                paramName: name,
                paramOwner: owner,
              });

              // save data
              await SNSService.create(client, {
                tokenId: tokenId,
                sns: name + ".seedao",
                owner: owner,
                registeredDate: param.timestamp,
                length: getCodePointLength(name),
                segmentLength: getSegmentLength(name),
                characterSet: findCharacterSet(name),
              });

              // add to unHandleEvents
              unHandleEvents.push({
                metadata: {
                  blockNumber: param.blockNumber,
                  timestamp: param.timestamp,
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
                `[SeeDAORegistrarController.NameRegistered] Event: ${tokenId} ${name} ${owner} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
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
                contractAddress: snsConf.SeeDAORegistrarController.addr,
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
      addr: snsConf.BaseRegistrar.addr,
      fromBlock: (_: string): Promise<number> => {
        return ERC721TokenTransferTxService.getLatestBlockNumber(
          client,
          snsConf.BaseRegistrar.addr,
        );
      },
      abi: [
        "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
      ],
      chainRPC: snsConf.chainRPC,
      events: ["Transfer"],
      callbacks: [
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              timestamp: number;
              tx: string;
            };
            parameters: {
              from: string;
              to: string;
              tokenId: string;
              sns: string;
            };
          }[] = [];

          for (const param of params) {
            // [[from, to, tokenId], , ]
            const from: string = param.args[0] as string;
            const to: string = param.args[1] as string;
            const tokenId: string = param.args[2].toString();

            console.log(
              `[BaseRegistrar.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
            );

            // check if the event has been handled
            const transferTx =
              await ERC721TokenTransferTxService.getByContractAndTxAndHandler(
                client,
                snsConf.BaseRegistrar.addr,
                param.tx,
                from,
                to,
                tokenId,
                toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
              );
            if (transferTx == null) {
              // save tx
              await ERC721TokenTransferTxService.create(client, {
                contractAddress: snsConf.BaseRegistrar.addr,
                tx: param.tx,
                blockNumber: param.blockNumber,
                timestamp: param.timestamp,
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
                  await SNSService.updateOwnerByTokenId(
                    client,
                    tokenId,
                    to,
                    param.timestamp,
                  );
                }

                // add to unHandleEvents
                unHandleEvents.push({
                  metadata: {
                    blockNumber: param.blockNumber,
                    timestamp: param.timestamp,
                    tx: param.tx,
                  },
                  parameters: {
                    from: from,
                    to: to,
                    tokenId: tokenId,
                    sns: sns.sns,
                  },
                });
              }
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
                contractAddress: snsConf.BaseRegistrar.addr,
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
  // 'PublicResolver' Contract
  const resolverConf = conf.contracts.NO_ERC_STD.sns_resolver;
  const snsResolver: Contract[] = [
    {
      name: "PublicResolver",
      addr: resolverConf.PublicResolver.addr,
      fromBlock: async (_: string): Promise<number> => {
        return Math.max(
          0,
          await SNSResolverAddrChangedTxService.getLatestBlockNumber(client),
          await SNSResolverNameChangedTxService.getLatestBlockNumber(client),
        );
      },
      abi: [
        "event AddrChanged(bytes32 indexed node, address a)",
        "event NameChanged(bytes32 indexed node, string name)",
      ],
      chainRPC: resolverConf.chainRPC,
      events: ["AddrChanged", "NameChanged"],
      callbacks: [
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              timestamp: number;
              tx: string;
            };
            parameters: {
              node: string;
              address: string;
            };
          }[] = [];

          for (const param of params) {
            // [[node, address], , ]
            const node: string = param.args[0] as string;
            const address: string = param.args[1] as string;

            console.log(
              `[PublicResolver.AddrChanged] Event: ${node} ${address} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
            );

            // check if the event has been handled
            const transferTx =
              await SNSResolverAddrChangedTxService.getByTxAndHandler(
                client,
                param.tx,
                node,
                address,
                toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
              );
            if (transferTx == null) {
              // save tx
              await SNSResolverAddrChangedTxService.create(client, {
                tx: param.tx,
                blockNumber: param.blockNumber,
                timestamp: param.timestamp,
                handler: handler,
                paramNode: node,
                paramA: address,
              });

              // save data
              if (
                (await SNSAddressResolverService.getByNode(client, node)) ==
                null
              ) {
                await SNSAddressResolverService.create(client, {
                  node: node,
                  address: address,
                });
              } else {
                await SNSAddressResolverService.updateByNode(
                  client,
                  node,
                  address,
                );
              }

              // add to unHandleEvents
              unHandleEvents.push({
                metadata: {
                  blockNumber: param.blockNumber,
                  timestamp: param.timestamp,
                  tx: param.tx,
                },
                parameters: {
                  node,
                  address,
                },
              });
            } else {
              console.log(
                `[PublicResolver.AddrChanged] Event: ${node} ${address} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
              );
            }
          }

          // send webhook
          if (
            unHandleEvents.length != 0 &&
            resolverConf.webhooks.AddrChanged.length != 0
          ) {
            await sendWebhook(
              {
                contractName: "PublicResolver",
                contractAddress: resolverConf.PublicResolver.addr,
                event: "AddrChanged",
                data: unHandleEvents,
              },
              resolverConf.webhooks.AddrChanged,
            );
          }
        },
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              timestamp: number;
              tx: string;
            };
            parameters: {
              node: string;
              name: string;
            };
          }[] = [];

          for (const param of params) {
            // [[node, name], , ]
            const node: string = param.args[0] as string;
            const name: string = param.args[1] as string;

            console.log(
              `[PublicResolver.NameChanged] Event: ${node} ${name} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
            );

            // check if the event has been handled
            const transferTx =
              await SNSResolverNameChangedTxService.getByTxAndHandler(
                client,
                param.tx,
                node,
                name,
                toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
              );
            if (transferTx == null) {
              // save tx
              await SNSResolverNameChangedTxService.create(client, {
                tx: param.tx,
                blockNumber: param.blockNumber,
                timestamp: param.timestamp,
                handler: handler,
                paramNode: node,
                paramName: name,
              });

              // save data
              if (
                (await SNSNameResolverService.getByNode(client, node)) == null
              ) {
                await SNSNameResolverService.create(client, {
                  node: node,
                  name: name,
                });
              } else {
                await SNSNameResolverService.updateByNode(client, node, name);
              }

              // add to unHandleEvents
              unHandleEvents.push({
                metadata: {
                  blockNumber: param.blockNumber,
                  timestamp: param.timestamp,
                  tx: param.tx,
                },
                parameters: {
                  node,
                  name,
                },
              });
            } else {
              console.log(
                `[PublicResolver.NameChanged] Event: ${node} ${name} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
              );
            }
          }

          // send webhook
          if (
            unHandleEvents.length != 0 &&
            resolverConf.webhooks.NameChanged.length != 0
          ) {
            await sendWebhook(
              {
                contractName: "PublicResolver",
                contractAddress: resolverConf.PublicResolver.addr,
                event: "NameChanged",
                data: unHandleEvents,
              },
              resolverConf.webhooks.NameChanged,
            );
          }
        },
      ],
    },
  ];
  // 'ScoreLend' Contract
  const scoreLendConf = conf.contracts.NO_ERC_STD.score_lend;
  const scoreLend: Contract[] = [
    {
      name: "ScoreLend",
      addr: scoreLendConf.ScoreLend.addr,
      fromBlock: async (_: string): Promise<number> => {
        return Math.max(
          0,
          await ScoreLendBorrowTxService.getLatestBlockNumber(client),
          await ScoreLendPaybackTxService.getLatestBlockNumber(client),
        );
      },
      abi: [
        "event Borrow(uint256 indexed id, address indexed debtor, address indexed borrowToken, uint256 borrowAmount, uint256 mortgageSCRAmount, uint256 interestRate, uint8 interestRateDecimals, uint256 borrowTimestamp, uint256 overdueTimestamp)",
        "event Payback(uint256 indexed id, uint256 interestDays, uint256 interestAmount)",
      ],
      chainRPC: scoreLendConf.chainRPC,
      events: ["Borrow", "Payback"],
      callbacks: [
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              timestamp: number;
              tx: string;
            };
            parameters: {
              id: string;
              debtor: string;
              borrowToken: string;
              borrowAmount: Prisma.Decimal;
              mortgageSCRAmount: Prisma.Decimal;
              interestRate: number;
              interestRateDecimals: number;
              borrowTimestamp: number;
              overdueTimestamp: number;
            };
          }[] = [];

          const scrDecimals = new Prisma.Decimal(
            Math.pow(10, scoreLendConf.ScoreLend.scrDecimals),
          );
          const usdtDecimals = new Prisma.Decimal(
            Math.pow(10, scoreLendConf.ScoreLend.usdtDecimals),
          );

          for (const param of params) {
            // [[id, debtor, borrowToken, borrowAmount, mortgageSCRAmount, interestRate, interestRateDecimals, borrowTimestamp, overdueTimestamp], , ]
            const id: string = param.args[0].toString();
            const debtor: string = param.args[1] as string;
            const borrowToken: string = param.args[2] as string;
            const borrowAmount: Prisma.Decimal = new Prisma.Decimal(
              param.args[3].toString(),
            ).dividedBy(usdtDecimals);
            const mortgageSCRAmount: Prisma.Decimal = new Prisma.Decimal(
              param.args[4].toString(),
            ).dividedBy(scrDecimals);
            const interestRate: number = Number(param.args[5] as bigint);
            const interestRateDecimals: number = Number(
              param.args[6] as bigint,
            );
            const borrowTimestamp: number = Number(param.args[7] as bigint);
            const overdueTimestamp: number = Number(param.args[8] as bigint);

            console.log(
              `[ScoreLend.Borrow] Event: ${id} ${debtor} ${borrowToken} ${borrowAmount} ${mortgageSCRAmount} ${interestRate} ${interestRateDecimals} ${borrowTimestamp} ${overdueTimestamp} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
            );

            // check if the event has been handled
            const transferTx = await ScoreLendBorrowTxService.getByTxAndHandler(
              client,
              param.tx,
              id,
              toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
            );
            if (transferTx == null) {
              // save tx
              await ScoreLendBorrowTxService.create(client, {
                tx: param.tx,
                blockNumber: param.blockNumber,
                timestamp: param.timestamp,
                handler: handler,
                paramId: id,
                paramDebtor: debtor,
                paramBorrowToken: borrowToken,
                paramBorrowAmount: borrowAmount,
                paramMortgageSCRAmount: mortgageSCRAmount,
                paramInterestRate: interestRate,
                paramInterestRateDecimals: interestRateDecimals,
                paramBorrowTimestamp: borrowTimestamp,
                paramOverdueTimestamp: overdueTimestamp,
              });

              // save data
              if ((await ScoreLendService.getByLendId(client, id)) == null) {
                await ScoreLendService.create(client, {
                  lendId: id,
                  lendStatus: ScoreLendService.LEND_STATUS_IN_USE,
                  debtor,
                  borrowToken,
                  borrowAmount,
                  mortgageSCRAmount,
                  interestRate: new Prisma.Decimal(interestRate).dividedBy(
                    Math.pow(10, interestRateDecimals),
                  ),
                  borrowTimestamp,
                  borrowTx: param.tx,
                  overdueTimestamp,
                  paybackTimestamp: 0,
                  paybackTx: "",
                  interestDays: 0,
                  interestAmount: 0,
                });
              }

              // add to unHandleEvents
              unHandleEvents.push({
                metadata: {
                  blockNumber: param.blockNumber,
                  timestamp: param.timestamp,
                  tx: param.tx,
                },
                parameters: {
                  id,
                  debtor,
                  borrowToken,
                  borrowAmount,
                  mortgageSCRAmount,
                  interestRate,
                  interestRateDecimals,
                  borrowTimestamp,
                  overdueTimestamp,
                },
              });
            } else {
              console.log(
                `[ScoreLend.Borrow] Event: ${id} ${debtor} ${borrowToken} ${borrowAmount} ${mortgageSCRAmount} ${interestRate} ${interestRateDecimals} ${borrowTimestamp} ${overdueTimestamp} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
              );
            }
          }

          // send webhook
          if (
            unHandleEvents.length != 0 &&
            scoreLendConf.webhooks.Borrow.length != 0
          ) {
            await sendWebhook(
              {
                contractName: "ScoreLend",
                contractAddress: scoreLendConf.ScoreLend.addr,
                event: "Borrow",
                data: unHandleEvents,
              },
              scoreLendConf.webhooks.Borrow,
            );
          }
        },
        async (params, handler) => {
          const unHandleEvents: {
            metadata: {
              blockNumber: number;
              timestamp: number;
              tx: string;
            };
            parameters: {
              id: string;
              interestDays: number;
              interestAmount: Prisma.Decimal;
            };
          }[] = [];

          const usdtDecimals = new Prisma.Decimal(
            Math.pow(10, scoreLendConf.ScoreLend.usdtDecimals),
          );

          for (const param of params) {
            // [[id, interestDays, interestAmount], , ]
            const id: string = param.args[0].toString();
            const interestDays: number = Number(param.args[1] as bigint);
            const interestAmount: Prisma.Decimal = new Prisma.Decimal(
              param.args[2].toString(),
            ).dividedBy(usdtDecimals);

            console.log(
              `[ScoreLend.Payback] Event: ${id} ${interestDays} ${interestAmount} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
            );

            // check if the event has been handled
            const transferTx =
              await ScoreLendPaybackTxService.getByTxAndHandler(
                client,
                param.tx,
                id,
                toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
              );
            if (transferTx == null) {
              // save tx
              await ScoreLendPaybackTxService.create(client, {
                tx: param.tx,
                blockNumber: param.blockNumber,
                timestamp: param.timestamp,
                handler: handler,
                paramId: id,
                paramInterestDays: interestDays,
                paramInterestAmount: interestAmount,
              });

              // save data
              if ((await ScoreLendService.getByLendId(client, id)) != null) {
                await ScoreLendService.updateToPaybackByLendId(
                  client,
                  id,
                  param.timestamp,
                  param.tx,
                  interestDays,
                  interestAmount,
                );
              }

              // add to unHandleEvents
              unHandleEvents.push({
                metadata: {
                  blockNumber: param.blockNumber,
                  timestamp: param.timestamp,
                  tx: param.tx,
                },
                parameters: {
                  id,
                  interestDays,
                  interestAmount,
                },
              });
            } else {
              console.log(
                `[ScoreLend.Payback] Event: ${id} ${interestDays} ${interestAmount} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
              );
            }
          }

          // send webhook
          if (
            unHandleEvents.length != 0 &&
            scoreLendConf.webhooks.Payback.length != 0
          ) {
            await sendWebhook(
              {
                contractName: "ScoreLend",
                contractAddress: scoreLendConf.ScoreLend.addr,
                event: "Payback",
                data: unHandleEvents,
              },
              scoreLendConf.webhooks.Payback,
            );
          }
        },
      ],
    },
    // {
    //   name: "MBLNFT",
    //   addr: scoreLendConf.MBLNFT.addr,
    //   fromBlock: (contractAddr: string): Promise<number> => {
    //     return ERC721TokenTransferTxService.getLatestBlockNumber(
    //       client,
    //       contractAddr,
    //     );
    //   },
    //   abi: [
    //     "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    //   ],
    //   chainRPC: scoreLendConf.chainRPC,
    //   events: ["Transfer"],
    //   callbacks: [
    //     async (params, handler) => {
    //       const unHandleEvents: {
    //         metadata: {
    //           blockNumber: number;
    //           timestamp: number;
    //           tx: string;
    //         };
    //         parameters: {
    //           from: string;
    //           to: string;
    //           tokenId: string;
    //         };
    //       }[] = [];
    //       for (const param of params) {
    //         // [[from, to, tokenId], , ]
    //         const from: string = param.args[0] as string;
    //         const to: string = param.args[1] as string;
    //         const tokenId: string = param.args[2].toString();
    //
    //         console.log(
    //           `[MBLNFT.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx} ${param.timestamp}`,
    //         );
    //
    //         // check if the event has been handled
    //         const transferTx =
    //           await ERC721TokenTransferTxService.getByContractAndTxAndHandler(
    //             client,
    //             scoreLendConf.MBLNFT.addr,
    //             param.tx,
    //             from,
    //             to,
    //             tokenId,
    //             toggle(handler), // when executing `query`, checking if the event has been handled by `on`, and vice versa
    //           );
    //         if (transferTx == null) {
    //           // save tx
    //           await ERC721TokenTransferTxService.create(client, {
    //             contractAddress: scoreLendConf.MBLNFT.addr,
    //             tx: param.tx,
    //             blockNumber: param.blockNumber,
    //             timestamp: param.timestamp,
    //             handler: handler,
    //             paramFrom: from,
    //             paramTo: to,
    //             paramTokenId: tokenId,
    //           });
    //
    //           // save data
    //           if (from === ethers.ZeroAddress) {
    //             await ERC721TokenService.create(client, {
    //               contractAddress: scoreLendConf.MBLNFT.addr,
    //               owner: to,
    //               tokenId: tokenId,
    //               timestamp: param.timestamp,
    //             });
    //           } else if (to === ethers.ZeroAddress) {
    //             await ERC721TokenService.deleteByContractAndTokenId(
    //               client,
    //               scoreLendConf.MBLNFT.addr,
    //               tokenId,
    //             );
    //           } else {
    //             await ERC721TokenService.updateOwnerByContractAndTokenId(
    //               client,
    //               scoreLendConf.MBLNFT.addr,
    //               tokenId,
    //               to,
    //               param.timestamp,
    //             );
    //
    //             // ===== ScoreLend Special Logic =====
    //             await ScoreLendService.updateDebtorByLendIdAndOldDebtor(
    //               client,
    //               tokenId,
    //               from,
    //               to,
    //             );
    //             // ===== ScoreLend Special Logic =====
    //           }
    //
    //           // add to unHandleEvents
    //           unHandleEvents.push({
    //             metadata: {
    //               blockNumber: param.blockNumber,
    //               timestamp: param.timestamp,
    //               tx: param.tx,
    //             },
    //             parameters: {
    //               from: from,
    //               to: to,
    //               tokenId: tokenId,
    //             },
    //           });
    //         } else {
    //           console.log(
    //             `[MBLNFT.Transfer] Event: ${from} ${to} ${tokenId} ${param.blockNumber} ${param.tx} ALREADY HANDLED !!`,
    //           );
    //         }
    //       }
    //
    //       // send webhook
    //       if (
    //         unHandleEvents.length != 0 &&
    //         scoreLendConf.webhooks.Transfer.length != 0
    //       ) {
    //         await sendWebhook(
    //           {
    //             contractName: "MBLNFT",
    //             contractAddress: scoreLendConf.MBLNFT.addr,
    //             event: "Transfer",
    //             data: unHandleEvents,
    //           },
    //           scoreLendConf.webhooks.Transfer,
    //         );
    //       }
    //     },
    //   ],
    // },
  ];

  // subscribe events first, and then query history events
  const contracts = [
    ...ERC20Contracts,
    ...ERC721Contracts,
    ...ERC1155Contracts,
    ...SNSContracts,
    ...snsResolver,
    ...scoreLend,
  ];
  for (const contract of contracts) {
    // <+++++++++++++++++++++++++++++++++
    function createWebSocket() {
      const url = contract.chainRPC.startsWith("https://")
        ? contract.chainRPC.replace("https://", "wss://")
        : contract.chainRPC.replace("http://", "ws://");

      const ws = new WebSocket(url);
      // listen 'open' event and send 'ping' interval
      let ping: any;
      ws.on("open", () => {
        ping = setInterval(() => {
          // console.log(`Sending Websocket ping... [contract=${contract.name}]`);
          ws.send("ping");
        }, 4000); // keep alive
      });
      // listen 'close' event
      ws.on("close", () => {
        console.log(
          `WebSocket disconnected. Reconnecting... [contract=${contract.name}]`,
        );
        clearInterval(ping);
        setTimeout(async () => {
          // <--------------------
          const provider = new WebSocketProvider(createWebSocket());
          await subscribeNewEvents(contract, provider);
          // <--------------------
        }, 100);
      });
      // listen 'error' event
      ws.on("error", (e) => {
        console.log(
          `WebSocket error: [${e}]. Reconnecting... [contract=${contract.name}]`,
        );
        clearInterval(ping);
        setTimeout(async () => {
          // <--------------------
          const provider = new WebSocketProvider(createWebSocket());
          await subscribeNewEvents(contract, provider);
          // <--------------------
        }, 100);
      });

      return ws;
    }
    // <+++++++++++++++++++++++++++++++++
    // <--------------------
    const provider = new WebSocketProvider(createWebSocket());
    await subscribeNewEvents(contract, provider);
    // <--------------------

    await queryHistoryEvents(contract);
  }

  // executing 'queryHistoryEvents()' every 5 minutes
  // refer: https://www.npmjs.com/package/node-cron
  // cronExpression: "minute hour dayOfMonth month dayOfWeek"
  cron.schedule("*/5 * * * *", async () => {
    for (const contract of contracts) {
      console.log(
        `CronTask: executing 'queryHistoryEvents()'... [contract=${contract.name}]`,
      );
      await queryHistoryEvents(contract);
    }
  });

  // instance Express App
  const app = express();

  // middleware
  app.use(cors());
  app.use(express.json());
  app.use((req: Request, resp: Response, next: NextFunction) => {
    resp.locals.client = client;
    next();
  });
  // sns apis
  app.get("/sns/all", snsAPI.all);
  app.get("/sns/list_by_wallet/:wallet", snsAPI.listByWallet);
  app.get("/sns/by_token_id/:tokenId", snsAPI.byTokenId);
  app.get("/sns/by_name", snsAPI.byName);
  app.get("/sns/resolver/get_address", snsResolverAPI.address);
  app.post("/sns/resolver/get_addresses", snsResolverAPI.addresses);
  app.get("/sns/resolver/get_name", snsResolverAPI.name);
  app.post("/sns/resolver/get_names", snsResolverAPI.names);
  // seed apis
  app.get("/seed/images", seedImageAPI.images);

  // snapshot apis
  app.get("/snapshot/erc20/:contract/:timestamp", erc20SnapshotAPI.snapshot);
  app.get("/snapshot/erc721/:contract/:timestamp", erc721SnapshotAPI.snapshot);
  app.get(
    "/snapshot/erc1155/:contract/:timestamp",
    erc1155SnapshotAPI.snapshot,
  );
  app.get("/snapshot/sns/:timestamp", snsSnapshotAPI.snapshot);

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

  // ScoreLend apis
  app.get("/score_lend/total_borrow", scoreLendAPI.totalBorrow);
  app.get("/score_lend/lends", scoreLendAPI.lends);
  app.get("/score_lend/lend/:lendId", scoreLendAPI.lend);

  // start server
  app.listen(3000, () => {
    console.log(
      `${new Date().toString()} Server is running on http://localhost:3000`,
    );
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
