import { PrismaClient } from ".prisma/client";
import { seedTransferTx } from "@prisma/client";

export namespace seedTransferTxService {
  export async function create(
    client: PrismaClient,
    data: seedTransferTx,
  ): Promise<seedTransferTx> {
    return client.seedTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.seedTransferTx.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 18010758 -1 ; // https://etherscan.io/tx/0x77a9c0ca3ad1ef21213e48aa736cef5a823eaab9de4c4943ae908b884678c9b0
    }
    return result.blockNumber;
  }

  export async function getByTx(
    client: PrismaClient,
    tx: string,
  ): Promise<seedTransferTx | null> {
    return client.seedTransferTx.findUnique({ where: { tx: tx } });
  }
}
