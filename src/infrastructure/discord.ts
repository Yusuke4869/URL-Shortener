import type { DiscordWebhookContent } from "../service/logging/formatter.ts";

export interface DiscordTransportConfig {
  readonly accessLogUrl?: string;
  readonly apiAccessLogUrl?: string;
  readonly othersLogUrl?: string;
}

export class DiscordTransport {
  constructor(private readonly config: DiscordTransportConfig) {}

  async send(
    webhookContent: DiscordWebhookContent,
    logType: "access" | "api",
    isError: boolean,
  ): Promise<void> {
    const webhookUrl = this.getWebhookUrl(logType, isError);
    if (!webhookUrl) return;

    await this.sendToDiscord(webhookUrl, webhookContent);
  }

  private getWebhookUrl(
    logType: "access" | "api",
    isError: boolean,
  ): string | undefined {
    switch (logType) {
      case "access":
        return isError ? this.config.othersLogUrl : this.config.accessLogUrl;
      case "api":
        return this.config.apiAccessLogUrl;
      default:
        return this.config.othersLogUrl;
    }
  }

  private async sendToDiscord(
    webhookUrl: string,
    content: DiscordWebhookContent,
  ): Promise<void> {
    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        console.error(`Discord webhook failed: ${response.status}`);
      }
    } catch (error) {
      console.error("Discord webhook error:", error);
    }
  }
}
