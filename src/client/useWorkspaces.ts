import { useCallback, useEffect, useState } from "react";
import { api } from "./api";
import type { Workspace } from "./types";

const ACTIVE_WORKSPACE_KEY = "wt_active_workspace";

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_WORKSPACE_KEY));

  const reload = useCallback(async () => {
    setLoading(true);
    const list = await api.listWorkspaces();
    setWorkspaces(list);
    setLoading(false);
    return list;
  }, []);

  useEffect(() => {
    reload().then((list) => {
      setActiveId((current) => {
        if (current && list.some((w) => w.id === current)) return current;
        return list[0]?.id ?? null;
      });
    });
  }, [reload]);

  const setActive = useCallback((id: string) => {
    setActiveId(id);
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id);
  }, []);

  const addWorkspace = useCallback(async (name: string) => {
    const workspace = await api.createWorkspace(name);
    setWorkspaces((ws) => [...ws, workspace]);
    setActive(workspace.id);
    return workspace;
  }, [setActive]);

  const renameWorkspace = useCallback(async (id: string, name: string) => {
    const updated = await api.updateWorkspace(id, { name });
    setWorkspaces((ws) => ws.map((w) => (w.id === id ? updated : w)));
  }, []);

  return { workspaces, loading, activeId, setActive, addWorkspace, renameWorkspace };
}
