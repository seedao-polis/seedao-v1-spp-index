import { sns, scr } from "./sdk";
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { namehash } from "@seedao/sns-namehash";
import { snsAll, snsByTokenId } from "./api/sns";
import {
  httpMainnetPRC,
  httpSepoliaRPC,
  SCRAddr,
  SNSAddr,
} from "./addr_and_rpc";
import { SeepassAPI } from "./sdk/seepass_api";

async function main() {
  // init database
  const client = new PrismaClient();

  // Init SeePASS API
  const seepassApi = new SeepassAPI(process.env.SEEPASS_BASE || "http://localhost:3000");
  // var scrRecords: Record<string, bigint> = {};
  // var changedScrAccounts: Record<string, boolean> = {};

  // handle history events
  // ---> sns
  for (const [name, owner, blockNumber] of await sns.history(
    SNSAddr,
    httpSepoliaRPC,
  )) {
    // owner: '0x123...321'
    const xx = namehash(name); //  name: 'xs' not contain '.seedao'
    const tokenId = ethers.getBigInt(xx);
    console.log(xx, tokenId, name, owner, blockNumber);
    await client.sns.create({
      data: {
        tokenId: tokenId,
        sns: name + ".seedao",
        owner: owner,
        blockNumber: blockNumber,
      },
    });
  }

  // ---> scr
  const scrRecords = await scr.history(SCRAddr, httpMainnetPRC);
  const updatedRecords = scr.getUpdatedScrRecords(scrRecords);
  await scr.sendDataToSpp(seepassApi, updatedRecords);

  // listen new events
  scr.subscribe(SCRAddr, httpMainnetPRC, async (scrEvent: scr.TransferEvent) => {
    const updatedRecords = scr.getUpdatedScrRecords([scrEvent]);
    await scr.sendDataToSpp(seepassApi, updatedRecords);
  })

  // instance Express App
  const app = express();

  // middleware
  app.use((req: Request, resp: Response, next: NextFunction) => {
    req.app.resource.client = client;
  });

  // sns apis
  app.get("/all", snsAll);
  app.get("/by_token_id/:tokenId", snsByTokenId);

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3003");
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
