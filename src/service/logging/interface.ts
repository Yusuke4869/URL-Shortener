import type { Context } from "hono";

export interface LoggingServiceInterface {
  access(c: Context, others: boolean): Promise<void>;
  apiAccess(
    c: Context,
    title: string,
    error: boolean,
    apiKey: string | undefined,
  ): Promise<void>;
  logAccess(context: Context, isError: boolean): Promise<void>;
  logApiAccess(
    context: Context,
    title: string,
    error: boolean,
    apiKey?: string,
  ): Promise<void>;
}
