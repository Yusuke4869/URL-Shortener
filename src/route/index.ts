import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import { Logger } from "../service/logger.ts";
import { home, redirect } from "../controller/index.ts";

const app = new Hono();
const logger = new Logger();

app.use(async (c, next) => {
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
app.use("/robots.txt", serveStatic({ path: "public/robots.txt" }));

app.get("/", home);
app.get("/:param", redirect);

export default app;
