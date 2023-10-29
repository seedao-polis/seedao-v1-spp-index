import { PrismaClient } from ".prisma/client";
import { ERC20Token, ERC20TokenTransferTx } from "@prisma/client";

export namespace ERC20TokenService {
  export async function create(
    client: PrismaClient,
    data: ERC20Token,
  ): Promise<ERC20Token> {
    return client.eRC20Token.create({
      data: data,
    });
  }
}

export namespace ERC20TokenTransferTxService {
  export async function create(
    client: PrismaClient,
    data: ERC20TokenTransferTx,
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
      where: { contractAddress: contractAddress },
      orderBy: { blockNumber: "desc" },
    });
    if (result == null) {
      return 0;
    }
    return result.blockNumber;
  }

  export async function getByContractAndTx(
    client: PrismaClient,
    contractAddress: string,
    tx: string,
  ): Promise<ERC20TokenTransferTx | null> {
    return client.eRC20TokenTransferTx.findUnique({
      where: { contractAddress: contractAddress, tx: tx },
    });
  }
}
