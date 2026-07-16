import type { ReactNode } from "react";

export function Toolbar({
  workspaceSwitcher,
  openTotal,
  clientCount,
  archCount,
  doneTotal,
  hasDoneAny,
  archiveOpen,
  onToggleArchive,
  onArchiveAllDone,
  onToggleClientForm,
  onToggleWorkForm,
  onOpenSettings,
}: {
  workspaceSwitcher: ReactNode;
  openTotal: number;
  clientCount: number;
  archCount: number;
  doneTotal: number;
  hasDoneAny: boolean;
  archiveOpen: boolean;
  onToggleArchive: () => void;
  onArchiveAllDone: () => void;
  onToggleClientForm: () => void;
  onToggleWorkForm: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-title-block">
        <div className="toolbar-title-row">
          <div className="toolbar-title">Worklog</div>
          {workspaceSwitcher}
        </div>
        <div className="toolbar-subtitle">
          {openTotal} open · {clientCount} clients
        </div>
      </div>
      <div className="toolbar-actions">
        <button className={`btn${archiveOpen ? " btn-active" : ""}`} onClick={onToggleArchive}>
          Archived ({archCount})
        </button>
        {hasDoneAny && (
          <button className="btn" onClick={onArchiveAllDone}>
            Archive done ({doneTotal})
          </button>
        )}
        <button className="btn" onClick={onToggleClientForm}>
          + Client
        </button>
        <button className="btn btn-primary" onClick={onToggleWorkForm}>
          + Add work
        </button>
        <button className="btn btn-icon" onClick={onOpenSettings} title="Settings">
          ⚙
        </button>
      </div>
    </div>
  );
}
