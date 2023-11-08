import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { ERC20TokenTransferTxService } from "./service/erc20";

export namespace erc20SnapshotAPI {
  // `/snapshot/erc20/:contract/:timestamp`
  export async function snapshot(req: Request, resp: Response) {
    const timestamp = Number(req.params.timestamp);
    const contract = req.params.contract;

    const client: PrismaClient = resp.locals.client;
    const txes = await ERC20TokenTransferTxService.getBeforeTimestamp(
      client,
      contract,
      timestamp,
    );

    const snapshot = new Map<string, Prisma.Decimal>();
    txes.forEach((tx) => {
      snapshot.get(tx.paramFrom)?.sub(tx.paramValue);
      if (tx.paramTo !== ethers.ZeroAddress) {
        const to = snapshot.get(tx.paramTo);
        if (to === undefined) {
          snapshot.set(tx.paramTo, tx.paramValue);
        } else {
          to.add(tx.paramValue);
        }
      }
    });

    const result: { wallet: string; value: string }[] = [];
    snapshot.forEach((value, key) => {
      result.push({
        wallet: key,
        value: value.valueOf(),
      });
    });

    resp.json(result);
  }
}
