import { PrismaClient } from ".prisma/client";
import {
  Prisma,
  SNSAddressResolver,
  SNSNameResolver,
  SNSResolverNameChangedTx,
  SNSResolverAddrChangedTx,
} from "@prisma/client";

export namespace SNSAddressResolverService {
  export async function create(
    client: PrismaClient,
    data: Prisma.SNSAddressResolverCreateInput,
  ): Promise<SNSAddressResolver> {
    return await client.sNSAddressResolver.create({
      data: data,
    });
  }

  export async function updateByNode(
    client: PrismaClient,
    node: string,
    newAddress: string,
  ): Promise<SNSAddressResolver> {
    return await client.sNSAddressResolver.update({
      where: { node },
      data: { address: newAddress },
    });
  }

  export async function getByNode(
    client: PrismaClient,
    node: string,
  ): Promise<SNSAddressResolver | null> {
    return await client.sNSAddressResolver.findUnique({ where: { node } });
  }

  export async function getByNodes(
    client: PrismaClient,
    nodes: string[],
  ): Promise<SNSAddressResolver[]> {
    return await client.sNSAddressResolver.findMany({
      where: { node: { in: nodes } },
    });
  }
}

export namespace SNSResolverAddrChangedTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.SNSResolverAddrChangedTxCreateInput,
  ): Promise<SNSResolverAddrChangedTx> {
    return await client.sNSResolverAddrChangedTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.sNSResolverAddrChangedTx.findFirst({
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
    paramNode: string,
    paramA: string,
    handler: string,
  ): Promise<SNSResolverAddrChangedTx | null> {
    return await client.sNSResolverAddrChangedTx.findFirst({
      where: { tx, paramNode, paramA, handler },
    });
  }
}

// ------ ------ ------ ------ ------ ------ ------ ------ ------
// ------ ------ ------ ------ ------ ------ ------ ------ ------

export namespace SNSNameResolverService {
  export async function create(
    client: PrismaClient,
    data: Prisma.SNSNameResolverCreateInput,
  ): Promise<SNSNameResolver> {
    return await client.sNSNameResolver.create({
      data: data,
    });
  }

  export async function updateByNode(
    client: PrismaClient,
    node: string,
    newName: string,
  ): Promise<SNSNameResolver> {
    return await client.sNSNameResolver.update({
      where: { node },
      data: { name: newName },
    });
  }

  export async function getByNode(
    client: PrismaClient,
    node: string,
  ): Promise<SNSNameResolver | null> {
    return await client.sNSNameResolver.findUnique({ where: { node } });
  }

  export async function getByNodes(
    client: PrismaClient,
    nodes: string[],
  ): Promise<SNSNameResolver[]> {
    return await client.sNSNameResolver.findMany({
      where: { node: { in: nodes } },
    });
  }
}

export namespace SNSResolverNameChangedTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.SNSResolverNameChangedTxCreateInput,
  ): Promise<SNSResolverNameChangedTx> {
    return await client.sNSResolverNameChangedTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.sNSResolverNameChangedTx.findFirst({
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
    paramNode: string,
    paramName: string,
    handler: string,
  ): Promise<SNSResolverNameChangedTx | null> {
    return await client.sNSResolverNameChangedTx.findFirst({
      where: { tx, paramNode, paramName, handler },
    });
  }
}
