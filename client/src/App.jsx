import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Login     from './pages/Login';
import Register  from './pages/Register';
import Overview  from './pages/Overview';
import Sales     from './pages/Sales';
import POS       from './pages/POS';
import Inventory from './pages/Inventory';
import Customers from './pages/Customers';
import Staff     from './pages/Staff';
import Reports   from './pages/Reports';
import Expenses  from './pages/Expenses';
import Settings  from './pages/Settings';

// Protected Route — roles list dene par sirf unhe access milta hai
const ProtectedRoute = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner" />
        <div className="loading-text">Loading GroceryIQ...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    // Staff ko seedha POS pe bhejo
    return <Navigate to="/pos" replace />;
  }

  return children;
};

// Home route — staff ke liye /inventory, baaki ke liye /
const HomeRoute = () => {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="full-page-loader">
        <div className="spinner" />
        <div className="loading-text">Loading GroceryIQ...</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Staff sirf POS ya inventory dekh sakta hai, default to POS
  if (user?.role === 'staff') return <Navigate to="/pos" replace />;

  return <Overview />;
};

// Auth-only redirect (already logged in → go home)
const AuthRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
};

const AppRoutes = () => (
  <Routes>
    <Route
      path="/login"
      element={
        <AuthRoute>
          <Login />
        </AuthRoute>
      }
    />
    <Route
      path="/register"
      element={
        <AuthRoute>
          <Register />
        </AuthRoute>
      }
    />

    {/* Home — staff auto-redirects to /inventory */}
    <Route path="/" element={<HomeRoute />} />

    {/* Admin + Manager only */}
    <Route
      path="/sales"
      element={
        <ProtectedRoute roles={['admin', 'manager', 'store_owner']}>
          <Sales />
        </ProtectedRoute>
      }
    />
    <Route
      path="/customers"
      element={
        <ProtectedRoute roles={['admin', 'manager', 'store_owner']}>
          <Customers />
        </ProtectedRoute>
      }
    />
    <Route
      path="/staff"
      element={
        <ProtectedRoute roles={['admin', 'manager', 'store_owner']}>
          <Staff />
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute roles={['admin', 'manager', 'store_owner']}>
          <Reports />
        </ProtectedRoute>
      }
    />
    <Route
      path="/expenses"
      element={
        <ProtectedRoute roles={['admin', 'manager', 'store_owner']}>
          <Expenses />
        </ProtectedRoute>
      }
    />
    <Route
      path="/settings"
      element={
        <ProtectedRoute roles={['admin', 'store_owner']}>
          <Settings />
        </ProtectedRoute>
      }
    />

    {/* All roles — inventory */}
    <Route
      path="/inventory"
      element={
        <ProtectedRoute>
          <Inventory />
        </ProtectedRoute>
      }
    />

    {/* POS is available to everyone */}
    <Route
      path="/pos"
      element={
        <ProtectedRoute>
          <POS />
        </ProtectedRoute>
      }
    />

    {/* Fallback — staff → /pos, others → / */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
