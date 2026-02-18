import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Signup from './pages/Signup';
import LandingPage from './pages/LandingPage';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import './mobile-overrides.css';

// --- ENTERPRISE IMPORTS ---
import MSMEDashboard from './pages/MSMEDashboard';
import MyShipments from './pages/MyShipments';
import ShipmentDetail from './pages/ShipmentDetail';
import DriverDashboard from './pages/DriverDashboard';
import VehicleManagement from './pages/VehicleManagement';
import ZoneManagement from './pages/ZoneManagement';
import OperationsMonitor from './pages/OperationsMonitor';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import DriverHistory from './pages/DriverHistory';
import SavedLocations from './pages/SavedLocations';
import RouteTracking from './pages/RouteTracking';
import Notifications from './pages/Notifications';

import DeliveryReceipt from './pages/DeliveryReceipt';
import CargoVisualizer from './pages/CargoVisualizer';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';

function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#4F46E5', // Indigo-600
          colorLink: '#4F46E5',
          borderRadius: 6, // Sharper, professional look (down from 8)
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          colorTextHeading: '#0F172A', // Slate-900
          colorText: '#334155',        // Slate-700
          colorBgLayout: '#F8FAFC',    // Slate-50
          colorBorder: '#E2E8F0',      // Slate-200
        },
        components: {
          Card: {
            boxShadowTertiary: 'none', // Remove default heavy shadows
            colorBorderSecondary: '#E2E8F0',
          },
          Layout: {
            bodyBg: '#F8FAFC',
            headerBg: '#FFFFFF',
            siderBg: '#FFFFFF',
          },
          Menu: {
            itemSelectedBg: '#EEF2FF', // Indigo-50
            itemSelectedColor: '#4F46E5', // Indigo-600
          }
        }
      }}
    >
      <AuthProvider>
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/receipt/:id" element={<DeliveryReceipt />} />

              {/* SUPER ADMIN ROUTES */}
              <Route path="/admin/*" element={
                <ProtectedRoute role="SUPER_ADMIN">
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<AdminDashboard />} />
                      <Route path="users" element={<UserManagement />} />
                      <Route path="vehicles" element={<VehicleManagement />} />
                      <Route path="zones" element={<ZoneManagement />} />
                      <Route path="operations" element={<OperationsMonitor />} />
                      <Route path="analytics" element={<Analytics />} />
                      <Route path="reports" element={<Reports />} />
                      <Route path="shipments" element={<MyShipments />} />
                      <Route path="shipments/:id" element={<ShipmentDetail />} />
                      <Route path="locations" element={<SavedLocations />} />
                      <Route path="track/:id" element={<RouteTracking />} />
                      <Route path="cargo-3d" element={<CargoVisualizer />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="notifications" element={<Notifications />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* MSME / BUSINESS ROUTES */}
              <Route path="/msme/*" element={
                <ProtectedRoute role="MSME">
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<MSMEDashboard />} />
                      <Route path="shipments" element={<MyShipments />} />
                      <Route path="locations" element={<SavedLocations />} />
                      <Route path="shipments/:id" element={<ShipmentDetail />} />
                      <Route path="track/:id" element={<RouteTracking />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="notifications" element={<Notifications />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* DRIVER ROUTES */}
              <Route path="/driver/*" element={
                <ProtectedRoute role="DRIVER">
                  <AppLayout>
                    <Routes>
                      <Route path="/" element={<DriverDashboard />} />
                      <Route path="shipments/:id" element={<ShipmentDetail />} />
                      <Route path="track/:id" element={<RouteTracking />} />
                      <Route path="history" element={<DriverHistory />} />
                      <Route path="settings" element={<Settings />} />
                      <Route path="notifications" element={<Notifications />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              } />

              {/* Catch-all: redirect unknown routes to landing */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </ModalProvider>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
