/*
  Warnings:

  - You are about to alter the column `registeredDate` on the `SNS` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - Added the required column `timestamp` to the `ERC20TokenTransferTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `SNSNameregisteredTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `ERC1155TokenTransferSingleTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `ERC1155TokenTransferBatchTx` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `ERC721Token` table without a default value. This is not possible if the table is not empty.
  - Added the required column `timestamp` to the `ERC721TokenTransferTx` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ERC20TokenTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramValue" BIGINT NOT NULL
);
INSERT INTO "new_ERC20TokenTransferTx" ("blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramValue", "tx") SELECT "blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramValue", "tx" FROM "ERC20TokenTransferTx";
DROP TABLE "ERC20TokenTransferTx";
ALTER TABLE "new_ERC20TokenTransferTx" RENAME TO "ERC20TokenTransferTx";
CREATE TABLE "new_SNS" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" TEXT NOT NULL,
    "sns" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "registeredDate" INTEGER NOT NULL,
    "length" INTEGER NOT NULL,
    "segmentLength" INTEGER NOT NULL,
    "characterSet" TEXT NOT NULL
);
INSERT INTO "new_SNS" ("characterSet", "id", "length", "owner", "registeredDate", "segmentLength", "sns", "tokenId") SELECT "characterSet", "id", "length", "owner", "registeredDate", "segmentLength", "sns", "tokenId" FROM "SNS";
DROP TABLE "SNS";
ALTER TABLE "new_SNS" RENAME TO "SNS";
CREATE UNIQUE INDEX "SNS_tokenId_key" ON "SNS"("tokenId");
CREATE UNIQUE INDEX "SNS_sns_key" ON "SNS"("sns");
CREATE TABLE "new_SNSNameregisteredTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramName" TEXT NOT NULL,
    "paramOwner" TEXT NOT NULL
);
INSERT INTO "new_SNSNameregisteredTx" ("blockNumber", "handler", "id", "paramName", "paramOwner", "tx") SELECT "blockNumber", "handler", "id", "paramName", "paramOwner", "tx" FROM "SNSNameregisteredTx";
DROP TABLE "SNSNameregisteredTx";
ALTER TABLE "new_SNSNameregisteredTx" RENAME TO "SNSNameregisteredTx";
CREATE TABLE "new_ERC1155TokenTransferSingleTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramId" TEXT NOT NULL,
    "paramValue" BIGINT NOT NULL
);
INSERT INTO "new_ERC1155TokenTransferSingleTx" ("blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramId", "paramOperator", "paramTo", "paramValue", "tx") SELECT "blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramId", "paramOperator", "paramTo", "paramValue", "tx" FROM "ERC1155TokenTransferSingleTx";
DROP TABLE "ERC1155TokenTransferSingleTx";
ALTER TABLE "new_ERC1155TokenTransferSingleTx" RENAME TO "ERC1155TokenTransferSingleTx";
CREATE TABLE "new_ERC1155TokenTransferBatchTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramIds" TEXT NOT NULL,
    "paramValues" TEXT NOT NULL
);
INSERT INTO "new_ERC1155TokenTransferBatchTx" ("blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramIds", "paramOperator", "paramTo", "paramValues", "tx") SELECT "blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramIds", "paramOperator", "paramTo", "paramValues", "tx" FROM "ERC1155TokenTransferBatchTx";
DROP TABLE "ERC1155TokenTransferBatchTx";
ALTER TABLE "new_ERC1155TokenTransferBatchTx" RENAME TO "ERC1155TokenTransferBatchTx";
CREATE TABLE "new_ERC721Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL
);
INSERT INTO "new_ERC721Token" ("contractAddress", "id", "owner", "tokenId") SELECT "contractAddress", "id", "owner", "tokenId" FROM "ERC721Token";
DROP TABLE "ERC721Token";
ALTER TABLE "new_ERC721Token" RENAME TO "ERC721Token";
CREATE UNIQUE INDEX "ERC721Token_tokenId_key" ON "ERC721Token"("tokenId");
CREATE TABLE "new_ERC721TokenTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramTokenId" TEXT NOT NULL
);
INSERT INTO "new_ERC721TokenTransferTx" ("blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramTokenId", "tx") SELECT "blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramTokenId", "tx" FROM "ERC721TokenTransferTx";
DROP TABLE "ERC721TokenTransferTx";
ALTER TABLE "new_ERC721TokenTransferTx" RENAME TO "ERC721TokenTransferTx";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
