import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { useAuth } from '../auth/AuthContext';
import { searchProducts } from '../api/products';
import { placeOrder } from '../api/orders';
import { Product, CartLine } from '../types';

export default function PosPage() {
  const navigate = useNavigate();
  const { tenant } = useAuth();
  const [search, setSearch] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  const loadProducts = useCallback(async (term: string) => {
    setLoading(true);
    try {
      const data = await searchProducts(term, 1, 20);
      setProducts(data.items);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handle = setTimeout(() => loadProducts(search), 300);
    return () => clearTimeout(handle);
  }, [search, loadProducts]);

  function addToCart(product: Product) {
    setError('');
    setCart((prev) => {
      const existing = prev.find((line) => line.productId === product._id);
      if (existing) {
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
        line.productId === productId ? { ...line, quantity: Math.max(1, quantity) } : line
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
      const message = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(message ?? 'Buyurtmani yuborib bo‘lmadi');
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
            <button className="btn-ghost" onClick={() => loadProducts(search)} disabled={loading}>
              Yangilash
            </button>
          </div>
          <input
            className="search"
            placeholder="Mahsulot nomi bo‘yicha qidirish"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading ? (
            <Spinner label="Mahsulotlar yuklanmoqda..." />
          ) : (
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
                        disabled={product.stock <= 0}
                        onClick={() => addToCart(product)}
                      >
                        {product.stock <= 0 ? 'Tugagan' : 'Qo‘shish'}
                      </button>
                    </div>
                  </li>
                );
              })}
              {products.length === 0 && <li className="muted empty">Mahsulot topilmadi</li>}
            </ul>
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
                        value={line.quantity}
                        onChange={(e) => setQuantity(line.productId, Number(e.target.value))}
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
