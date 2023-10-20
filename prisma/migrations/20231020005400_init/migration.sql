-- CreateTable
CREATE TABLE "sns" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "tokenId" TEXT NOT NULL,
    "sns" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "registeredDate" BIGINT NOT NULL,
    "length" INTEGER NOT NULL,
    "segmentLength" INTEGER NOT NULL,
    "characterSet" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "sns_tokenId_key" ON "sns"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "sns_sns_key" ON "sns"("sns");
