import { Hono } from "hono";
import { logger } from "hono/logger";

import app from "./route/index.ts";
import api from "./route/api.ts";

const server = new Hono();

server.use(logger());
server.route("/", app);
server.route("/api", api);

Deno.serve(server.fetch);
