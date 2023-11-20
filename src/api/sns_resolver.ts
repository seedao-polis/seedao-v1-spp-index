import { Request, Response } from "express";
import {
  SNSAddressResolverService,
  SNSNameResolverService,
} from "./service/sns_resolver";
import { PrismaClient } from "@prisma/client";

export namespace snsResolverAPI {
  // `/resolver/get_address?name=abc.seedao`
  export async function address(req: Request, resp: Response) {
    const name: string = req.query.name as string;

    // don't handle normalize

    const client: PrismaClient = resp.locals.client;
    const r = await SNSAddressResolverService.getByName(client, name);
    if (r == null) {
      resp.status(404).json({ error: "Resolver not found" });
      return;
    }

    resp.set("Content-Type", "text/plain; charset=utf-8");
    resp.send(r.address);
  }

  // `/resolver/get_addresses`
  export async function addresses(req: Request, resp: Response) {
    const names: string[] = req.body;

    const client: PrismaClient = resp.locals.client;
    const r = await SNSAddressResolverService.getByNames(client, names);

    const t: Map<string, string> = new Map();
    r.forEach((v) => t.set(v.name, v.address));
    const result: string[] = [];
    names.forEach((v) => result.push(t.get(v) ?? ""));

    resp.json(result);
  }

  // `/resolver/get_name?address=0x123`
  export async function name(req: Request, resp: Response) {
    const address: string = req.query.address as string;

    const client: PrismaClient = resp.locals.client;
    const r = await SNSNameResolverService.getByAddress(client, address);
    if (r == null) {
      resp.status(404).json({ error: "Resolver not found" });
      return;
    }

    resp.set("Content-Type", "text/plain; charset=utf-8");
    resp.send(r.name);
  }

  // `/resolver/get_names`
  export async function names(req: Request, resp: Response) {
    const addresses: string[] = req.body;

    const client: PrismaClient = resp.locals.client;
    const r = await SNSNameResolverService.getByAddresses(client, addresses);

    const t: Map<string, string> = new Map();
    r.forEach((v) => t.set(v.address, v.name));
    const result: string[] = [];
    addresses.forEach((v) => result.push(t.get(v) ?? ""));

    resp.json(result);
  }
}
