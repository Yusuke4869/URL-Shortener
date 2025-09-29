import { createMiddleware } from "hono/factory";
import { getCookie, setCookie } from "hono/cookie";
import { HTTPException } from "hono/http-exception";

const docTokens = Deno.env.get("API_DOC_TOKENS")?.split(",").filter(Boolean) ??
  [];

export const docAuthMiddleware = createMiddleware(async (c, next) => {
  if (docTokens.length === 0) {
    throw new HTTPException(503, { message: "Service Unavailable" });
  }

  const queryToken = c.req.query("token");
  const cookieToken = getCookie(c, "api_doc_token");

  const token = queryToken || cookieToken;

  if (!token || !docTokens.includes(token)) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }

  setCookie(c, "api_doc_token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
  });

  await next();
});
