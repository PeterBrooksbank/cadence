import type { ApiToken, Client, Item, RawItem, User, Workspace } from "./types";

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function normalizeItem(raw: RawItem): Item {
  return { ...raw, archived: !!raw.archived };
}

export { ApiError };

export const api = {
  me: () => request<User>("/api/me"),
  logout: () => request<{ ok: true }>("/api/auth/logout", { method: "POST" }),

  listWorkspaces: () => request<Workspace[]>("/api/workspaces"),
  createWorkspace: (name: string) => request<Workspace>("/api/workspaces", { method: "POST", body: JSON.stringify({ name }) }),
  updateWorkspace: (id: string, patch: Partial<Pick<Workspace, "name" | "color" | "sort_order">>) =>
    request<Workspace>(`/api/workspaces/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  listClients: (workspaceId: string) => request<Client[]>(`/api/clients?workspaceId=${encodeURIComponent(workspaceId)}`),
  createClient: (workspaceId: string, name: string) =>
    request<Client>("/api/clients", { method: "POST", body: JSON.stringify({ workspaceId, name }) }),
  updateClient: (id: string, patch: Partial<Pick<Client, "name" | "color">>) =>
    request<Client>(`/api/clients/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),

  listItems: async (workspaceId: string): Promise<Item[]> => {
    const raw = await request<RawItem[]>(`/api/items?workspaceId=${encodeURIComponent(workspaceId)}`);
    return raw.map(normalizeItem);
  },
  createItem: async (input: {
    clientId: string;
    title: string;
    notes?: string;
    dueDate?: string | null;
    priority?: string;
    status?: string;
  }): Promise<Item> => {
    const raw = await request<RawItem>("/api/items", { method: "POST", body: JSON.stringify(input) });
    return normalizeItem(raw);
  },
  updateItem: async (
    id: string,
    patch: Partial<{
      title: string;
      notes: string;
      dueDate: string | null;
      priority: string;
      status: string;
      archived: boolean;
      clientId: string;
    }>,
  ): Promise<Item> => {
    const raw = await request<RawItem>(`/api/items/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
    return normalizeItem(raw);
  },

  listTokens: () => request<ApiToken[]>("/api/tokens"),
  createToken: (label: string) =>
    request<ApiToken & { token: string }>("/api/tokens", { method: "POST", body: JSON.stringify({ label }) }),
  revokeToken: (id: string) => request<{ ok: true }>(`/api/tokens/${id}`, { method: "DELETE" }),
};
