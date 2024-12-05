import { Item } from "../../domain/item/impl.ts";

import type { ItemUseCaseInterface } from "./interface.ts";
import type { ItemFields } from "../../domain/item/impl.ts";
import type { ItemRepositoryInterface } from "../../repository/item/interface.ts";

export class ItemUseCase implements ItemUseCaseInterface {
  constructor(private readonly itemRepository: ItemRepositoryInterface) {}

  async findAllItems(host: string): Promise<Item[]> {
    const items = await this.itemRepository.findAllItems(host);
    return items;
  }

  async findItem(host: string, param: string): Promise<Item | null> {
    const item = await this.itemRepository.findItem(host, param);
    return item;
  }

  async upsertItem(host: string, fields: ItemFields): Promise<Item> {
    const res = await this.itemRepository.upsertItem(host, fields);
    return res;
  }

  async updateItem(
    host: string,
    item: Item,
    fields: Partial<Omit<ItemFields, "param">>,
  ): Promise<Item> {
    const res = await this.itemRepository.updateItem(host, item, fields);
    return res;
  }

  async incrementItemCount(host: string, item: Item): Promise<Item> {
    const res = await this.itemRepository.updateItem(host, item, {
      count: item.count + 1,
    });
    return res;
  }

  async disableItem(host: string, item: Item): Promise<Item> {
    const res = await this.itemRepository.updateItem(host, item, {
      unavailable: true,
    });
    return res;
  }

  async deleteItem(host: string, item: Item): Promise<void> {
    await this.itemRepository.deleteItem(host, item);
  }
}
