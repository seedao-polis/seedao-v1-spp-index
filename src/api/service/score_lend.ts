import { PrismaClient } from ".prisma/client";
import {
  ScoreLend,
  ScoreLendBorrowTx,
  ScoreLendPaybackTx,
  Prisma,
} from "@prisma/client";
import { ethers } from "ethers";

export namespace ScoreLendService {
  export const LEND_STATUS_IN_USE: number = 0;
  export const LEND_STATUS_PAYBACK: number = 1;
  export const LEND_STATUS_OVERDUE: number = 2;

  export async function create(
    client: PrismaClient,
    data: Prisma.ScoreLendCreateInput,
  ): Promise<ScoreLend> {
    return await client.scoreLend.create({
      data: data,
    });
  }

  export async function updateToPaybackByLendId(
    client: PrismaClient,
    lendId: string,
    paybackTimestamp: number,
    paybackTx: string,
    interestDays: number,
    interestAmount: Prisma.Decimal,
  ): Promise<ScoreLend> {
    return await client.scoreLend.update({
      where: { lendId },
      data: {
        lendStatus: LEND_STATUS_PAYBACK,
        paybackTimestamp: paybackTimestamp,
        paybackTx: paybackTx,
        interestDays: interestDays,
        interestAmount: interestAmount,
      },
    });
  }

  export async function getByLendId(
    client: PrismaClient,
    lendId: string,
  ): Promise<ScoreLend | null> {
    return await client.scoreLend.findUnique({ where: { lendId } });
  }

  export async function getAll(client: PrismaClient): Promise<ScoreLend[]> {
    return await client.scoreLend.findMany({
      orderBy: {
        id: "asc",
      },
    });
  }

  export async function searchLends(
    client: PrismaClient,
    debtor: string | undefined,
    lendStatus: number | undefined,
    currentUTC0Timestamp: number,
    sortField: string,
    sortOrder: string,
    page: number, // start from 0
    size: number,
  ): Promise<[number, ScoreLend[]]> {
    // 'debtor' condition
    const debtorWhere: any = debtor
      ? { debtor: ethers.getAddress(debtor) }
      : {};
    // lend status condition
    let lendStatusWhere: any = {};
    if (lendStatus == LEND_STATUS_PAYBACK) {
      lendStatusWhere = {
        lendStatus: LEND_STATUS_PAYBACK,
      };
    } else if (lendStatus == LEND_STATUS_OVERDUE) {
      lendStatusWhere = {
        lendStatus: LEND_STATUS_IN_USE,
        overdueTimestamp: {
          lt: currentUTC0Timestamp,
        },
      };
    } else if (lendStatus == LEND_STATUS_IN_USE) {
      lendStatusWhere = {
        lendStatus: LEND_STATUS_IN_USE,
        overdueTimestamp: {
          gte: currentUTC0Timestamp,
        },
      };
    }
    // 'orderBy' condition
    let orderBy: any = {
      borrowTimestamp: sortOrder,
    };
    if (sortField == "borrowAmount") {
      orderBy = {
        borrowAmount: sortOrder,
      };
    }

    // query total count
    const total = await client.scoreLend.count({
      where: {
        ...debtorWhere,
        ...lendStatusWhere,
      },
    });
    // query lends
    const lends = await client.scoreLend.findMany({
      where: {
        ...debtorWhere,
        ...lendStatusWhere,
      },
      orderBy: {
        ...orderBy,
      },
      skip: page * size,
      take: size,
    });

    console.log({
      where: {
        ...debtorWhere,
        ...lendStatusWhere,
      },
      orderBy: {
        ...orderBy,
      },
      skip: page * size,
      take: size,
    });

    return [total, lends];
  }
}

export namespace ScoreLendBorrowTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ScoreLendBorrowTxCreateInput,
  ): Promise<ScoreLendBorrowTx> {
    return await client.scoreLendBorrowTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.scoreLendBorrowTx.findFirst({
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
    paramId: string,
    handler: string,
  ): Promise<ScoreLendBorrowTx | null> {
    return await client.scoreLendBorrowTx.findFirst({
      where: { tx, paramId, handler },
    });
  }
}

export namespace ScoreLendPaybackTxService {
  export async function create(
    client: PrismaClient,
    data: Prisma.ScoreLendPaybackTxCreateInput,
  ): Promise<ScoreLendPaybackTx> {
    return await client.scoreLendPaybackTx.create({
      data: data,
    });
  }

  export async function getLatestBlockNumber(
    client: PrismaClient,
  ): Promise<number> {
    const result = await client.scoreLendPaybackTx.findFirst({
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
    paramId: string,
    handler: string,
  ): Promise<ScoreLendPaybackTx | null> {
    return await client.scoreLendPaybackTx.findFirst({
      where: { tx, paramId, handler },
    });
  }
}
