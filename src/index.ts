import { sns } from "./sdk";
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { snsAPI } from "./api/sns";
import { httpSepoliaRPC, SNSAddr, wsSepoliaRPC } from "./addr_and_rpc";
import { snsMetadataAPI } from "./api/sns_metadata";
import { findCharacterSet, getCodePointLength, getSegmentLength } from "./util";

async function main() {
  // init database
  const client = new PrismaClient();

  // handle history events
  // ---> sns TODO read latestBlockNumber from database
  for (const { name, owner } of await sns.history(SNSAddr, httpSepoliaRPC)) {
    const tokenId = BigInt(
      ethers.keccak256(ethers.toUtf8Bytes(name)),
    ).toString();

    // TODO refactor
    const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });
    if (sns === null) {
      await client.sns.create({
        data: {
          tokenId: tokenId,
          sns: name + ".seedao",
          owner: owner,
          registeredDate: Date.now(),
          length: getCodePointLength(name),
          segmentLength: getSegmentLength(name),
          characterSet: findCharacterSet(name),
        },
      });
    }
  }
  // ---> sns
  await sns.subscribe(SNSAddr, wsSepoliaRPC, async (event) => {
    const tokenId = BigInt(
      ethers.keccak256(ethers.toUtf8Bytes(event.name)),
    ).toString();

    // TODO save latestBlockNumber to database

    // TODO refactor
    const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });
    if (sns === null) {
      await client.sns.create({
        data: {
          tokenId: tokenId,
          sns: event.name + ".seedao",
          owner: event.owner,
          registeredDate: Date.now(),
          length: getCodePointLength(event.name),
          segmentLength: getSegmentLength(event.name),
          characterSet: findCharacterSet(event.name),
        },
      });
    }
  });

  // instance Express App
  const app = express();

  // middleware
  app.use((req: Request, resp: Response, next: NextFunction) => {
    resp.locals.client = client;
    next();
  });

  // sns apis
  app.get("/all", snsAPI.all);
  app.get("/by_token_id/:tokenId", snsAPI.byTokenId);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  // sns metadata apis
  app.get("/metadata/:tokenId", snsMetadataAPI.metadata);
  app.get("/metadata/:tokenId/image", snsMetadataAPI.image);

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3003");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
