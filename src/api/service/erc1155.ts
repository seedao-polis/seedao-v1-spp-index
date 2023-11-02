import { PrismaClient } from ".prisma/client";
import {
  ERC1155Token,
  ERC1155TokenTransferBatchTx,
  ERC1155TokenTransferSingleTx,
  Prisma,
} from "@prisma/client";

export namespace ERC1155TokenService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ERC1155TokenCreateInput,
  ): Promise<ERC1155Token> {
    return client.eRC1155Token.create({
      data: data,
    });
  }

  export async function getByContractAndTokenIdAndOwner(
    client: PrismaClient,
    contractAddress: string,
    tokenId: string,
    owner: string,
  ): Promise<ERC1155Token | null> {
    return client.eRC1155Token.findFirst({
      where: {
        contractAddress,
        tokenId,
        owner,
      },
    });
  }

  export async function incrementValueByTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: string,
    owner: string,
    value: bigint,
  ) {
    const row = await client.eRC1155Token.findFirst({
      where: {
        contractAddress,
        tokenId,
        owner,
      },
    });
    if (row == null) {
      throw new Error(
        `ERC1155TokenService.incrementValueByTokenId: row not found [contract: ${contractAddress} tokenId: ${tokenId} owner: ${owner}]`,
      );
    } else {
      client.eRC1155Token.updateMany({
        where: {
          contractAddress,
          tokenId,
          owner,
        },
        data: { tokenValue: { increment: value } },
      }); // use `updateMany` not `update` is ok, because using `contractAddress`+`tokenId`+`owner` as unique key
    }
  }

  export async function decrementValueByTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: string,
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
        `ERC1155TokenService.decrementValueByTokenId: row not found [contract: ${contractAddress} tokenId: ${tokenId} owner: ${owner}]`,
      );
    } else {
      client.eRC1155Token.updateMany({
        where: {
          contractAddress,
          tokenId,
          owner,
        },
        data: { tokenValue: { decrement: value } },
      }); // use `updateMany` not `update` is ok, because using `contractAddress`+`tokenId`+`owner` as unique key
    }
  }

  export async function totalSupplyOfTokenId(
    client: PrismaClient,
    contractAddress: string,
    tokenId: string,
  ): Promise<bigint> {
    const result = await client.eRC1155Token.aggregate({
      where: { contractAddress, tokenId },
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
      where: { contractAddress },
      _sum: { tokenValue: true },
    });
    if (result == null) {
      return BigInt(0);
    }
    return result._sum.tokenValue ?? BigInt(0);
  }
}

export namespace ERC1155TokenTransferSingleTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ERC1155TokenTransferSingleTxCreateInput,
  ): Promise<ERC1155TokenTransferSingleTx> {
    return client.eRC1155TokenTransferSingleTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<number> {
    const result = await client.eRC1155TokenTransferSingleTx.findFirst({
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
    paramId: string,
    handler: string,
  ): Promise<ERC1155TokenTransferSingleTx | null> {
    return client.eRC1155TokenTransferSingleTx.findFirst({
      where: { contractAddress, tx, paramFrom, paramTo, paramId, handler },
    });
  }
}

export namespace ERC1155TokenTransferBatchTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ERC1155TokenTransferBatchTxCreateInput,
  ): Promise<ERC1155TokenTransferBatchTx> {
    return client.eRC1155TokenTransferBatchTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<number> {
    const result = await client.eRC1155TokenTransferBatchTx.findFirst({
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
    handler: string,
  ): Promise<ERC1155TokenTransferBatchTx | null> {
    return client.eRC1155TokenTransferBatchTx.findFirst({
      where: { contractAddress, tx, paramFrom, paramTo, handler },
    });
  }
}
