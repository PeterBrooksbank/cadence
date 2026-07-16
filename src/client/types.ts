export type Priority = "high" | "med" | "low";
export type Status = "todo" | "progress" | "done";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  color: string;
  sort_order: number;
  created_at: number;
}

export interface Client {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: number;
}

export interface Item {
  id: string;
  client_id: string;
  title: string;
  notes: string;
  due_date: string | null;
  priority: Priority;
  status: Status;
  archived: boolean;
  created_at: number;
  updated_at: number;
}

export interface RawItem extends Omit<Item, "archived"> {
  archived: number;
}

export interface User {
  id: string;
  email: string;
}

export interface ApiToken {
  id: string;
  label: string | null;
  created_at: number;
  last_used_at: number | null;
  revoked_at: number | null;
}
