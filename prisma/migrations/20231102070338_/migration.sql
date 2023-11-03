/*
  Warnings:

  - You are about to alter the column `paramValue` on the `ERC20TokenTransferTx` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal`.
  - You are about to alter the column `amount` on the `ERC20Token` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Decimal`.

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
    "paramValue" DECIMAL NOT NULL
);
INSERT INTO "new_ERC20TokenTransferTx" ("blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramValue", "timestamp", "tx") SELECT "blockNumber", "contractAddress", "handler", "id", "paramFrom", "paramTo", "paramValue", "timestamp", "tx" FROM "ERC20TokenTransferTx";
DROP TABLE "ERC20TokenTransferTx";
ALTER TABLE "new_ERC20TokenTransferTx" RENAME TO "ERC20TokenTransferTx";
CREATE TABLE "new_ERC20Token" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "amount" DECIMAL NOT NULL
);
INSERT INTO "new_ERC20Token" ("amount", "contractAddress", "id", "owner") SELECT "amount", "contractAddress", "id", "owner" FROM "ERC20Token";
DROP TABLE "ERC20Token";
ALTER TABLE "new_ERC20Token" RENAME TO "ERC20Token";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
