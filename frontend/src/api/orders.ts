import { api } from './client';
import { Receipt } from '../types';

export async function placeOrder(items: { productId: string; quantity: number }[]) {
  const { data } = await api.post<Receipt>('/api/orders', { items });
  return data;
}

export async function getOrder(id: string) {
  const { data } = await api.get<Receipt>(`/api/orders/${id}`);
  return data;
}

export async function simulatePayment(orderId: string) {
  const { data } = await api.post(`/api/dev/simulate-payment/${orderId}`);
  return data;
}
