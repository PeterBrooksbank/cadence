import { useState } from "react";
import type { ClientGroupVM } from "../deriveViewModel";
import { ItemRow } from "./ItemRow";

export function ClientGroupSection({
  group,
  onRenameClient,
  onToggleDone,
  onCycleStatus,
  onArchiveItem,
  onArchiveDone,
}: {
  group: ClientGroupVM;
  onRenameClient: (id: string, name: string) => Promise<unknown>;
  onToggleDone: (id: string) => void;
  onCycleStatus: (id: string) => void;
  onArchiveItem: (id: string) => void;
  onArchiveDone: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(group.client.name);

  async function saveEdit() {
    if (name.trim() && name.trim() !== group.client.name) {
      await onRenameClient(group.client.id, name.trim());
    }
    setEditing(false);
  }

  return (
    <div className="client-group">
      <div className="client-group-header">
        <span className="dot" style={{ background: group.client.color }} />
        {editing ? (
          <>
            <input
              autoFocus
              className="client-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") {
                  setName(group.client.name);
                  setEditing(false);
                }
              }}
            />
            <button className="btn btn-sm btn-dark" onClick={saveEdit} title="Save name">
              ✓
            </button>
          </>
        ) : (
          <span className="client-group-name" onClick={() => setEditing(true)} title="Click to rename">
            {group.client.name}
          </span>
        )}
        <span className="client-group-count">{group.openCount} open</span>
        {group.hasDone && (
          <button className="link-btn" onClick={onArchiveDone}>
            Archive done ↓
          </button>
        )}
      </div>
      {group.items.length === 0 ? (
        <div className="empty-note">No open work</div>
      ) : (
        group.items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            onToggleDone={() => onToggleDone(item.id)}
            onCycleStatus={() => onCycleStatus(item.id)}
            onArchive={() => onArchiveItem(item.id)}
          />
        ))
      )}
    </div>
  );
}
