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

async function main() {
  // init database
  const client = new PrismaClient();

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
  // // ---> scr
  // for (const [from, to, amount, blockNumber] of (await scr.history(SCRAddr, httpMainnetPRC))) {
  //   // ...
  // }

  // listen new events

  // instance Express App
  const app = express();

  // middleware
  app.use((req: Request, resp: Response, next: NextFunction) => {
    req.app.resource.client = client;
  });

  // sns apis
  app.get("/all", snsAll);
  app.get("/by_token_id/:tokenId", snsByTokenId);

  // scr apis

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
