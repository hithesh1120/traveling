import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ children, role }) {
  const userRole = localStorage.getItem('role');
  const token = localStorage.getItem('token');

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (role && userRole !== role) {
    const roleRoutes = {
      SUPER_ADMIN: '/admin',
      VENDOR: '/vendor',
      MSME: '/msme',
      DRIVER: '/driver',
      FLEET_MANAGER: '/fleet',
    };
    return <Navigate to={roleRoutes[userRole] || '/login'} replace />;
  }

  return children;
}
