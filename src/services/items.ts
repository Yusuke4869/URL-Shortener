import KV from "../db/kv.ts";

import type { Item } from "../db/kv.ts";

const kv = await KV.getInstance();

export const getURL = async (
  host: string,
  param: string,
): Promise<string | null> => {
  const res = await kv.get([host, param]);

  if (!res || res.unavailable) return null;
  return res.url;
};

export const getAllItems = async (host: string) => {
  const items = await kv.getAll(host);
  return items;
};

export const getItem = async (host: string, param: string) => {
  const item = await kv.get([host, param]);
  return item;
};

export const upsertItem = async (host: string, param: string, item: Item) => {
  await kv.set([host, param], item);

  const res = await getItem(host, param);
  return res;
};

export const updateItem = async (
  host: string,
  param: string,
  { ...fields }: Partial<Omit<Item, "param">>,
) => {
  const item = await getItem(host, param);
  if (!item) return;

  const res = await upsertItem(host, param, {
    param,
    description: fields.description ?? item.description,
    url: fields.url ?? item.url,
    count: fields.count ?? item.count,
    unavailable: fields.unavailable ?? item.unavailable,
  });
  return res;
};

export const countUpItem = async (host: string, param: string) => {
  const item = await getItem(host, param);
  if (!item) return;

  await updateItem(host, param, { count: item.count + 1 });
};

export const disableItem = async (host: string, param: string) => {
  const res = await updateItem(host, param, { unavailable: true });
  return res;
};

export const deleteItem = async (host: string, param: string) => {
  await kv.delete([host, param]);
};
