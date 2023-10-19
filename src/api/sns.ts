import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

export namespace snsAPI {
  // `/sns/all`
  export async function all(req: Request, resp: Response) {
    // TODO
  }

  // `/sns/by_token_id/:tokenId`
  export async function byTokenId(req: Request, resp: Response) {
    const tokenId: string = req.params.tokenId;

    const client: PrismaClient = req.app.resource.client;
    const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });

    resp.json(sns);
  }
}
