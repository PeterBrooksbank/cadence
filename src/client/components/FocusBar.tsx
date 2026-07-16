import type { ClientGroupVM } from "../deriveViewModel";

export function FocusBar({ group, onClear }: { group: ClientGroupVM; onClear: () => void }) {
  return (
    <div className="focus-bar">
      <button className="btn btn-sm" onClick={onClear}>
        ← All clients
      </button>
      <span className="dot" style={{ background: group.client.color }} />
      <span className="focus-bar-name">{group.client.name}</span>
      <span className="focus-bar-stats">
        {group.openCount} open · {group.doneCount} done · {group.overdueCount} overdue
      </span>
      <div className="focus-bar-progress">
        <div
          className="focus-bar-progress-fill"
          style={{ width: `${group.pct}%`, background: group.client.color }}
        />
      </div>
    </div>
  );
}
