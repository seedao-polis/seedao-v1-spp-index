import { PrismaClient } from ".prisma/client";
import { ERC1155Token, ERC1155TokenTransferTx } from "@prisma/client";

export namespace ERC1155TokenService {
  export async function create(
    client: PrismaClient,
    data: ERC1155Token,
  ): Promise<ERC1155Token> {
    return client.eRC1155Token.create({
      data: data,
    });
  }

  export async function incrementValueByTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: bigint,
    owner: string,
    value: bigint,
  ) {
    const row = await client.eRC1155Token.findFirst({
      where: {
        contractAddress: contractAddress,
        tokenId: tokenId,
        owner: owner,
      },
    });
    if (row == null) {
      throw new Error(
        "ERC1155TokenService.incrementValueByTokenId: row not found",
      );
    } else {
      client.eRC1155Token.updateMany({
        where: {
          contractAddress: contractAddress,
          tokenId: tokenId,
          owner: owner,
        },
        data: { tokenValue: { increment: value } },
      }); // use `updateMany` not `update` is ok, because using `contractAddress`+`tokenId`+`owner` as unique key
    }
  }

  export async function decrementValueByTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: bigint,
    owner: string,
    value: bigint,
  ) {
    const row = await client.eRC1155Token.findFirst({
      where: {
        contractAddress: contractAddress,
        tokenId: tokenId,
        owner: owner,
      },
    });
    if (row == null) {
      throw new Error(
        "ERC1155TokenService.decrementValueByTokenId: row not found",
      );
    } else {
      client.eRC1155Token.updateMany({
        where: {
          contractAddress: contractAddress,
          tokenId: tokenId,
          owner: owner,
        },
        data: { tokenValue: { decrement: value } },
      }); // use `updateMany` not `update` is ok, because using `contractAddress`+`tokenId`+`owner` as unique key
    }
  }

  export async function totalSupplyOfTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: bigint,
  ): Promise<bigint> {
    const result = await client.eRC1155Token.aggregate({
      where: { contractAddress: contractAddress, tokenId: tokenId },
      _sum: { tokenValue: true },
    });
    if (result == null) {
      return BigInt(0);
    }
    return result._sum.tokenValue ?? BigInt(0);
  }

  export async function totalSupply(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<bigint> {
    const result = await client.eRC1155Token.aggregate({
      where: { contractAddress: contractAddress },
      _sum: { tokenValue: true },
    });
    if (result == null) {
      return BigInt(0);
    }
    return result._sum.tokenValue ?? BigInt(0);
  }
}

export namespace ERC1155TokenTransferTxService {
  export async function create(
    client: PrismaClient,
    data: ERC1155TokenTransferTx,
  ): Promise<ERC1155TokenTransferTx> {
    return client.eRC1155TokenTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<number> {
    const result = await client.eRC1155TokenTransferTx.findFirst({
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
  ): Promise<ERC1155TokenTransferTx | null> {
    return client.eRC1155TokenTransferTx.findUnique({
      where: { contractAddress: contractAddress, tx: tx },
    });
  }
}
