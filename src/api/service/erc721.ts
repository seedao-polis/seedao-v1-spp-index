import { PrismaClient } from ".prisma/client";
import { ERC721Token, ERC721TokenTransferTx, Prisma } from "@prisma/client";

export namespace ERC721TokenService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ERC721TokenCreateInput,
  ): Promise<ERC721Token> {
    return await client.eRC721Token.create({
      data: data,
    });
  }

  export async function deleteByContractAndTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: string,
  ) {
    await client.eRC721Token.delete({
      where: { contractAddress, tokenId },
    });
  }

  export async function updateOwnerByContractAndTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: string,
    newOwner: string,
    timestamp: number,
  ) {
    await client.eRC721Token.update({
      where: { contractAddress, tokenId },
      data: { owner: newOwner, timestamp: timestamp },
    });
  }

  export async function totalSupply(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<bigint> {
    const result = await client.eRC721Token.aggregate({
      where: { contractAddress },
      _count: { tokenId: true },
    });
    if (result == null) {
      return BigInt(0);
    }
    return BigInt(result._count.tokenId);
  }
}

export namespace ERC721TokenTransferTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ERC721TokenTransferTxCreateInput,
  ): Promise<ERC721TokenTransferTx> {
    return await client.eRC721TokenTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<number> {
    const result = await client.eRC721TokenTransferTx.findFirst({
      where: { contractAddress },
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 0;
    }
    return result.blockNumber;
  }

  export async function getByContractAndTxAndHandler(
    client: PrismaClient,
    contractAddress: string,
    tx: string,
    paramFrom: string,
    paramTo: string,
    paramTokenId: string,
    handler: string,
  ): Promise<ERC721TokenTransferTx | null> {
    return await client.eRC721TokenTransferTx.findFirst({
      where: { contractAddress, tx, paramTo, paramFrom, paramTokenId, handler },
    });
  }

  export async function getBeforeTimestamp(
    client: PrismaClient,
    contractAddress: string,
    timestamp: number,
  ): Promise<ERC721TokenTransferTx[]> {
    return await client.eRC721TokenTransferTx.findMany({
      where: { contractAddress, timestamp: { lte: timestamp } },
      orderBy: {
        id: "asc",
      },
    });
  }
}
