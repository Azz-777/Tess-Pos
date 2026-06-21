import { api } from './client';
import { Product, ManagedProduct } from '../types';

interface ProductPage {
  items: Product[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface NewProduct {
  name: string;
  sku?: string;
  price: number;
  costPrice: number;
  stock: number;
  categoryName?: string;
}

export async function searchProducts(search: string, page = 1, limit = 10) {
  const { data } = await api.get<ProductPage>('/api/products', {
    params: { search, page, limit },
  });
  return data;
}

export async function listManagedProducts() {
  const { data } = await api.get<{ items: ManagedProduct[] }>('/api/products/manage');
  return data.items;
}

export async function createProduct(input: NewProduct) {
  const { data } = await api.post('/api/products', input);
  return data;
}
