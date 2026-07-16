import type { ClientGroupVM } from "../deriveViewModel";

export function ClientChips({
  groups,
  focusedId,
  onSelect,
}: {
  groups: ClientGroupVM[];
  focusedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="client-chips">
      {groups.map((g) => (
        <button
          key={g.client.id}
          className={`client-chip${focusedId === g.client.id ? " client-chip-active" : ""}`}
          style={{ borderColor: focusedId === g.client.id ? g.client.color : undefined }}
          onClick={() => onSelect(g.client.id)}
          title="Click to drill into this client"
        >
          <span className="dot" style={{ background: g.client.color }} />
          <span className="client-chip-name">{g.client.name}</span>
          <span className="client-chip-count">{g.openCount}</span>
          {g.hasOverdue && <span className="dot dot-overdue" title="Has overdue work" />}
        </button>
      ))}
    </div>
  );
}
