import { useEffect, useState, FormEvent } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { listUsers, createUser, setUserActive, deleteUser } from '../api/users';
import { getErrorMessage } from '../api/errorMessage';
import { ManagedUser } from '../types';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'cashier' as 'admin' | 'cashier' };

const ROLE_LABEL: Record<string, string> = { superadmin: 'Super admin', admin: 'Admin', cashier: 'Kassir' };

export default function UsersPage() {
  const { user, tenant } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [workingUserId, setWorkingUserId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      setUsers(await listUsers());
    } catch (err) {
      setError(getErrorMessage(err, 'Xodimlarni yuklab bo‘lmadi'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const created = await createUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      });
      setSuccess(`${ROLE_LABEL[created.role] ?? created.role} "${created.name}" qo‘shildi`);
      setForm(EMPTY_FORM);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Xodim qo‘shilmadi'));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(target: ManagedUser) {
    setError('');
    setWorkingUserId(target.id);
    try {
      await setUserActive(target.id, !target.active);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Xodimni yangilab bo‘lmadi'));
    } finally {
      setWorkingUserId(null);
    }
  }

  async function remove(target: ManagedUser) {
    if (!window.confirm(`"${target.name}" xodimini o‘chirishni tasdiqlaysizmi?`)) return;
    setError('');
    setWorkingUserId(target.id);
    try {
      await deleteUser(target.id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'Xodimni o‘chirib bo‘lmadi'));
    } finally {
      setWorkingUserId(null);
    }
  }

  const query = search.trim().toLocaleLowerCase();
  const filteredUsers = users.filter((member) =>
    `${member.name} ${member.email} ${ROLE_LABEL[member.role] ?? member.role}`.toLocaleLowerCase().includes(query)
  );

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Xodimlar</h1>
          {tenant && (
            <p className="muted">
              {tenant.name} · {tenant.businessType}
            </p>
          )}
        </div>
      </div>

      <div className="products-grid">
        <section className="card">
          <h2>Xodim qo‘shish</h2>
          <form onSubmit={handleSubmit} className="product-form">
            <label>
              Ism
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Email
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
              <span className="field-hint">Xodim shu email bilan tizimga kiradi.</span>
            </label>
            <label>
              Parol
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                minLength={6}
                maxLength={72}
                required
              />
              <span className="field-hint">Kamida 6 ta belgi.</span>
            </label>
            <label>
              Rol
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'cashier' })}>
                <option value="cashier">Kassir — sotadi</option>
                <option value="admin">Admin — boshqaradi</option>
              </select>
              <span className="field-hint">Kassir tannarx/foydani ko‘ra olmaydi.</span>
            </label>

            {error && <div className="error">{error}</div>}
            {success && <div className="success">{success}</div>}

            <button className="btn-primary" disabled={saving}>
              {saving ? 'Saqlanmoqda...' : 'Xodim qo‘shish'}
            </button>
            <p className="muted small">Yangi xodim faqat shu biznesga tegishli bo‘ladi.</p>
          </form>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Jamoa</h2>
            <button className="btn-ghost" onClick={load} disabled={loading}>
              Yangilash
            </button>
          </div>
          <label className="catalog-search">
            Jamoa ichidan qidirish
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ism, email yoki rol"
            />
          </label>
          {loading ? (
            <Spinner label="Xodimlar yuklanmoqda..." />
          ) : (
            <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ism</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Holat</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.name}</td>
                    <td>{member.email}</td>
                    <td>{ROLE_LABEL[member.role] ?? member.role}</td>
                    <td>
                      <span className={`status ${member.active ? 'status-paid' : 'status-cancelled'}`}>
                        {member.active ? 'faol' : 'bloklangan'}
                      </span>
                    </td>
                    <td className="row-actions">
                      {member.id === user?.id ? (
                        <span className="muted small">Siz</span>
                      ) : (
                        <>
                          <button className="btn-link" onClick={() => toggleActive(member)} disabled={workingUserId === member.id}>
                            {member.active ? 'Bloklash' : 'Faollashtirish'}
                          </button>
                          <button className="btn-link danger" onClick={() => remove(member)} disabled={workingUserId === member.id}>
                            O‘chirish
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
}
