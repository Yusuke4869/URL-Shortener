import { getConnInfo } from "hono/deno";
import type { Context } from "hono";

import { sendDiscordWebhook } from "./discord.ts";

const DISCORD_WEBHOOK_URL_ACCESS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_ACCESS_LOG",
);
const DISCORD_WEBHOOK_URL_API_ACCESS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_API_ACCESS_LOG",
);
const DISCORD_WEBHOOK_URL_OTHERS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_OTHERS_LOG",
);

export const sendAccessLog = async (c: Context, others: boolean) => {
  const webhookURL = others
    ? DISCORD_WEBHOOK_URL_OTHERS_LOG
    : DISCORD_WEBHOOK_URL_ACCESS_LOG;
  if (!webhookURL) return;

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

  const ua = c.req.header("user-agent") || "Unknown";

  await sendDiscordWebhook(webhookURL, {
    content: c.req.path,
    embeds: [
      {
        description: `[${c.req.method}] ${c.req.url} - ${c.res.status}`,
        color: others ? 0xffff00 : 0x008000,
        fields: [
          {
            name: "User-Agent",
            value: ua,
          },
        ],
        footer: {
          text: `${time} - ${info.remote.address}`,
        },
      },
    ],
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
    hashedApiKey = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
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
        color: error ? 0xff0000 : 0x008000,
        fields: [
          {
            name: "Hashed API Key",
            value: hashedApiKey,
          },
        ],
        footer: {
          text: `${time} - ${info.remote.address}`,
        },
      },
    ],
  });
};
