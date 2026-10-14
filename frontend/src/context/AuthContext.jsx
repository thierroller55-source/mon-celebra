import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authService } from '../services/auth.service.js';
import { clearAccessToken, setAccessToken } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const applySession = useCallback((data) => {
    if (data?.accessToken) setAccessToken(data.accessToken);
    setUser(data?.user ?? null);
  }, []);

  const login = useCallback(
    async (payload) => {
      const data = await authService.login(payload);
      applySession(data);
      return data.user;
    },
    [applySession],
  );

  const register = useCallback(
    async (payload) => {
      const data = await authService.register(payload);
      applySession(data);
      return data.user;
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // La deconnexion doit reussir cote client meme si l'appel echoue.
    }
    clearAccessToken();
    setUser(null);
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await authService.me();
        if (active) setUser(data);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, register, logout, setUser }),
    [user, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth doit etre utilise a l'interieur de AuthProvider.");
  }
  return ctx;
}
