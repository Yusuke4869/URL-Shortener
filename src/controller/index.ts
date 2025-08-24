import { Kv } from "../infrastructure/kv.ts";
import { getRequest } from "../util/request.ts";
import { ItemUseCase } from "../usecase/item/impl.ts";
import { ItemRepository } from "../repository/item/impl.ts";

import type { Context } from "hono";

const itemUseCase = new ItemUseCase(new ItemRepository(await Kv.getKv()));

export const home = (c: Context) => {
  return c.text("Hello World!");
};

export const redirect = async (c: Context) => {
  const { host, param } = getRequest(c);
  if (!host || !param) return c.notFound();

  // クエリパラメータがある場合は404を返す
  const query = c.req.query();
  if (Object.keys(query).length > 0) return c.notFound();

  const item = await itemUseCase.findItem(host, param);
  if (!item) return c.notFound();

  const url = item.url;
  if (!url) return c.notFound();

  // GETリクエストの場合はカウントをインクリメント
  if (c.req.method === "GET") {
    await itemUseCase.incrementItemCount(host, item);
  }

  return c.redirect(url);
};
