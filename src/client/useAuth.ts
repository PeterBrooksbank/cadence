import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import type { User } from "./types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const me = await api.me();
      setUser(me);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setUser(null);
      } else {
        throw e;
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  return { user, loading, logout, refresh };
}
