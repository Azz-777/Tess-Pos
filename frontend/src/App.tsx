import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { roleHome } from './auth/roleHome';
import LoginPage from './pages/LoginPage';
import PosPage from './pages/PosPage';
import ReceiptPage from './pages/ReceiptPage';
import ReportPage from './pages/ReportPage';
import ProductsAdminPage from './pages/ProductsAdminPage';
import UsersPage from './pages/UsersPage';
import BusinessesPage from './pages/BusinessesPage';

function Home() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={roleHome(user.role)} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/pos"
            element={
              <ProtectedRoute roles={['cashier', 'admin']}>
                <PosPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/receipt/:id"
            element={
              <ProtectedRoute roles={['cashier', 'admin']}>
                <ReceiptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute roles={['admin']}>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute roles={['admin']}>
                <ProductsAdminPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute roles={['admin']}>
                <UsersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/businesses"
            element={
              <ProtectedRoute roles={['superadmin']}>
                <BusinessesPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
