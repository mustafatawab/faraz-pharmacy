import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

interface User {
  id: string;
  username: string;
  role: string;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  csrfToken: string | null;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ACCESS_COOKIE = "faraz_access_token";
const REFRESH_COOKIE = "faraz_refresh_token";

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 86400000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
}

function removeCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict`;
}

function nully<T>(val: T | null | undefined): T | null {
  return val ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const accessToken = getCookie(ACCESS_COOKIE);
    const refreshToken = getCookie(REFRESH_COOKIE);
    return { user: null, accessToken, refreshToken, csrfToken: null };
  });

  const refreshAccessToken = useCallback(async () => {
    const stored = getCookie(REFRESH_COOKIE);
    if (!stored) return false;

    try {
      const res = await window.authRefresh({ refreshToken: stored });
      if (res.error) {
        removeCookie(ACCESS_COOKIE);
        removeCookie(REFRESH_COOKIE);
        return false;
      }
      setState((prev) => ({
        ...prev,
        user: nully(res.user),
        accessToken: nully(res.accessToken),
        csrfToken: nully(res.csrfToken),
        refreshToken: stored,
      }));
      if (res.accessToken) setCookie(ACCESS_COOKIE, res.accessToken, 1);
      return true;
    } catch {
      removeCookie(ACCESS_COOKIE);
      removeCookie(REFRESH_COOKIE);
      return false;
    }
  }, []);

  useEffect(() => {
    if (state.refreshToken) return;
    refreshAccessToken();
  }, [refreshAccessToken, state.refreshToken]);

  useEffect(() => {
    if (!state.refreshToken) return;

    const interval = setInterval(async () => {
      try {
        const res = await window.authRefresh({ refreshToken: state.refreshToken });
        if (res.error) {
          setState({ user: null, accessToken: null, refreshToken: null, csrfToken: null });
          removeCookie(ACCESS_COOKIE);
          removeCookie(REFRESH_COOKIE);
          return;
        }
        setState((prev) => ({
          ...prev,
          accessToken: nully(res.accessToken),
          csrfToken: nully(res.csrfToken),
        }));
        if (res.accessToken) setCookie(ACCESS_COOKIE, res.accessToken, 1);
      } catch {
        setState({ user: null, accessToken: null, refreshToken: null, csrfToken: null });
        removeCookie(ACCESS_COOKIE);
        removeCookie(REFRESH_COOKIE);
      }
    }, 10 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.refreshToken]);

  const login = async (username: string, password: string): Promise<string | null> => {
    try {
      const res = await window.authLogin({ username, password });
      if (res.error) return res.error;
      setState({
        user: nully(res.user),
        accessToken: nully(res.accessToken),
        refreshToken: nully(res.refreshToken),
        csrfToken: nully(res.csrfToken),
      });
      if (res.accessToken) setCookie(ACCESS_COOKIE, res.accessToken, 1);
      if (res.refreshToken) setCookie(REFRESH_COOKIE, res.refreshToken, 30);
      return null;
    } catch {
      return "Login failed";
    }
  };

  const logout = async () => {
    try {
      if (state.accessToken) {
        await window.authLogout({ accessToken: state.accessToken });
      }
    } catch {}
    setState({ user: null, accessToken: null, refreshToken: null, csrfToken: null });
    removeCookie(ACCESS_COOKIE);
    removeCookie(REFRESH_COOKIE);
    localStorage.setItem("faraz_show_setup", "true");
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, isAuthenticated: !!state.user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
