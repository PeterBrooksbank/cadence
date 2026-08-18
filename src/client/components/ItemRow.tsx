import { PRIORITY_META, STATUS_META, type DerivedItem } from "../deriveViewModel";

export function ItemRow({
  item,
  contextLabel,
  contextColor,
  onToggleDone,
  onCycleStatus,
  onArchive,
}: {
  item: DerivedItem;
  contextLabel?: string;
  contextColor?: string;
  onToggleDone: () => void;
  onCycleStatus: () => void;
  onArchive: () => void;
}) {
  const statusMeta = STATUS_META[item.status];
  const priorityMeta = PRIORITY_META[item.priority];

  return (
    <div className="item-row" style={{ opacity: item.done ? 0.55 : 1 }}>
      <div
        className="item-checkbox"
        onClick={onToggleDone}
        title="Mark done / undone"
        style={{
          background: item.done ? "#2E6B4F" : "transparent",
          borderColor: item.done ? "#2E6B4F" : "rgba(28,26,23,.3)",
        }}
      >
        {item.done ? "✓" : ""}
      </div>
      <div className="item-main">
        {contextLabel && (
          <div className="item-context">
            <span className="dot" style={{ background: contextColor ?? item.clientColor }} />
            <span>{contextLabel}</span>
          </div>
        )}
        <div className="item-title" style={{ textDecoration: item.done ? "line-through" : "none" }}>
          {item.title}
        </div>
        {item.notes && <div className="item-notes">{item.notes}</div>}
        <div className="item-meta-mobile">
          <span className="dot" style={{ background: priorityMeta.color }} />
          <span className="item-due" style={{ color: item.dueColor }}>
            {item.dueLabel}
          </span>
        </div>
      </div>
      <div className="item-priority">
        <span className="dot" style={{ background: priorityMeta.color }} />
        <span>{priorityMeta.label}</span>
      </div>
      <button
        className="status-pill"
        onClick={onCycleStatus}
        title="Click to change status"
        style={{ background: statusMeta.bg, color: statusMeta.color }}
      >
        {statusMeta.label}
      </button>
      <div className="item-due item-due-desktop" style={{ color: item.dueColor }}>
        {item.dueLabel}
      </div>
      <button className="item-archive" onClick={onArchive} title="Archive">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 9.5v3h10v-3"></path>
          <path d="M7 2v6.5"></path>
          <path d="M4.5 6.5 7 8.8 9.5 6.5"></path>
        </svg>
      </button>
    </div>
  );
}
