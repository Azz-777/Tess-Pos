import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleHome } from '../auth/roleHome';

const DEMO_PASSWORD = 'password123';

const OWNER_EMAIL = 'owner@tesspos.test';

const DEMO_TENANTS = [
  {
    name: 'Bright Mart',
    type: 'Supermarket',
    admin: 'admin@brightmart.test',
    cashier: 'cashier@brightmart.test',
  },
  {
    name: 'City Pharmacy',
    type: 'Dorixona',
    admin: 'admin@citypharma.test',
    cashier: 'cashier@citypharma.test',
  },
  {
    name: 'Aroma Cafe',
    type: 'Kafe',
    admin: 'admin@aromacafe.test',
    cashier: 'cashier@aromacafe.test',
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('cashier@brightmart.test');
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(loginEmail: string, loginPassword: string) {
    setError('');
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      navigate(roleHome(user.role));
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? 'Kirishda xatolik');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    submit(email, password);
  }

  function fill(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={handleSubmit}>
        <h1>Tess POS</h1>
        <p className="muted">Davom etish uchun tizimga kiring</p>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </label>
        <label>
          Parol
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </label>

        {error && <div className="error">{error}</div>}

        <button className="btn-primary" disabled={loading}>
          {loading ? 'Kirilmoqda...' : 'Kirish'}
        </button>

        <div className="demo-block">
          <div className="demo-title">Tez kirish (demo akkauntlar)</div>
          <p className="muted small">Rolni bosing — forma to'ladi. Ikki marta bossangiz to'g'ridan-to'g'ri kiradi.</p>
          <div className="demo-list">
            {DEMO_TENANTS.map((tenant) => (
              <div className="demo-row" key={tenant.name}>
                <div className="demo-tenant">
                  <span className="demo-name">{tenant.name}</span>
                  <span className="demo-type">{tenant.type}</span>
                </div>
                <div className="demo-buttons">
                  <button
                    type="button"
                    className={`chip ${email === tenant.admin ? 'chip-active' : ''}`}
                    onClick={() => fill(tenant.admin)}
                    onDoubleClick={() => submit(tenant.admin, DEMO_PASSWORD)}
                    disabled={loading}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    className={`chip ${email === tenant.cashier ? 'chip-active' : ''}`}
                    onClick={() => fill(tenant.cashier)}
                    onDoubleClick={() => submit(tenant.cashier, DEMO_PASSWORD)}
                    disabled={loading}
                  >
                    Kassir
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="demo-row owner-row">
            <div className="demo-tenant">
              <span className="demo-name">Platforma egasi</span>
              <span className="demo-type">Barcha bizneslarni boshqaradi</span>
            </div>
            <div className="demo-buttons">
              <button
                type="button"
                className={`chip ${email === OWNER_EMAIL ? 'chip-active' : ''}`}
                onClick={() => fill(OWNER_EMAIL)}
                onDoubleClick={() => submit(OWNER_EMAIL, DEMO_PASSWORD)}
                disabled={loading}
              >
                Super admin
              </button>
            </div>
          </div>
          <p className="muted small">Barcha demo akkauntlar paroli: {DEMO_PASSWORD}</p>
        </div>
      </form>
    </div>
  );
}
