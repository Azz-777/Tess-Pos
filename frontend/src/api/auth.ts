import { api } from './client';
import { AuthUser, Tenant } from '../types';

export async function loginRequest(email: string, password: string) {
  const { data } = await api.post<{ token: string; user: AuthUser; tenant: Tenant | null }>(
    '/api/auth/login',
    { email, password }
  );
  return data;
}
