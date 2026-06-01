import { assertEquals } from "@std/assert";

import {
  MAX_BULK_UPSERT_APPROX_BYTES,
  MAX_BULK_UPSERT_ITEMS,
  PutItemsRequestBodySchema,
} from "./api.schema.ts";

import type { ItemFields } from "../domain/item/impl.ts";

const createItems = (count: number): ItemFields[] =>
  Array.from({ length: count }, (_, index) => ({
    param: `item-${index}`,
    description: `example ${index}`,
    url: `https://example.com/${index}`,
    count: 0,
    unavailable: false,
  }));

Deno.test("PutItemsRequestBodySchema - 最大1000件まで許可する", () => {
  const res = PutItemsRequestBodySchema.safeParse(
    createItems(MAX_BULK_UPSERT_ITEMS),
  );

  assertEquals(res.success, true);
});

Deno.test("PutItemsRequestBodySchema - 1001件以上は許可しない", () => {
  const res = PutItemsRequestBodySchema.safeParse(
    createItems(MAX_BULK_UPSERT_ITEMS + 1),
  );

  assertEquals(res.success, false);
});

Deno.test("PutItemsRequestBodySchema - 概算サイズが700KiBを超えるbodyは許可しない", () => {
  const [item] = createItems(1);
  const res = PutItemsRequestBodySchema.safeParse([
    {
      ...item,
      description: "x".repeat(MAX_BULK_UPSERT_APPROX_BYTES),
    },
  ]);

  assertEquals(res.success, false);
  if (!res.success) {
    assertEquals(
      res.error.issues.some((issue) =>
        issue.message === "items approximate size must be <= 700KiB"
      ),
      true,
    );
  }
});

Deno.test("PutItemsRequestBodySchema - 重複したparamは許可しない", () => {
  const items = createItems(2);
  items[1] = {
    ...items[1],
    param: items[0].param,
  };

  const res = PutItemsRequestBodySchema.safeParse(items);

  assertEquals(res.success, false);
  if (!res.success) {
    assertEquals(res.error.issues[0].path, [1, "param"]);
    assertEquals(res.error.issues[0].message, "param must be unique");
  }
});
