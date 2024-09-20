import { Hono } from "hono";

import { home, redirect } from "../controllers/index.ts";
import { sendAccessLog } from "../services/log.ts";

const app = new Hono();

app.use(async (c, next) => {
  if (!c.req.path.startsWith("/api")) await sendAccessLog(c);

  await next();
});

app.get("/", home);
app.get("/:param", redirect);

export default app;
