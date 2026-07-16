import { useState } from "react";

export function AddClientForm({ onSubmit }: { onSubmit: (name: string) => Promise<unknown> }) {
  const [name, setName] = useState("");

  async function submit() {
    if (!name.trim()) return;
    await onSubmit(name.trim());
    setName("");
  }

  return (
    <div className="add-client-form">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="New client name"
      />
      <button className="btn btn-primary" onClick={submit}>
        Add client
      </button>
    </div>
  );
}
