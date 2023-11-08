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
      "0x6C679D0ca8C6e3692Ca033fab499242A94C257C2",
      timestamp,
    );

    const snapshot = new Map<string, Set<string>>();
    nameRegisteredTx.forEach((tx) => {
      const to = snapshot.get(tx.paramOwner);
      if (to === undefined) {
        snapshot.set(tx.paramOwner, new Set<string>([tx.paramName]));
      } else {
        to.add(tx.paramName);
      }
    });
    for (const tx of transferTx) {
      const sns =
        (await SNSService.getByTokenId(client, tx.paramTokenId))?.sns ?? "";

      snapshot.get(tx.paramFrom)?.delete(sns);
      if (tx.paramTo !== ethers.ZeroAddress) {
        const to = snapshot.get(tx.paramTo);
        if (to === undefined) {
          snapshot.set(tx.paramTo, new Set<string>([sns]));
        } else {
          to.add(sns);
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
