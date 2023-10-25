import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
// @ts-ignore
import conf from "../../conf.json";

export namespace snsMetadataAPI {
  // `/metadata/:tokenId`
  export async function metadata(req: Request, resp: Response) {
    const tokenId: string = req.params.tokenId;

    const client: PrismaClient = resp.locals.client;
    const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });

    if (sns === null) {
      resp.status(404).json({ error: "SNS Not Found" });
      return;
    }

    const image = conf.metadata_host + "metadata/" + tokenId + "/image";
    const metadata = {
      name: sns.sns,
      description: sns.sns + ", an SNS name.",
      image: image,
      image_url: image,
      attributes: [
        {
          trait_type: "Length",
          display_type: "number",
          value: sns.length,
        },
        {
          trait_type: "Segment Length",
          display_type: "number",
          value: sns.segmentLength,
        },
        {
          trait_type: "Character Set",
          display_type: "string",
          value: sns.characterSet,
        },
        {
          trait_type: "Registration Date",
          display_type: "date",
          value: Number(sns.registeredDate),
        },
      ],
    };

    resp.json(metadata);
  }

  // `/metadata/:tokenId/image`
  export async function image(req: Request, resp: Response) {
    const tokenId: string = req.params.tokenId;

    const client: PrismaClient = resp.locals.client;
    const sns = await client.sns.findUnique({ where: { tokenId: tokenId } });

    if (sns === null) {
      resp.status(404).json({ error: "SNS Not Found" });
      return;
    }

    const buffer = Buffer.from(_genSVG(sns.sns));

    resp
      .writeHead(200, {
        "Content-Type": "image/svg+xml",
        "Content-Length": buffer.length,
      })
      .end(buffer);
  }

  function _genSVG(name: string): string {
    return `<svg width="270" height="270" viewBox="0 0 270 270" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="270" height="270" fill="url(#paint0_linear)"/>
<defs>
<filter id="dropShadow" color-interpolation-filters="sRGB" filterUnits="userSpaceOnUse" height="270" width="270">
<feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.225" width="200%" height="200%"/>
</filter>
</defs>
<text
      x="32.5"
      y="231"
      font-size="22px"
      fill="white"
      filter="url(#dropShadow)">${name}</text>
<defs>
<style>
        text {
          font-family: 'Satoshi', 'Noto Color Emoji', 'Apple Color Emoji', sans-serif;
          font-style: normal;
          font-variant-numeric: tabular-nums;
          font-weight: bold;
          font-variant-ligatures: none;
          font-feature-settings: "ss01" on, "ss03" on;
          -moz-font-feature-settings: "ss01" on, "ss03" on;
          line-height: 34px;
        }
      </style>
<linearGradient id="paint0_linear" x1="190.5" y1="302" x2="-64" y2="-172.5" gradientUnits="userSpaceOnUse">
<stop stop-color="#44BcF0"/>
<stop offset="0.428185" stop-color="#628BF3"/>
<stop offset="1" stop-color="#A099FF"/>
</linearGradient>
<linearGradient id="paint1_linear" x1="0" y1="0" x2="269.553" y2="285.527" gradientUnits="userSpaceOnUse">
<stop stop-color="#EB9E9E"/>
<stop offset="1" stop-color="#992222"/>
</linearGradient>
</defs>
</svg>`;
  }
}
