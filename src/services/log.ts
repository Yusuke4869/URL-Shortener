import { getConnInfo } from "hono/deno";
import type { Context } from "hono";

import { sendDiscordWebhook } from "./discord.ts";

const DISCORD_WEBHOOK_URL_ACCESS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_ACCESS_LOG",
);
const DISCORD_WEBHOOK_URL_API_ACCESS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_API_ACCESS_LOG",
);

export const sendAccessLog = async (c: Context) => {
  if (!DISCORD_WEBHOOK_URL_ACCESS_LOG) return;

  const info = getConnInfo(c);
  await sendDiscordWebhook(DISCORD_WEBHOOK_URL_ACCESS_LOG, {
    content: `[${c.req.method}] ${info.remote.address} ${c.req.url}`,
  });
};

export const sendAPIAccessLog = async (
  c: Context,
  title: string,
  error: boolean,
  apiKey: string | undefined,
) => {
  if (!DISCORD_WEBHOOK_URL_API_ACCESS_LOG) return;

  let hashedApiKey = "none";
  if (apiKey) {
    const encoder = new TextEncoder();
    const data = encoder.encode(apiKey);
    const hash = await crypto.subtle.digest("SHA-256", data);
    hashedApiKey = Array.from(new Uint8Array(hash)).map((b) =>
      b.toString(16).padStart(2, "0")
    ).join("");
  }

  const info = getConnInfo(c);
  const time = new Date().toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    hour12: false,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });

  await sendDiscordWebhook(DISCORD_WEBHOOK_URL_API_ACCESS_LOG, {
    embeds: [
      {
        title,
        description: `[${c.req.method}] ${c.req.url}`,
        color: error ? 0xff0000 : 0x20c030,
        fields: [{
          name: "Hashed API Key",
          value: hashedApiKey,
        }],
        footer: {
          text: `${time} - ${info.remote.address}`,
        },
      },
    ],
  });
};
