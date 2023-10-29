/*
  Warnings:

  - You are about to drop the `sns` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "sns";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "ERC20Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "amount" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "ERC20TokenTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramValue" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "ERC721Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ERC721TokenTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramTokenId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ERC1155Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "tokenValue" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "ERC1155TokenTransferTx" (
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

-- CreateTable
CREATE TABLE "SNS" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" TEXT NOT NULL,
    "sns" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "registeredDate" BIGINT NOT NULL,
    "length" INTEGER NOT NULL,
    "segmentLength" INTEGER NOT NULL,
    "characterSet" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "SNSNameregisteredTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramName" TEXT NOT NULL,
    "paramOwner" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ERC20TokenTransferTx_tx_key" ON "ERC20TokenTransferTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "ERC721Token_tokenId_key" ON "ERC721Token"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "ERC721TokenTransferTx_tx_key" ON "ERC721TokenTransferTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "ERC1155Token_tokenId_key" ON "ERC1155Token"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "ERC1155TokenTransferTx_tx_key" ON "ERC1155TokenTransferTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "SNS_tokenId_key" ON "SNS"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "SNS_sns_key" ON "SNS"("sns");

-- CreateIndex
CREATE UNIQUE INDEX "SNSNameregisteredTx_tx_key" ON "SNSNameregisteredTx"("tx");
