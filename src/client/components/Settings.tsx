import { useEffect, useState } from "react";
import { api } from "../api";
import type { ApiToken, User } from "../types";

export function Settings({ user, onClose, onLogout }: { user: User; onClose: () => void; onLogout: () => void }) {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [label, setLabel] = useState("");
  const [freshToken, setFreshToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listTokens().then((t) => {
      setTokens(t);
      setLoading(false);
    });
  }, []);

  async function createToken() {
    const created = await api.createToken(label.trim() || "API token");
    setFreshToken(created.token);
    setLabel("");
    setTokens((ts) => [{ id: created.id, label: created.label, created_at: created.created_at, last_used_at: null, revoked_at: null }, ...ts]);
  }

  async function revoke(id: string) {
    await api.revokeToken(id);
    setTokens((ts) => ts.map((t) => (t.id === id ? { ...t, revoked_at: Date.now() / 1000 } : t)));
  }

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title">Settings</div>
          <button className="btn btn-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-label">Signed in as</div>
          <div className="settings-value">{user.email}</div>
          <button className="btn btn-sm" onClick={onLogout}>
            Log out
          </button>
        </div>

        <div className="settings-section">
          <div className="settings-label">API tokens</div>
          <div className="settings-hint">
            Use a token to add items programmatically: <code>Authorization: Bearer &lt;token&gt;</code>
          </div>

          {freshToken && (
            <div className="settings-fresh-token">
              <div>Copy this now — it won't be shown again:</div>
              <code>{freshToken}</code>
            </div>
          )}

          <div className="settings-token-create">
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Label (e.g. 'shortcuts script')" />
            <button className="btn btn-primary btn-sm" onClick={createToken}>
              Generate token
            </button>
          </div>

          {!loading && (
            <div className="settings-token-list">
              {tokens.length === 0 && <div className="empty-note">No tokens yet</div>}
              {tokens.map((t) => (
                <div key={t.id} className="settings-token-row">
                  <span>{t.label || "Untitled token"}</span>
                  {t.revoked_at ? (
                    <span className="token-revoked">Revoked</span>
                  ) : (
                    <button className="link-btn" onClick={() => revoke(t.id)}>
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
