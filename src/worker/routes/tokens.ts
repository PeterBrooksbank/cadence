import { Hono } from "hono";
import type { AppEnv } from "../types";
import { newId, sha256Hex, type ApiTokenRow } from "../db";
import { base64UrlEncode } from "../auth/base64url";

export const tokenRoutes = new Hono<AppEnv>();

tokenRoutes.get("/", async (c) => {
  const user = c.get("user");
  const { results } = await c.env.DB.prepare(
    "SELECT id, label, created_at, last_used_at, revoked_at FROM api_tokens WHERE user_id = ? ORDER BY created_at DESC",
  )
    .bind(user.id)
    .all<Omit<ApiTokenRow, "token_hash" | "user_id">>();
  return c.json(results);
});

tokenRoutes.post("/", async (c) => {
  const user = c.get("user");
  const body = await c.req.json<{ label?: string }>().catch(() => ({}) as { label?: string });
  const raw = `wt_${base64UrlEncode(crypto.getRandomValues(new Uint8Array(32)))}`;
  const hash = await sha256Hex(raw);
  const id = newId("tok");
  await c.env.DB.prepare("INSERT INTO api_tokens (id, user_id, token_hash, label) VALUES (?, ?, ?, ?)")
    .bind(id, user.id, hash, body.label?.trim() || null)
    .run();
  return c.json({ id, label: body.label?.trim() || null, token: raw }, 201);
});

tokenRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  const id = c.req.param("id");
  const result = await c.env.DB.prepare(
    "UPDATE api_tokens SET revoked_at = unixepoch() WHERE id = ? AND user_id = ? AND revoked_at IS NULL",
  )
    .bind(id, user.id)
    .run();
  if (result.meta.changes === 0) return c.json({ error: "Token not found" }, 404);
  return c.json({ ok: true });
});
