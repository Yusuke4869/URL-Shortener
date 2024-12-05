import { Item } from "../../domain/item/impl.ts";

import type { ItemFields } from "../../domain/item/impl.ts";
import type { ItemRepositoryInterface } from "./interface.ts";

type MockItems = {
  [host: string]: Item[];
};

export class MockItemRepository implements ItemRepositoryInterface {
  constructor(private items: MockItems) {}

  findAllItems(host: string): Promise<Item[]> {
    return Promise.resolve(this.items[host] ?? []);
  }

  findItem(host: string, param: string): Promise<Item | null> {
    const item = this.items[host].find((item) => item.param === param);
    return Promise.resolve(item ?? null);
  }

  upsertItem(host: string, fields: ItemFields): Promise<Item> {
    const item = new Item(fields);
    this.items[host].push(item);
    return Promise.resolve(item);
  }

  updateItem(
    host: string,
    item: Item,
    fields: Partial<Omit<ItemFields, "param">>,
  ): Promise<Item> {
    this.items[host] = this.items[host].filter((i) => i.param !== item.param);

    const newItem = new Item({ ...item.getFields(), ...fields });
    this.items[host].push(newItem);
    return Promise.resolve(newItem);
  }

  deleteItem(host: string, item: Item): Promise<void> {
    this.items[host] = this.items[host].filter((i) => i.param !== item.param);
    return Promise.resolve();
  }
}
