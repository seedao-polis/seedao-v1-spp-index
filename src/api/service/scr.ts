import { PrismaClient } from ".prisma/client";
import { scrTransferTx } from "@prisma/client";

export namespace scrTransferTxService {
  export async function create(
    client: PrismaClient,
    data: scrTransferTx,
  ): Promise<scrTransferTx> {
    return client.erc20TestTransferTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.scrTransferTx.findFirst({
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 15737180 - 1; // https://etherscan.io/tx/0x367c672e6d3896091b6f6443d2862c1162d9c92664f56483041f3ad78b8a201b
    }
    return result.blockNumber;
  }

  export async function getByTx(
    client: PrismaClient,
    tx: string,
  ): Promise<scrTransferTx | null> {
    return client.scrTransferTx.findUnique({ where: { tx: tx } });
  }
}
