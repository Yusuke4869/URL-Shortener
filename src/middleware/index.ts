import { createMiddleware } from "hono/factory";

import { LoggingService } from "../service/logging/impl.ts";

const logger = new LoggingService();

export const indexMiddleware = createMiddleware(async (c, next) => {
  await next();

  if (!c.req.path.startsWith("/api")) {
    // 200-299 or 300-399
    if (c.res.ok || (c.res.status >= 300 && c.res.status < 400)) {
      await logger.access(c, false);
    } else {
      await logger.access(c, true);
    }
  }
});
