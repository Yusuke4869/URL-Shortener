import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import { Logger } from "../service/logger.ts";
import { home, redirect } from "../controller/index.ts";

const logger = new Logger();

const app = new Hono()
  .use(async (c, next) => {
    await next();

    if (!c.req.path.startsWith("/api")) {
      // 200-299 or 300-399
      if (c.res.ok || (c.res.status >= 300 && c.res.status < 400)) {
        await logger.access(c, false);
      } else {
        await logger.access(c, true);
      }
    }
  })
  .use("/robots.txt", serveStatic({ path: "public/robots.txt" }))
  .get("/", home)
  .get("/:param", redirect);

export default app;
