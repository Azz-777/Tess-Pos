import { useEffect, useState, FormEvent } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { listManagedProducts, createProduct } from '../api/products';
import { listCategories } from '../api/categories';
import { ManagedProduct, Category } from '../types';

const NEW_CATEGORY = '__new__';

const EMPTY_FORM = {
  name: '',
  sku: '',
  category: '',
  newCategory: '',
  price: '',
  costPrice: '',
  stock: '',
};

export default function ProductsAdminPage() {
  const { tenant } = useAuth();
  const [products, setProducts] = useState<ManagedProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [items, cats] = await Promise.all([listManagedProducts(), listCategories()]);
      setProducts(items);
      setCategories(cats);
    } catch (err) {
      setError(readError(err, 'Mahsulotlarni yuklab bo‘lmadi'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function update(field: keyof typeof EMPTY_FORM, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const categoryName = form.category === NEW_CATEGORY ? form.newCategory : form.category;
      const created = await createProduct({
        name: form.name,
        sku: form.sku || undefined,
        price: Number(form.price),
        costPrice: Number(form.costPrice),
        stock: Number(form.stock),
        categoryName: categoryName || undefined,
      });
      setSuccess(`"${created.name}" qo‘shildi`);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(readError(err, 'Mahsulot qo‘shilmadi'));
    } finally {
      setSaving(false);
    }
  }

  const previewMargin =
    form.price !== '' && form.costPrice !== '' ? Number(form.price) - Number(form.costPrice) : null;

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Mahsulotlar</h1>
          {tenant && (
            <p className="muted">
              {tenant.name} · {tenant.businessType}
            </p>
          )}
        </div>
      </div>

      <div className="products-grid">
        <section className="card">
          <h2>Mahsulot qo‘shish</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <label>
              Mahsulot nomi
              <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
              <span className="field-hint">Mahsulot qanday nomlanadi, masalan "Cola 0.5L"</span>
            </label>

            <label>
              Mahsulot kodi (ixtiyoriy)
              <input value={form.sku} onChange={(e) => update('sku', e.target.value)} placeholder="masalan BM-COLA" />
              <span className="field-hint">Mahsulotni belgilash uchun o‘z kodingiz yoki shtrix-kod. Bilmasangiz bo‘sh qoldiring.</span>
            </label>

            <label>
              Turkum
              <select value={form.category} onChange={(e) => update('category', e.target.value)}>
                <option value="">Turkumsiz</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
                <option value={NEW_CATEGORY}>+ Yangi turkum qo‘shish</option>
              </select>
              <span className="field-hint">Mahsulotlarni guruhlaydi, masalan Ichimliklar, Shirinliklar.</span>
            </label>

            {form.category === NEW_CATEGORY && (
              <label>
                Yangi turkum nomi
                <input
                  value={form.newCategory}
                  onChange={(e) => update('newCategory', e.target.value)}
                  placeholder="masalan Muzlatilgan"
                  required
                />
              </label>
            )}

            <div className="form-row">
              <label>
                Sotuv narxi
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.price}
                  onChange={(e) => update('price', e.target.value)}
                  required
                />
                <span className="field-hint">Mijoz to‘laydigan narx.</span>
              </label>
              <label>
                Tannarx
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.costPrice}
                  onChange={(e) => update('costPrice', e.target.value)}
                  required
                />
                <span className="field-hint">Sizga tushadigan narx. Faqat admin ko‘radi.</span>
              </label>
            </div>

            <label>
              Qoldiq
              <input
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => update('stock', e.target.value)}
                required
              />
              <span className="field-hint">Hozir do‘konda nechta dona borligi.</span>
            </label>

            {previewMargin !== null && (
              <p className="muted small">Har dona foydasi: {previewMargin.toFixed(2)} (sotuv narxi − tannarx)</p>
            )}

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button className="btn-primary" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Mahsulot qo‘shish'}
            </button>
            <p className="muted small">Tannarx va foyda faqat admin uchun, hech qachon kassirga ko‘rinmaydi.</p>
          </form>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Katalog</h2>
            <button className="btn-ghost" onClick={load} disabled={loading}>
              Yangilash
            </button>
          </div>
          {loading ? (
            <Spinner label="Mahsulotlar yuklanmoqda..." />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Turkum</th>
                  <th>Sotuv</th>
                  <th>Tannarx</th>
                  <th>Foyda</th>
                  <th>Qoldiq</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>{product.name}</td>
                    <td>{product.categoryName ?? '-'}</td>
                    <td>{product.price.toFixed(2)}</td>
                    <td>{product.costPrice.toFixed(2)}</td>
                    <td>{product.margin.toFixed(2)}</td>
                    <td>{product.stock}</td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      Hali mahsulot yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </Layout>
  );
}

function readError(err: unknown, fallback: string): string {
  return (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? fallback;
}
