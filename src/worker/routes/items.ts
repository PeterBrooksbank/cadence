import { Hono } from "hono";
import type { AppEnv } from "../types";
import { newId, type ClientRow, type ItemRow, type WorkspaceRow } from "../db";
import { createClient, findClientByName } from "./clients";

export const itemRoutes = new Hono<AppEnv>();

const PRIORITIES = new Set(["high", "med", "low"]);
const STATUSES = new Set(["todo", "progress", "done"]);

itemRoutes.get("/", async (c) => {
  const workspaceId = c.req.query("workspaceId");
  if (!workspaceId) return c.json({ error: "workspaceId query param is required" }, 400);
  const { results } = await c.env.DB.prepare(
    `SELECT items.* FROM items
     JOIN clients ON clients.id = items.client_id
     WHERE clients.workspace_id = ?
     ORDER BY items.created_at ASC`,
  )
    .bind(workspaceId)
    .all<ItemRow>();
  return c.json(results);
});

interface CreateItemBody {
  clientId?: string;
  clientName?: string;
  workspaceId?: string;
  workspaceSlug?: string;
  title?: string;
  notes?: string;
  dueDate?: string | null;
  priority?: string;
  status?: string;
}

itemRoutes.post("/", async (c) => {
  const body = await c.req.json<CreateItemBody>().catch(() => ({}) as CreateItemBody);
  const title = body.title?.trim();
  if (!title) return c.json({ error: "title is required" }, 400);

  let client: ClientRow | null = null;

  if (body.clientId) {
    client = await c.env.DB.prepare("SELECT * FROM clients WHERE id = ?").bind(body.clientId).first<ClientRow>();
    if (!client) return c.json({ error: "clientId does not exist" }, 404);
  } else if (body.clientName) {
    let workspaceId = body.workspaceId ?? null;
    if (!workspaceId && body.workspaceSlug) {
      const ws = await c.env.DB.prepare("SELECT id FROM workspaces WHERE slug = ?").bind(body.workspaceSlug).first<WorkspaceRow>();
      if (!ws) return c.json({ error: "workspaceSlug does not match a known workspace" }, 404);
      workspaceId = ws.id;
    }
    if (!workspaceId) {
      return c.json({ error: "workspaceId or workspaceSlug is required when using clientName" }, 400);
    }
    client = await findClientByName(c.env.DB, workspaceId, body.clientName.trim());
    if (!client) {
      client = await createClient(c.env.DB, workspaceId, body.clientName.trim());
    }
  } else {
    return c.json({ error: "clientId, or clientName with workspaceId/workspaceSlug, is required" }, 400);
  }

  const priority = body.priority && PRIORITIES.has(body.priority) ? body.priority : "med";
  const status = body.status && STATUSES.has(body.status) ? body.status : "todo";
  const id = newId("it");

  await c.env.DB.prepare(
    `INSERT INTO items (id, client_id, title, notes, due_date, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(id, client.id, title, body.notes?.trim() ?? "", body.dueDate ?? null, priority, status)
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM items WHERE id = ?").bind(id).first<ItemRow>();
  return c.json(row, 201);
});

interface PatchItemBody {
  title?: string;
  notes?: string;
  dueDate?: string | null;
  priority?: string;
  status?: string;
  archived?: boolean;
  clientId?: string;
}

itemRoutes.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await c.env.DB.prepare("SELECT * FROM items WHERE id = ?").bind(id).first<ItemRow>();
  if (!existing) return c.json({ error: "Item not found" }, 404);

  const body = await c.req.json<PatchItemBody>().catch(() => ({}) as PatchItemBody);

  if (body.clientId) {
    const client = await c.env.DB.prepare("SELECT id FROM clients WHERE id = ?").bind(body.clientId).first();
    if (!client) return c.json({ error: "clientId does not exist" }, 404);
  }
  if (body.priority !== undefined && !PRIORITIES.has(body.priority)) {
    return c.json({ error: "Invalid priority" }, 400);
  }
  if (body.status !== undefined && !STATUSES.has(body.status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  const title = body.title !== undefined ? body.title.trim() || existing.title : existing.title;
  const notes = body.notes !== undefined ? body.notes : existing.notes;
  const dueDate = body.dueDate !== undefined ? body.dueDate : existing.due_date;
  const priority = body.priority ?? existing.priority;
  const status = body.status ?? existing.status;
  const archived = body.archived !== undefined ? (body.archived ? 1 : 0) : existing.archived;
  const clientId = body.clientId ?? existing.client_id;

  await c.env.DB.prepare(
    `UPDATE items SET title = ?, notes = ?, due_date = ?, priority = ?, status = ?, archived = ?, client_id = ?, updated_at = unixepoch()
     WHERE id = ?`,
  )
    .bind(title, notes, dueDate, priority, status, archived, clientId, id)
    .run();

  const row = await c.env.DB.prepare("SELECT * FROM items WHERE id = ?").bind(id).first<ItemRow>();
  return c.json(row);
});
