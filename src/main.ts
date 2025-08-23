import { Hono } from "hono";
import { logger } from "hono/logger";

import { indexRoute } from "./route/index.ts";
import { apiRoute } from "./route/api.ts";

const app = new Hono()
  .use(logger())
  .route("/", indexRoute)
  .route("/api", apiRoute);

Deno.serve(app.fetch);
