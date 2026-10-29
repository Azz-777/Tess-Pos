import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { getOrder, simulatePayment } from '../api/orders';
import { getErrorMessage } from '../api/errorMessage';
import { Receipt } from '../types';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'to‘lov kutilmoqda',
  paid: 'to‘langan',
  cancelled: 'bekor qilingan',
};

const money = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 2 });

export default function ReceiptPage() {
  const { id } = useParams<{ id: string }>();
  const { tenant } = useAuth();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paying, setPaying] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getOrder(id);
      setReceipt(data);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, 'Chekni yuklab bo‘lmadi'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function pay() {
    if (!id) return;
    setPaying(true);
    setError('');
    try {
      await simulatePayment(id);
      await load();
    } catch (err) {
      setError(getErrorMessage(err, 'To‘lov amalga oshmadi'));
    } finally {
      setPaying(false);
    }
  }

  if (loading && !receipt) {
    return (
      <Layout>
        <div className="card">
          <Spinner label="Chek yuklanmoqda..." />
        </div>
      </Layout>
    );
  }

  if (!receipt) {
    return (
      <Layout>
        <div className="card">
          <div className="error">{error || 'Chek topilmadi'}</div>
          <Link className="btn-link block" to="/pos">
            Kassaga qaytish
          </Link>
        </div>
      </Layout>
    );
  }

  const orderNumber = receipt.id.slice(-6).toUpperCase();
  const placedAt = new Date(receipt.createdAt).toLocaleString('uz-UZ');
  const statusText = STATUS_LABEL[receipt.status] ?? receipt.status;
  const qrValue = JSON.stringify({
    orderId: receipt.id,
    business: tenant?.name ?? '',
    total: receipt.total,
    status: receipt.status,
    placedAt: receipt.createdAt,
  });

  return (
    <Layout>
      <div className="receipt-actions no-print">
        {receipt.status === 'pending_payment' && (
          <button className="btn-primary inline" disabled={paying} onClick={pay}>
            {paying ? 'To‘lov amalga oshmoqda...' : 'To‘lovni tasdiqlash (demo)'}
          </button>
        )}
        <button className="btn-secondary" onClick={() => window.print()} disabled={receipt.status !== 'paid'}>
          Chekni chop etish
        </button>
        <button className="btn-ghost" onClick={load} disabled={loading}>
          Yangilash
        </button>
        <Link className="btn-ghost" to="/pos">
          Kassaga qaytish
        </Link>
      </div>

      <article className="receipt printable" aria-label="Sotuv cheki">
        <div className="receipt-brand">
          <div className="receipt-business">{tenant?.name ?? 'Tess POS'}</div>
          {tenant && <div className="muted small">{tenant.businessType}</div>}
        </div>

        <h1 className="receipt-title">SOTUV CHEKI</h1>

        <div className="receipt-meta">
          <div>
            <span>Chek raqami</span>
            <strong>#{orderNumber}</strong>
          </div>
          <div>
            <span>Sana</span>
            <strong>{placedAt}</strong>
          </div>
          <div>
            <span>To‘lov holati</span>
            <strong className={`receipt-status status-${receipt.status}`}>{statusText}</strong>
          </div>
        </div>

        <table className="receipt-table">
          <thead>
            <tr>
              <th>Tovar</th>
              <th className="receipt-amount">Summa</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => (
              <tr key={item.productId}>
                <td>
                  <strong className="receipt-item-name">{item.name}</strong>
                  <span className="receipt-item-detail">
                    {money.format(item.unitPrice)} × {item.quantity} dona
                  </span>
                </td>
                <td className="receipt-amount">{money.format(item.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-total">
          <strong>JAMI</strong>
          <strong>{money.format(receipt.total)} so‘m</strong>
        </div>

        <div className="receipt-qr">
          <QRCodeSVG value={qrValue} size={104} level="M" />
          <div>Chekni tekshirish uchun skanerlang</div>
          <small>Buyurtma ID: {receipt.id}</small>
        </div>

        <footer className="receipt-footer">
          <strong>Xaridingiz uchun rahmat!</strong>
          <span>Tess POS</span>
        </footer>
      </article>

      {error && (
        <div className="card no-print">
          <div className="error">{error}</div>
        </div>
      )}
    </Layout>
  );
}
