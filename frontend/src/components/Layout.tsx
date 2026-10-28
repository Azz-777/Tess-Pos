import { ReactNode } from 'react';
import { useNavigate, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { roleLabel } from '../auth/roleLabel';

export default function Layout({ children }: { children: ReactNode }) {
  const { user, tenant, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-left">
          <Link className="brand" to="/">
            <span className="brand-mark">T</span>
            <span>Tess<span className="brand-light">POS</span></span>
          </Link>
          {tenant ? (
            <span className="tenant-badge">
              {tenant.name}
              <span className="tenant-type">{tenant.businessType}</span>
            </span>
          ) : (
            user?.role === 'superadmin' && <span className="tenant-badge owner">Platforma egasi</span>
          )}
        </div>

        <nav className="topnav">
          {(user?.role === 'cashier' || user?.role === 'admin') && (
            <NavLink to="/pos" className="navlink">
              Yangi sotuv
            </NavLink>
          )}
          {user?.role === 'admin' && (
            <>
              <NavLink to="/reports" className="navlink">
                Hisobot
              </NavLink>
              <NavLink to="/products" className="navlink">
                Mahsulotlar
              </NavLink>
              <NavLink to="/users" className="navlink">
                Xodimlar
              </NavLink>
            </>
          )}
          {user?.role === 'superadmin' && (
            <NavLink to="/businesses" className="navlink">
              Bizneslar
            </NavLink>
          )}
        </nav>

        <div className="topbar-right">
          {user && (
            <div className="user-profile">
              <span className="user-avatar" aria-hidden="true">{user.name.trim().charAt(0).toUpperCase()}</span>
              <span className="user-label">
                <strong>{user.name}</strong>
                <small>{roleLabel(user.role)}</small>
              </span>
            </div>
          )}
          {user && (
            <button className="btn-logout" onClick={handleLogout}>
              Chiqish
            </button>
          )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
