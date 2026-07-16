import { Hono } from "hono";
import type { AppEnv } from "../types";
import { newId, paletteColor, type ClientRow } from "../db";

export const clientRoutes = new Hono<AppEnv>();

clientRoutes.get("/", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId query param is required" }, 400);
  const { results } = await c.env.DB.prepare("SELECT * FROM clients WHERE workspace_id = ? ORDER BY created_at ASC")
    .bind(workspaceId)
    .all<ClientRow>();
  return c.json(results);
});

clientRoutes.post("/", async (c) => {
  const body = await c.req.json<{ workspaceId?: string; name?: string; color?: string }>().catch(
    () => ({}) as Record<string, never>,
  );
  const name = body.name?.trim();
  if (!body.workspaceId || !name) return c.json({ error: "workspaceId and name are required" }, 400);

  const workspace = await c.env.DB.prepare("SELECT id FROM workspaces WHERE id = ?").bind(body.workspaceId).first();
  if (!workspace) return c.json({ error: "Workspace not found" }, 404);

  const client = await createClient(c.env.DB, body.workspaceId, name, body.color);
  return c.json(client, 201);
});

clientRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{ name?: string; color?: string; workspaceId?: string }>().catch(
    () => ({}) as Record<string, never>,
  );
  const existing = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first<ClientRow>();
  if (!existing) return c.json({ error: "Client not found" }, 404);

  const name = body.name?.trim() || existing.name;
  const color = body.color || existing.color;
  const workspaceId = body.workspaceId || existing.workspace_id;

  await c.env.DB.prepare("UPDATE clients SET name = ?, color = ?, workspace_id = ? WHERE id = ?")
    .bind(name, color, workspaceId, id)
    .run();
  const row = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first<ClientRow>();
  return c.json(row);
});

export async function createClient(db: D1Database, workspaceId: string, name: string, color?: string): Promise<ClientRow> {
  const countRow = await db.prepare("SELECT COUNT(*) as n FROM clients WHERE workspace_id = ?").bind(workspaceId).first<{ n: number }>();
  const id = newId("cl");
  const finalColor = color || paletteColor(countRow?.n ?? 0);
  await db.prepare("INSERT INTO clients (id, workspace_id, name, color) VALUES (?, ?, ?, ?)")
    .bind(id, workspaceId, name, finalColor)
    .run();
  const row = await db.prepare("SELECT * FROM clients WHERE id = ?").bind(id).first<ClientRow>();
  if (!row) throw new Error("Failed to create client");
  return row;
}

export async function findClientByName(db: D1Database, workspaceId: string, name: string): Promise<ClientRow | null> {
  return db
    .prepare("SELECT * FROM clients WHERE workspace_id = ? AND lower(name) = lower(?)")
    .bind(workspaceId, name)
    .first<ClientRow>();
}
