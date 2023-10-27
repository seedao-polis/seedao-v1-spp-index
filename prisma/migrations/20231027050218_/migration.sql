-- CreateTable
CREATE TABLE "erc20Test" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "owner" TEXT NOT NULL,
    "amount" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "erc20TestTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramValue" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "scr" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "owner" TEXT NOT NULL,
    "amount" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "scrTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramValue" BIGINT NOT NULL
);

-- CreateTable
CREATE TABLE "seed" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "seedTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramTokenId" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "snsNameregisteredTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramName" TEXT NOT NULL,
    "paramOwner" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "snsTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramTokenId" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "erc20TestTransferTx_tx_key" ON "erc20TestTransferTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "scrTransferTx_tx_key" ON "scrTransferTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "seed_tokenId_key" ON "seed"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "seedTransferTx_tx_key" ON "seedTransferTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "snsNameregisteredTx_tx_key" ON "snsNameregisteredTx"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "snsTransferTx_tx_key" ON "snsTransferTx"("tx");
