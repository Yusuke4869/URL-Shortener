import { getConnInfo } from "hono/deno";

import type { Context } from "hono";

type DiscordEmbed = {
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

type DiscordWebhookContent = {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
};

const DISCORD_WEBHOOK_URL_ACCESS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_ACCESS_LOG",
);
const DISCORD_WEBHOOK_URL_API_ACCESS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_API_ACCESS_LOG",
);
const DISCORD_WEBHOOK_URL_OTHERS_LOG = Deno.env.get(
  "DISCORD_WEBHOOK_URL_OTHERS_LOG",
);

export class Logger {
  private readonly DISCORD_WEBHOOK_URL_ACCESS_LOG: string | undefined;
  private readonly DISCORD_WEBHOOK_URL_API_ACCESS_LOG: string | undefined;
  private readonly DISCORD_WEBHOOK_URL_OTHERS_LOG: string | undefined;

  constructor() {
    this.DISCORD_WEBHOOK_URL_ACCESS_LOG = DISCORD_WEBHOOK_URL_ACCESS_LOG;
    this.DISCORD_WEBHOOK_URL_API_ACCESS_LOG =
      DISCORD_WEBHOOK_URL_API_ACCESS_LOG;
    this.DISCORD_WEBHOOK_URL_OTHERS_LOG = DISCORD_WEBHOOK_URL_OTHERS_LOG;
  }

  private getTimestamp(): string {
    return new Date().toLocaleString("en-US", {
      timeZone: "Asia/Tokyo",
      hour12: false,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  }

  private async sendToDiscord(
    webhookUrl: string,
    content: DiscordWebhookContent,
  ): Promise<number> {
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });

      return res.status;
    } catch (e) {
      console.error(e);
      return 500;
    }
  }

  async access(c: Context, others: boolean): Promise<void> {
    const webhookUrl = others
      ? this.DISCORD_WEBHOOK_URL_OTHERS_LOG
      : this.DISCORD_WEBHOOK_URL_ACCESS_LOG;
    if (!webhookUrl) return;

    const info = getConnInfo(c);
    const time = this.getTimestamp();
    const ua = c.req.header("user-agent") || "Unknown";

    await this.sendToDiscord(webhookUrl, {
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
  }

  async apiAccess(
    c: Context,
    title: string,
    error: boolean,
    apiKey: string | undefined,
  ): Promise<void> {
    if (!this.DISCORD_WEBHOOK_URL_API_ACCESS_LOG) return;

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
    const time = this.getTimestamp();

    await this.sendToDiscord(this.DISCORD_WEBHOOK_URL_API_ACCESS_LOG, {
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
  }
}
