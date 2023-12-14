import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ERC721TokenTransferTxService } from "./service/erc721";
import { ethers } from "ethers";

export namespace erc721SnapshotAPI {
  // `/snapshot/erc20/:contract/:timestamp`
  export async function snapshot(req: Request, resp: Response) {
    const timestamp = Number(req.params.timestamp);
    const contract = req.params.contract;

    const client: PrismaClient = resp.locals.client;
    const tx = await ERC721TokenTransferTxService.getBeforeTimestamp(
      client,
      contract,
      timestamp,
    );

    const snapshot = new Map<string, Set<string>>();
    tx.forEach((tx) => {
      if (tx.paramFrom !== ethers.ZeroAddress) {
        const from = snapshot.get(tx.paramFrom);
        if (from !== undefined) {
          from.delete(tx.paramTokenId);
          snapshot.set(tx.paramFrom, from);
        }
      }

      if (tx.paramTo !== ethers.ZeroAddress) {
        const to = snapshot.get(tx.paramTo);
        if (to === undefined) {
          snapshot.set(tx.paramTo, new Set<string>([tx.paramTokenId]));
        } else {
          to.add(tx.paramTokenId);
          snapshot.set(tx.paramTo, to);
        }
      }
    });

    const result: { wallet: string; ids: string[] }[] = [];
    snapshot.forEach((value, key) => {
      result.push({
        wallet: key,
        ids: Array.from(value),
      });
    });

    resp.json(result);
  }
}
