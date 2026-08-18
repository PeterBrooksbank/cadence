import type { Client, Item, Priority, Status } from "./types";

export const STATUS_META: Record<Status, { label: string; bg: string; color: string; next: Status }> = {
  todo: { label: "To do", bg: "rgba(28,26,23,.07)", color: "#6B6559", next: "progress" },
  progress: { label: "In progress", bg: "rgba(64,86,168,.12)", color: "#4056A8", next: "done" },
  done: { label: "Done", bg: "rgba(46,107,79,.13)", color: "#2E6B4F", next: "todo" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string }> = {
  high: { label: "High", color: "#C05B3C" },
  med: { label: "Med", color: "#B9852F" },
  low: { label: "Low", color: "#8A8478" },
};

export function formatDue(due: string | null): string {
  if (!due) return "—";
  const dt = new Date(`${due}T00:00:00`);
  return dt.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export interface DerivedItem extends Item {
  clientName: string;
  clientColor: string;
  done: boolean;
  overdue: boolean;
  dueLabel: string;
  dueColor: string;
}

export function deriveItem(item: Item, client: Client | undefined, dueSoonDays: number, today: Date): DerivedItem {
  const done = item.status === "done";
  let dueLabel = formatDue(item.due_date);
  let dueColor = "#8A8478";
  let overdue = false;

  if (item.due_date && !done) {
    const dt = new Date(`${item.due_date}T00:00:00`);
    const diff = Math.round((dt.getTime() - today.getTime()) / 86400000);
    if (diff < 0) {
      dueLabel = `Overdue · ${dueLabel}`;
      dueColor = "#C05B3C";
      overdue = true;
    } else if (diff === 0) {
      dueLabel = "Due today";
      dueColor = "#C05B3C";
    } else if (diff <= dueSoonDays) {
      dueColor = "#A87B1F";
    }
  }

  return {
    ...item,
    clientName: client?.name ?? "—",
    clientColor: client?.color ?? "#8A8478",
    done,
    overdue,
    dueLabel,
    dueColor,
  };
}

export interface ClientGroupVM {
  client: Client;
  items: DerivedItem[];
  openCount: number;
  doneCount: number;
  overdueCount: number;
  hasDone: boolean;
  hasOverdue: boolean;
  pct: number;
}

const PRIORITY_ORDER: Record<Priority, number> = {
  high: 0,
  med: 1,
  low: 2,
};

function compareDerivedItems(a: DerivedItem, b: DerivedItem): number {
  const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
  if (priorityDiff !== 0) return priorityDiff;

  if (a.due_date && b.due_date) {
    const dueDiff = a.due_date.localeCompare(b.due_date);
    if (dueDiff !== 0) return dueDiff;
  } else if (a.due_date) {
    return -1;
  } else if (b.due_date) {
    return 1;
  }

  return a.created_at - b.created_at;
}

export function deriveGroups(clients: Client[], activeItems: Item[], dueSoonDays: number): ClientGroupVM[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const byClient = new Map<string, Client>(clients.map((c) => [c.id, c]));

  return clients.map((client) => {
    const items = activeItems
      .filter((i) => i.client_id === client.id)
      .map((i) => deriveItem(i, byClient.get(client.id), dueSoonDays, today))
      .sort(compareDerivedItems);
    const doneCount = items.filter((i) => i.done).length;
    const overdueCount = items.filter((i) => i.overdue).length;
    return {
      client,
      items,
      openCount: items.length - doneCount,
      doneCount,
      overdueCount,
      hasDone: doneCount > 0,
      hasOverdue: overdueCount > 0,
      pct: items.length ? Math.round((doneCount / items.length) * 100) : 0,
    };
  });
}

export function deriveSortedItems(clients: Client[], activeItems: Item[], dueSoonDays: number): DerivedItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const byClient = new Map<string, Client>(clients.map((c) => [c.id, c]));

  return activeItems.map((i) => deriveItem(i, byClient.get(i.client_id), dueSoonDays, today)).sort(compareDerivedItems);
}

export function deriveArchivedItems(clients: Client[], items: Item[], dueSoonDays: number): DerivedItem[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const byClient = new Map<string, Client>(clients.map((c) => [c.id, c]));
  return items.filter((i) => i.archived).map((i) => deriveItem(i, byClient.get(i.client_id), dueSoonDays, today));
}
