import { Hono } from "hono";
import { logger } from "hono/logger";

import app from "./route/index.ts";
import api from "./route/api.ts";

const server = new Hono()
  .use(logger())
  .route("/", app)
  .route("/api", api);

Deno.serve(server.fetch);
