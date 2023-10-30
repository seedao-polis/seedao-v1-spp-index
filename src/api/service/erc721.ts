import { PrismaClient } from ".prisma/client";
import { ERC721Token, ERC721TokenTransferTx } from "@prisma/client";

export namespace ERC721TokenService {
  export async function create(
    client: PrismaClient,
    data: ERC721Token,
  ): Promise<ERC721Token> {
    return client.eRC721Token.create({
      data: data,
    });
  }

  export async function updateOwnerByTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: bigint,
    newOwner: string,
  ) {
    client.eRC721Token.update({
      where: { contractAddress: contractAddress, tokenId: tokenId },
      data: { owner: newOwner },
    });
  }

  export async function totalSupply(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<bigint> {
    const result = await client.eRC721Token.aggregate({
      where: { contractAddress: contractAddress },
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
    data: ERC721TokenTransferTx,
  ): Promise<ERC721TokenTransferTx> {
    return client.eRC721TokenTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<number> {
    const result = await client.eRC721TokenTransferTx.findFirst({
      where: { contractAddress: contractAddress },
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 0;
    }
    return result.blockNumber;
  }

  export async function getByContractAndTx(
    client: PrismaClient,
    contractAddress: string,
    tx: string,
  ): Promise<ERC721TokenTransferTx | null> {
    return client.eRC721TokenTransferTx.findUnique({
      where: { contractAddress: contractAddress, tx: tx },
    });
  }
}
