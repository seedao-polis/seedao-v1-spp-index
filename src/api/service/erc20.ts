import { PrismaClient } from ".prisma/client";
import { ERC20Token, ERC20TokenTransferTx, Prisma } from "@prisma/client";

export namespace ERC20TokenService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ERC20TokenCreateInput,
  ): Promise<ERC20Token> {
    return client.eRC20Token.create({
      data: data,
    });
  }

  export async function getByContractAndOwner(
    client: PrismaClient,
    contractAddress: string,
    owner: string,
  ): Promise<ERC20Token | null> {
    return client.eRC20Token.findFirst({
      where: { contractAddress, owner },
    });
  }

  export async function incrementAmount(
    client: PrismaClient,
    contractAddress: string,
    owner: string,
    amount: bigint,
  ) {
    const row = client.eRC20Token.findFirst({
      where: { contractAddress, owner },
    });
    if (row == null) {
      throw new Error(
        `ERC20TokenService.incrementAmount: row not found [contract: ${contractAddress} owner: ${owner}]`,
      );
    } else {
      client.eRC20Token.updateMany({
        where: { contractAddress, owner },
        data: { amount: { increment: amount } },
      }); // use `updateMany` not `update` is ok, because using `contractAddress`+`owner` as unique key
    }
  }

  export async function decrementAmount(
    client: PrismaClient,
    contractAddress: string,
    owner: string,
    amount: bigint,
  ) {
    const row = client.eRC20Token.findFirst({
      where: { contractAddress, owner },
    });
    if (row == null) {
      throw new Error(
        "ERC20TokenService.decrementAmount: row not found [contract: ${contractAddress} owner: ${owner}]",
      );
    } else {
      client.eRC20Token.updateMany({
        where: { contractAddress, owner },
        data: { amount: { decrement: amount } },
      }); // use `updateMany` not `update` is ok, because using `contractAddress`+`owner` as unique key
    }
  }

  export async function totalSupply(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<bigint> {
    const result = await client.eRC20Token.aggregate({
      where: { contractAddress },
      _sum: { amount: true },
    });
    if (result == null) {
      return BigInt(0);
    }
    return result._sum.amount ?? BigInt(0);
  }
}

export namespace ERC20TokenTransferTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ERC20TokenTransferTxCreateInput,
  ): Promise<ERC20TokenTransferTx> {
    return client.eRC20TokenTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
    contractAddress: string,
  ): Promise<number> {
    const result = await client.eRC20TokenTransferTx.findFirst({
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
  ): Promise<ERC20TokenTransferTx | null> {
    return client.eRC20TokenTransferTx.findFirst({
      where: { contractAddress, tx, paramTo, paramFrom, handler },
    });
  }
}
