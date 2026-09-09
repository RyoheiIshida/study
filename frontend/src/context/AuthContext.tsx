import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthCredentials, AuthUser, AuthResponse } from '../types';
import { TOKEN_KEY, fetchCurrentUser, login as loginApi, register as registerApi } from '../api/auth';
import { recordLoginDay } from '../api/loginDays';

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (credentials: AuthCredentials) => Promise<void>;
  register: (credentials: AuthCredentials) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (!storedToken) {
      setLoading(false);
      return;
    }

    fetchCurrentUser(storedToken)
      .then((response) => {
        setUser(response.user);
        setToken(storedToken);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  // Opening the app with a valid session already counts as a login for the
  // day, so restoring a stored token checks in just like a fresh sign-in does.
  // The backend keys the record by JST date, so extra calls are harmless; the
  // ref only avoids pointless requests within one page load.
  const checkedInFor = useRef<string | null>(null);
  useEffect(() => {
    if (!user) {
      checkedInFor.current = null;
      return;
    }
    if (checkedInFor.current === user.username) return;
    checkedInFor.current = user.username;
    recordLoginDay().catch(() => {
      checkedInFor.current = null;
    });
  }, [user]);

  const setSession = useCallback((auth: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, auth.token);
    setToken(auth.token);
    setUser(auth.user);
  }, []);

  const login = useCallback(async (credentials: AuthCredentials) => {
    const auth = await loginApi(credentials);
    setSession(auth);
  }, [setSession]);

  const register = useCallback(async (credentials: AuthCredentials) => {
    const auth = await registerApi(credentials);
    setSession(auth);
  }, [setSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login', { replace: true });
    }
  }, [loading, user, navigate]);

  if (loading || !user) {
    return <p>セッションを確認中...</p>;
  }

  return children;
}
