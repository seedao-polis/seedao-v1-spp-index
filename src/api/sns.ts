import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { SNSService } from "./service/sns";
import { builtin } from "@seedao/sns-js";
import { safe } from "@seedao/sns-safe";

export namespace snsAPI {
  // `/sns/all`
  export async function all(req: Request, resp: Response) {
    // TODO
    resp.json({});
  }

  // uses:
  // 1. os-app MySNS page
  //
  // `/sns/list_by_wallet/:wallet`
  export async function listByWallet(req: Request, resp: Response) {
    const wallet: string = req.params.wallet;

    const client: PrismaClient = resp.locals.client;
    const snsList = await client.sNS.findMany({ where: { owner: wallet } });

    if (snsList == null) {
      resp.status(404).json({ error: "SNS not found" });
      return;
    }

    // filter sensitive words
    const safeNames = (
      await safe(
        snsList.map((sns) => sns.sns),
        builtin.SAFE_HOST,
      )
    ).filter((name) => name != "");
    const result = snsList.filter((sns) => safeNames.includes(sns.sns));

    resp.json(result);
  }

  // uses:
  // 1. sns-js-sdk `tokenId()` function
  //
  // `/sns/by_name?name=abc.seedao`
  export async function byName(req: Request, resp: Response) {
    const name: string = req.query.name as string;

    const client: PrismaClient = resp.locals.client;
    const sns = await client.sNS.findUnique({ where: { sns: name } });
    if (sns == null) {
      resp.status(404).json({ error: "SNS not found" });
      return;
    }

    // // check if contains sensitive words
    // if (await isSafe(sns.sns, builtin.SAFE_HOST)) {
    resp.json(sns);
    // } else {
    //   resp.status(404).json({ error: "SNS not safe" });
    // }
  }

  // uses:
  // 1. <no>
  //
  // `/sns/by_token_id/:tokenId`
  export async function byTokenId(req: Request, resp: Response) {
    const tokenId: string = req.params.tokenId;

    const client: PrismaClient = resp.locals.client;
    const sns = await SNSService.getByTokenId(client, tokenId);
    if (sns == null) {
      resp.status(404).json({ error: "SNS not found" });
      return;
    }

    // // check if contains sensitive words
    // if (await isSafe(sns.sns, builtin.SAFE_HOST)) {
    resp.json(sns);
    // } else {
    //   resp.status(404).json({ error: "SNS not safe" });
    // }
  }
}
