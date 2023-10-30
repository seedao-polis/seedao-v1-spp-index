/*
  Warnings:

  - You are about to alter the column `tokenId` on the `SNS` table. The data in that column could be lost. The data in that column will be cast from `String` to `BigInt`.
  - You are about to alter the column `paramTokenId` on the `ERC721TokenTransferTx` table. The data in that column could be lost. The data in that column will be cast from `String` to `BigInt`.
  - You are about to alter the column `tokenId` on the `ERC1155Token` table. The data in that column could be lost. The data in that column will be cast from `String` to `BigInt`.
  - You are about to alter the column `tokenId` on the `ERC721Token` table. The data in that column could be lost. The data in that column will be cast from `String` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SNS" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" BIGINT NOT NULL,
    "sns" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "registeredDate" BIGINT NOT NULL,
    "length" INTEGER NOT NULL,
    "segmentLength" INTEGER NOT NULL,
    "characterSet" TEXT NOT NULL
);
INSERT INTO "new_SNS" ("characterSet", "id", "length", "owner", "registeredDate", "segmentLength", "sns", "tokenId") SELECT "characterSet", "id", "length", "owner", "registeredDate", "segmentLength", "sns", "tokenId" FROM "SNS";
DROP TABLE "SNS";
ALTER TABLE "new_SNS" RENAME TO "SNS";
CREATE UNIQUE INDEX "SNS_tokenId_key" ON "SNS"("tokenId");
CREATE UNIQUE INDEX "SNS_sns_key" ON "SNS"("sns");
CREATE TABLE "new_ERC721TokenTransferTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramTokenId" BIGINT NOT NULL
);
INSERT INTO "new_ERC721TokenTransferTx" ("blockNumber", "contractAddress", "id", "paramFrom", "paramTo", "paramTokenId", "tx") SELECT "blockNumber", "contractAddress", "id", "paramFrom", "paramTo", "paramTokenId", "tx" FROM "ERC721TokenTransferTx";
DROP TABLE "ERC721TokenTransferTx";
ALTER TABLE "new_ERC721TokenTransferTx" RENAME TO "ERC721TokenTransferTx";
CREATE UNIQUE INDEX "ERC721TokenTransferTx_tx_key" ON "ERC721TokenTransferTx"("tx");
CREATE TABLE "new_ERC1155Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" BIGINT NOT NULL,
    "tokenValue" BIGINT NOT NULL
);
INSERT INTO "new_ERC1155Token" ("contractAddress", "id", "owner", "tokenId", "tokenValue") SELECT "contractAddress", "id", "owner", "tokenId", "tokenValue" FROM "ERC1155Token";
DROP TABLE "ERC1155Token";
ALTER TABLE "new_ERC1155Token" RENAME TO "ERC1155Token";
CREATE TABLE "new_ERC721Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" BIGINT NOT NULL
);
INSERT INTO "new_ERC721Token" ("contractAddress", "id", "owner", "tokenId") SELECT "contractAddress", "id", "owner", "tokenId" FROM "ERC721Token";
DROP TABLE "ERC721Token";
ALTER TABLE "new_ERC721Token" RENAME TO "ERC721Token";
CREATE UNIQUE INDEX "ERC721Token_tokenId_key" ON "ERC721Token"("tokenId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
