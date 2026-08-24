import { PERMISSION_MODULES } from '../../config/adminModules';
import type { UserRole } from '../../types';
import type { CustomAccessRole, PermissionMap, RoleOption } from './types';

export const SYSTEM_ROLES: RoleOption[] = [
  { id: 'guest', label: 'Invitado', shortLabel: 'Invitado', description: 'Acceso mínimo para cuentas nuevas.' },
  { id: 'member', label: 'Miembro', shortLabel: 'Miembro', description: 'Acceso básico para miembros registrados.' },
  { id: 'leader', label: 'Líder de ministerio', shortLabel: 'Líder', description: 'Gestiona los ministerios autorizados.' },
  { id: 'apoyo', label: 'Cuerpo de apoyo', shortLabel: 'Apoyo', description: 'Apoya tareas administrativas y operativas.' },
  { id: 'diacono', label: 'Diácono', shortLabel: 'Diácono', description: 'Apoya la logística, el orden y la atención durante los servicios.' },
  { id: 'ujier', label: 'Ujier', shortLabel: 'Ujier', description: 'Gestiona aforo, orientación y atención práctica a la congregación.' },
  { id: 'multimedia', label: 'Equipo multimedia', shortLabel: 'Multimedia', description: 'Gestiona contenidos y recursos audiovisuales.' },
  { id: 'editor', label: 'Editor general', shortLabel: 'Editor', description: 'Edita contenido público y recursos.' },
  { id: 'secretary', label: 'Secretaría', shortLabel: 'Secretaría', description: 'Gestiona información administrativa y del CRM.' },
  { id: 'secretaria', label: 'Secretaría (legado)', shortLabel: 'Secretaría', description: 'Alias conservado para cuentas existentes.' },
  { id: 'pastor', label: 'Pastor', shortLabel: 'Pastor', description: 'Acceso pastoral y de supervisión.' },
  { id: 'maestro', label: 'Maestro', shortLabel: 'Maestro', description: 'Gestiona cursos y recursos educativos.' },
  { id: 'docente', label: 'Docente (legado)', shortLabel: 'Docente', description: 'Alias educativo conservado por compatibilidad.' },
  { id: 'student', label: 'Estudiante', shortLabel: 'Estudiante', description: 'Acceso al aula virtual como estudiante.' },
  { id: 'estudiante', label: 'Estudiante (legado)', shortLabel: 'Estudiante', description: 'Alias conservado para cuentas existentes.' },
  { id: 'musico', label: 'Músico', shortLabel: 'Músico', description: 'Acceso a repertorios y recursos de alabanza.' },
  { id: 'admin', label: 'Administrador', shortLabel: 'Admin', description: 'Control total del panel y de la seguridad.' },
];

export const createEmptyPermissions = (): PermissionMap => Object.fromEntries(
  PERMISSION_MODULES.map((module) => [module.id, { view: false, edit: false }]),
);

export const normalizePermissions = (permissions: PermissionMap | null | undefined): PermissionMap => {
  const normalized = createEmptyPermissions();
  if (!permissions) return normalized;

  for (const module of PERMISSION_MODULES) {
    const permission = permissions[module.id];
    if (!permission) continue;
    const edit = Boolean(permission.edit);
    normalized[module.id] = { view: Boolean(permission.view) || edit, edit };
  }
  return normalized;
};

export const mergePermissions = (...permissionSets: Array<PermissionMap | null | undefined>): PermissionMap => {
  const merged = createEmptyPermissions();
  for (const permissions of permissionSets) {
    const normalized = normalizePermissions(permissions);
    for (const module of PERMISSION_MODULES) {
      merged[module.id].view = merged[module.id].view || normalized[module.id].view;
      merged[module.id].edit = merged[module.id].edit || normalized[module.id].edit;
    }
  }
  return merged;
};

export const togglePermission = (
  permissions: PermissionMap,
  moduleId: string,
  capability: 'view' | 'edit',
): PermissionMap => {
  const current = permissions[moduleId] ?? { view: false, edit: false };
  const next = { ...current, [capability]: !current[capability] };
  if (capability === 'view' && !next.view) next.edit = false;
  if (capability === 'edit' && next.edit) next.view = true;
  return { ...permissions, [moduleId]: next };
};

export const countPermissionModules = (permissions: PermissionMap) => {
  const values = Object.values(normalizePermissions(permissions));
  return {
    view: values.filter((permission) => permission.view).length,
    edit: values.filter((permission) => permission.edit).length,
  };
};

export const getRoleLabel = (role: UserRole) => (
  SYSTEM_ROLES.find((option) => option.id === role)?.shortLabel ?? role
);

export const getRoleBadgeClass = (role: UserRole) => {
  if (role === 'admin') return 'border-rose-400/25 bg-rose-500/10 text-rose-700 dark:text-rose-300';
  if (role === 'pastor') return 'border-amber-400/25 bg-amber-500/10 text-amber-700 dark:text-amber-300';
  if (role === 'leader') return 'border-blue-400/25 bg-blue-500/10 text-blue-700 dark:text-blue-300';
  if (['maestro', 'docente'].includes(role)) return 'border-violet-400/25 bg-violet-500/10 text-violet-700 dark:text-violet-300';
  if (['multimedia', 'musico'].includes(role)) return 'border-cyan-400/25 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300';
  return 'border-slate-400/20 bg-slate-500/10 text-slate-700 dark:text-slate-300';
};

export const slugifyRoleName = (name: string) => name
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '_')
  .replace(/^_+|_+$/g, '');

export const resolveCustomRolePermissions = (
  assignedIds: string[] | null | undefined,
  customRoles: CustomAccessRole[],
) => mergePermissions(
  ...customRoles
    .filter((role) => role.is_active && assignedIds?.includes(role.id))
    .map((role) => role.permissions),
);
