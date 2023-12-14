import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { SNSNameregisteredTxService, SNSService } from "./service/sns";
import { ERC721TokenTransferTxService } from "./service/erc721";
import { ethers } from "ethers";

export namespace snsSnapshotAPI {
  // `/snapshot/sns/:timestamp`
  export async function snapshot(req: Request, resp: Response) {
    const timestamp = Number(req.params.timestamp);

    const client: PrismaClient = resp.locals.client;
    const nameRegisteredTx =
      await SNSNameregisteredTxService.getBeforeTimestamp(client, timestamp);
    const transferTx = await ERC721TokenTransferTxService.getBeforeTimestamp(
      client,
      "0x5f3BD0CE4445E96F2D7DCC4bbA883378EAD8E10f", // BaseRegistrar contract address
      timestamp,
    );

    const snapshot = new Map<string, Set<string>>();
    nameRegisteredTx.forEach((tx) => {
      const to = snapshot.get(tx.paramOwner);
      if (to === undefined) {
        snapshot.set(tx.paramOwner, new Set<string>([tx.paramName]));
      } else {
        to.add(tx.paramName);
        snapshot.set(tx.paramOwner, to);
      }
    });
    for (const tx of transferTx) {
      const sns =
        (await SNSService.getByTokenId(client, tx.paramTokenId))?.sns ?? "";

      if (tx.paramFrom !== ethers.ZeroAddress) {
        const from = snapshot.get(tx.paramFrom);
        if (from !== undefined) {
          from.delete(sns);
          snapshot.set(tx.paramFrom, from);
        }
      }

      if (tx.paramTo !== ethers.ZeroAddress) {
        const to = snapshot.get(tx.paramTo);
        if (to === undefined) {
          snapshot.set(tx.paramTo, new Set<string>([sns]));
        } else {
          to.add(sns);
          snapshot.set(tx.paramTo, to);
        }
      }
    }

    const result: { wallet: string; sns: string[] }[] = [];
    snapshot.forEach((value, key) => {
      result.push({
        wallet: key,
        sns: Array.from(value),
      });
    });

    resp.json(result);
  }
}
