import { createContext, useContext, useState, ReactNode } from 'react';
import { AuthUser, Tenant } from '../types';
import { loginRequest } from '../api/auth';

interface AuthState {
  user: AuthUser | null;
  tenant: Tenant | null;
  login: (email: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

function readStored<T>(key: string): T | null {
  const stored = localStorage.getItem(key);
  return stored ? (JSON.parse(stored) as T) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => readStored<AuthUser>('tess_user'));
  const [tenant, setTenant] = useState<Tenant | null>(() => readStored<Tenant>('tess_tenant'));

  async function login(email: string, password: string) {
    const data = await loginRequest(email, password);
    localStorage.setItem('tess_token', data.token);
    localStorage.setItem('tess_user', JSON.stringify(data.user));
    if (data.tenant) {
      localStorage.setItem('tess_tenant', JSON.stringify(data.tenant));
    }
    setUser(data.user);
    setTenant(data.tenant);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('tess_token');
    localStorage.removeItem('tess_user');
    localStorage.removeItem('tess_tenant');
    setUser(null);
    setTenant(null);
  }

  return (
    <AuthContext.Provider value={{ user, tenant, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
