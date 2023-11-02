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
    "paramTokenId" TEXT NOT NULL
);
INSERT INTO "new_ERC721TokenTransferTx" ("blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramTokenId", "tx") SELECT "blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramTokenId", "tx" FROM "ERC721TokenTransferTx";
DROP TABLE "ERC721TokenTransferTx";
ALTER TABLE "new_ERC721TokenTransferTx" RENAME TO "ERC721TokenTransferTx";
CREATE TABLE "new_ERC1155TokenTransferSingleTx" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
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
CREATE TABLE "new_ERC1155Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "tokenValue" BIGINT NOT NULL
);
INSERT INTO "new_ERC1155Token" ("contractAddress", "id", "owner", "tokenId", "tokenValue") SELECT "contractAddress", "id", "owner", "tokenId", "tokenValue" FROM "ERC1155Token";
DROP TABLE "ERC1155Token";
ALTER TABLE "new_ERC1155Token" RENAME TO "ERC1155Token";
CREATE TABLE "new_ERC721Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL
);
INSERT INTO "new_ERC721Token" ("contractAddress", "id", "owner", "tokenId") SELECT "contractAddress", "id", "owner", "tokenId" FROM "ERC721Token";
DROP TABLE "ERC721Token";
ALTER TABLE "new_ERC721Token" RENAME TO "ERC721Token";
CREATE UNIQUE INDEX "ERC721Token_tokenId_key" ON "ERC721Token"("tokenId");
CREATE TABLE "new_SNS" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" TEXT NOT NULL,
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
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
