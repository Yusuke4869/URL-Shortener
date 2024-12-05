import { assertEquals } from "jsr:@std/assert";

import { ItemUseCase } from "./impl.ts";
import { Item, ItemFields } from "../../domain/item/impl.ts";
import { MockItemRepository } from "../../repository/item/impl.mock.ts";

const mockItems: Item[] = [
  new Item({
    param: "com",
    description: "example.com",
    url: "https://example.com",
    count: 1,
    unavailable: false,
  }),
  new Item({
    param: "net",
    description: "example.net",
    url: "https://example.net",
    count: 2,
    unavailable: false,
  }),
  new Item({
    param: "org",
    description: "example.org",
    url: "https://example.org",
    count: 3,
    unavailable: true,
  }),
];

Deno.test("findAllItems - hostに紐づく全てのitemを取得できる", async () => {
  const mockItemsJP: Item[] = [
    new Item({
      param: "jp",
      description: "example.jp",
      url: "https://example.jp",
      count: 3,
      unavailable: false,
    }),
    new Item({
      param: "co.jp",
      description: "example.co.jp",
      url: "https://example.co.jp",
      count: 5,
      unavailable: true,
    }),
  ];

  const itemUsecase = new ItemUseCase(
    new MockItemRepository({
      mock: mockItems,
      jp: mockItemsJP,
    }),
  );

  const items = await itemUsecase.findAllItems("mock");
  assertEquals(items, mockItems);

  const itemsJP = await itemUsecase.findAllItems("jp");
  assertEquals(itemsJP, mockItemsJP);
});

Deno.test("findItem - 指定されたitemを取得できる", async () => {
  const itemUsecase = new ItemUseCase(
    new MockItemRepository({ mock: mockItems }),
  );

  const item = await itemUsecase.findItem("mock", "com");
  assertEquals(
    item,
    mockItems.find((i) => i.param === "com"),
  );
});

Deno.test("upsertItem - itemを追加できる", async () => {
  const itemUsecase = new ItemUseCase(
    new MockItemRepository({ mock: mockItems }),
  );

  const newItem = new Item({
    param: "edu",
    description: "example.edu",
    url: "https://example.edu",
    count: 4,
    unavailable: false,
  });

  const res = await itemUsecase.upsertItem("mock", newItem.getFields());
  assertEquals(res, newItem);
});

Deno.test("updateItem - itemを更新できる", async () => {
  const itemUsecase = new ItemUseCase(
    new MockItemRepository({ mock: mockItems }),
  );

  const oldItem = mockItems.find((i) => i.param === "net");
  const obj: Partial<Omit<ItemFields, "param">> = {
    description: "www.example.net",
    url: "https://www.example.net",
  };
  if (!oldItem) throw new Error("Mock item not found");

  const item = await itemUsecase.findItem("mock", "net");
  assertEquals(item, oldItem);

  const res = await itemUsecase.updateItem("mock", oldItem, obj);
  assertEquals(res, new Item({ ...oldItem.getFields(), ...obj }));
});

Deno.test("incrementItemCount - itemのカウントをインクリメントできる", async () => {
  const itemUsecase = new ItemUseCase(
    new MockItemRepository({ mock: mockItems }),
  );

  const oldItem = mockItems.find((i) => i.param === "org");
  if (!oldItem) throw new Error("Mock item not found");

  const item = await itemUsecase.findItem("mock", "org");
  assertEquals(item, oldItem);

  const res = await itemUsecase.incrementItemCount("mock", oldItem);
  assertEquals(
    res,
    new Item({ ...oldItem.getFields(), count: oldItem.count + 1 }),
  );
});

Deno.test("disableItem - itemを無効化できる", async () => {
  const itemUsecase = new ItemUseCase(
    new MockItemRepository({ mock: mockItems }),
  );

  const item = mockItems.find((i) => i.param === "com");
  if (!item) throw new Error("Mock item not found");

  // unavailable が false であることを確認
  const r = await itemUsecase.updateItem("mock", item, { unavailable: false });
  assertEquals(r, new Item({ ...item.getFields(), unavailable: false }));

  const res = await itemUsecase.disableItem("mock", item);
  assertEquals(res, new Item({ ...item.getFields(), unavailable: true }));
});

Deno.test("deleteItem - itemを削除できる", async () => {
  const itemUsecase = new ItemUseCase(
    new MockItemRepository({ mock: mockItems }),
  );

  const deleteItem = mockItems.find((i) => i.param === "net");
  if (!deleteItem) throw new Error("Mock item not found");

  const item = await itemUsecase.findItem("mock", "net");
  assertEquals(item, deleteItem);

  await itemUsecase.deleteItem("mock", deleteItem);
  const res = await itemUsecase.findItem("mock", "net");
  assertEquals(res, null);
});
