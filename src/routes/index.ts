import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import { home, redirect } from "../controllers/index.ts";
import { sendAccessLog } from "../services/log.ts";

const app = new Hono();

app.use(async (c, next) => {
  await next();

  if (!c.req.path.startsWith("/api")) {
    // 200-299 or 300-399
    if (c.res.ok || (c.res.status >= 300 && c.res.status < 400)) {
      await sendAccessLog(c, false);
    } else {
      await sendAccessLog(c, true);
    }
  }
});
app.use("/robots.txt", serveStatic({ path: "public/robots.txt" }));

app.get("/", home);
app.get("/:param", redirect);

export default app;
