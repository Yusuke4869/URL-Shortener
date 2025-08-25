import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";

import { LoggingService } from "../service/logging/impl.ts";

const apiKeys = Deno.env.get("API_KEYS")?.split(",").filter(Boolean) ?? [];

const logger = new LoggingService();

export const apiMiddleware = createMiddleware(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKey) {
    await logger.apiAccess(c, "Unauthorized", true, apiKey);
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  if (!apiKeys.includes(apiKey)) {
    await logger.apiAccess(c, "Forbidden", true, apiKey);
    throw new HTTPException(403, { message: "Forbidden" });
  }

  await logger.apiAccess(c, "Accessed", false, apiKey);
  await next();
});
