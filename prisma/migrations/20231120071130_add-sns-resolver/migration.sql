-- CreateTable
CREATE TABLE "SNSAddressResolver" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,

    CONSTRAINT "SNSAddressResolver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SNSResolverAddrChangedTx" (
    "id" SERIAL NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramNode" TEXT NOT NULL,
    "paramName" TEXT NOT NULL,
    "paramA" TEXT NOT NULL,

    CONSTRAINT "SNSResolverAddrChangedTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SNSNameResolver" (
    "id" SERIAL NOT NULL,
    "address" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "SNSNameResolver_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SNSResolverNameChangedTx" (
    "id" SERIAL NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramNode" TEXT NOT NULL,
    "paramA" TEXT NOT NULL,
    "paramName" TEXT NOT NULL,

    CONSTRAINT "SNSResolverNameChangedTx_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SNSAddressResolver_name_key" ON "SNSAddressResolver"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SNSNameResolver_address_key" ON "SNSNameResolver"("address");
