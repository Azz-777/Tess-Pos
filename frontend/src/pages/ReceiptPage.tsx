import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { getOrder, simulatePayment } from '../api/orders';
import { Receipt } from '../types';

const STATUS_LABEL: Record<string, string> = {
  pending_payment: 'to‘lov kutilmoqda',
  paid: 'to‘langan',
  cancelled: 'bekor qilingan',
};

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
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? 'Chekni yuklab bo‘lmadi');
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
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? 'To‘lov amalga oshmadi');
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
  const placedAt = new Date(receipt.createdAt).toLocaleString();
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

      <div className="card receipt printable">
        <div className="receipt-brand">
          <div className="receipt-business">{tenant?.name ?? 'Tess POS'}</div>
          {tenant && <div className="muted small">{tenant.businessType}</div>}
        </div>

        <div className="receipt-meta">
          <div>
            <span className="muted small">Buyurtma</span>
            <div>#{orderNumber}</div>
          </div>
          <div>
            <span className="muted small">Sana</span>
            <div>{placedAt}</div>
          </div>
          <div>
            <span className="muted small">Holat</span>
            <div>
              <span className={`status status-${receipt.status}`}>{statusText}</span>
            </div>
          </div>
        </div>

        <table className="data-table receipt-table">
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Narx</th>
              <th>Soni</th>
              <th>Jami</th>
            </tr>
          </thead>
          <tbody>
            {receipt.items.map((item) => (
              <tr key={item.productId}>
                <td>{item.name}</td>
                <td>{item.unitPrice.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>{item.lineTotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="cart-total">
          <span>Umumiy jami</span>
          <span>{receipt.total.toFixed(2)}</span>
        </div>

        <div className="receipt-qr">
          <QRCodeSVG value={qrValue} size={132} level="M" />
          <div className="muted small">Chekni tekshirish uchun skanerlang</div>
          <div className="muted small">Buyurtma id: {receipt.id}</div>
        </div>

        <div className="receipt-footer muted small">Xaridingiz uchun rahmat</div>
      </div>

      {error && (
        <div className="card no-print">
          <div className="error">{error}</div>
        </div>
      )}
    </Layout>
  );
}
