import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { getSalesReport } from '../api/reports';
import { SalesReport } from '../types';

export default function ReportPage() {
  const { tenant } = useAuth();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const data = await getSalesReport(from || undefined, to || undefined);
      setReport(data);
    } catch (err) {
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? 'Hisobotni yuklab bo‘lmadi');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const marginPercent =
    report && report.totalRevenue > 0 ? (report.totalMargin / report.totalRevenue) * 100 : 0;

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Sotuv hisoboti</h1>
          {tenant && (
            <p className="muted">
              {tenant.name} · {tenant.businessType}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <label>
            Boshlanish
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            Tugash
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <button className="btn-secondary" onClick={load} disabled={loading}>
            Qo‘llash
          </button>
          <button className="btn-ghost" onClick={load} disabled={loading}>
            Yangilash
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {loading && <Spinner label="Hisoblanmoqda..." />}

        {!loading && report && (
          <>
            <div className="stats">
              <div className="stat">
                <span className="muted">Tushum</span>
                <strong>{report.totalRevenue.toFixed(2)}</strong>
                <span className="muted small">To‘langan sotuvlar jami</span>
              </div>
              <div className="stat highlight">
                <span className="muted">Foyda (margin)</span>
                <strong>{report.totalMargin.toFixed(2)}</strong>
                <span className="muted small">narx − tannarx · tushumning {marginPercent.toFixed(1)}%</span>
              </div>
              <div className="stat">
                <span className="muted">Sotilgan dona</span>
                <strong>{report.itemsSold}</strong>
                <span className="muted small">Jami birliklar</span>
              </div>
              <div className="stat">
                <span className="muted">Buyurtmalar</span>
                <strong>{report.orderCount}</strong>
                <span className="muted small">To‘langan buyurtmalar</span>
              </div>
            </div>

            <p className="muted small note">
              Foyda (margin) — bu biznesga qoladigan daromad (sotuv narxidan tannarx ayirilgan). Bu raqam
              faqat admin uchun va hech qachon kassirga ko‘rsatilmaydi.
            </p>

            <h3>Eng ko‘p sotilganlar</h3>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Sotilgan soni</th>
                  <th>Tushum</th>
                </tr>
              </thead>
              <tbody>
                {report.topProducts.map((product) => (
                  <tr key={product.productId}>
                    <td>{product.name}</td>
                    <td>{product.quantity}</td>
                    <td>{product.revenue.toFixed(2)}</td>
                  </tr>
                ))}
                {report.topProducts.length === 0 && (
                  <tr>
                    <td colSpan={3} className="muted">
                      Bu davrda to‘langan sotuv yo‘q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <p className="muted small">{report.cached ? 'Keshdan olindi' : 'Yangidan hisoblandi'}</p>
          </>
        )}
      </div>
    </Layout>
  );
}
