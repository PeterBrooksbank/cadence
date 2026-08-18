import { useMemo, useState } from "react";
import { useAuth } from "./useAuth";
import { useWorkspaces } from "./useWorkspaces";
import { useWorkTracker } from "./useWorkTracker";
import { deriveArchivedItems, deriveGroups, deriveSortedItems } from "./deriveViewModel";
import { Login } from "./components/Login";
import { Toolbar } from "./components/Toolbar";
import { WorkspaceSwitcher } from "./components/WorkspaceSwitcher";
import { AddWorkForm } from "./components/AddWorkForm";
import { AddClientForm } from "./components/AddClientForm";
import { ArchivePanel } from "./components/ArchivePanel";
import { ClientChips } from "./components/ClientChips";
import { FocusBar } from "./components/FocusBar";
import { ClientGroupSection } from "./components/ClientGroupSection";
import { AllTasksSection } from "./components/AllTasksSection";
import { Settings } from "./components/Settings";

const DUE_SOON_DAYS = 3;

export function App() {
  const { user, loading: authLoading, logout } = useAuth();
  const { workspaces, activeId, setActive, addWorkspace } = useWorkspaces();
  const { clients, items, addClient, renameClient, addItem, patchItem, archiveManyDone } = useWorkTracker(activeId);

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [clientFormOpen, setClientFormOpen] = useState(false);
  const [workFormOpen, setWorkFormOpen] = useState(false);
  const [focusClientId, setFocusClientId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeItems = useMemo(() => items.filter((i) => !i.archived), [items]);
  const groups = useMemo(() => deriveGroups(clients, activeItems, DUE_SOON_DAYS), [clients, activeItems]);
  const sortedItems = useMemo(() => deriveSortedItems(clients, activeItems, DUE_SOON_DAYS), [clients, activeItems]);
  const archivedItems = useMemo(() => deriveArchivedItems(clients, items, DUE_SOON_DAYS), [clients, items]);

  const doneTotal = activeItems.filter((i) => i.status === "done").length;
  const openTotal = activeItems.length - doneTotal;
  const focusGroup = groups.find((g) => g.client.id === focusClientId) ?? null;
  const visibleGroups = focusGroup ? [focusGroup] : groups;

  if (authLoading) return <div className="app-loading">Loading…</div>;
  if (!user) return <Login />;

  return (
    <div className="app">
      <div className="card">
        <Toolbar
          workspaceSwitcher={
            <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} onSelect={setActive} onCreate={addWorkspace} />
          }
          openTotal={openTotal}
          clientCount={clients.length}
          archCount={archivedItems.length}
          doneTotal={doneTotal}
          hasDoneAny={doneTotal > 0}
          archiveOpen={archiveOpen}
          onToggleArchive={() => setArchiveOpen((o) => !o)}
          onArchiveAllDone={() =>
            archiveManyDone(activeItems.filter((i) => i.status === "done").map((i) => i.id))
          }
          onToggleClientForm={() => setClientFormOpen((o) => !o)}
          onToggleWorkForm={() => setWorkFormOpen((o) => !o)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {workFormOpen && (
          <AddWorkForm
            clients={clients}
            variant="desktop"
            onSubmit={async (input) => {
              await addItem(input);
              setWorkFormOpen(false);
            }}
          />
        )}

        {clientFormOpen && (
          <AddClientForm
            onSubmit={async (name) => {
              await addClient(name);
              setClientFormOpen(false);
            }}
          />
        )}

        {archiveOpen && <ArchivePanel items={archivedItems} onRestore={(id) => patchItem(id, { archived: false })} />}

        <AllTasksSection
          items={sortedItems}
          onToggleDone={(id) => {
            const item = items.find((i) => i.id === id);
            if (!item) return;
            patchItem(id, { status: item.status === "done" ? "todo" : "done" });
          }}
          onCycleStatus={(id) => {
            const item = items.find((i) => i.id === id);
            if (!item) return;
            const next = item.status === "todo" ? "progress" : item.status === "progress" ? "done" : "todo";
            patchItem(id, { status: next });
          }}
          onArchiveItem={(id) => patchItem(id, { archived: true })}
        />

        <ClientChips groups={groups} focusedId={focusClientId} onSelect={(id) => setFocusClientId((cur) => (cur === id ? null : id))} />

        {focusGroup && <FocusBar group={focusGroup} onClear={() => setFocusClientId(null)} />}

        <div className="client-groups">
          {clients.length === 0 && <div className="empty-note empty-note-lg">No clients yet — add one to get started.</div>}
          {visibleGroups.map((group) => (
            <ClientGroupSection
              key={group.client.id}
              group={group}
              onRenameClient={renameClient}
              onToggleDone={(id) => {
                const item = items.find((i) => i.id === id);
                if (!item) return;
                patchItem(id, { status: item.status === "done" ? "todo" : "done" });
              }}
              onCycleStatus={(id) => {
                const item = items.find((i) => i.id === id);
                if (!item) return;
                const next = item.status === "todo" ? "progress" : item.status === "progress" ? "done" : "todo";
                patchItem(id, { status: next });
              }}
              onArchiveItem={(id) => patchItem(id, { archived: true })}
              onArchiveDone={() =>
                archiveManyDone(activeItems.filter((i) => i.client_id === group.client.id && i.status === "done").map((i) => i.id))
              }
            />
          ))}
        </div>
      </div>

      {settingsOpen && <Settings user={user} onClose={() => setSettingsOpen(false)} onLogout={logout} />}
    </div>
  );
}
