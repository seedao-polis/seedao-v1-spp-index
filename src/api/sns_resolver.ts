import { Request, Response } from "express";
import {
  SNSAddressResolverService,
  SNSNameResolverService,
} from "./service/sns_resolver";
import { PrismaClient } from "@prisma/client";

export namespace snsResolverAPI {

  // ---------> !! all functions don't need to handle sensitive words, handled by sns-js sdk !!

  // `/resolver/get_address?node=namehash(abc.seedao)`
  export async function address(req: Request, resp: Response) {
    const node: string = req.query.node as string;

    // don't handle normalize

    const client: PrismaClient = resp.locals.client;
    const r = await SNSAddressResolverService.getByNode(client, node);

    resp.set("Content-Type", "text/plain; charset=utf-8");
    resp.send(
      r == null ? "0x0000000000000000000000000000000000000000" : r.address,
    );
  }

  // `/resolver/get_addresses`
  export async function addresses(req: Request, resp: Response) {
    const nodes: string[] = req.body; // all item are `namehash(YOUR_NAME.seedao)`

    const client: PrismaClient = resp.locals.client;
    const r = await SNSAddressResolverService.getByNodes(client, nodes);

    const t: Map<string, string> = new Map();
    r.forEach((v) => t.set(v.node, v.address));
    const result: string[] = [];
    nodes.forEach((v) =>
      result.push(t.get(v) ?? "0x0000000000000000000000000000000000000000"),
    );

    resp.json(result);
  }

  // `/resolver/get_name?node=namehash(0x123.addr.reverse)`
  export async function name(req: Request, resp: Response) {
    const node: string = req.query.node as string;

    const client: PrismaClient = resp.locals.client;
    const r = await SNSNameResolverService.getByNode(client, node);

    resp.set("Content-Type", "text/plain; charset=utf-8");
    resp.send(r == null ? "" : r.name);
  }

  // `/resolver/get_names`
  export async function names(req: Request, resp: Response) {
    const nodes: string[] = req.body; // all item are `namehash(YOUR_ADDR.addr.reverse)`

    const client: PrismaClient = resp.locals.client;
    const r = await SNSNameResolverService.getByNodes(client, nodes);

    const t: Map<string, string> = new Map();
    r.forEach((v) => t.set(v.node, v.name));
    const result: string[] = [];
    nodes.forEach((v) => result.push(t.get(v) ?? ""));

    resp.json(result);
  }
}
