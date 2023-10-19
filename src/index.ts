import { sns, scr } from "./sdk";
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ethers, keccak256 } from "ethers";
import { snsAPI } from "./api/sns";
import {
  httpMainnetPRC,
  httpSepoliaRPC,
  SCRAddr,
  SNSAddr,
  wsMainnetPRC,
} from "./addr_and_rpc";
import { SeepassAPI } from "./sdk/seepass_api";
import { snsMetadataAPI } from "./api/sns_metadata";
import { findCharacterSet, getCodePointLength, getSegmentLength } from "./util";

async function main() {
  // init database
  const client = new PrismaClient();

  // Init SeePASS API
  const seepassApi = new SeepassAPI(
    process.env.SEEPASS_BASE || "http://localhost:3000",
  );
  // var scrRecords: Record<string, bigint> = {};
  // var changedScrAccounts: Record<string, boolean> = {};

  // handle history events
  // ---> sns
  for (const { name, owner } of await sns.history(SNSAddr, httpSepoliaRPC)) {
    await client.sns.create({
      data: {
        tokenId: BigInt(keccak256(ethers.toUtf8Bytes(name))).toString(),
        sns: name + ".seedao",
        owner: owner,
        registeredDate: Date.now(),
        length: getCodePointLength(name),
        segmentLength: getSegmentLength(name),
        characterSet: findCharacterSet(name),
      },
    });
  }

  // ---> scr
  const scrRecords = await scr.history(SCRAddr, httpMainnetPRC);
  const updatedRecords = scr.getUpdatedScrRecords(scrRecords);
  await scr.sendDataToSpp(seepassApi, updatedRecords);

  // listen new events
  await scr.subscribe(
    SCRAddr,
    wsMainnetPRC,
    async (scrEvent: scr.TransferEvent) => {
      const updatedRecords = scr.getUpdatedScrRecords([scrEvent]);
      await scr.sendDataToSpp(seepassApi, updatedRecords);
    },
  );

  // instance Express App
  const app = express();

  // middleware
  app.use((req: Request, resp: Response, next: NextFunction) => {
    req.app.resource.client = client;
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
