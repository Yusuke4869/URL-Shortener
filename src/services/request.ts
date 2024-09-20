import type { Context } from "hono";

export const getRequest = (c: Context) => {
  const host = c.req.header("host");
  const param = c.req.param("param");
  return { host, param };
};
