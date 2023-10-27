import { PrismaClient } from ".prisma/client";
import { sns, snsNameregisteredTx, snsTransferTx } from "@prisma/client";

export namespace snsService {
  export async function create(client: PrismaClient, data: sns): Promise<sns> {
    return client.sns.create({
      data: data,
    });
  }

  export async function updateOwnerByTokenId(
    client: PrismaClient,
    tokenId: string,
    owner: string,
  ): Promise<sns> {
    return client.sns.update({
      where: { tokenId: tokenId },
      data: { owner: owner },
    });
  }

  export async function getByTokenId(
    client: PrismaClient,
    tokenId: string,
  ): Promise<sns | null> {
    return client.sns.findUnique({ where: { tokenId: tokenId } });
  }
}

export namespace snsNameregisteredTxService {
  export async function create(
    client: PrismaClient,
    data: snsNameregisteredTx,
  ): Promise<snsNameregisteredTx> {
    return client.snsNameregisteredTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.snsNameregisteredTx.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 0; // TODO: find the first block number
    }
    return result.blockNumber;
  }

  export async function getByTx(
    client: PrismaClient,
    tx: string,
  ): Promise<snsNameregisteredTx | null> {
    return client.snsNameregisteredTx.findUnique({ where: { tx: tx } });
  }
}

export namespace snsTransferTxService {
  export async function create(
    client: PrismaClient,
    data: snsTransferTx,
  ): Promise<snsTransferTx> {
    return client.snsTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.snsTransferTx.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 0; // TODO: find the first block number
    }
    return result.blockNumber;
  }

  export async function getByTx(
    client: PrismaClient,
    tx: string,
  ): Promise<snsTransferTx | null> {
    return client.snsTransferTx.findUnique({ where: { tx: tx } });
  }
}
