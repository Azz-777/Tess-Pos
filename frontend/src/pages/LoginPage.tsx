import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleHome } from '../auth/roleHome';
import { getErrorMessage } from '../api/errorMessage';
import { resetPasswordRequest } from '../api/auth';

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
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const canResetPassword = import.meta.env.VITE_ENABLE_DEV_ROUTES === 'true';

  async function submit(loginEmail: string, loginPassword: string) {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const user = await login(loginEmail, loginPassword);
      navigate(roleHome(user.role));
    } catch (err) {
      setError(getErrorMessage(err, 'Kirishda xatolik'));
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!resetMode) {
      void submit(email, password);
      return;
    }

    setError('');
    setSuccess('');
    if (newPassword !== confirmPassword) {
      setError('Yangi parollar mos kelmadi');
      return;
    }

    setLoading(true);
    resetPasswordRequest(email, newPassword)
      .then(({ message }) => {
        setPassword(newPassword);
        setNewPassword('');
        setConfirmPassword('');
        setResetMode(false);
        setSuccess(`${message} Yangi parol bilan tizimga kiring.`);
      })
      .catch((err: unknown) => setError(getErrorMessage(err, 'Parolni tiklab bo‘lmadi')))
      .finally(() => setLoading(false));
  }

  function fill(accountEmail: string) {
    setEmail(accountEmail);
    setPassword(DEMO_PASSWORD);
    setError('');
    setSuccess('');
  }

  return (
    <div className="login-wrap">
      <section className="login-visual">
        <div className="login-visual-top">
          <span className="brand-mark">T</span>
          <span>Tess<span className="brand-light">POS</span></span>
        </div>
        <div className="login-visual-copy">
          <span className="eyebrow">SAVDO BOSHQARUVI, SODDA</span>
          <h1>Biznesingiz uchun<br /><span>yangi imkoniyat.</span></h1>
          <p>Sotuv, mahsulotlar va jamoangiz — barchasi bitta qulay tizimda.</p>
          <div className="login-benefits">
            <div><span className="benefit-icon">01</span><span><strong>Tezkor kassa</strong><small>Savdoni bir necha bosishda yakunlang</small></span></div>
            <div><span className="benefit-icon">02</span><span><strong>Aniq hisobotlar</strong><small>Biznes natijalarini real vaqtda kuzating</small></span></div>
            <div><span className="benefit-icon">03</span><span><strong>Ishonchli boshqaruv</strong><small>Jamoa va mahsulotlarni bir joyda boshqaring</small></span></div>
          </div>
        </div>
        <p className="login-visual-footer">Tess POS <span>·</span> Savdongiz doimo nazoratda</p>
      </section>

      <div className="login-panel">
        <form className="card login-card" onSubmit={handleSubmit}>
          <div className="login-heading">
            <span className="eyebrow">XUSH KELIBSIZ</span>
            <h2>{resetMode ? 'Parolni yangilash' : 'Hisobingizga kiring'}</h2>
            <p className="muted">{resetMode ? 'Hisobingiz uchun yangi parol yarating.' : 'Davom etish uchun ma’lumotlaringizni kiriting.'}</p>
          </div>

        <label>
          Email
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" autoComplete="username" required />
        </label>
        {resetMode ? (
          <>
            <label>
              Yangi parol
              <input
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                type="password"
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </label>
            <label>
              Yangi parolni tasdiqlang
              <input
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                type="password"
                minLength={6}
                maxLength={72}
                autoComplete="new-password"
                required
              />
            </label>
            <p className="muted small">
              Bu tiklash faqat lokal/demo muhit uchun. Ishlab chiqarish tizimida email orqali tasdiqlash talab qilinadi.
            </p>
          </>
        ) : (
          <label>
            Parol
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
        )}

        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? (resetMode ? 'Yangilanmoqda...' : 'Kirilmoqda...') : resetMode ? 'Parolni tiklash' : 'Kirish'}
        </button>

        {canResetPassword && (
          <button
            type="button"
            className="btn-link block"
            disabled={loading}
            onClick={() => {
              setResetMode((current) => !current);
              setError('');
              setSuccess('');
            }}
          >
            {resetMode ? 'Kirishga qaytish' : 'Parolni unutdingizmi?'}
          </button>
        )}

        {!resetMode && <div className="demo-block">
          <div className="demo-title">Demo hisoblar</div>
          <p className="muted small">Hisob turini tanlang — email avtomatik to‘ldiriladi.</p>
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
                    disabled={loading}
                  >
                    Admin
                  </button>
                  <button
                    type="button"
                    className={`chip ${email === tenant.cashier ? 'chip-active' : ''}`}
                    onClick={() => fill(tenant.cashier)}
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
                disabled={loading}
              >
                Super admin
              </button>
            </div>
          </div>
          <p className="muted small">Barcha demo akkauntlar paroli: {DEMO_PASSWORD}</p>
        </div>}
        </form>
        <p className="login-panel-footer">Himoyalangan kirish <span aria-hidden="true">·</span> Tess POS</p>
      </div>
    </div>
  );
}
