import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

export namespace snsAPI {
  // `/sns/all`
  export async function all(req: Request, resp: Response) {
    // TODO
    resp.json({});
  }

  // `/sns/by_name?name=abc.seedao`
  export async function byName(req: Request, resp: Response) {
    /*
     #swagger.tags = ['SNS']
     #swagger.summary = 'Get SNS by name'
     #swagger.path = '/sns/by_name'
     #swagger.method = 'get'
     #swagger.parameters['name'] = { in: query, type: 'string', description: 'SNS name' }
     */
    const name: string = req.query.name as string;

    const client: PrismaClient = resp.locals.client;
    const sns = await client.sns.findUnique({ where: { sns: name } });
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
    const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });
    if (sns == null) {
      resp.status(404).json({ error: "SNS not found" });
      return;
    }

    resp.json(sns);
  }
}
