import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
import conf from "../../conf.json";

interface ContractConf {
  name: string;
  addr: string;
  chainRPC: string;
  webhooks: {
    TransferEvent: string[];
  };
}

export namespace computeNodeSbtAPI {
  // /computenodesbt
  export async function getComputeNodeSbt(req: Request, resp: Response) {
    const client: PrismaClient = resp.locals.client;

    let node = 0;
    let sbt = 0;

    const nodeNums: number[] = await Promise.all(
      conf.contracts.ERC1155.map(async (c: ContractConf): Promise<number> => {
        if (c.name === "NODE") {
          const singleTxGroupBy =
            await client.eRC1155TokenTransferSingleTx.groupBy({
              where: {
                contractAddress: c.addr,
              },
              by: ["paramTo"],
            });

          const batchTxGroupBy =
            await client.eRC1155TokenTransferBatchTx.groupBy({
              where: {
                contractAddress: c.addr,
              },
              by: ["paramTo"],
            });

          let findMatch: { [key: string]: boolean } = {};
          let num = 0;
          for (let i = 0; i < singleTxGroupBy.length; i++) {
            const item = singleTxGroupBy[i];
            if (!findMatch[item.paramTo]) {
              findMatch[item.paramTo] = true;
              num += 1;
            }
          }
          for (let i = 0; i < batchTxGroupBy.length; i++) {
            const item = batchTxGroupBy[i];
            if (!findMatch[item.paramTo]) {
              findMatch[item.paramTo] = true;
              num += 1;
            }
          }

          return num;
        }
        return 0;
      }),
    );

    const sbtNums: number[] = await Promise.all(
      conf.contracts.ERC1155.map(async (c: ContractConf): Promise<number> => {
        if (c.name !== "NODE") {
          const singleTxGroupBy =
            await client.eRC1155TokenTransferSingleTx.groupBy({
              where: {
                contractAddress: c.addr,
              },
              by: ["paramTo"],
            });

          const batchTxGroupBy =
            await client.eRC1155TokenTransferBatchTx.groupBy({
              where: {
                contractAddress: c.addr,
              },
              by: ["paramTo"],
            });

          let findMatch: { [key: string]: boolean } = {};
          let num = 0;
          for (let i = 0; i < singleTxGroupBy.length; i++) {
            const item = singleTxGroupBy[i];
            if (!findMatch[item.paramTo]) {
              findMatch[item.paramTo] = true;
              num += 1;
            }
          }
          for (let i = 0; i < batchTxGroupBy.length; i++) {
            const item = batchTxGroupBy[i];
            if (!findMatch[item.paramTo]) {
              findMatch[item.paramTo] = true;
              num += 1;
            }
          }

          return num;
        }
        return 0;
      }),
    );

    for (let i = 0; i < nodeNums.length; i++) {
      node += nodeNums[i];
    }
    for (let i = 0; i < sbtNums.length; i++) {
      sbt += sbtNums[i];
    }

    resp.json({
      node,
      sbt,
    });
  }
}
