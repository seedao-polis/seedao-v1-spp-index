import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

// /sns/all
export async function snsAll(req: Request, resp: Response) {}

// /sns/by_token_id/:tokenId
export async function snsByTokenId(req: Request, resp: Response) {
  const tokenId: bigint = BigInt(req.params.tokenId);

  const client: PrismaClient = req.app.resource.client;
  const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });

  resp.json(sns);
}
