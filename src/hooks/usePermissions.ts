import { useAuthStore } from '../store/useAuthStore';

export const usePermissions = () => {
  const { permissions, role, user, ministryId, allowedMinistries } = useAuthStore();

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
   * Checks if the user is authorized to edit a specific ministry or department.
   * Admins have full access. Leaders have access to their designated ministry.
   * Other roles with general ministries edit permission have access unless restricted by an explicit allowed list.
   */
  const canEditMinistry = (minId: string): boolean => {
    if (role === 'admin') return true;
    if (!user) return false;

    // 1. Explicit leader check
    if (role === 'leader' && minId === ministryId) return true;

    // 2. Allowed list override check
    if (allowedMinistries && allowedMinistries.includes(minId)) return true;

    // 3. General edit permission check
    const hasGeneralEdit = hasPermission('ministries', 'edit');
    if (hasGeneralEdit && (!allowedMinistries || allowedMinistries.length === 0)) {
      return true;
    }

    return false;
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
    canEditMinistry,
    isAdmin: role === 'admin',
  };
};
