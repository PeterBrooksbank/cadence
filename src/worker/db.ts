export interface UserRow {
  id: string;
  email: string;
  name: string | null;
  created_at: number;
}

export interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  created_at: number;
}

export interface ClientRow {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: number;
}

export interface ItemRow {
  id: string;
  client_id: string;
  title: string;
  notes: string;
  due_date: string | null;
  priority: string;
  status: string;
  archived: number;
  created_at: number;
  updated_at: number;
}

export interface ApiTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  label: string | null;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "")}`;
}

export function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "workspace";
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const PALETTE = ["#C05B3C", "#4056A8", "#2E6B4F", "#8A4F7D", "#B9852F", "#3E7B8A"];

export function paletteColor(index: number): string {
  return PALETTE[index % PALETTE.length];
}
