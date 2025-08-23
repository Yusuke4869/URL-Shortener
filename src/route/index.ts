import { Hono } from "hono";
import { serveStatic } from "hono/deno";

import { home, redirect } from "../controller/index.ts";
import { indexMiddleware } from "../middleware/index.ts";

export const indexRoute = new Hono()
  .use(indexMiddleware)
  .use("/robots.txt", serveStatic({ path: "public/robots.txt" }))
  .get("/", home)
  .get("/:param", redirect);
