import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import {
  ERC1155TokenTransferBatchTxService,
  ERC1155TokenTransferSingleTxService,
} from "./service/erc1155";

export namespace erc1155SnapshotAPI {
  // `/snapshot/erc1155/:contract/:timestamp`
  export async function snapshot(req: Request, resp: Response) {
    const timestamp = Number(req.params.timestamp);
    const contract = req.params.contract;

    const client: PrismaClient = resp.locals.client;
    const tx1 = await ERC1155TokenTransferSingleTxService.getBeforeTimestamp(
      client,
      contract,
      timestamp,
    );
    const tx2 = await ERC1155TokenTransferBatchTxService.getBeforeTimestamp(
      client,
      contract,
      timestamp,
    );

    const snapshot = new Map<string, Map<string, bigint>>();
    tx1.forEach((tx) => {
      const fm = snapshot.get(tx.paramFrom);
      if (fm != undefined && fm.get(tx.paramId) != undefined) {
        fm!.set(tx.paramId, fm.get(tx.paramId)! - tx.paramValue);
      }

      if (tx.paramTo !== ethers.ZeroAddress) {
        const to = snapshot.get(tx.paramTo);
        if (to === undefined) {
          snapshot.set(
            tx.paramTo,
            new Map<string, bigint>().set(tx.paramId, tx.paramValue),
          );
        } else {
          if (to.get(tx.paramId) === undefined) {
            to.set(tx.paramId, tx.paramValue);
          } else {
            to.set(tx.paramId, to.get(tx.paramId)! - tx.paramValue);
          }
        }
      }
    });
    tx2.forEach((tx) => {
      const ids = tx.paramIds.split("##");
      const values = tx.paramValues.split("##").map((v) => BigInt(v));
      for (let i = 0; i < ids.length; i++) {
        const fm = snapshot.get(tx.paramFrom);
        if (fm != undefined && fm.get(ids[i]) != undefined) {
          fm!.set(ids[i], fm.get(ids[i])! - values[i]);
        }

        if (tx.paramTo !== ethers.ZeroAddress) {
          const to = snapshot.get(tx.paramTo);
          if (to === undefined) {
            snapshot.set(
              tx.paramTo,
              new Map<string, bigint>().set(ids[i], values[i]),
            );
          } else {
            if (to.get(ids[i]) === undefined) {
              to.set(ids[i], values[i]);
            } else {
              to.set(ids[i], to.get(ids[i])! - values[i]);
            }
          }
        }
      }
    });

    const result: { wallet: string; ids: string[]; values: bigint[] }[] = [];
    snapshot.forEach((value, key) => {
      let ids: string[] = [];
      let values: bigint[] = [];

      value.forEach((vl, id) => {
        ids.push(id);
        values.push(vl);
      });

      result.push({
        wallet: key,
        ids,
        values,
      });
    });

    resp.json(result);
  }
}
