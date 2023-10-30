/*
  Warnings:

  - You are about to drop the `ERC1155TokenTransferTx` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ERC1155TokenTransferTx";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ERC1155TokenTransferSingleTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramId" BIGINT NOT NULL,
    "paramValue" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "ERC1155TokenTransferBatchTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramIds" TEXT NOT NULL,
    "paramValues" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ERC1155TokenTransferSingleTx_tx_key" ON "ERC1155TokenTransferSingleTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "ERC1155TokenTransferBatchTx_tx_key" ON "ERC1155TokenTransferBatchTx"("tx");
