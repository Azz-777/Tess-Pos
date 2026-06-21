# Tess POS

A multi-tenant point-of-sale checkout. One backend serves many businesses (tenants).
A cashier logs in, searches the catalog, builds a cart, places an order, a payment
provider confirms it, and the cashier sees a receipt. An admin sees a sales report
with profit margin — a number the cashier can never reach.

Stack: Node.js + Express + Mongoose (TypeScript), MongoDB, React + TypeScript, Docker.

> The end-user UI is in Uzbek; the code, `DECISIONS.md` and this README are in English.

## Roles

| Role         | Scope            | Can do                                                        |
| ------------ | ---------------- | ------------------------------------------------------------- |
| `superadmin` | the whole platform | create / suspend businesses (tenants) and their first admin |
| `admin`      | one business     | manage products, manage users (cashiers/admins), see margin   |
| `cashier`    | one business     | search catalog, place orders, see receipts — never sees cost  |

`superadmin` is the only role that crosses the tenant boundary, and only to manage
businesses; it cannot read a tenant's sales data. Tenant isolation holds everywhere else.

## Run with Docker

```
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:4000
- MongoDB runs as a single-node replica set (required for transactions) and the
  backend waits for it to be healthy. Demo data is seeded automatically on first start.

## Demo accounts (password: `password123`)

| Tenant        | Type        | Role       | Email                     |
| ------------- | ----------- | ---------- | ------------------------- |
| (platform)    | —           | superadmin | owner@tesspos.test        |
| Bright Mart   | Supermarket | cashier    | cashier@brightmart.test   |
| Bright Mart   | Supermarket | admin      | admin@brightmart.test     |
| City Pharmacy | Pharmacy    | cashier    | cashier@citypharma.test   |
| City Pharmacy | Pharmacy    | admin      | admin@citypharma.test     |
| Aroma Cafe    | Cafe        | cashier    | cashier@aromacafe.test    |
| Aroma Cafe    | Cafe        | admin      | admin@aromacafe.test      |

Each tenant is a separate business with its own catalog, users and orders. `Chocolate Bar`
(Bright Mart) is seeded with stock = 1 to demonstrate the no-oversell path. The receipt shows
a QR code (encoding order id, business, total and status) and a print button.

## The flow

1. Log in as a cashier → redirected to the POS screen.
2. Search the catalog, add items to the cart, adjust quantities.
3. Place the order → the server re-reads prices and stock, creates the order at
   server-side prices in a transaction, and returns a `pending_payment` receipt.
4. On the receipt, click **Simulate payment provider** (dev-only helper) to move the
   order to `paid`. In production this is done by the signed webhook below.
5. Log in as the admin of the same tenant → sales report with revenue, top products
   and total margin.

## API

| Method | Path                                | Access            |
| ------ | ----------------------------------- | ----------------- |
| POST   | `/api/auth/login`                   | public            |
| GET    | `/api/products?search=&page=&limit=`| cashier, admin    |
| POST   | `/api/orders`                       | cashier, admin    |
| GET    | `/api/orders/:id`                   | cashier, admin    |
| GET    | `/api/orders`                       | cashier, admin    |
| POST   | `/api/webhooks/payment`             | HMAC-signed       |
| GET    | `/api/products/manage`              | admin only        |
| POST   | `/api/products`                     | admin only        |
| GET    | `/api/categories`                   | cashier, admin    |
| GET    | `/api/reports/sales?from=&to=`      | admin only        |
| GET/POST/PATCH/DELETE | `/api/users`         | admin only        |
| GET/POST/PATCH | `/api/tenants`              | superadmin only   |
| POST   | `/api/dev/simulate-payment/:orderId`| dev-only          |

## Real payment webhook

The webhook verifies an `x-signature` header (HMAC-SHA256 of the raw body using
`PAYMENT_WEBHOOK_SECRET`) and is idempotent on `eventId`. A helper script signs and
sends a real webhook:

```
cd backend
npm install
npm run send-webhook -- <orderId> <tenantId> evt-123
```

Run it twice with the same `eventId` to see idempotency (`status: "duplicate"`).

## Proving the margin boundary

Log in as a cashier, then hit the raw API with the token:

```
curl http://localhost:4000/api/products -H "Authorization: Bearer <cashier-token>"
curl http://localhost:4000/api/orders/<id> -H "Authorization: Bearer <cashier-token>"
curl http://localhost:4000/api/reports/sales -H "Authorization: Bearer <cashier-token>"
```

The first two never contain `costPrice` or `margin`. The third returns 403.

## Local development (without Docker)

You need a MongoDB running as a replica set. Then:

```
cd backend && cp .env.example .env && npm install && npm run dev
cd frontend && npm install && npm run dev
```

See `DECISIONS.md` for the design rationale behind each stage.
