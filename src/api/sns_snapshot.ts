import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { SNSService } from "./service/sns";

export namespace snsSnapshotAPI {
  // `/sns/snapshot/:timestamp`
  export async function snapshot(req: Request, resp: Response) {
    const timestamp = Number(req.params.timestamp);

    const client: PrismaClient = resp.locals.client;
    const snsList = await SNSService.getBeforeTimestamp(client, timestamp);

    resp.json(snsList);
  }
}
