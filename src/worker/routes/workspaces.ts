import { Hono } from "hono";
import type { AppEnv } from "../types";
import { newId, paletteColor, slugify, type WorkspaceRow } from "../db";

export const workspaceRoutes = new Hono<AppEnv>();

workspaceRoutes.get("/", async (c) => {
  const { results } = await c.env.DB.prepare("SELECT * FROM workspaces ORDER BY sort_order ASC, created_at ASC").all<WorkspaceRow>();
  return c.json(results);
});

workspaceRoutes.post("/", async (c) => {
  const body = await c.req.json<{ name?: string }>().catch(() => ({}) as { name?: string });
  const name = body.name?.trim();
  if (!name) return c.json({ error: "name is required" }, 400);

  const countRow = await c.env.DB.prepare("SELECT COUNT(*) as n, COALESCE(MAX(sort_order), -1) as maxOrder FROM workspaces").first<{
    n: number;
    maxOrder: number;
  }>();
  const id = newId("ws");
  const baseSlug = slugify(name);
  let slug = baseSlug;
  let suffix = 1;
  while (
    await c.env.DB.prepare("SELECT 1 FROM workspaces WHERE slug = ?")
      .bind(slug)
      .first()
  ) {
    slug = `${baseSlug}-${++suffix}`;
  }
  const color = paletteColor(countRow?.n ?? 0);
  const sortOrder = (countRow?.maxOrder ?? -1) + 1;

  await c.env.DB.prepare("INSERT INTO workspaces (id, name, slug, color, sort_order) VALUES (?, ?, ?, ?, ?)")
    .bind(id, name, slug, color, sortOrder)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM workspaces WHERE id = ?").bind(id).first<WorkspaceRow>();
  return c.json(row, 201);
});

workspaceRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; color?: string; sortOrder?: number }>().catch(() => ({}) as Record<string, never>);

  const existing = await c.env.DB.prepare("SELECT * FROM workspaces WHERE id = ?").bind(id).first<WorkspaceRow>();
  if (!existing) return c.json({ error: "Workspace not found" }, 404);

  const name = body.name?.trim() || existing.name;
  const color = body.color || existing.color;
  const sortOrder = typeof body.sortOrder === "number" ? body.sortOrder : existing.sort_order;

  await c.env.DB.prepare("UPDATE workspaces SET name = ?, color = ?, sort_order = ? WHERE id = ?")
    .bind(name, color, sortOrder, id)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM workspaces WHERE id = ?").bind(id).first<WorkspaceRow>();
  return c.json(row);
});
