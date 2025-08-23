import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import {
  deleteItemController,
  getAllItemsController,
  getItemController,
  patchItemController,
  putItemController,
} from "../controller/api.ts";
import { apiMiddleware } from "../middleware/api.ts";

export const apiRoute = new Hono()
  .use(apiMiddleware)
  .get("/all", getAllItemsController)
  .get("/items/:param", getItemController)
  .put(
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
  )
  .patch(
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
  )
  .delete("/items/:param", deleteItemController);
