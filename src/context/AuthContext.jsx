import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authAPI, userAPI } from "@/lib/authApi";

const STORAGE_KEY = "finance_auth_session";

const AuthContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.email) return null;
    return session;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const token = localStorage.getItem("auth_token");
    return token ? undefined : readSession();
  });

  const persistSession = useCallback((user, token) => {
    localStorage.setItem("auth_token", token);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(
      "settings_profile",
      JSON.stringify({
        name: user.name,
        email: user.email,
      })
    );
    setSession(user);
  }, []);

  const login = useCallback(
    async ({ email, password }) => {
      try {
        const res = await authAPI.login(email, password);
        const { user, token } = res.data.data;
        persistSession(user, token);
        return { success: true };
      } catch (error) {
        const msg = error.response?.data?.message || error.message || "Login failed";
        throw new Error(msg);
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async ({ name, email, password }) => {
      try {
        const res = await authAPI.register(name, email, password);
        const { user, token } = res.data.data;
        persistSession(user, token);
        return { success: true };
      } catch (error) {
        const msg = error.response?.data?.message || error.message || "Registration failed";
        throw new Error(msg);
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("settings_profile");
    setSession(null);
  }, []);

  const applySessionUser = useCallback((user) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(
      "settings_profile",
      JSON.stringify({
        name: user.name,
        email: user.email,
        phone: user.phone || "",
        bio: user.bio || "",
        avatar: user.avatar || "",
      })
    );
    setSession(user);
    return user;
  }, []);

  const refreshSession = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setSession(null);
      return null;
    }

    const res = await userAPI.getMe();
    const user = res.data?.data?.user;
    if (!user) {
      logout();
      return null;
    }

    return applySessionUser(user);
  }, [logout, applySessionUser]);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setSession((current) => current ?? null);
      return;
    }

    let isMounted = true;

    userAPI
      .getMe()
      .then((res) => {
        if (!isMounted) return;
        const user = res.data?.data?.user;
        if (!user) {
          logout();
          return;
        }

        applySessionUser(user);
      })
      .catch(() => {
        if (!isMounted) return;
        logout();
      });

    return () => {
      isMounted = false;
    };
  }, [logout]);

  const value = useMemo(
    () => ({
      session,
      isAuthed: Boolean(session),
      login,
      register,
      logout,
      refreshSession,
      setSessionUser: applySessionUser,
    }),
    [session, login, register, logout, refreshSession, applySessionUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
