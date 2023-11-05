-- CreateTable
CREATE TABLE "ERC20Token" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ERC20Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERC20TokenTransferTx" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramValue" DECIMAL(65,30) NOT NULL,

    CONSTRAINT "ERC20TokenTransferTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERC721Token" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "timestamp" INTEGER NOT NULL,

    CONSTRAINT "ERC721Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERC721TokenTransferTx" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramTokenId" TEXT NOT NULL,

    CONSTRAINT "ERC721TokenTransferTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERC1155Token" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "tokenId" TEXT NOT NULL,
    "tokenValue" BIGINT NOT NULL,

    CONSTRAINT "ERC1155Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERC1155TokenTransferSingleTx" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramId" TEXT NOT NULL,
    "paramValue" BIGINT NOT NULL,

    CONSTRAINT "ERC1155TokenTransferSingleTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ERC1155TokenTransferBatchTx" (
    "id" SERIAL NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramOperator" TEXT NOT NULL,
    "paramFrom" TEXT NOT NULL,
    "paramTo" TEXT NOT NULL,
    "paramIds" TEXT NOT NULL,
    "paramValues" TEXT NOT NULL,

    CONSTRAINT "ERC1155TokenTransferBatchTx_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SNS" (
    "id" SERIAL NOT NULL,
    "tokenId" TEXT NOT NULL,
    "sns" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "registeredDate" INTEGER NOT NULL,
    "length" INTEGER NOT NULL,
    "segmentLength" INTEGER NOT NULL,
    "characterSet" TEXT NOT NULL,

    CONSTRAINT "SNS_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SNSNameregisteredTx" (
    "id" SERIAL NOT NULL,
    "tx" TEXT NOT NULL,
    "blockNumber" INTEGER NOT NULL,
    "timestamp" INTEGER NOT NULL,
    "handler" TEXT NOT NULL,
    "paramName" TEXT NOT NULL,
    "paramOwner" TEXT NOT NULL,

    CONSTRAINT "SNSNameregisteredTx_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ERC721Token_tokenId_key" ON "ERC721Token"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "SNS_tokenId_key" ON "SNS"("tokenId");

-- CreateIndex
CREATE UNIQUE INDEX "SNS_sns_key" ON "SNS"("sns");
