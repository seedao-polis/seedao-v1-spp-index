-- CreateTable
CREATE TABLE "SNS" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "toeknId" BIGINT NOT NULL,
    "snsName" TEXT NOT NULL,
    "owner" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SNS_toeknId_key" ON "SNS"("toeknId");

-- CreateIndex
CREATE UNIQUE INDEX "SNS_snsName_key" ON "SNS"("snsName");
