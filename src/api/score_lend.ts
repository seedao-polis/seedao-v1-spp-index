import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { ScoreLendService } from "./service/score_lend";
import { currentUTC0Timestamp } from "../helper/datetime";

export namespace scoreLendAPI {
  // `/score_lend/total_borrow`
  export async function totalBorrow(req: Request, resp: Response) {
    const client: PrismaClient = resp.locals.client;
    const lends = await ScoreLendService.getAll(client);

    const timestamp = currentUTC0Timestamp();

    let totalBorrowedAmount: Prisma.Decimal = new Prisma.Decimal(0); // 总借出 USDT 数量
    let inUseCount: number = 0; // 使用中笔数
    let inUseAmount: Prisma.Decimal = new Prisma.Decimal(0); // 使用中 USDT 数量
    let paybackCount: number = 0; // 已归还笔数
    let paybackAmount: Prisma.Decimal = new Prisma.Decimal(0); // 已归还 USDT 数量
    let overdueCount: number = 0; // 已逾期笔数
    let overdueAmount: Prisma.Decimal = new Prisma.Decimal(0); // 已逾期 USDT 数量
    let forfeitSCRAmount: Prisma.Decimal = new Prisma.Decimal(0); // 已罚没 SCR 数量

    for (const lend of lends) {
      totalBorrowedAmount = totalBorrowedAmount.add(lend.borrowAmount);

      if (lend.lendStatus === ScoreLendService.LEND_STATUS_PAYBACK) {
        paybackCount += 1;
        paybackAmount = paybackAmount.add(lend.borrowAmount);
      } else {
        if (timestamp > lend.overdueTimestamp) {
          overdueCount += 1;
          overdueAmount = overdueAmount.add(lend.borrowAmount);

          forfeitSCRAmount = forfeitSCRAmount.add(lend.mortgageSCRAmount);
        } else {
          inUseCount += 1;
          inUseAmount = inUseAmount.add(lend.borrowAmount);
        }
      }
    }

    resp.json({
      totalBorrowed: lends.length,
      totalBorrowedAmount,
      inUseCount,
      inUseAmount,
      paybackCount,
      paybackAmount,
      overdueCount,
      overdueAmount,
      forfeitSCRAmount,
    });
  }

  // `/score_lend/lends?debtor=0x123&lendStatus=[0/1/2]&sortField=[borrowAmount/borrowTimestamp]&sortOrder=[asc/desc]&page=1&size=10`
  // `/score_lend/lends` for this situation, all query parameters use default value
  // 'lendStatus' values: 0-使用中, 1-已归还, 2-已逾期
  // 'sortField' default is `borrowTimestamp`, 'sortOrder' default is `desc`
  // 'page' start from 1 and default is 1, 'size' default is 10
  export async function lends(req: Request, resp: Response) {
    const debtor: string | undefined = req.query.debtor as string;
    const lendStatus: number | undefined = req.query.lendStatus
      ? parseInt(req.query.lendStatus.toString())
      : undefined;

    const sortField: string =
      (req.query.sortField as string) ?? "borrowTimestamp";
    const sortOrder: string = (req.query.sortOrder as string) ?? "desc";

    const page: number = req.query.page
      ? parseInt(req.query.page.toString())
      : 1;
    const size: number = req.query.size
      ? parseInt(req.query.size.toString())
      : 10;

    const timestamp = currentUTC0Timestamp();

    const client: PrismaClient = resp.locals.client;
    const [total, lends] = await ScoreLendService.searchLends(
      client,
      debtor,
      lendStatus,
      timestamp,
      sortField,
      sortOrder,
      page - 1,
      size,
    );

    // when lend is overdue, need chang it's 'status' to overdue
    // we choose to iterate the 'lends', because of the size of lends is very small, common is less than 10
    for (const lend of lends) {
      if (
        lend.lendStatus == ScoreLendService.LEND_STATUS_IN_USE &&
        timestamp > lend.overdueTimestamp
      ) {
        lend.lendStatus = ScoreLendService.LEND_STATUS_OVERDUE;
      }
    }

    resp.json({
      total,
      page,
      data: lends,
    });
  }

  // `/score_lend/lend/1`
  export async function lend(req: Request, resp: Response) {
    const lendId: string = req.params.lendId;

    const client: PrismaClient = resp.locals.client;

    resp.json(await ScoreLendService.getByLendId(client, lendId));
  }
}
