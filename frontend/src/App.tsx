import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import Login from './pages/Login';
import POS from './pages/POS';
import Inventory from './pages/Inventory';
import Categories from './pages/Categories';
import Dashboard from './pages/Dashboard';
import Suppliers from './pages/Suppliers';
import Kardex from './pages/Kardex';
import PurchasingReport from './pages/PurchasingReport';
import SalesHistory from './pages/SalesHistory';
import BulkUpload from './pages/BulkUpload';
import UserManagement from './pages/UserManagement';
import AppLayout from './components/AppLayout';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('jwt_token');
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function ProtectedRouteAdmin({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('jwt_token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  if (!token) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/pos" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* AppLayout Envoltura Maestra */}
        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/pos" element={<POS />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/dashboard" element={<ProtectedRouteAdmin><Dashboard /></ProtectedRouteAdmin>} />
          
          {/* SPRINT 4 y 5 Rutas Administrativas */}
          <Route path="/users" element={<ProtectedRouteAdmin><UserManagement /></ProtectedRouteAdmin>} />
          <Route path="/suppliers" element={<ProtectedRouteAdmin><Suppliers /></ProtectedRouteAdmin>} />
          <Route path="/kardex" element={<ProtectedRouteAdmin><Kardex /></ProtectedRouteAdmin>} />
          <Route path="/purchasing" element={<ProtectedRouteAdmin><PurchasingReport /></ProtectedRouteAdmin>} />
          <Route path="/sales-history" element={<ProtectedRouteAdmin><SalesHistory /></ProtectedRouteAdmin>} />
          <Route path="/bulk-upload" element={<ProtectedRouteAdmin><BulkUpload /></ProtectedRouteAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/pos" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
