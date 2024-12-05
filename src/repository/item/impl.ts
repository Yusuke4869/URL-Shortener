import { Item } from "../../domain/item/impl.ts";

import type { ItemFields } from "../../domain/item/impl.ts";
import type { ItemRepositoryInterface } from "./interface.ts";

export class ItemRepository implements ItemRepositoryInterface {
  constructor(private readonly kv: Deno.Kv) {}

  async findAllItems(host: string): Promise<Item[]> {
    const items: Item[] = [];

    try {
      const entries = this.kv.list<ItemFields>({ prefix: [host] });
      for await (const entry of entries) {
        items.push(new Item({ ...entry.value }));
      }

      return items;
    } catch {
      throw new Error("Failed to find all items");
    }
  }

  async findItem(host: string, param: string): Promise<Item | null> {
    try {
      const r = await this.kv.get<ItemFields>([host, param]);
      return r.value ? new Item({ ...r.value }) : null;
    } catch {
      throw new Error("Failed to find item");
    }
  }

  async upsertItem(host: string, fields: ItemFields): Promise<Item> {
    try {
      await this.kv.set([host, fields.param], { ...fields });

      const res = await this.findItem(host, fields.param);
      if (!res) throw new Error("Failed to upsert item");
      return res;
    } catch {
      throw new Error("Failed to upsert item");
    }
  }

  async updateItem(
    host: string,
    item: Item,
    fields: Partial<Omit<ItemFields, "param">>,
  ): Promise<Item> {
    try {
      const itemFields = item.getFields();
      const res = await this.upsertItem(host, { ...itemFields, ...fields });
      return res;
    } catch {
      throw new Error("Failed to update item");
    }
  }

  async deleteItem(host: string, item: Item): Promise<void> {
    try {
      await this.kv.delete([host, item.param]);
    } catch {
      throw new Error("Failed to delete item");
    }
  }
}
