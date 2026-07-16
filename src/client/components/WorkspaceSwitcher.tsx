import { useState } from "react";
import type { Workspace } from "../types";

export function WorkspaceSwitcher({
  workspaces,
  activeId,
  onSelect,
  onCreate,
}: {
  workspaces: Workspace[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onCreate: (name: string) => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const active = workspaces.find((w) => w.id === activeId);

  async function submitCreate() {
    if (!name.trim()) return;
    await onCreate(name.trim());
    setName("");
    setCreating(false);
    setOpen(false);
  }

  return (
    <div className="ws-switcher">
      <button className="ws-switcher-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="ws-dot" style={{ background: active?.color ?? "#8A8478" }} />
        <span>{active?.name ?? "Workspace"}</span>
        <span className="ws-caret">▾</span>
      </button>
      {open && (
        <div className="ws-switcher-menu">
          {workspaces.map((w) => (
            <button
              key={w.id}
              className="ws-switcher-item"
              onClick={() => {
                onSelect(w.id);
                setOpen(false);
              }}
            >
              <span className="ws-dot" style={{ background: w.color }} />
              {w.name}
            </button>
          ))}
          <div className="ws-switcher-divider" />
          {creating ? (
            <div className="ws-switcher-create">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitCreate()}
                placeholder="Workspace name"
              />
              <button className="btn btn-primary btn-sm" onClick={submitCreate}>
                Add
              </button>
            </div>
          ) : (
            <button className="ws-switcher-item ws-switcher-new" onClick={() => setCreating(true)}>
              + New workspace
            </button>
          )}
        </div>
      )}
    </div>
  );
}
