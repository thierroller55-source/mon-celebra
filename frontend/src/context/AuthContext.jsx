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

  // Ouvre une session invite (client sans compte) et l'installe dans le contexte.
  const guest = useCallback(async () => {
    const data = await authService.guest();
    applySession(data);
    return data.user;
  }, [applySession]);

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
        // Bootstrap via le cookie de session (refresh) : evite un 401 garanti
        // a chaque chargement puisque l'access token n'existe qu'en memoire.
        const data = await authService.refresh();
        if (active) applySession(data);
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [applySession]);

  const value = useMemo(
    () => ({ user, loading, login, register, guest, logout, setUser }),
    [user, loading, login, register, guest, logout],
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
