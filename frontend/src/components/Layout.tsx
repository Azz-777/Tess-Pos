import { ReactNode } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
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
          <span className="brand">Tess POS</span>
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
          {user?.role === 'cashier' && (
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
            <span className="user-label">
              {user.name} · {roleLabel(user.role)}
            </span>
          )}
          {user && (
            <button className="btn-link" onClick={handleLogout}>
              Chiqish
            </button>
          )}
        </div>
      </header>
      <main className="content">{children}</main>
    </div>
  );
}
