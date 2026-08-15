import { useAuthStore } from '../store/useAuthStore';
import { useCallback, useMemo } from 'react';

export const usePermissions = () => {
  const { permissions, role, user, ministryId, allowedMinistries, roles } = useAuthStore();
  const userRoles = useMemo(() => roles || (role ? [role] : []), [role, roles]);
  const normalizedRoles = useMemo(() => userRoles.map((item) => String(item).toLowerCase()), [userRoles]);
  const hasAdministrativeRole = normalizedRoles.some((item) => item === 'admin' || item === 'superadmin');

  /**
   * Checks if the current user has permission to view or edit a specific module.
   * Admin role always returns true.
   */
  const hasPermission = useCallback((moduleName: string, action: 'view' | 'edit' = 'view'): boolean => {
    // Admin and Superadmin have total access
    if (hasAdministrativeRole) return true;

    // If not authenticated or permissions not loaded, deny access
    if (!user || !permissions) return false;

    const modulePerm = permissions[moduleName];
    if (!modulePerm) return false;

    return !!modulePerm[action];
  }, [hasAdministrativeRole, permissions, user]);

  /**
   * Checks if the user is authorized to edit a specific ministry or department.
   * Admins have full access. Leaders have access to their designated ministry.
   * Other roles with general ministries edit permission have access unless restricted by an explicit allowed list.
   */
  const canEditMinistry = useCallback((minId: string): boolean => {
    if (hasAdministrativeRole) return true;
    if (!user) return false;

    // 1. Explicit leader check
    if (normalizedRoles.includes('leader') && minId === ministryId) return true;

    // 2. Allowed list override check
    if (allowedMinistries && allowedMinistries.includes(minId)) return true;

    // 3. General edit permission check
    const hasGeneralEdit = hasPermission('ministries', 'edit');
    if (hasGeneralEdit && (!allowedMinistries || allowedMinistries.length === 0)) {
      return true;
    }

    return false;
  }, [allowedMinistries, hasAdministrativeRole, hasPermission, ministryId, normalizedRoles, user]);

  /**
   * Helper that returns true if the user can only view a module but cannot edit it.
   */
  const isReadOnly = useCallback((moduleName: string): boolean => {
    return hasPermission(moduleName, 'view') && !hasPermission(moduleName, 'edit');
  }, [hasPermission]);

  return {
    permissions,
    role,
    roles: userRoles,
    user,
    hasPermission,
    isReadOnly,
    canEditMinistry,
    isAdmin: hasAdministrativeRole,
  };
};
