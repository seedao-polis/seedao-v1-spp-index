import { PrismaClient } from ".prisma/client";
import { erc20Test, erc20TestTransferTx } from "@prisma/client";

export namespace erc20TestService {
  export async function create(
    client: PrismaClient,
    data: erc20Test,
  ): Promise<erc20Test> {
    return client.erc20Test.create({
      data: data,
    });
  }
}

export namespace erc20TestTransferTxService {
  export async function create(
    client: PrismaClient,
    data: erc20TestTransferTx,
  ): Promise<erc20TestTransferTx> {
    return client.erc20TestTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.erc20TestTransferTx.findFirst({
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
  ): Promise<erc20TestTransferTx | null> {
    return client.erc20TestTransferTx.findUnique({ where: { tx: tx } });
  }
}
