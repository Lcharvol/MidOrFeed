"use client";

import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  email: string;
  name: string | null;
  role?: string;
  subscriptionTier?: string;
  subscriptionExpiresAt?: string | null;
  dailyAnalysesUsed?: number;
  lastDailyReset?: string;
  riotGameName?: string | null;
  riotTagLine?: string | null;
  riotRegion?: string | null;
  riotPuuid?: string | null;
  leagueAccount?: {
    id: string;
    puuid: string;
    riotRegion: string;
    riotGameName?: string | null;
    riotTagLine?: string | null;
    profileIconId?: number | null;
  } | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (user: unknown, token?: string) => void | Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback((userData: unknown, token?: string) => {
    const castUser = userData as User;
    setUser(castUser);
    localStorage.setItem("user", JSON.stringify(castUser));
    if (token) {
      localStorage.setItem("token", token);
    }
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setIsLoading(false);
  }, []);

  const contextValue = useMemo(
    () => ({ user, isLoading, login, logout }),
    [user, isLoading, login, logout]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
