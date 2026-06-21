import { api } from './client';
import { Category } from '../types';

export async function listCategories() {
  const { data } = await api.get<{ items: Category[] }>('/api/categories');
  return data.items;
}
