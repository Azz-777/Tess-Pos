import { api } from './client';
import { SalesReport } from '../types';

export async function getSalesReport(from?: string, to?: string) {
  const { data } = await api.get<SalesReport>('/api/reports/sales', {
    params: { from, to },
  });
  return data;
}
