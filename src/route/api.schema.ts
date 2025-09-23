import { z } from "@hono/zod-openapi";

/**
 * アイテムのスキーマ
 */
export const ItemSchema = z.object({
  param: z.string().openapi({
    description: "アイテムの識別子（短縮URLの識別子）",
    example: "example",
  }),
  description: z.string().optional().openapi({
    description: "アイテムの説明",
    example: "This is an example item.",
  }),
  url: z.httpUrl().openapi({
    description: "リダイレクト先のURL (HTTP)",
    example: "https://example.com",
  }),
  count: z.int().nonnegative().openapi({
    description: "短縮URLへのアクセス回数",
    example: 42,
  }),
  unavailable: z.boolean().openapi({
    description: "短縮URLが無効化されているかどうか",
    example: false,
  }),
}).openapi("Item");

/**
 * 無効な（リダイレクトされない）アイテムのスキーマ
 */
export const DisabledItemSchema = ItemSchema.extend({
  unavailable: z.boolean().openapi({
    description: "短縮URLが無効化されているかどうか",
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
 * パスパラメーターのスキーマ
 */
export const PathParamsSchema = z.object({
  param: z.string().openapi({
    description: "アイテムの識別子（短縮URLの識別子）",
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
    description: "リダイレクト先のURL (HTTP)",
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
    description: "リダイレクト先のURL (HTTP)",
    example: "https://example.com",
  }),
  unavailable: z.boolean().optional().openapi({
    description: "短縮URLが無効化されているかどうか",
    example: false,
  }),
});
