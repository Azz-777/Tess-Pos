import { api } from './client';
import { TenantSummary } from '../types';

export interface NewTenant {
  name: string;
  businessType: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}

export async function listTenants() {
  const { data } = await api.get<{ items: TenantSummary[] }>('/api/tenants');
  return data.items;
}

export async function createTenant(input: NewTenant) {
  const { data } = await api.post('/api/tenants', input);
  return data;
}

export async function setTenantActive(id: string, active: boolean) {
  const { data } = await api.patch(`/api/tenants/${id}`, { active });
  return data;
}
