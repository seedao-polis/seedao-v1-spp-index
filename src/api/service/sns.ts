import { PrismaClient } from ".prisma/client";
import { SNS, SNSNameregisteredTx, Prisma } from "@prisma/client";

export namespace SNSService {
  export async function create(
    client: PrismaClient,
    data: Prisma.SNSCreateInput,
  ): Promise<SNS> {
    return client.sNS.create({
      data: data,
    });
  }

  export async function deleteByTokenId(
    client: PrismaClient,
    tokenId: bigint,
  ): Promise<void> {
    client.sNS.delete({ where: { tokenId: tokenId } });
  }

  export async function updateOwnerByTokenId(
    client: PrismaClient,
    tokenId: bigint,
    owner: string,
  ): Promise<SNS> {
    return client.sNS.update({
      where: { tokenId: tokenId },
      data: { owner: owner },
    });
  }

  export async function getByTokenId(
    client: PrismaClient,
    tokenId: bigint,
  ): Promise<SNS | null> {
    return client.sNS.findUnique({ where: { tokenId: tokenId } });
  }
}

export namespace SNSNameregisteredTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.SNSNameregisteredTxCreateInput,
  ): Promise<SNSNameregisteredTx> {
    return client.sNSNameregisteredTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.sNSNameregisteredTx.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 0;
    }
    return result.blockNumber;
  }

  export async function getByTx(
    client: PrismaClient,
    tx: string,
  ): Promise<SNSNameregisteredTx | null> {
    return client.sNSNameregisteredTx.findUnique({ where: { tx: tx } });
  }
}
