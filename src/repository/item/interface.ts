import type { Item, ItemFields } from "../../domain/item/impl.ts";

export interface ItemRepositoryInterface {
  findAllItems(host: string): Promise<Item[]>;
  findItem(host: string, param: string): Promise<Item | null>;
  upsertItem(host: string, fields: ItemFields): Promise<Item>;
  updateItem(
    host: string,
    item: Item,
    fields: Partial<Omit<ItemFields, "param">>,
  ): Promise<Item>;
  deleteItem(host: string, item: Item): Promise<void>;
}
