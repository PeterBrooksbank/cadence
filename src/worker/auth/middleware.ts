import { createMiddleware } from "hono/factory";
import { getCookie } from "hono/cookie";
import type { AppEnv } from "../types";
import { verifySessionCookieValue } from "./session";
import { sha256Hex, type ApiTokenRow } from "../db";
import { SESSION_COOKIE_NAME } from "./constants";

export const requireAuth = createMiddleware<AppEnv>(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice("Bearer ".length).trim();
    const hash = await sha256Hex(token);
    const row = await c.env.DB.prepare(
      "SELECT api_tokens.*, users.email as user_email FROM api_tokens JOIN users ON users.id = api_tokens.user_id WHERE token_hash = ? AND revoked_at IS NULL",
    )
      .bind(hash)
      .first<ApiTokenRow & { user_email: string }>();
    if (!row) return c.json({ error: "Invalid or revoked API token" }, 401);
    c.executionCtx.waitUntil(
      c.env.DB.prepare("UPDATE api_tokens SET last_used_at = unixepoch() WHERE id = ?").bind(row.id).run(),
    );
    c.set("user", { id: row.user_id, email: row.user_email });
    await next();
    return;
  }

  const cookieValue = getCookie(c, SESSION_COOKIE_NAME);
  if (cookieValue) {
    const session = await verifySessionCookieValue(cookieValue, c.env.COOKIE_SECRET);
    if (session && session.email.toLowerCase() === c.env.ALLOWED_EMAIL.toLowerCase()) {
      c.set("user", { id: session.uid, email: session.email });
      await next();
      return;
    }
  }

  return c.json({ error: "Not authenticated" }, 401);
});
