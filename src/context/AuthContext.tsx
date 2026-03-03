import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types";
import { authApi } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("opsmind_token"));
  const [isLoading, setIsLoading] = useState(true);

  // On mount: restore session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("opsmind_token");
    if (savedToken) {
      authApi
        .getMe()
        .then((data) => {
          setUser(data.user);
          setToken(savedToken);
        })
        .catch(() => {
          localStorage.removeItem("opsmind_token");
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    localStorage.setItem("opsmind_token", data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem("opsmind_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
