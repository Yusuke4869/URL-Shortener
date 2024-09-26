import type { Context } from "hono";

import { getRequest } from "../services/request.ts";
import { countUpItem, getURL } from "../services/items.ts";

export const home = (c: Context) => {
  return c.text("Hello World!");
};

export const redirect = async (c: Context) => {
  const { host, param } = getRequest(c);
  if (!host || !param) return c.notFound();

  const query = c.req.query();
  if (Object.keys(query).length > 0) return c.notFound();

  const url = await getURL(host, param);
  if (!url) return c.notFound();

  if (c.req.method === "GET") await countUpItem(host, param);
  return c.redirect(url);
};
