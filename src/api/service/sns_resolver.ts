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

  export async function updateByName(
    client: PrismaClient,
    name: string,
    newAddress: string,
  ): Promise<SNSAddressResolver> {
    return await client.sNSAddressResolver.update({
      where: { name },
      data: { address: newAddress },
    });
  }

  export async function getByName(
    client: PrismaClient,
    name: string,
  ): Promise<SNSAddressResolver | null> {
    return await client.sNSAddressResolver.findUnique({ where: { name } });
  }

  export async function getByNames(
    client: PrismaClient,
    names: string[],
  ): Promise<SNSAddressResolver[]> {
    return await client.sNSAddressResolver.findMany({
      where: { name: { in: names } },
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
    paramName: string,
    paramA: string,
    handler: string,
  ): Promise<SNSResolverAddrChangedTx | null> {
    return await client.sNSResolverAddrChangedTx.findFirst({
      where: { tx, paramName, paramA, handler },
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

  export async function updateByAddress(
    client: PrismaClient,
    address: string,
    newName: string,
  ): Promise<SNSNameResolver> {
    return await client.sNSNameResolver.update({
      where: { address },
      data: { name: newName },
    });
  }

  export async function getByAddress(
    client: PrismaClient,
    address: string,
  ): Promise<SNSNameResolver | null> {
    return await client.sNSNameResolver.findUnique({ where: { address } });
  }

  export async function getByAddresses(
    client: PrismaClient,
    addresses: string[],
  ): Promise<SNSNameResolver[]> {
    return await client.sNSNameResolver.findMany({
      where: { address: { in: addresses } },
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
    paramA: string,
    paramName: string,
    handler: string,
  ): Promise<SNSResolverNameChangedTx | null> {
    return await client.sNSResolverNameChangedTx.findFirst({
      where: { tx, paramA, paramName, handler },
    });
  }
}
