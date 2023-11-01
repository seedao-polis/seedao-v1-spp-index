import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ERC20TokenService } from "./service/erc20";
import { ERC721TokenService } from "./service/erc721";
import { ERC1155TokenService } from "./service/erc1155";

export namespace insightAPI {
  // `/insight/erc20/total_supply/:contractAddress`
  export async function ERC20TotalSupply(req: Request, resp: Response) {
    const contractAddress: string = req.params.contractAddress;

    const client: PrismaClient = resp.locals.client;
    const result = await ERC20TokenService.totalSupply(client, contractAddress);
    resp.json({ totalSupply: result });
  }

  // `/insight/erc721/total_supply/:contractAddress`
  export async function ERC721TotalSupply(req: Request, resp: Response) {
    const contractAddress: string = req.params.contractAddress;

    const client: PrismaClient = resp.locals.client;
    const result = await ERC721TokenService.totalSupply(
      client,
      contractAddress,
    );
    resp.json({ totalSupply: result });
  }

  // `/insight/erc1155/total_supply_of_tokenId/:contractAddress/:tokenId`
  export async function ERC1155TotalSupplyOfTokenId(
    req: Request,
    resp: Response,
  ) {
    const contractAddress: string = req.params.contractAddress;
    const tokenId: bigint = BigInt(req.params.tokenId);

    const client: PrismaClient = resp.locals.client;
    const result = await ERC1155TokenService.totalSupplyOfTokenId(
      client,
      contractAddress,
      tokenId,
    );
    resp.json({ tokenId: tokenId, totalSupply: result });
  }

  // `/insight/erc1155/total_supply/:contractAddress`
  export async function ERC1155TotalSupply(req: Request, resp: Response) {
    const contractAddress: string = req.params.contractAddress;

    const client: PrismaClient = resp.locals.client;
    const result = await ERC1155TokenService.totalSupply(
      client,
      contractAddress,
    );
    resp.json({ totalSupply: result });
  }
}
