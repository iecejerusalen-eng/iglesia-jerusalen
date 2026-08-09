import type { UserRole } from '../../types';

export interface ModulePermission {
  view: boolean;
  edit: boolean;
}

export type PermissionMap = Record<string, ModulePermission>;

export interface CustomAccessRole {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  permissions: PermissionMap;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleOption {
  id: UserRole;
  label: string;
  shortLabel: string;
  description: string;
}

export type AccessTab = 'users' | 'roles';
export type UserStatusFilter = 'all' | 'active' | 'suspended' | 'linked' | 'unlinked';

