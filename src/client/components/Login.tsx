import { useEffect, useState } from "react";

export function Login() {
  const [devLoginEnabled, setDevLoginEnabled] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((cfg) => setDevLoginEnabled(!!cfg.devLoginEnabled))
      .catch(() => {});
  }, []);

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-title">Worklog</div>
        <div className="login-subtitle">Sign in to track client work</div>
        <a className="btn btn-primary btn-block" href="/auth/login">
          Sign in with Google
        </a>
        {devLoginEnabled && (
          <a className="btn btn-block login-dev-link" href="/auth/dev-login">
            Dev login (local only)
          </a>
        )}
      </div>
    </div>
  );
}
