import type { Context } from "hono";
import { DiscordTransport } from "../../infrastructure/discord.ts";
import { formatAccessLog, formatApiLog } from "./formatter.ts";
import type { LoggingServiceInterface } from "./interface.ts";

export class LoggingService implements LoggingServiceInterface {
  private readonly transport: DiscordTransport;

  constructor() {
    this.transport = new DiscordTransport({
      accessLogUrl: Deno.env.get("DISCORD_WEBHOOK_URL_ACCESS_LOG"),
      apiAccessLogUrl: Deno.env.get("DISCORD_WEBHOOK_URL_API_ACCESS_LOG"),
      othersLogUrl: Deno.env.get("DISCORD_WEBHOOK_URL_OTHERS_LOG"),
    });
  }

  async access(c: Context, others: boolean): Promise<void> {
    await this.logAccess(c, others);
  }

  async apiAccess(
    c: Context,
    title: string,
    error: boolean,
    apiKey: string | undefined,
  ): Promise<void> {
    await this.logApiAccess(c, title, error, apiKey);
  }

  async logAccess(context: Context, isError: boolean): Promise<void> {
    const timestamp = new Date();
    const discordContent = formatAccessLog(context, isError, timestamp);
    await this.transport.send(discordContent, "access", isError);
  }

  async logApiAccess(
    context: Context,
    title: string,
    error: boolean,
    apiKey?: string,
  ): Promise<void> {
    const timestamp = new Date();
    const discordContent = await formatApiLog(
      context,
      title,
      error,
      apiKey,
      timestamp,
    );
    await this.transport.send(discordContent, "api", error);
  }
}
