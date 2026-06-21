import { TenantModel } from './models/tenant.model';
import { UserModel } from './models/user.model';
import { CategoryModel } from './models/category.model';
import { ProductModel } from './models/product.model';
import { hashPassword } from './utils/password';

export async function seedIfEmpty() {
  const userCount = await UserModel.countDocuments();
  if (userCount > 0) {
    console.log('Seed skipped, data already present');
    return;
  }

  console.log('Seeding demo data');

  const brightMart = await TenantModel.create({ name: 'Bright Mart', businessType: 'Supermarket' });
  const cityPharmacy = await TenantModel.create({ name: 'City Pharmacy', businessType: 'Dorixona' });
  const aromaCafe = await TenantModel.create({ name: 'Aroma Cafe', businessType: 'Kafe' });

  const passwordHash = await hashPassword('password123');

  await UserModel.create({ name: 'Platform Owner', email: 'owner@tesspos.test', passwordHash, role: 'superadmin' });

  await UserModel.create([
    { tenantId: brightMart._id, name: 'Alice Admin', email: 'admin@brightmart.test', passwordHash, role: 'admin' },
    { tenantId: brightMart._id, name: 'Carl Cashier', email: 'cashier@brightmart.test', passwordHash, role: 'cashier' },
    { tenantId: cityPharmacy._id, name: 'Bob Admin', email: 'admin@citypharma.test', passwordHash, role: 'admin' },
    { tenantId: cityPharmacy._id, name: 'Dana Cashier', email: 'cashier@citypharma.test', passwordHash, role: 'cashier' },
    { tenantId: aromaCafe._id, name: 'Emma Admin', email: 'admin@aromacafe.test', passwordHash, role: 'admin' },
    { tenantId: aromaCafe._id, name: 'Finn Cashier', email: 'cashier@aromacafe.test', passwordHash, role: 'cashier' },
  ]);

  const beverages = await CategoryModel.create({ tenantId: brightMart._id, name: 'Beverages' });
  const snacks = await CategoryModel.create({ tenantId: brightMart._id, name: 'Snacks' });
  const household = await CategoryModel.create({ tenantId: brightMart._id, name: 'Household' });
  const medicine = await CategoryModel.create({ tenantId: cityPharmacy._id, name: 'Medicine' });
  const care = await CategoryModel.create({ tenantId: cityPharmacy._id, name: 'Personal Care' });
  const coffee = await CategoryModel.create({ tenantId: aromaCafe._id, name: 'Coffee' });
  const bakery = await CategoryModel.create({ tenantId: aromaCafe._id, name: 'Bakery' });

  await ProductModel.create([
    { tenantId: brightMart._id, name: 'Cola 0.5L', sku: 'BM-COLA', price: 1.5, costPrice: 0.9, stock: 100, categoryId: beverages._id },
    { tenantId: brightMart._id, name: 'Orange Juice 1L', sku: 'BM-OJ', price: 2.2, costPrice: 1.3, stock: 60, categoryId: beverages._id },
    { tenantId: brightMart._id, name: 'Mineral Water 1L', sku: 'BM-WATER', price: 0.8, costPrice: 0.35, stock: 200, categoryId: beverages._id },
    { tenantId: brightMart._id, name: 'Potato Chips', sku: 'BM-CHIP', price: 1.2, costPrice: 0.6, stock: 5, categoryId: snacks._id },
    { tenantId: brightMart._id, name: 'Chocolate Bar', sku: 'BM-CHOC', price: 1.0, costPrice: 0.45, stock: 1, categoryId: snacks._id },
    { tenantId: brightMart._id, name: 'Salted Peanuts', sku: 'BM-PEAN', price: 1.8, costPrice: 0.95, stock: 40, categoryId: snacks._id },
    { tenantId: brightMart._id, name: 'Dish Soap 500ml', sku: 'BM-SOAP', price: 2.5, costPrice: 1.4, stock: 30, categoryId: household._id },

    { tenantId: cityPharmacy._id, name: 'Paracetamol 500mg', sku: 'CP-PARA', price: 3.0, costPrice: 1.1, stock: 200, categoryId: medicine._id },
    { tenantId: cityPharmacy._id, name: 'Ibuprofen 400mg', sku: 'CP-IBU', price: 4.2, costPrice: 1.6, stock: 120, categoryId: medicine._id },
    { tenantId: cityPharmacy._id, name: 'Vitamin C 1000mg', sku: 'CP-VITC', price: 6.5, costPrice: 2.8, stock: 80, categoryId: medicine._id },
    { tenantId: cityPharmacy._id, name: 'Hand Sanitizer 250ml', sku: 'CP-SAN', price: 3.5, costPrice: 1.5, stock: 90, categoryId: care._id },

    { tenantId: aromaCafe._id, name: 'Espresso', sku: 'AC-ESP', price: 2.0, costPrice: 0.5, stock: 999, categoryId: coffee._id },
    { tenantId: aromaCafe._id, name: 'Cappuccino', sku: 'AC-CAP', price: 3.2, costPrice: 0.8, stock: 999, categoryId: coffee._id },
    { tenantId: aromaCafe._id, name: 'Latte', sku: 'AC-LAT', price: 3.5, costPrice: 0.9, stock: 999, categoryId: coffee._id },
    { tenantId: aromaCafe._id, name: 'Croissant', sku: 'AC-CRO', price: 2.4, costPrice: 0.7, stock: 24, categoryId: bakery._id },
    { tenantId: aromaCafe._id, name: 'Blueberry Muffin', sku: 'AC-MUF', price: 2.8, costPrice: 0.85, stock: 18, categoryId: bakery._id },
  ]);

  console.log('Seed complete');
}

async function runStandalone() {
  const { connectDatabase } = await import('./config/db');
  const mongoose = (await import('mongoose')).default;
  await connectDatabase();
  await seedIfEmpty();
  await mongoose.disconnect();
  process.exit(0);
}

if (require.main === module) {
  runStandalone().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
