import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { z } from "zod";

import {
  deleteItemController,
  getAllItemsController,
  getItemController,
  patchItemController,
  putItemController,
} from "../controllers/api.ts";
import { sendAPIAccessLog } from "../services/log.ts";

const apiKeys = Deno.env.get("API_KEYS")?.split(",").filter(Boolean) ?? [];

const api = new Hono();

api.use(async (c, next) => {
  const apiKey = c.req.header("X-API-Key");

  if (!apiKeys.length || !apiKey) {
    await sendAPIAccessLog(c, "Unauthorized", true, apiKey);
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  if (!apiKeys.includes(apiKey)) {
    await sendAPIAccessLog(c, "Forbidden", true, apiKey);
    throw new HTTPException(403, { message: "Forbidden" });
  }

  await sendAPIAccessLog(c, "Accessed", false, apiKey);
  await next();
});

api.get("/all", getAllItemsController);
api.get("/items/:param", getItemController);
api.put(
  "/items/:param",
  zValidator(
    "json",
    z.object({
      description: z.string().optional(),
      url: z.string().url(),
      count: z.number().optional(),
    }),
  ),
  (c) => {
    const { description, url, count } = c.req.valid("json");
    return putItemController(c, description, url, count);
  },
);
api.patch(
  "/items/:param",
  zValidator(
    "json",
    z.object({
      description: z.string().optional(),
      url: z.string().url().optional(),
      count: z.number().optional(),
      unavailable: z.boolean().optional(),
    }),
  ),
  (c) => {
    const { description, url, count, unavailable } = c.req.valid("json");
    return patchItemController(c, description, url, count, unavailable);
  },
);
api.delete("/items/:param", deleteItemController);

export default api;
