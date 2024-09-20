import type { Context } from "hono";

import { getRequest } from "../services/request.ts";
import {
  deleteItem,
  disableItem,
  getAllItems,
  getItem,
  updateItem,
  upsertItem,
} from "../services/items.ts";

export const getAllItemsController = async (c: Context) => {
  const { host } = getRequest(c);
  if (!host) return c.notFound();

  const items = await getAllItems(host);
  return c.json(items);
};

export const getItemController = async (c: Context) => {
  const { host, param } = getRequest(c);
  if (!host || !param) return c.notFound();

  const item = await getItem(host, param);
  if (!item) return c.notFound();
  return c.json(item);
};

export const putItemController = async (
  c: Context,
  description: string | undefined,
  url: string,
  count: number | undefined,
) => {
  const { host, param } = getRequest(c);
  if (!host || !param) return c.notFound();

  const item = typeof count === "number" ? null : await getItem(host, param);
  const res = await upsertItem(host, param, {
    param,
    description: description ?? item?.description,
    url,
    count: typeof count === "number" ? count : item?.count ?? 0,
    unavailable: false,
  });

  return c.json(res);
};

export const patchItemController = async (
  c: Context,
  description: string | undefined,
  url: string | undefined,
  count: number | undefined,
  unavailable: boolean | undefined,
) => {
  const { host, param } = getRequest(c);
  if (!host || !param) return c.notFound();

  const item = await getItem(host, param);
  if (!item) return c.notFound();

  const res = await updateItem(host, param, {
    description,
    url,
    count,
    unavailable,
  });
  return c.json(res);
};

export const deleteItemController = async (c: Context) => {
  const { host, param } = getRequest(c);
  if (!host || !param) return c.notFound();

  if (c.req.query("permanently") === "true") {
    await deleteItem(host, param);
    return c.body(null, 204);
  }

  const res = await disableItem(host, param);
  return c.json(res);
};
