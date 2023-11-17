import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { ethers, JsonRpcProvider } from "ethers";

export namespace seedImageAPI {
  export async function images(req: Request, resp: Response) {
    const client: PrismaClient = resp.locals.client;
    const seed = await client.eRC721Token.findMany({
      where: { contractAddress: "0x30093266E34a816a53e302bE3e59a93B52792FD4" },
    });

    const c = new ethers.Contract(
      "0x30093266E34a816a53e302bE3e59a93B52792FD4",
      [
        {
          inputs: [
            {
              internalType: "uint256",
              name: "tokenId",
              type: "uint256",
            },
          ],
          name: "tokenURI",
          outputs: [
            {
              internalType: "string",
              name: "",
              type: "string",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      new JsonRpcProvider(
        "https://eth-mainnet.g.alchemy.com/v2/FU0ujCat3OQd5hIqpddJ94SngVaeSxad",
      ),
    );

    // let i = 0;

    const r: { id: string; image: string }[] = [];
    for (const e of seed) {
      // i++;
      // if (i <= 273) continue;

      let uri: string = await c.tokenURI(e.tokenId);

      // console.log(i, " : ", e.tokenId, " : ", uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/"));

      const metadata = await fetch(
        uri.replace("ipfs://", "https://cloudflare-ipfs.com/ipfs/"),
      );
      const image = ((await metadata.json()) as { image: string }).image;
      // console.log(i, " : ", e.tokenId, " : ", image);
      r.push({
        id: e.tokenId,
        image,
      });
    }

    resp.json(r);
  }
}
