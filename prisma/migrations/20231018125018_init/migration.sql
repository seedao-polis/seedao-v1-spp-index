/*
  Warnings:

  - You are about to drop the `SNS` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "SNS";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "sns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" BIGINT NOT NULL,
    "snsName" TEXT NOT NULL,
    "owner" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "sns_tokenId_key" ON "sns"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "sns_snsName_key" ON "sns"("snsName");
