import { assertEquals } from "jsr:@std/assert";

import { ItemRepository } from "./impl.ts";
import { Item } from "../../domain/item/impl.ts";

import type { ItemFields } from "../../domain/item/impl.ts";

const HOST_NAME = "host";

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

const getItemsObj = (items: Item[]): ItemFields[] =>
  items.map((item) => item.getFields());

const setItems = async (kv: Deno.Kv, host: string, items: Item[]) => {
  for (const item of getItemsObj(items)) {
    await kv.set([host, item.param], item);
  }
};

const sortItems = (items: Item[]): Item[] =>
  items.sort((a, b) => a.param.localeCompare(b.param));

Deno.test("findAllItems - hostに紐づく全てのitemを取得できる", async (t) => {
  const mockItems2: Item[] = [
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

  const kv = await Deno.openKv(":memory:");
  await setItems(kv, "host1", mockItems);
  await setItems(kv, "host2", mockItems2);

  await t.step(
    "hostを指定すると、hostに紐づく全てのitemが取得できる - 1",
    async () => {
      const itemRepository = new ItemRepository(kv);
      const items = await itemRepository.findAllItems("host1");

      assertEquals(items.length, mockItems.length);
      assertEquals(sortItems(items), sortItems(mockItems));
    },
  );

  await t.step(
    "hostを指定すると、hostに紐づく全てのitemが取得できる - 2",
    async () => {
      const itemRepository = new ItemRepository(kv);
      const items = await itemRepository.findAllItems("host2");

      assertEquals(items.length, mockItems2.length);
      assertEquals(sortItems(items), sortItems(mockItems2));
    },
  );

  await t.step(
    "存在しないhostのitemを取得すると、空の配列を取得できる",
    async () => {
      const itemRepository = new ItemRepository(kv);
      const items = await itemRepository.findAllItems("host3");

      assertEquals(items.length, 0);
      assertEquals(items, []);
    },
  );

  kv.close();
});

Deno.test("findItem - 指定されたitemを取得できる", async (t) => {
  const kv = await Deno.openKv(":memory:");
  await setItems(kv, HOST_NAME, mockItems);

  await t.step(
    "paramを指定すると、itemが取得できる",
    async () => {
      const itemRepository = new ItemRepository(kv);
      const item = await itemRepository.findItem(HOST_NAME, "com");

      assertEquals(item, mockItems.find((item) => item.param === "com"));
    },
  );

  await t.step(
    "存在しないparamを指定すると、nullを取得できる",
    async () => {
      const itemRepository = new ItemRepository(kv);
      const item = await itemRepository.findItem(HOST_NAME, "jp");

      assertEquals(item, null);
    },
  );

  kv.close();
});

Deno.test("upsertItem - itemを追加または更新できる", async (t) => {
  await t.step(
    "itemが存在しない場合、itemを追加できる",
    async () => {
      const kv = await Deno.openKv(":memory:");
      await setItems(kv, HOST_NAME, mockItems);
      const itemRepository = new ItemRepository(kv);

      const obj: ItemFields = {
        param: "jp",
        description: "example.jp",
        url: "https://example.jp",
        count: 3,
        unavailable: false,
      };

      const item = await itemRepository.findItem(HOST_NAME, "jp");
      assertEquals(item, null);

      const res = await itemRepository.upsertItem(HOST_NAME, obj);
      assertEquals(res, new Item(obj));

      const items = await itemRepository.findAllItems(HOST_NAME);
      assertEquals(sortItems(items), sortItems([...mockItems, new Item(obj)]));

      kv.close();
    },
  );

  await t.step(
    "itemが存在する場合、itemを更新できる",
    async () => {
      const kv = await Deno.openKv(":memory:");
      await setItems(kv, HOST_NAME, mockItems);
      const itemRepository = new ItemRepository(kv);

      const oldItem = mockItems.find((item) => item.param === "com");
      const obj: ItemFields = {
        param: "com",
        description: "www.example.com",
        url: "https://www.example.com",
        count: 10,
        unavailable: false,
      };

      const item = await itemRepository.findItem(HOST_NAME, "com");
      assertEquals(item, oldItem);

      const res = await itemRepository.upsertItem(HOST_NAME, obj);
      assertEquals(res, new Item(obj));

      const items = await itemRepository.findAllItems(HOST_NAME);
      assertEquals(
        sortItems(items),
        sortItems([
          ...mockItems.filter((item) => item.param !== "com"),
          new Item(obj),
        ]),
      );

      kv.close();
    },
  );
});

Deno.test("updateItem - itemを更新できる", async (t) => {
  await t.step(
    "itemを更新できる",
    async () => {
      const kv = await Deno.openKv(":memory:");
      await setItems(kv, HOST_NAME, mockItems);
      const itemRepository = new ItemRepository(kv);

      const oldItem = mockItems.find((item) => item.param === "com");
      const obj: Partial<Omit<ItemFields, "param">> = {
        description: "www.example.com",
        url: "https://www.example.com",
      };
      if (!oldItem) throw new Error("Mock item not found");

      const item = await itemRepository.findItem(HOST_NAME, "com");
      assertEquals(item, oldItem);

      const res = await itemRepository.updateItem(HOST_NAME, oldItem, obj);
      assertEquals(res, new Item({ ...oldItem.getFields(), ...obj }));

      const items = await itemRepository.findAllItems(HOST_NAME);
      assertEquals(
        sortItems(items),
        sortItems([
          ...mockItems.filter((item) => item.param !== "com"),
          new Item({ ...oldItem.getFields(), ...obj }),
        ]),
      );

      kv.close();
    },
  );

  // NOTE: この用途での使用は想定していないが、itemが存在しない場合の挙動を確認する
  await t.step("itemが存在しない場合、更新されたitemが追加できる", async () => {
    const kv = await Deno.openKv(":memory:");
    await setItems(kv, HOST_NAME, mockItems);
    const itemRepository = new ItemRepository(kv);

    const newItem = new Item({
      param: "jp",
      description: "example.jp",
      url: "https://example.jp",
      count: 1,
      unavailable: false,
    });
    const obj: Partial<Omit<ItemFields, "param">> = {
      description: "www.example.jp",
      url: "https://www.example.jp",
    };

    const item = await itemRepository.findItem(HOST_NAME, "jp");
    assertEquals(item, null);

    const res = await itemRepository.updateItem(HOST_NAME, newItem, obj);
    assertEquals(res, new Item({ ...newItem.getFields(), ...obj }));

    const items = await itemRepository.findAllItems(HOST_NAME);
    assertEquals(
      sortItems(items),
      sortItems([...mockItems, new Item({ ...newItem.getFields(), ...obj })]),
    );

    kv.close();
  });
});

Deno.test("deleteItem - itemを削除できる", async (t) => {
  await t.step(
    "itemを削除できる",
    async () => {
      const kv = await Deno.openKv(":memory:");
      await setItems(kv, HOST_NAME, mockItems);
      const itemRepository = new ItemRepository(kv);

      const deleteItem = mockItems.find((item) => item.param === "com");
      if (!deleteItem) throw new Error("Mock item not found");

      const item = await itemRepository.findItem(HOST_NAME, "com");
      assertEquals(item, deleteItem);

      await itemRepository.deleteItem(HOST_NAME, deleteItem);
      const res = await itemRepository.findItem(HOST_NAME, "com");
      assertEquals(res, null);

      const items = await itemRepository.findAllItems(HOST_NAME);
      assertEquals(
        sortItems(items),
        sortItems(mockItems.filter((item) => item.param !== "com")),
      );

      kv.close();
    },
  );

  await t.step("itemが存在しない場合、なにもしない", async () => {
    const kv = await Deno.openKv(":memory:");
    await setItems(kv, HOST_NAME, mockItems);
    const itemRepository = new ItemRepository(kv);

    const notExistItem = new Item({
      param: "jp",
      description: "example.jp",
      url: "https://example.jp",
      count: 1,
      unavailable: false,
    });

    const item = await itemRepository.findItem(HOST_NAME, "jp");
    assertEquals(item, null);

    await itemRepository.deleteItem(HOST_NAME, notExistItem);
    const res = await itemRepository.findItem(HOST_NAME, "jp");
    assertEquals(res, null);

    const items = await itemRepository.findAllItems(HOST_NAME);
    assertEquals(sortItems(items), sortItems(mockItems));

    kv.close();
  });
});
