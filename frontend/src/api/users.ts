import { api } from './client';
import { ManagedUser } from '../types';

export interface NewUser {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'cashier';
}

export async function listUsers() {
  const { data } = await api.get<{ items: ManagedUser[] }>('/api/users');
  return data.items;
}

export async function createUser(input: NewUser) {
  const { data } = await api.post<ManagedUser>('/api/users', input);
  return data;
}

export async function setUserActive(id: string, active: boolean) {
  const { data } = await api.patch<ManagedUser>(`/api/users/${id}`, { active });
  return data;
}

export async function deleteUser(id: string) {
  const { data } = await api.delete(`/api/users/${id}`);
  return data;
}
