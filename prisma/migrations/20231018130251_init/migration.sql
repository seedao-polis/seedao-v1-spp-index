/*
  Warnings:

  - Added the required column `blockNumber` to the `sns` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" BIGINT NOT NULL,
    "snsName" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL
);
INSERT INTO "new_sns" ("id", "owner", "snsName", "tokenId") SELECT "id", "owner", "snsName", "tokenId" FROM "sns";
DROP TABLE "sns";
ALTER TABLE "new_sns" RENAME TO "sns";
CREATE UNIQUE INDEX "sns_tokenId_key" ON "sns"("tokenId");
CREATE UNIQUE INDEX "sns_snsName_key" ON "sns"("snsName");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
