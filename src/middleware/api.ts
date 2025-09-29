import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { LoggingService } from "../service/logging/impl.ts";

const apiKeys = Deno.env.get("API_KEYS")?.split(",").filter(Boolean) ?? [];

const logger = new LoggingService();

export const apiMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey || !apiKeys.includes(apiKey)) {
    await logger.apiAccess(c, "Unauthorized", true, apiKey);
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  await logger.apiAccess(c, "Accessed", false, apiKey);
  await next();
});
