import { scr } from "./scr";
import { sns } from "./sns";
import fs from "fs";
import { ethers } from "ethers";

async function main() {
  const scrBalance = new Map<string, bigint>();
  (await scr.history()).forEach(([from, to, amount]) => {
    scrBalance.set(to, (scrBalance.get(to) ?? BigInt(0)) + amount);
  });
  for (const balance of scrBalance.entries()) {
    fs.writeFileSync(
      "scr.json",
      `{ "wallet": "${
        balance[0]
      }", "chainId": 1, "contractAddr": "<scr addr>", "contractType": "erc20", "amount": "${ethers.formatEther(
        balance[1],
      )}", "tokenId": "", "tokenUri": "", "name": "SCR", "symbol": "SCR", "imageUri": "", "metadata": "" },\n`,
      { flag: "a+" },
    );
  }

  (await sns.history()).forEach(([name, owner]) => {
    fs.writeFileSync("sns.txt", `${name}:${owner}\n`, { flag: "a+" });
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
