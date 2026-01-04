import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse } from '../types/api';
import { login as loginApi } from '../api/taaleem';
import { parseApiError, setAuthToken } from '../api/client';

const STORAGE_KEY = 'taaleem-auth';

type AuthContextValue = {
  user: AuthResponse | null;
  isLoading: boolean;
  error: string | null;
  initialized: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed: AuthResponse = JSON.parse(stored);
      setUser(parsed);
      setAuthToken(parsed.token);
    }
    setInitialized(true);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loginApi({ email, password });
      setUser(result);
      setAuthToken(result.token);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
      return true;
    } catch (err) {
      setError(parseApiError(err));
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(
    () => ({ user, isLoading, error, initialized, login, logout }),
    [user, isLoading, error, initialized],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
