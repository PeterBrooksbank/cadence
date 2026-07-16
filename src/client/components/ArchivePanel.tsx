import type { DerivedItem } from "../deriveViewModel";

export function ArchivePanel({ items, onRestore }: { items: DerivedItem[]; onRestore: (id: string) => void }) {
  if (items.length === 0) {
    return <div className="archive-panel empty-note">Nothing archived yet</div>;
  }
  return (
    <div className="archive-panel">
      {items.map((item) => (
        <div key={item.id} className="archive-row">
          <span className="dot" style={{ background: item.clientColor }} />
          <span className="archive-client">{item.clientName}</span>
          <span className="archive-title">{item.title}</span>
          <button className="btn btn-sm" onClick={() => onRestore(item.id)}>
            Restore
          </button>
        </div>
      ))}
    </div>
  );
}
