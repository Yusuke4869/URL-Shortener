import { assertEquals } from "jsr:@std/assert";

import { Item } from "./impl.ts";

import type { ItemFields } from "./impl.ts";

Deno.test("getURL - 適切なURLを取得できる", async (t) => {
  const url = "https://example.com";
  const obj: ItemFields = {
    param: "com",
    description: "example.com",
    url,
    count: 1,
    unavailable: false,
  };

  await t.step("有効なitemのURLを取得できる", () => {
    const item = new Item({ ...obj });
    assertEquals(item.url, url);
  });

  await t.step("無効なitemのURLはnullである", () => {
    const item = new Item({ ...obj, unavailable: true });
    assertEquals(item.url, null);
  });
});
