import { getConnInfo } from "hono/deno";
import type { Context } from "hono";

export type DiscordEmbed = {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
};

export type DiscordWebhookContent = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
};

const formatTimestamp = (timestamp: Date): string => {
  return timestamp.toLocaleString("en-US", {
    timeZone: "Asia/Tokyo",
    hour12: false,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  });
};

export const formatAccessLog = (
  context: Context,
  isError: boolean,
  timestamp: Date,
): DiscordWebhookContent => {
  const info = getConnInfo(context);
  const ua = context.req.header("user-agent") || "Unknown";

  return {
    content: context.req.path,
    embeds: [{
      description:
        `[${context.req.method}] ${context.req.url} - ${context.res.status}`,
      color: isError ? 0xffff00 : 0x008000,
      fields: [{
        name: "User-Agent",
        value: ua,
      }],
      footer: {
        text: `${formatTimestamp(timestamp)} - ${info.remote.address}`,
      },
    }],
  };
};

export const formatApiLog = async (
  context: Context,
  title: string,
  isError: boolean,
  apiKey: string | undefined,
  timestamp: Date,
): Promise<DiscordWebhookContent> => {
  const info = getConnInfo(context);
  const hashedApiKey = await getHashedApiKey(apiKey);

  return {
    embeds: [{
      title,
      description: `[${context.req.method}] ${context.req.url}`,
      color: isError ? 0xff0000 : 0x008000,
      fields: [{
        name: "Hashed API Key",
        value: hashedApiKey,
      }],
      footer: {
        text: `${formatTimestamp(timestamp)} - ${info.remote.address}`,
      },
    }],
  };
};

const getHashedApiKey = async (apiKey: string | undefined): Promise<string> => {
  if (!apiKey) return "none";

  const encoder = new TextEncoder();
  const data = encoder.encode(apiKey);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
