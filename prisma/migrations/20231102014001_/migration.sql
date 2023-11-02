/*
  Warnings:

  - Added the required column `handler` to the `ERC721TokenTransferTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `handler` to the `ERC20TokenTransferTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `handler` to the `ERC1155TokenTransferBatchTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `handler` to the `ERC1155TokenTransferSingleTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `handler` to the `SNSNameregisteredTx` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ERC721TokenTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramTokenId" BIGINT NOT NULL
);
INSERT INTO "new_ERC721TokenTransferTx" ("blockNumber", "contractAddress", "id", "paramFrom", "paramTo", "paramTokenId", "tx") SELECT "blockNumber", "contractAddress", "id", "paramFrom", "paramTo", "paramTokenId", "tx" FROM "ERC721TokenTransferTx";
DROP TABLE "ERC721TokenTransferTx";
ALTER TABLE "new_ERC721TokenTransferTx" RENAME TO "ERC721TokenTransferTx";
CREATE TABLE "new_ERC20TokenTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramValue" BIGINT NOT NULL
);
INSERT INTO "new_ERC20TokenTransferTx" ("blockNumber", "contractAddress", "id", "paramFrom", "paramTo", "paramValue", "tx") SELECT "blockNumber", "contractAddress", "id", "paramFrom", "paramTo", "paramValue", "tx" FROM "ERC20TokenTransferTx";
DROP TABLE "ERC20TokenTransferTx";
ALTER TABLE "new_ERC20TokenTransferTx" RENAME TO "ERC20TokenTransferTx";
CREATE TABLE "new_ERC1155TokenTransferBatchTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramIds" TEXT NOT NULL,
    "paramValues" TEXT NOT NULL
);
INSERT INTO "new_ERC1155TokenTransferBatchTx" ("blockNumber", "contractAddress", "id", "paramFrom", "paramIds", "paramOperator", "paramTo", "paramValues", "tx") SELECT "blockNumber", "contractAddress", "id", "paramFrom", "paramIds", "paramOperator", "paramTo", "paramValues", "tx" FROM "ERC1155TokenTransferBatchTx";
DROP TABLE "ERC1155TokenTransferBatchTx";
ALTER TABLE "new_ERC1155TokenTransferBatchTx" RENAME TO "ERC1155TokenTransferBatchTx";
CREATE TABLE "new_ERC1155TokenTransferSingleTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramId" BIGINT NOT NULL,
    "paramValue" BIGINT NOT NULL
);
INSERT INTO "new_ERC1155TokenTransferSingleTx" ("blockNumber", "contractAddress", "id", "paramFrom", "paramId", "paramOperator", "paramTo", "paramValue", "tx") SELECT "blockNumber", "contractAddress", "id", "paramFrom", "paramId", "paramOperator", "paramTo", "paramValue", "tx" FROM "ERC1155TokenTransferSingleTx";
DROP TABLE "ERC1155TokenTransferSingleTx";
ALTER TABLE "new_ERC1155TokenTransferSingleTx" RENAME TO "ERC1155TokenTransferSingleTx";
CREATE TABLE "new_SNSNameregisteredTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramName" TEXT NOT NULL,
    "paramOwner" TEXT NOT NULL
);
INSERT INTO "new_SNSNameregisteredTx" ("blockNumber", "id", "paramName", "paramOwner", "tx") SELECT "blockNumber", "id", "paramName", "paramOwner", "tx" FROM "SNSNameregisteredTx";
DROP TABLE "SNSNameregisteredTx";
ALTER TABLE "new_SNSNameregisteredTx" RENAME TO "SNSNameregisteredTx";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
