import { useState } from "react";
import type { Client, Priority } from "../types";

export function AddWorkForm({
  clients,
  onSubmit,
  variant,
}: {
  clients: Client[];
  onSubmit: (input: { clientId: string; title: string; dueDate: string | null; priority: Priority }) => Promise<unknown>;
  variant: "desktop" | "mobile";
}) {
  const [title, setTitle] = useState("");
  const [clientId, setClientId] = useState(clients[0]?.id ?? "");
  const [due, setDue] = useState("");
  const [priority, setPriority] = useState<Priority>("med");

  const effectiveClientId = clientId || clients[0]?.id || "";

  async function submit() {
    if (!title.trim() || !effectiveClientId) return;
    await onSubmit({ clientId: effectiveClientId, title: title.trim(), dueDate: due || null, priority });
    setTitle("");
    setDue("");
  }

  return (
    <div className={`add-form add-form-${variant}`}>
      <input
        className="add-form-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="What needs doing?"
      />
      <div className="add-form-row">
        <select value={effectiveClientId} onChange={(e) => setClientId(e.target.value)}>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="high">High</option>
          <option value="med">Med</option>
          <option value="low">Low</option>
        </select>
      </div>
      <div className="add-form-row">
        <input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <button className="btn btn-primary" onClick={submit}>
          Add
        </button>
      </div>
    </div>
  );
}
