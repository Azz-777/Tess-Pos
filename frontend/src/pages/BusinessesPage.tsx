import { useEffect, useState, FormEvent } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { listTenants, createTenant, setTenantActive } from '../api/tenants';
import { getErrorMessage } from '../api/errorMessage';
import { TenantSummary } from '../types';

const BUSINESS_TYPES = ['Supermarket', 'Dorixona', 'Kafe', 'Restoran', 'Oziq-ovqat', 'Nonvoyxona', 'Elektronika', 'Chakana savdo'];
const OTHER_TYPE = '__other__';

const EMPTY_FORM = {
  name: '',
  businessType: '',
  otherType: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function BusinessesPage() {
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [workingTenantId, setWorkingTenantId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setTenants(await listTenants());
    } catch (err) {
      setError(getErrorMessage(err, 'Bizneslarni yuklab bo‘lmadi'));
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
      const businessType = form.businessType === OTHER_TYPE ? form.otherType : form.businessType;
      await createTenant({
        name: form.name,
        businessType,
        adminName: form.adminName,
        adminEmail: form.adminEmail,
        adminPassword: form.adminPassword,
      });
      setSuccess(`"${form.name}" yaratildi, admin: ${form.adminEmail}`);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Biznes yaratilmadi'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(tenant: TenantSummary) {
    setError('');
    setWorkingTenantId(tenant.id);
    try {
      await setTenantActive(tenant.id, !tenant.active);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Biznesni yangilab bo‘lmadi'));
    } finally {
      setWorkingTenantId(null);
    }
  }

  const query = search.trim().toLocaleLowerCase();
  const filteredTenants = tenants.filter((tenant) =>
    `${tenant.name} ${tenant.businessType}`.toLocaleLowerCase().includes(query)
  );

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Bizneslar</h1>
          <p className="muted">Har bir biznes — alohida tenant: o‘z xodimlari, katalogi va buyurtmalari bilan.</p>
        </div>
      </div>

      <div className="products-grid">
        <section className="card">
          <h2>Yangi biznes qo‘shish</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <label>
              Biznes nomi
              <input value={form.name} onChange={(e) => update('name', e.target.value)} required />
            </label>
            <label>
              Biznes turi
              <select value={form.businessType} onChange={(e) => update('businessType', e.target.value)} required>
                <option value="">Turini tanlang</option>
                {BUSINESS_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value={OTHER_TYPE}>Boshqa...</option>
              </select>
            </label>

            {form.businessType === OTHER_TYPE && (
              <label>
                Boshqa tur nomi
                <input
                  value={form.otherType}
                  onChange={(e) => update('otherType', e.target.value)}
                  placeholder="masalan Kiyim do‘koni"
                  required
                />
              </label>
            )}

            <label>
              Admin ismi
              <input value={form.adminName} onChange={(e) => update('adminName', e.target.value)} required />
            </label>
            <label>
              Admin email
              <input
                type="email"
                value={form.adminEmail}
                onChange={(e) => update('adminEmail', e.target.value)}
                required
              />
            </label>
            <label>
              Admin paroli
              <input
                type="password"
                value={form.adminPassword}
                onChange={(e) => update('adminPassword', e.target.value)}
                minLength={6}
                maxLength={72}
                required
              />
              <span className="field-hint">Kamida 6 ta belgi.</span>
            </label>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button className="btn-primary" disabled={saving}>
              {saving ? 'Yaratilmoqda...' : 'Biznes yaratish'}
            </button>
            <p className="muted small">Birinchi admin keyin o‘z biznesiga kassir va mahsulot qo‘sha oladi.</p>
          </form>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Barcha bizneslar</h2>
            <button className="btn-ghost" onClick={load} disabled={loading}>
              Yangilash
            </button>
          </div>
          <label className="catalog-search">
            Bizneslardan qidirish
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Biznes nomi yoki turi"
            />
          </label>
          {loading ? (
            <Spinner label="Bizneslar yuklanmoqda..." />
          ) : (
            <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Biznes</th>
                  <th>Turi</th>
                  <th>Xodimlar</th>
                  <th>Mahsulotlar</th>
                  <th>Holat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map((tenant) => (
                  <tr key={tenant.id}>
                    <td>{tenant.name}</td>
                    <td>{tenant.businessType}</td>
                    <td>{tenant.userCount}</td>
                    <td>{tenant.productCount}</td>
                    <td>
                      <span className={`status ${tenant.active ? 'status-paid' : 'status-cancelled'}`}>
                        {tenant.active ? 'faol' : 'to‘xtatilgan'}
                      </span>
                    </td>
                    <td className="row-actions">
                      <button className="btn-link" onClick={() => toggleActive(tenant)} disabled={workingTenantId === tenant.id}>
                        {tenant.active ? 'To‘xtatish' : 'Faollashtirish'}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredTenants.length === 0 && (
                  <tr>
                    <td colSpan={6} className="muted">
                      {tenants.length === 0 ? 'Hali biznes yo‘q' : 'Qidiruv bo‘yicha biznes topilmadi'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
