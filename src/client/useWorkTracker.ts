import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Client, Item, Priority, Status } from "./types";

export function useWorkTracker(workspaceId: string | null) {
  const [clients, setClients] = useState<Client[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [c, i] = await Promise.all([api.listClients(workspaceId), api.listItems(workspaceId)]);
      setClients(c);
      setItems(i);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    reload();
  }, [reload]);

  const addClient = useCallback(
    async (name: string) => {
      if (!workspaceId) return null;
      const client = await api.createClient(workspaceId, name);
      setClients((cs) => [...cs, client]);
      return client;
    },
    [workspaceId],
  );

  const renameClient = useCallback(async (id: string, name: string) => {
    const updated = await api.updateClient(id, { name });
    setClients((cs) => cs.map((c) => (c.id === id ? updated : c)));
  }, []);

  const addItem = useCallback(
    async (input: { clientId: string; title: string; dueDate: string | null; priority: Priority }) => {
      const item = await api.createItem(input);
      setItems((is) => [...is, item]);
      return item;
    },
    [],
  );

  const patchItem = useCallback(
    async (id: string, patch: Partial<{ status: Status; priority: Priority; archived: boolean; dueDate: string | null; title: string; notes: string; clientId: string }>) => {
      setItems((is) => is.map((i) => (i.id === id ? { ...i, ...patch } : i)));
      try {
        const updated = await api.updateItem(id, patch);
        setItems((is) => is.map((i) => (i.id === id ? updated : i)));
      } catch {
        await reload();
      }
    },
    [reload],
  );

  const archiveManyDone = useCallback(
    async (itemIds: string[]) => {
      setItems((is) => is.map((i) => (itemIds.includes(i.id) ? { ...i, archived: true } : i)));
      try {
        await Promise.all(itemIds.map((id) => api.updateItem(id, { archived: true })));
      } finally {
        await reload();
      }
    },
    [reload],
  );

  return { clients, items, loading, error, reload, addClient, renameClient, addItem, patchItem, archiveManyDone };
}
