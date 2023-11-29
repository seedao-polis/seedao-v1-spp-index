import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { SNSService } from "./service/sns";

export namespace snsAPI {
  // `/sns/all`
  export async function all(req: Request, resp: Response) {
    // TODO
    resp.json({});
  }

  // `/sns/list_by_wallet/:wallet`
  export async function listByWallet(req: Request, resp: Response) {
    const wallet: string = req.params.wallet;

    const client: PrismaClient = resp.locals.client;
    const snsList = await client.sNS.findMany({ where: { owner: wallet } });

    if (snsList == null) {
      resp.status(404).json({ error: "SNS not found" });
      return;
    }

    resp.json(snsList);
  }

  // `/sns/by_name?name=abc.seedao`
  export async function byName(req: Request, resp: Response) {
    const name: string = req.query.name as string;

    const client: PrismaClient = resp.locals.client;
    const sns = await client.sNS.findUnique({ where: { sns: name } });
    if (sns == null) {
      resp.status(404).json({ error: "SNS not found" });
      return;
    }

    resp.json(sns);
  }

  // `/sns/by_token_id/:tokenId`
  export async function byTokenId(req: Request, resp: Response) {
    const tokenId: string = req.params.tokenId;

    const client: PrismaClient = resp.locals.client;
    const sns = await SNSService.getByTokenId(client, tokenId);
    if (sns == null) {
      resp.status(404).json({ error: "SNS not found" });
      return;
    }

    resp.json(sns);
  }
}
