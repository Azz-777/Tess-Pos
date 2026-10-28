import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { searchProducts } from '../api/products';
import { placeOrder } from '../api/orders';
import { getErrorMessage } from '../api/errorMessage';
import { Product, CartLine } from '../types';

export default function PosPage() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);
  const requestId = useRef(0);

  const loadProducts = useCallback(async (term: string, requestedPage: number) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setLoadError('');
    try {
      const data = await searchProducts(term, requestedPage, 20);
      if (currentRequest === requestId.current) {
        setProducts(data.items);
        setTotalPages(data.totalPages);
      }
    } catch (err) {
      if (currentRequest === requestId.current) {
        setLoadError(getErrorMessage(err, 'Mahsulotlarni yuklab bo‘lmadi'));
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => loadProducts(search, page), 300);
    return () => clearTimeout(handle);
  }, [search, page, loadProducts]);

  function addToCart(product: Product) {
    setError('');
    const existing = cart.find((line) => line.productId === product._id);
    if (existing && existing.quantity >= product.stock) {
      setError(`${product.name} uchun mavjud qoldiqdan ortiq qo‘shib bo‘lmaydi`);
      return;
    }
    setCart((prev) => {
      const current = prev.find((line) => line.productId === product._id);
      if (current) {
        return prev.map((line) =>
          line.productId === product._id ? { ...line, quantity: line.quantity + 1 } : line
        );
      }
      return [
        ...prev,
        { productId: product._id, name: product.name, price: product.price, quantity: 1, stock: product.stock },
      ];
    });
  }

  function setQuantity(productId: string, quantity: number) {
    setCart((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.min(line.stock, Math.max(1, quantity)) }
          : line
      )
    );
  }

  function removeLine(productId: string) {
    setCart((prev) => prev.filter((line) => line.productId !== productId));
  }

  const total = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const itemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  async function checkout() {
    setError('');
    setPlacing(true);
    try {
      const receipt = await placeOrder(
        cart.map((line) => ({ productId: line.productId, quantity: line.quantity }))
      );
      setCart([]);
      navigate(`/receipt/${receipt.id}`);
    } catch (err) {
      setError(getErrorMessage(err, 'Buyurtmani yuborib bo‘lmadi'));
    } finally {
      setPlacing(false);
    }
  }

  return (
    <Layout>
      <div className="page-head">
        <div>
          <h1>Yangi sotuv</h1>
          {tenant && (
            <p className="muted">
              {tenant.name} · {tenant.businessType}
            </p>
          )}
        </div>
      </div>

      <div className="pos-grid">
        <section className="card">
          <div className="card-head">
            <h2>Mahsulotlar</h2>
            <button className="btn-ghost" onClick={() => loadProducts(search, page)} disabled={loading}>
              Yangilash
            </button>
          </div>
          <input
            className="search"
            placeholder="Mahsulot nomi bo‘yicha qidirish"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          {loadError && <div className="error">{loadError}</div>}
          {loading && !loadError ? (
            <Spinner label="Mahsulotlar yuklanmoqda..." />
          ) : !loadError && (
            <ul className="product-list">
              {products.map((product) => {
                const inCart = cart.find((line) => line.productId === product._id);
                return (
                  <li key={product._id}>
                    <div>
                      <div className="product-name">{product.name}</div>
                      <div className="muted small">
                        {product.categoryName ?? 'Turkumsiz'} · qoldiq {product.stock}
                        {inCart ? ` · savatda ${inCart.quantity}` : ''}
                      </div>
                    </div>
                    <div className="product-right">
                      <span className="price">{product.price.toFixed(2)}</span>
                      <button
                        className="btn-secondary"
                        disabled={product.stock <= 0 || (inCart !== undefined && inCart.quantity >= product.stock)}
                        onClick={() => addToCart(product)}
                      >
                        {product.stock <= 0 ? 'Tugagan' : inCart && inCart.quantity >= product.stock ? 'Qoldiq yetarli emas' : 'Qo‘shish'}
                      </button>
                    </div>
                  </li>
                );
              })}
              {products.length === 0 && <li className="muted empty">Mahsulot topilmadi</li>}
            </ul>
          )}
          {!loading && !loadError && totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn-ghost"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
              >
                Oldingi
              </button>
              <span className="muted small">{page} / {totalPages}-sahifa</span>
              <button
                className="btn-ghost"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
              >
                Keyingi
              </button>
            </div>
          )}
        </section>

        <section className="card cart-card">
          <div className="card-head">
            <h2>Savat</h2>
            <span className="muted small">{itemCount} dona</span>
          </div>
          {cart.length === 0 ? (
            <p className="muted empty">Savat bo‘sh. Mahsulotlardan qo‘shing.</p>
          ) : (
            <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Soni</th>
                  <th>Jami</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cart.map((line) => (
                  <tr key={line.productId}>
                    <td>{line.name}</td>
                    <td>
                      <input
                        className="qty-input"
                        type="number"
                        min={1}
                        max={line.stock}
                        step={1}
                        value={line.quantity}
                        onChange={(e) => {
                          const quantity = Number(e.target.value);
                          if (Number.isInteger(quantity)) setQuantity(line.productId, quantity);
                        }}
                      />
                    </td>
                    <td>{(line.price * line.quantity).toFixed(2)}</td>
                    <td>
                      <button className="btn-link danger" onClick={() => removeLine(line.productId)}>
                        O‘chirish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          <div className="cart-total">
            <span>Jami</span>
            <span>{total.toFixed(2)}</span>
          </div>

          {error && <div className="error">{error}</div>}

          <button className="btn-primary" disabled={cart.length === 0 || placing} onClick={checkout}>
            {placing ? 'Yuborilmoqda...' : 'Buyurtma berish'}
          </button>
          <p className="muted small">Narx va qoldiq buyurtma yaratilishidan oldin serverda qayta tekshiriladi.</p>
        </section>
      </div>
    </Layout>
  );
}
