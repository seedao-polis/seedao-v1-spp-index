import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ERC721TokenService } from "./service/erc721";

export namespace erc721SnapshotAPI {
  // `/erc721/snapshot/:contract/:timestamp`
  export async function snapshot(req: Request, resp: Response) {
    const timestamp = Number(req.params.timestamp);
    const contract = req.params.contract;

    const client: PrismaClient = resp.locals.client;
    const tokenList = await ERC721TokenService.getBeforeTimestamp(
      client,
      contract,
      timestamp,
    );

    resp.json(tokenList);
  }
}
