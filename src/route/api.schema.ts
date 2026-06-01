import { z } from "@hono/zod-openapi";

// https://docs.deno.com/deploy/kv/transactions/#limits
export const MAX_BULK_UPSERT_ITEMS = 1000;
// Deno KV allows up to 800KiB per atomic operation, including encoding overhead
// Keep the app-side JSON estimate lower to leave room for KV key/value overhead
export const MAX_BULK_UPSERT_APPROX_BYTES = 700 * 1024;

const textEncoder = new TextEncoder();

const getJsonByteLength = (value: unknown): number =>
  textEncoder.encode(JSON.stringify(value)).length;

/**
 * アイテムのスキーマ
 */
export const ItemSchema = z.object({
  param: z.string().openapi({
    description: "アイテムの識別子（短縮 URL の識別子）",
    example: "example",
  }),
  description: z.string().optional().openapi({
    description: "アイテムの説明",
    example: "This is an example item.",
  }),
  url: z.httpUrl().openapi({
    description: "リダイレクト先の URL (HTTP)",
    example: "https://example.com",
  }),
  count: z.int().nonnegative().openapi({
    description: "短縮 URL へのアクセス回数",
    example: 42,
  }),
  unavailable: z.boolean().openapi({
    description: "短縮 URL が無効化されているかどうか",
    example: false,
  }),
}).openapi("Item");

/**
 * 無効な（リダイレクトされない）アイテムのスキーマ
 */
export const DisabledItemSchema = ItemSchema.extend({
  unavailable: z.boolean().openapi({
    description: "短縮 URL が無効化されているかどうか",
    example: true,
  }),
});

/**
 * アイテムの配列のスキーマ
 */
export const ItemArraySchema = z.array(ItemSchema)
  .openapi({
    description: "アイテムの配列",
  })
  .openapi("Items");

/**
 * 一括作成・更新リクエストボディのスキーマ
 *
 * PUT /items 用
 */
export const PutItemsRequestBodySchema = z.array(ItemSchema)
  .max(MAX_BULK_UPSERT_ITEMS)
  .superRefine((items, ctx) => {
    const bodyBytes = getJsonByteLength(items);
    if (bodyBytes > MAX_BULK_UPSERT_APPROX_BYTES) {
      ctx.addIssue({
        code: "custom",
        message: "items approximate size must be <= 700KiB",
      });
    }

    const seenParams = new Set<string>();

    items.forEach((item, index) => {
      if (!seenParams.has(item.param)) {
        seenParams.add(item.param);
        return;
      }

      ctx.addIssue({
        code: "custom",
        path: [index, "param"],
        message: "param must be unique",
      });
    });
  })
  .openapi({
    description:
      `一括作成・更新するアイテムの配列（最大 ${MAX_BULK_UPSERT_ITEMS} 件、概算 ${
        MAX_BULK_UPSERT_APPROX_BYTES / 1024
      } KiB）`,
  })
  .openapi("PutItemsRequestBody");

/**
 * パスパラメーターのスキーマ
 */
export const PathParamsSchema = z.object({
  param: z.string().openapi({
    description: "アイテムの識別子（短縮 URL の識別子）",
    example: "example",
  }),
});

/**
 * 削除リクエストのクエリパラメーターのスキーマ
 */
export const DeleteQuerySchema = z.object({
  permanently: z.enum(["true", "false"]).optional().openapi({
    description: "アイテムを完全に削除するかどうか（削除する場合は true）",
    example: "false",
  }),
});

/**
 * API リクエストボディのスキーマ
 *
 * PUT 用
 */
export const PutRequestBodySchema = z.object({
  description: z.string().optional().openapi({
    description: "アイテムの説明",
    example: "This is an example item.",
  }),
  url: z.httpUrl().openapi({
    description: "リダイレクト先の URL (HTTP)",
    example: "https://example.com",
  }),
  count: z.int().nonnegative().optional().openapi({
    description: "アクセス回数（指定した値で上書き）",
    example: 0,
  }),
});

/**
 * API リクエストボディのスキーマ (OPTIONAL)
 *
 * PATCH 用
 */
export const PatchRequestBodySchema = PutRequestBodySchema.extend({
  url: z.httpUrl().optional().openapi({
    description: "リダイレクト先の URL (HTTP)",
    example: "https://example.com",
  }),
  unavailable: z.boolean().optional().openapi({
    description: "短縮 URL が無効化されているかどうか",
    example: false,
  }),
});
