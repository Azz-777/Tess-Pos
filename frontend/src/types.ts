export type Role = 'superadmin' | 'admin' | 'cashier';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  tenantId: string | null;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
}

export interface TenantSummary {
  id: string;
  name: string;
  businessType: string;
  active: boolean;
  userCount: number;
  productCount: number;
}

export interface Tenant {
  id: string;
  name: string;
  businessType: string;
}

export interface Product {
  _id: string;
  name: string;
  sku?: string;
  price: number;
  stock: number;
  categoryName?: string;
}

export interface Category {
  id: string;
  name: string;
}

export interface ManagedProduct {
  _id: string;
  name: string;
  sku?: string;
  price: number;
  costPrice: number;
  stock: number;
  categoryName?: string;
  margin: number;
}

export interface CartLine {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

export interface ReceiptItem {
  productId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface Receipt {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: ReceiptItem[];
}

export interface TopProduct {
  productId: string;
  name: string;
  quantity: number;
  revenue: number;
}

export interface SalesReport {
  from: string;
  to: string;
  totalRevenue: number;
  totalMargin: number;
  itemsSold: number;
  orderCount: number;
  topProducts: TopProduct[];
  cached: boolean;
}
