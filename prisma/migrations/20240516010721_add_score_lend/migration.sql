/*
  Warnings:

  - A unique constraint covering the columns `[tokenId]` on the table `ERC721Token` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "ScoreLend" (
    "id" SERIAL NOT NULL,
    "lendId" TEXT NOT NULL,
    "lendStatus" INTEGER NOT NULL,
    "debtor" TEXT NOT NULL,
    "borrowToken" TEXT NOT NULL,
    "borrowAmount" DECIMAL(65,30) NOT NULL,
    "mortgageSCRAmount" DECIMAL(65,30) NOT NULL,
    "interestRate" DECIMAL(65,30) NOT NULL,
    "borrowTimestamp" INTEGER NOT NULL,
    "borrowTx" TEXT NOT NULL,
    "overdueTimestamp" INTEGER NOT NULL,
    "paybackTimestamp" INTEGER NOT NULL,
    "paybackTx" TEXT NOT NULL,
    "interestDays" INTEGER NOT NULL,
    "interestAmount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ScoreLend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreLendBorrowTx" (
    "id" SERIAL NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramId" TEXT NOT NULL,
    "paramDebtor" TEXT NOT NULL,
    "paramBorrowToken" TEXT NOT NULL,
    "paramBorrowAmount" DECIMAL(65,30) NOT NULL,
    "paramMortgageSCRAmount" DECIMAL(65,30) NOT NULL,
    "paramInterestRate" INTEGER NOT NULL,
    "paramInterestRateDecimals" INTEGER NOT NULL,
    "paramBorrowTimestamp" INTEGER NOT NULL,
    "paramOverdueTimestamp" INTEGER NOT NULL,

    CONSTRAINT "ScoreLendBorrowTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScoreLendPaybackTx" (
    "id" SERIAL NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramId" TEXT NOT NULL,
    "paramInterestDays" INTEGER NOT NULL,
    "paramInterestAmount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ScoreLendPaybackTx_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScoreLend_lendId_key" ON "ScoreLend"("lendId");

-- CreateIndex
CREATE UNIQUE INDEX "ERC721Token_tokenId_key" ON "ERC721Token"("tokenId");
