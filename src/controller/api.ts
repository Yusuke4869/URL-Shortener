import { Kv } from "../infrastructure/kv.ts";
import { getRequest } from "../service/request.ts";
import { ItemUseCase } from "../usecase/item/impl.ts";
import { ItemRepository } from "../repository/item/impl.ts";

import type { Context } from "hono";

const itemUseCase = new ItemUseCase(new ItemRepository(await Kv.getKv()));

export const getAllItemsController = async (c: Context) => {
  const { host } = getRequest(c);
  if (!host) return c.notFound();

  const items = await itemUseCase.findAllItems(host);
  return c.json(items);
};

export const getItemController = async (c: Context) => {
  const { host, param } = getRequest(c);
  if (!host || !param) return c.notFound();

  const item = await itemUseCase.findItem(host, param);
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

  const item = await itemUseCase.findItem(host, param);
  const res = await itemUseCase.upsertItem(host, {
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

  const item = await itemUseCase.findItem(host, param);
  if (!item) return c.notFound();

  const res = await itemUseCase.updateItem(host, item, {
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

  const item = await itemUseCase.findItem(host, param);
  if (!item) return c.notFound();

  if (c.req.query("permanently") === "true") {
    await itemUseCase.deleteItem(host, item);
    return c.body(null, 204);
  }

  const res = await itemUseCase.disableItem(host, item);
  return c.json(res);
};
