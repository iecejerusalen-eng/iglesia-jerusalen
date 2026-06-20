import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  module?: string;
  children?: React.ReactNode;
}

const ProtectedRoute = ({ allowedRoles, module, children }: ProtectedRouteProps) => {
  const { user, role, isLoading } = useAuthStore();
  const { hasPermission } = usePermissions();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface text-primary font-medium">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-3"></div>
        Cargando sesión...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check dynamic module permissions
  if (module) {
    if (!hasPermission(module, 'view')) {
      return <Navigate to="/admin" replace />;
    }
  }

  // Check role-based fallback if module is not provided
  if (allowedRoles && !module) {
    const roleLower = role?.toLowerCase();
    const isAllowed = allowedRoles.some((r) => r.toLowerCase() === roleLower);
    if (!isAllowed) {
      return <Navigate to="/" replace />;
    }
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
