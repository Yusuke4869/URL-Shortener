import { createRoute as _createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { Scalar } from "@scalar/hono-api-reference";

import {
  deleteItemController,
  getAllItemsController,
  getItemController,
  patchItemController,
  putItemController,
} from "../controller/api.ts";
import { apiMiddleware } from "../middleware/api.ts";
import {
  DeleteQuerySchema,
  DisabledItemSchema,
  ItemArraySchema,
  ItemSchema,
  PatchRequestBodySchema,
  PathParamsSchema,
  PutRequestBodySchema,
} from "./api.schema.ts";

const createRoute = <T extends Parameters<typeof _createRoute>[0]>(
  options: T,
) => {
  const { middleware: existingMiddleware } = options;
  const middlewares = existingMiddleware
    ? Array.isArray(existingMiddleware)
      ? existingMiddleware
      : [existingMiddleware]
    : [];

  return _createRoute({
    ...options,
    middleware: [...middlewares, apiMiddleware],
  });
};

export const apiRoute = new OpenAPIHono({
  defaultHook: (result, c) => {
    if (!result.success) {
      return c.json(
        {
          error: "Validation failed",
          details: result.error.issues,
        },
        400,
      );
    }
  },
});

apiRoute.openAPIRegistry.registerComponent("securitySchemes", "X-API-Key", {
  type: "apiKey",
  in: "header",
  name: "X-API-Key",
});

apiRoute
  .openapi(
    createRoute({
      method: "get",
      /**
       * /items/{param} との競合を避けるため、 /all とする
       */
      path: "/all",
      tags: ["items"],
      description: "すべてのアイテムを取得します",
      responses: {
        200: {
          description: "すべてのアイテムを取得しました",
          content: {
            "application/json": {
              schema: ItemArraySchema,
            },
          },
        },
        404: {
          description: "指定されたホストが存在しません",
        },
      },
    }),
    getAllItemsController,
  )
  .openapi(
    createRoute({
      method: "get",
      path: "/items/{param}",
      tags: ["items"],
      description: "指定したアイテムを取得します",
      request: {
        params: PathParamsSchema,
      },
      responses: {
        200: {
          description: "アイテムを取得しました",
          content: {
            "application/json": {
              schema: ItemSchema,
            },
          },
        },
        404: {
          description: "指定されたホストまたはアイテムが存在しません",
        },
      },
    }),
    getItemController,
  )
  .openapi(
    createRoute({
      method: "put",
      path: "/items/{param}",
      tags: ["items"],
      description: "指定したアイテムを作成または更新します",
      request: {
        params: PathParamsSchema,
        body: {
          content: {
            "application/json": {
              schema: PutRequestBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "アイテムを作成または更新しました",
          content: {
            "application/json": {
              schema: ItemSchema,
            },
          },
        },
        404: {
          description: "指定されたホストが存在しません",
        },
      },
    }),
    (c) => {
      const { description, url, count } = c.req.valid("json");
      return putItemController(c, description, url, count);
    },
  )
  .openapi(
    createRoute({
      method: "patch",
      path: "/items/{param}",
      tags: ["items"],
      description: "指定したアイテムの一部を更新します",
      request: {
        params: PathParamsSchema,
        body: {
          content: {
            "application/json": {
              schema: PatchRequestBodySchema,
            },
          },
        },
      },
      responses: {
        200: {
          description: "アイテムを更新しました",
          content: {
            "application/json": {
              schema: ItemSchema,
            },
          },
        },
        404: {
          description: "指定されたホストまたはアイテムが存在しません",
        },
      },
    }),
    (c) => {
      const { description, url, count, unavailable } = c.req.valid("json");
      return patchItemController(c, description, url, count, unavailable);
    },
  )
  .openapi(
    createRoute({
      method: "delete",
      path: "/items/{param}",
      tags: ["items"],
      description:
        "短縮URLを無効化するか、アイテムをデータベースから削除します",
      request: {
        params: PathParamsSchema,
        query: DeleteQuerySchema,
      },
      responses: {
        200: {
          description: "短縮URLを無効化しました",
          content: {
            "application/json": {
              schema: DisabledItemSchema,
            },
          },
        },
        204: {
          description: "アイテムをデータベースから削除しました",
        },
        404: {
          description: "指定されたホストまたはアイテムが存在しません",
        },
      },
    }),
    deleteItemController,
  )
  .get("/doc", (c) =>
    c.json(
      apiRoute.getOpenAPI31Document({
        openapi: "3.1.0",
        info: {
          version: "latest",
          title: "URL Shortener API",
        },
        servers: [{ url: "/api" }],
        security: [{ "X-API-Key": [] }],
        tags: [
          {
            name: "items",
            description: `アイテム関連の操作を行います。

アイテムとは、短縮URLの情報を保持するオブジェクトです。

短縮URLが無効化されている場合、ユーザーがアクセスしても 404 が返されます
`,
          },
        ],
      }),
    ))
  .get(
    "/doc/ui",
    Scalar({ url: "/api/doc", pageTitle: "URL Shortener API Reference" }),
  )
  .use(apiMiddleware); // 存在しないルートに対しても API Key の確認を行う
