import type { DerivedItem } from "../deriveViewModel";
import { ItemRow } from "./ItemRow";

export function AllTasksSection({
  items,
  onToggleDone,
  onCycleStatus,
  onArchiveItem,
}: {
  items: DerivedItem[];
  onToggleDone: (id: string) => void;
  onCycleStatus: (id: string) => void;
  onArchiveItem: (id: string) => void;
}) {
  return (
    <section className="all-tasks-section">
      <div className="all-tasks-header">
        <div>
          <div className="all-tasks-title">All tasks</div>
          <div className="all-tasks-subtitle">Sorted by priority, then due date</div>
        </div>
        <div className="all-tasks-count">{items.length} total</div>
      </div>
      {items.length === 0 ? (
        <div className="empty-note">No tasks yet — add one to get started.</div>
      ) : (
        items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            contextLabel={item.clientName}
            contextColor={item.clientColor}
            onToggleDone={() => onToggleDone(item.id)}
            onCycleStatus={() => onCycleStatus(item.id)}
            onArchive={() => onArchiveItem(item.id)}
          />
        ))
      )}
    </section>
  );
}
