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
    tokenId: string,
  ): Promise<void> {
    client.sNS.delete({ where: { tokenId } });
  }

  export async function updateOwnerByTokenId(
    client: PrismaClient,
    tokenId: string,
    owner: string,
    timestamp: number,
  ): Promise<SNS> {
    return client.sNS.update({
      where: { tokenId },
      data: { owner: owner, timestamp: timestamp },
    });
  }

  export async function getByTokenId(
    client: PrismaClient,
    tokenId: string,
  ): Promise<SNS | null> {
    return client.sNS.findUnique({ where: { tokenId } });
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

  export async function getByTxAndHandler(
    client: PrismaClient,
    tx: string,
    paramName: string,
    paramOwner: string,
    handler: string,
  ): Promise<SNSNameregisteredTx | null> {
    return client.sNSNameregisteredTx.findFirst({
      where: { tx, paramName, paramOwner, handler },
    });
  }
}
