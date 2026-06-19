import { useAuthStore } from '../store/useAuthStore';

export const usePermissions = () => {
  const { permissions, role, user } = useAuthStore();

  /**
   * Checks if the current user has permission to view or edit a specific module.
   * Admin role always returns true.
   */
  const hasPermission = (moduleName: string, action: 'view' | 'edit' = 'view'): boolean => {
    // Admin has total access
    if (role === 'admin') return true;

    // If not authenticated or permissions not loaded, deny access
    if (!user || !permissions) return false;

    const modulePerm = permissions[moduleName];
    if (!modulePerm) return false;

    return !!modulePerm[action];
  };

  /**
   * Helper that returns true if the user can only view a module but cannot edit it.
   */
  const isReadOnly = (moduleName: string): boolean => {
    return hasPermission(moduleName, 'view') && !hasPermission(moduleName, 'edit');
  };

  return {
    permissions,
    role,
    user,
    hasPermission,
    isReadOnly,
    isAdmin: role === 'admin',
  };
};
