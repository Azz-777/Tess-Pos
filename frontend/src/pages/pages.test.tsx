import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AuthUser, ManagedProduct, ManagedUser, Receipt, SalesReport, Tenant, TenantSummary } from '../types';
import LoginPage from './LoginPage';
import PosPage from './PosPage';
import ReceiptPage from './ReceiptPage';
import ReportPage from './ReportPage';
import ProductsAdminPage from './ProductsAdminPage';
import UsersPage from './UsersPage';
import BusinessesPage from './BusinessesPage';
import { createProduct, listManagedProducts, searchProducts } from '../api/products';
import { placeOrder, getOrder, simulatePayment } from '../api/orders';
import { getSalesReport } from '../api/reports';
import { createUser, deleteUser, listUsers, setUserActive } from '../api/users';
import { createTenant, listTenants, setTenantActive } from '../api/tenants';

const mocks = vi.hoisted(() => ({
  authState: {} as { user: AuthUser | null; tenant: Tenant | null; login: ReturnType<typeof vi.fn> },
  login: vi.fn(),
  resetPasswordRequest: vi.fn(),
  searchProducts: vi.fn(),
  listManagedProducts: vi.fn(),
  createProduct: vi.fn(),
  listCategories: vi.fn(),
  placeOrder: vi.fn(),
  getOrder: vi.fn(),
  simulatePayment: vi.fn(),
  getSalesReport: vi.fn(),
  listUsers: vi.fn(),
  createUser: vi.fn(),
  setUserActive: vi.fn(),
  deleteUser: vi.fn(),
  listTenants: vi.fn(),
  createTenant: vi.fn(),
  setTenantActive: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({ useAuth: () => mocks.authState }));
vi.mock('../api/auth', () => ({ resetPasswordRequest: mocks.resetPasswordRequest }));
vi.mock('../api/products', () => ({
  searchProducts: mocks.searchProducts,
  listManagedProducts: mocks.listManagedProducts,
  createProduct: mocks.createProduct,
}));
vi.mock('../api/categories', () => ({ listCategories: mocks.listCategories }));
vi.mock('../api/orders', () => ({
  placeOrder: mocks.placeOrder,
  getOrder: mocks.getOrder,
  simulatePayment: mocks.simulatePayment,
}));
vi.mock('../api/reports', () => ({ getSalesReport: mocks.getSalesReport }));
vi.mock('../api/users', () => ({
  listUsers: mocks.listUsers,
  createUser: mocks.createUser,
  setUserActive: mocks.setUserActive,
  deleteUser: mocks.deleteUser,
}));
vi.mock('../api/tenants', () => ({
  listTenants: mocks.listTenants,
  createTenant: mocks.createTenant,
  setTenantActive: mocks.setTenantActive,
}));

const admin: AuthUser = {
  id: 'admin-1',
  name: 'Demo Admin',
  email: 'admin@brightmart.test',
  role: 'admin',
  tenantId: 'tenant-1',
};
const tenant: Tenant = { id: 'tenant-1', name: 'Bright Mart', businessType: 'Supermarket' };
const product = {
  _id: 'product-1',
  name: 'Cola 0.5L',
  sku: 'COLA-1',
  price: 12000,
  stock: 5,
  categoryName: 'Ichimliklar',
};
const managedProduct: ManagedProduct = { ...product, costPrice: 8000, margin: 4000 };
const pendingReceipt: Receipt = {
  id: 'order-123456',
  status: 'pending_payment',
  total: 12000,
  createdAt: '2026-10-28T08:00:00.000Z',
  items: [{ productId: 'product-1', name: 'Cola 0.5L', unitPrice: 12000, quantity: 1, lineTotal: 12000 }],
};
const report: SalesReport = {
  from: '2026-10-01',
  to: '2026-10-28',
  totalRevenue: 12000,
  totalMargin: 4000,
  itemsSold: 1,
  orderCount: 1,
  topProducts: [{ productId: 'product-1', name: 'Cola 0.5L', quantity: 1, revenue: 12000 }],
  cached: false,
};

function Location() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

function renderPage(element: ReactNode, path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/receipt/:id" element={element} />
        <Route path="*" element={element} />
      </Routes>
      <Location />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authState = { user: admin, tenant, login: mocks.login };
  mocks.login.mockResolvedValue(admin);
  mocks.searchProducts.mockResolvedValue({ items: [product], page: 1, limit: 20, total: 1, totalPages: 1 });
  mocks.listManagedProducts.mockResolvedValue([managedProduct]);
  mocks.listCategories.mockResolvedValue([{ id: 'category-1', name: 'Ichimliklar' }]);
  mocks.createProduct.mockResolvedValue(managedProduct);
  mocks.placeOrder.mockResolvedValue(pendingReceipt);
  mocks.getOrder.mockResolvedValue(pendingReceipt);
  mocks.simulatePayment.mockResolvedValue({ ...pendingReceipt, status: 'paid' });
  mocks.getSalesReport.mockResolvedValue(report);
  mocks.listUsers.mockResolvedValue([
    { id: 'cashier-1', name: 'Ali Kassir', email: 'ali@example.test', role: 'cashier', active: true } satisfies ManagedUser,
  ]);
  mocks.createUser.mockResolvedValue({
    id: 'cashier-2',
    name: 'Test Kassir',
    email: 'test@example.test',
    role: 'cashier',
    active: true,
  });
  mocks.setUserActive.mockResolvedValue({});
  mocks.deleteUser.mockResolvedValue({});
  mocks.listTenants.mockResolvedValue([
    { id: 'tenant-2', name: 'City Shop', businessType: 'Market', active: true, userCount: 2, productCount: 4 } satisfies TenantSummary,
  ]);
  mocks.createTenant.mockResolvedValue({});
  mocks.setTenantActive.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('application pages', () => {
  it('signs in using a selected demo role and routes to the admin home', async () => {
    const user = userEvent.setup();
    renderPage(<LoginPage />);

    await user.click(screen.getAllByRole('button', { name: 'Admin' })[0]);
    expect(screen.getByLabelText('Email')).toHaveValue('admin@brightmart.test');
    await user.click(screen.getByRole('button', { name: 'Kirish' }));

    await waitFor(() => expect(mocks.login).toHaveBeenCalledWith('admin@brightmart.test', 'password123'));
    expect(await screen.findByTestId('location')).toHaveTextContent('/reports');
  });

  it('searches products, maintains cart quantities and submits an order', async () => {
    const user = userEvent.setup();
    renderPage(<PosPage />);

    await screen.findByText('Cola 0.5L');
    await user.click(screen.getByRole('button', { name: 'Qo‘shish' }));
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    await user.click(screen.getByRole('button', { name: 'Buyurtma berish' }));

    await waitFor(() => expect(mocks.placeOrder).toHaveBeenCalledWith([{ productId: 'product-1', quantity: 2 }]));
    expect(await screen.findByTestId('location')).toHaveTextContent('/receipt/order-123456');
  });

  it('loads a receipt, confirms demo payment and enables printing', async () => {
    const user = userEvent.setup();
    mocks.getOrder
      .mockResolvedValueOnce(pendingReceipt)
      .mockResolvedValueOnce({ ...pendingReceipt, status: 'paid' });
    Object.defineProperty(window, 'print', { configurable: true, value: vi.fn() });
    renderPage(<ReceiptPage />, '/receipt/order-123456');

    await screen.findByText('to‘lov kutilmoqda');
    expect(screen.getByRole('heading', { name: 'SOTUV CHEKI' })).toBeInTheDocument();
    expect(screen.getByText('SOTUV CHEKI').parentElement).toHaveClass('receipt', 'printable');
    expect(screen.getByText('Cola 0.5L')).toBeInTheDocument();
    expect(screen.getByText(/12\s?000 × 1 dona/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'To‘lovni tasdiqlash (demo)' }));
    await screen.findByText('to‘langan');
    expect(mocks.simulatePayment).toHaveBeenCalledWith('order-123456');
    expect(screen.getByRole('button', { name: 'Chekni chop etish' })).toBeEnabled();
    await user.click(screen.getByRole('button', { name: 'Chekni chop etish' }));
    expect(window.print).toHaveBeenCalledOnce();
  });

  it('filters report dates and rejects an invalid range', async () => {
    const user = userEvent.setup();
    renderPage(<ReportPage />);

    expect(await screen.findByText('Cola 0.5L')).toBeInTheDocument();
    expect(screen.getByText('Foyda (margin)')).toBeInTheDocument();
    await user.clear(screen.getByLabelText('Boshlanish'));
    await user.type(screen.getByLabelText('Boshlanish'), '2026-10-20');
    await user.clear(screen.getByLabelText('Tugash'));
    await user.type(screen.getByLabelText('Tugash'), '2026-10-10');
    await user.click(screen.getByRole('button', { name: 'Qo‘llash' }));

    expect(await screen.findByText('Boshlanish sanasi tugash sanasidan keyin bo‘lishi mumkin emas')).toBeInTheDocument();
    expect(mocks.getSalesReport).toHaveBeenCalledTimes(1);
  });

  it('searches the catalog and creates a product', async () => {
    const user = userEvent.setup();
    renderPage(<ProductsAdminPage />);

    await screen.findByText('Cola 0.5L');
    await user.type(screen.getByLabelText('Katalogdan qidirish'), 'Cola');
    await user.type(screen.getByLabelText('Mahsulot nomi', { exact: false }), 'Green tea');
    await user.type(screen.getByLabelText('Sotuv narxi', { exact: false }), '18000');
    await user.type(screen.getByLabelText('Tannarx', { exact: false }), '12000');
    await user.type(screen.getByLabelText('Qoldiq', { exact: false }), '8');
    await user.click(screen.getByRole('button', { name: 'Mahsulot qo‘shish' }));

    await screen.findByText('\"Cola 0.5L\" qo‘shildi');
    expect(mocks.createProduct).toHaveBeenCalledWith({
      name: 'Green tea',
      sku: undefined,
      price: 18000,
      costPrice: 12000,
      stock: 8,
      categoryName: undefined,
    });
  });

  it('creates, searches, blocks and deletes a team member', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderPage(<UsersPage />);

    await screen.findByText('Ali Kassir');
    await user.type(screen.getByLabelText('Ism'), 'Test Kassir');
    await user.type(screen.getByLabelText('Email', { exact: false }), 'test@example.test');
    await user.type(screen.getByLabelText('Parol', { exact: false }), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Xodim qo‘shish' }));
    await screen.findByText('Kassir \"Test Kassir\" qo‘shildi');
    expect(mocks.createUser).toHaveBeenCalled();

    await user.type(screen.getByLabelText('Jamoa ichidan qidirish'), 'Ali');
    await user.click(screen.getByRole('button', { name: 'Bloklash' }));
    expect(mocks.setUserActive).toHaveBeenCalledWith('cashier-1', false);
    await user.click(screen.getByRole('button', { name: 'O‘chirish' }));
    expect(window.confirm).toHaveBeenCalled();
    expect(mocks.deleteUser).toHaveBeenCalledWith('cashier-1');
  });

  it('creates, searches and suspends a business', async () => {
    const user = userEvent.setup();
    mocks.authState = {
      user: { id: 'owner', name: 'Owner', email: 'owner@tesspos.test', role: 'superadmin', tenantId: null },
      tenant: null,
      login: mocks.login,
    };
    renderPage(<BusinessesPage />);

    await screen.findByText('City Shop');
    await user.type(screen.getByLabelText('Biznes nomi'), 'Demo Outlet');
    await user.selectOptions(screen.getByLabelText('Biznes turi'), 'Supermarket');
    await user.type(screen.getByLabelText('Admin ismi'), 'Store Admin');
    await user.type(screen.getByLabelText('Admin email'), 'store@example.test');
    await user.type(screen.getByLabelText('Admin paroli', { exact: false }), 'secret123');
    await user.click(screen.getByRole('button', { name: 'Biznes yaratish' }));
    await screen.findByText('\"Demo Outlet\" yaratildi, admin: store@example.test');
    expect(mocks.createTenant).toHaveBeenCalled();

    await user.type(screen.getByLabelText('Bizneslardan qidirish'), 'City Shop');
    await user.click(screen.getByRole('button', { name: 'To‘xtatish' }));
    expect(mocks.setTenantActive).toHaveBeenCalledWith('tenant-2', false);
  });
});
