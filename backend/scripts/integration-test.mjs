import assert from 'node:assert/strict';

const baseUrl = process.env.API_BASE_URL ?? 'http://localhost:4000';
const runId = `${Date.now()}-${process.pid}`;
const results = [];

async function request(path, { method = 'GET', token, body, expectedStatus = 200 } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(new URL(path, baseUrl), {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const contentType = response.headers.get('content-type') ?? '';
  const data = contentType.includes('application/json') ? await response.json() : await response.text();

  assert.equal(
    response.status,
    expectedStatus,
    `${method} ${path}: expected HTTP ${expectedStatus}, received ${response.status}: ${JSON.stringify(data)}`
  );
  return data;
}

async function check(name, run) {
  await run();
  results.push(name);
  console.log(`PASS ${name}`);
}

async function login(email) {
  return request('/api/auth/login', {
    method: 'POST',
    body: { email, password: 'password123' },
  });
}

const admin = await login('admin@brightmart.test');
const cashier = await login('cashier@brightmart.test');
const owner = await login('owner@tesspos.test');

await check('admin, cashier, and platform-owner login', async () => {
  assert.equal(admin.user.role, 'admin');
  assert.equal(cashier.user.role, 'cashier');
  assert.equal(owner.user.role, 'superadmin');
  assert.ok(admin.token && cashier.token && owner.token);
});

await check('cashier catalog search and category list', async () => {
  const products = await request('/api/products?search=Chocolate&page=1&limit=10', { token: cashier.token });
  assert.ok(Array.isArray(products.items));
  assert.ok(products.total >= 0);
  const categories = await request('/api/categories', { token: cashier.token });
  assert.ok(Array.isArray(categories.items));
});

await check('admin product catalog and cashier cost-price restriction', async () => {
  const created = await request('/api/products', {
    method: 'POST',
    token: admin.token,
    expectedStatus: 201,
    body: {
      name: `CI Test Product ${runId}`,
      sku: `CI-${runId}`,
      price: 10,
      costPrice: 5,
      stock: 3,
      categoryName: `CI Test Category ${runId}`,
    },
  });
  assert.ok(created.id);
  const managed = await request('/api/products/manage', { token: admin.token });
  assert.ok(managed.items.some((item) => item._id === created.id && 'costPrice' in item));
  const categories = await request('/api/categories', { token: admin.token });
  assert.ok(categories.items.some((category) => category.name === `CI Test Category ${runId}`));
  await request('/api/products/manage', { token: cashier.token, expectedStatus: 403 });
});

await check('sales report and cashier access restriction', async () => {
  const report = await request('/api/reports/sales', { token: admin.token });
  assert.equal(typeof report.totalRevenue, 'number');
  assert.equal(typeof report.orderCount, 'number');
  await request('/api/reports/sales', { token: cashier.token, expectedStatus: 403 });
});

await check('tenant staff listing and user create, deactivate, and delete', async () => {
  const listed = await request('/api/users', { token: admin.token });
  assert.ok(Array.isArray(listed.items));
  const created = await request('/api/users', {
    method: 'POST',
    token: admin.token,
    expectedStatus: 201,
    body: {
      name: 'CI Test Cashier',
      email: `ci-cashier-${runId}@tesspos.test`,
      password: 'ci-test-password',
      role: 'cashier',
    },
  });
  assert.ok(created.id);
  await request(`/api/users/${created.id}`, {
    method: 'PATCH',
    token: admin.token,
    body: { active: false },
  });
  await request(`/api/users/${created.id}`, { method: 'DELETE', token: admin.token });
});

await check('platform business listing, creation, and suspension', async () => {
  const listed = await request('/api/tenants', { token: owner.token });
  assert.ok(Array.isArray(listed.items));
  const created = await request('/api/tenants', {
    method: 'POST',
    token: owner.token,
    expectedStatus: 201,
    body: {
      name: `CI Test Store ${runId}`,
      businessType: 'Supermarket',
      adminName: 'CI Test Admin',
      adminEmail: `ci-admin-${runId}@tesspos.test`,
      adminPassword: 'ci-test-password',
    },
  });
  assert.ok(created.id);
  await request(`/api/tenants/${created.id}`, {
    method: 'PATCH',
    token: owner.token,
    body: { active: false },
  });
  await request('/api/tenants', { token: admin.token, expectedStatus: 403 });
});

await check('order placement, receipt lookup, and payment confirmation', async () => {
  const catalog = await request('/api/products?limit=50', { token: cashier.token });
  const available = catalog.items.find((product) => product.stock > 0);
  assert.ok(available, 'Expected seeded catalog to contain an in-stock product');
  const order = await request('/api/orders', {
    method: 'POST',
    token: cashier.token,
    expectedStatus: 201,
    body: { items: [{ productId: available._id, quantity: 1 }] },
  });
  assert.ok(order.id);
  assert.equal(order.status, 'pending_payment');
  const receipt = await request(`/api/orders/${order.id}`, { token: cashier.token });
  assert.equal(receipt.id, order.id);
  await request(`/api/dev/simulate-payment/${order.id}`, {
    method: 'POST',
    token: cashier.token,
    body: {},
  });
  const paidReceipt = await request(`/api/orders/${order.id}`, { token: cashier.token });
  assert.equal(paidReceipt.status, 'paid');
});

console.log(`Completed ${results.length} API integration checks.`);
