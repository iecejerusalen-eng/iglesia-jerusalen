import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  KeyRound,
  Link2,
  LockKeyhole,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Unlink,
  UserCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { PERMISSION_MODULES, MODULE_GROUPS } from '../../config/adminModules';
import { supabase } from '../../config/supabase';
import {
  SYSTEM_ROLES,
  countPermissionModules,
  createEmptyPermissions,
  getRoleBadgeClass,
  getRoleLabel,
  normalizePermissions,
  slugifyRoleName,
  togglePermission,
} from '../../features/access-control/accessControl';
import type {
  AccessTab,
  CustomAccessRole,
  PermissionMap,
  UserStatusFilter,
} from '../../features/access-control/types';
import { useConfirmStore } from '../../store/useConfirmStore';
import { useAuthStore } from '../../store/useAuthStore';
import type { Profile, UserRole } from '../../types';
import { logAuditEvent } from '../../utils/auditLogger';

interface CrmMemberOption {
  id: string;
  first_name: string;
  last_name: string;
  dni: string | null;
}

interface MinistryOption {
  id: string;
  name: string;
  category: string;
}

interface CustomRoleDraft {
  id: string | null;
  name: string;
  slug: string;
  description: string;
  color: string;
  permissions: PermissionMap;
  is_active: boolean;
}

const emptyCustomRoleDraft = (): CustomRoleDraft => ({
  id: null,
  name: '',
  slug: '',
  description: '',
  color: '#2563eb',
  permissions: createEmptyPermissions(),
  is_active: true,
});

const glassPanel = 'rounded-[1.75rem] border border-slate-200/70 bg-white/75 shadow-[0_18px_55px_-32px_rgba(15,23,42,0.38)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55';
const softButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/75 px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-blue-400/40 dark:hover:text-blue-300';

const profileName = (profile: Profile) => {
  const name = `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim();
  return name || 'Usuario sin nombre';
};

const initials = (profile: Profile) => {
  const value = `${profile.first_name?.[0] ?? ''}${profile.last_name?.[0] ?? ''}`.trim();
  return value.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U';
};

const isAdminProfile = (profile: Profile) => (
  profile.role === 'admin' || (profile.roles ?? []).includes('admin')
);

function PermissionMatrix({
  value,
  onChange,
  disabled = false,
}: {
  value: PermissionMap;
  onChange: (next: PermissionMap) => void;
  disabled?: boolean;
}) {
  const normalized = normalizePermissions(value);

  const setGroupLevel = (groupKey: string, level: 'none' | 'view' | 'edit') => {
    if (disabled) return;
    const next = { ...normalized };
    for (const module of PERMISSION_MODULES.filter((item) => item.group === groupKey)) {
      next[module.id] = {
        view: level !== 'none',
        edit: level === 'edit',
      };
    }
    onChange(next);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-slate-950/30">
      <div className="grid grid-cols-[minmax(0,1fr)_72px_72px] border-b border-slate-200/80 bg-slate-50/80 px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
        <span>Módulo</span>
        <span className="text-center">Ver</span>
        <span className="text-center">Editar</span>
      </div>
      <div className="max-h-[440px] overflow-y-auto">
        {MODULE_GROUPS.map((group) => {
          const groupModules = PERMISSION_MODULES.filter((module) => module.group === group.key);
          return (
            <Fragment key={group.key}>
              <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-2 border-y border-slate-200/70 bg-slate-100/95 px-4 py-2.5 backdrop-blur dark:border-white/10 dark:bg-slate-900/95">
                <div className="flex items-center gap-2 text-xs font-black text-slate-800 dark:text-slate-100">
                  <group.icon size={14} className="text-amber-500" />
                  {group.label}
                </div>
                {!disabled && (
                  <div className="flex rounded-lg border border-slate-200 bg-white/80 p-0.5 dark:border-white/10 dark:bg-white/5" aria-label={`Permisos para ${group.label}`}>
                    {(['none', 'view', 'edit'] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setGroupLevel(group.key, level)}
                        className="rounded-md px-2 py-1 text-[9px] font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white"
                      >
                        {level === 'none' ? 'Nada' : level === 'view' ? 'Ver' : 'Editar'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {groupModules.map((module) => {
                const permission = normalized[module.id];
                return (
                  <div key={module.id} className="grid grid-cols-[minmax(0,1fr)_72px_72px] items-center border-b border-slate-100 px-4 py-3 last:border-b-0 dark:border-white/5">
                    <div className="min-w-0 pr-3">
                      <p className="truncate text-xs font-bold text-slate-750 dark:text-slate-200">{module.label}</p>
                      <p className="mt-0.5 truncate text-[10px] text-slate-400">{module.path}</p>
                    </div>
                    {(['view', 'edit'] as const).map((capability) => (
                      <div key={capability} className="flex justify-center">
                        <button
                          type="button"
                          disabled={disabled || (capability === 'edit' && !permission.view)}
                          onClick={() => onChange(togglePermission(normalized, module.id, capability))}
                          aria-label={`${capability === 'view' ? 'Ver' : 'Editar'} ${module.label}`}
                          aria-pressed={permission[capability]}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-30 ${permission[capability] ? 'border-blue-500/30 bg-blue-500 text-white shadow-sm' : 'border-slate-200 bg-white text-transparent dark:border-white/10 dark:bg-white/5'}`}
                        >
                          <Check size={14} strokeWidth={3} />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}

function ModalShell({
  title,
  description,
  icon: Icon,
  onClose,
  children,
  footer,
  size = 'max-w-3xl',
}: {
  title: string;
  description?: string;
  icon: typeof Shield;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
  size?: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="access-dialog-title" className={`${glassPanel} ${size} flex max-h-[92vh] w-full flex-col overflow-hidden bg-white/95 dark:bg-slate-950/95`}>
        <header className="flex items-start justify-between gap-4 border-b border-slate-200/80 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 px-5 py-4 text-white dark:border-white/10">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10"><Icon size={19} /></div>
            <div className="min-w-0">
              <h2 id="access-dialog-title" className="truncate font-serif text-lg font-bold">{title}</h2>
              {description && <p className="mt-0.5 truncate text-xs text-blue-100/70">{description}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"><X size={19} /></button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">{children}</div>
        <footer className="flex flex-wrap justify-end gap-2 border-t border-slate-200/80 bg-slate-50/85 px-5 py-4 dark:border-white/10 dark:bg-white/[0.03]">{footer}</footer>
      </section>
    </div>
  );
}

export default function UsersManager() {
  const confirm = useConfirmStore((state) => state.confirm);
  const currentUserId = useAuthStore((state) => state.user?.id ?? null);
  const [activeTab, setActiveTab] = useState<AccessTab>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [members, setMembers] = useState<CrmMemberOption[]>([]);
  const [ministries, setMinistries] = useState<MinistryOption[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomAccessRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [databaseNotice, setDatabaseNotice] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [primaryRole, setPrimaryRole] = useState<UserRole>('guest');
  const [userCustomRoleIds, setUserCustomRoleIds] = useState<string[]>([]);
  const [allowedMinistryIds, setAllowedMinistryIds] = useState<string[]>([]);
  const [useOverride, setUseOverride] = useState(false);
  const [userPermissions, setUserPermissions] = useState<PermissionMap>(createEmptyPermissions());
  const [savingUser, setSavingUser] = useState(false);

  const [linkingUser, setLinkingUser] = useState<Profile | null>(null);
  const [memberSearch, setMemberSearch] = useState('');

  const [selectedSystemRole, setSelectedSystemRole] = useState<UserRole>('pastor');
  const [systemPermissions, setSystemPermissions] = useState<PermissionMap>(createEmptyPermissions());
  const [loadingPermissions, setLoadingPermissions] = useState(false);
  const [customRoleDraft, setCustomRoleDraft] = useState<CustomRoleDraft | null>(null);
  const [savingCustomRole, setSavingCustomRole] = useState(false);

  const loadData = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    setDatabaseNotice(null);
    try {
      const [profilesResult, membersResult, ministriesResult, customRolesResult] = await Promise.all([
        supabase.from('profiles').select('*, member:member_id(id, first_name, last_name)').order('created_at', { ascending: false }),
        supabase.from('members').select('id, first_name, last_name, dni').is('deleted_at', null).order('last_name'),
        supabase.from('ministries').select('id, name, category').order('name'),
        supabase.from('access_roles').select('*').order('name'),
      ]);

      if (profilesResult.error) throw profilesResult.error;
      if (membersResult.error) throw membersResult.error;
      if (ministriesResult.error) throw ministriesResult.error;

      setProfiles((profilesResult.data ?? []) as Profile[]);
      setMembers((membersResult.data ?? []) as CrmMemberOption[]);
      setMinistries((ministriesResult.data ?? []) as MinistryOption[]);

      if (customRolesResult.error) {
        setCustomRoles([]);
        setDatabaseNotice(`Los roles personalizados no están disponibles: ${customRolesResult.error.message}`);
      } else {
        setCustomRoles((customRolesResult.data ?? []).map((role) => ({
          ...role,
          permissions: normalizePermissions(role.permissions as PermissionMap),
        })) as CustomAccessRole[]);
      }
    } catch (error) {
      console.error('Error al cargar la gestión de acceso:', error);
      toast.error(`No se pudo cargar la gestión de acceso: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadSystemPermissions = useCallback(async (role: UserRole) => {
    setLoadingPermissions(true);
    try {
      if (role === 'admin') {
        setSystemPermissions(Object.fromEntries(PERMISSION_MODULES.map((module) => [module.id, { view: true, edit: true }])));
        return;
      }
      const { data, error } = await supabase.from('role_permissions').select('permissions').eq('role', role).maybeSingle();
      if (error) throw error;
      setSystemPermissions(normalizePermissions((data?.permissions ?? {}) as PermissionMap));
    } catch (error) {
      console.error('Error al cargar permisos del rol:', error);
      toast.error(`No se pudieron cargar los permisos: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingPermissions(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  useEffect(() => {
    if (activeTab !== 'roles') return undefined;
    const timer = window.setTimeout(() => { void loadSystemPermissions(selectedSystemRole); }, 0);
    return () => window.clearTimeout(timer);
  }, [activeTab, loadSystemPermissions, selectedSystemRole]);

  const stats = useMemo(() => ({
    total: profiles.length,
    active: profiles.filter((profile) => !profile.banned).length,
    admins: profiles.filter(isAdminProfile).length,
    unlinked: profiles.filter((profile) => !profile.member_id).length,
  }), [profiles]);

  const filteredProfiles = useMemo(() => profiles.filter((profile) => {
    const query = searchTerm.trim().toLocaleLowerCase('es');
    const roles = profile.roles?.length ? profile.roles : [profile.role];
    const matchesText = !query || `${profileName(profile)} ${profile.email ?? ''} ${profile.member?.first_name ?? ''} ${profile.member?.last_name ?? ''}`.toLocaleLowerCase('es').includes(query);
    const matchesRole = roleFilter === 'all' || roles.includes(roleFilter);
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'active' && !profile.banned)
      || (statusFilter === 'suspended' && Boolean(profile.banned))
      || (statusFilter === 'linked' && Boolean(profile.member_id))
      || (statusFilter === 'unlinked' && !profile.member_id);
    return matchesText && matchesRole && matchesStatus;
  }), [profiles, roleFilter, searchTerm, statusFilter]);

  const openUserEditor = (profile: Profile) => {
    const assignedRoles = profile.roles?.length ? profile.roles : [profile.role];
    setSelectedUser(profile);
    setUserRoles(assignedRoles);
    setPrimaryRole(profile.role);
    setUserCustomRoleIds(profile.custom_role_ids ?? []);
    setAllowedMinistryIds(profile.allowed_ministries ?? []);
    setUseOverride(Boolean(profile.permissions_override));
    setUserPermissions(normalizePermissions(profile.permissions_override));
  };

  const saveUserAccess = async () => {
    if (!selectedUser) return;
    const normalizedRoles = userRoles.length ? userRoles : [primaryRole];
    const rolesWithPrimary = normalizedRoles.includes(primaryRole) ? normalizedRoles : [...normalizedRoles, primaryRole];
    if (selectedUser.id === currentUserId && selectedUser.role === 'admin' && !rolesWithPrimary.includes('admin')) {
      toast.error('No puedes retirar tu propio acceso administrativo desde esta sesión.');
      return;
    }
    setSavingUser(true);
    try {
      const update = {
        role: primaryRole,
        roles: rolesWithPrimary,
        custom_role_ids: userCustomRoleIds,
        permissions_override: useOverride ? normalizePermissions(userPermissions) : null,
        allowed_ministries: allowedMinistryIds.length ? allowedMinistryIds : null,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('profiles').update(update).eq('id', selectedUser.id);
      if (error) throw error;
      setProfiles((current) => current.map((profile) => profile.id === selectedUser.id ? { ...profile, ...update } : profile));
      await logAuditEvent('UPDATE', 'profiles', selectedUser.id, {
        action_detail: 'update_user_access',
        primary_role: primaryRole,
        roles: rolesWithPrimary,
        custom_role_ids: userCustomRoleIds,
        has_override: useOverride,
      });
      toast.success(`Acceso de ${profileName(selectedUser)} actualizado.`);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error al guardar acceso del usuario:', error);
      toast.error(`No se pudo guardar: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingUser(false);
    }
  };

  const toggleBan = async (profile: Profile) => {
    if (profile.id === currentUserId) {
      toast.error('No puedes suspender tu propia cuenta.');
      return;
    }
    const nextBanned = !profile.banned;
    const accepted = await confirm({
      title: nextBanned ? 'Suspender cuenta' : 'Reactivar cuenta',
      message: nextBanned
        ? `${profileName(profile)} perderá el acceso hasta que un administrador reactive la cuenta.`
        : `${profileName(profile)} podrá volver a iniciar sesión.`,
      confirmText: nextBanned ? 'Suspender' : 'Reactivar',
      cancelText: 'Cancelar',
      variant: nextBanned ? 'danger' : 'info',
    });
    if (!accepted) return;
    const { error } = await supabase.from('profiles').update({ banned: nextBanned, updated_at: new Date().toISOString() }).eq('id', profile.id);
    if (error) {
      console.error('Error al cambiar el estado del usuario:', error);
      toast.error(`No se pudo cambiar el estado: ${error.message}`);
      return;
    }
    setProfiles((current) => current.map((item) => item.id === profile.id ? { ...item, banned: nextBanned } : item));
    await logAuditEvent('UPDATE', 'profiles', profile.id, { action_detail: nextBanned ? 'suspend_user' : 'reactivate_user' });
    toast.success(nextBanned ? 'Cuenta suspendida.' : 'Cuenta reactivada.');
  };

  const deleteUser = async (profile: Profile) => {
    if (profile.id === currentUserId) {
      toast.error('No puedes eliminar tu propia cuenta.');
      return;
    }
    const accepted = await confirm({
      title: 'Eliminar cuenta permanentemente',
      message: `Se eliminará la cuenta de ${profileName(profile)} y su acceso. Esta acción no se puede deshacer. La ficha CRM vinculada no será eliminada.`,
      confirmText: 'Eliminar definitivamente',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!accepted) return;
    const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: profile.id });
    if (error) {
      console.error('Error al eliminar usuario:', error);
      toast.error(`No se pudo eliminar: ${error.message}`);
      return;
    }
    setProfiles((current) => current.filter((item) => item.id !== profile.id));
    toast.success('Cuenta eliminada permanentemente.');
  };

  const linkMember = async (member: CrmMemberOption) => {
    if (!linkingUser) return;
    const { error } = await supabase.from('profiles').update({ member_id: member.id, updated_at: new Date().toISOString() }).eq('id', linkingUser.id);
    if (error) {
      console.error('Error al vincular ficha CRM:', error);
      toast.error(`No se pudo vincular la ficha: ${error.message}`);
      return;
    }
    setProfiles((current) => current.map((profile) => profile.id === linkingUser.id ? {
      ...profile,
      member_id: member.id,
      member: { id: member.id, first_name: member.first_name, last_name: member.last_name },
    } : profile));
    await logAuditEvent('UPDATE', 'profiles', linkingUser.id, { action_detail: 'link_crm_member', member_id: member.id });
    toast.success('Cuenta vinculada con la ficha CRM.');
    setLinkingUser(null);
    setMemberSearch('');
  };

  const unlinkMember = async (profile: Profile) => {
    const accepted = await confirm({
      title: 'Desvincular ficha CRM',
      message: 'La cuenta conservará sus roles y acceso, pero dejará de estar asociada con esta ficha de miembro.',
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!accepted) return;
    const { error } = await supabase.from('profiles').update({ member_id: null, updated_at: new Date().toISOString() }).eq('id', profile.id);
    if (error) {
      console.error('Error al desvincular ficha CRM:', error);
      toast.error(`No se pudo desvincular: ${error.message}`);
      return;
    }
    setProfiles((current) => current.map((item) => item.id === profile.id ? { ...item, member_id: null, member: null } : item));
    await logAuditEvent('UPDATE', 'profiles', profile.id, { action_detail: 'unlink_crm_member' });
    toast.success('Ficha CRM desvinculada.');
  };

  const saveSystemPermissions = async () => {
    if (selectedSystemRole === 'admin') return;
    setLoadingPermissions(true);
    try {
      const permissions = normalizePermissions(systemPermissions);
      const { error } = await supabase.from('role_permissions').upsert({ role: selectedSystemRole, permissions, updated_at: new Date().toISOString() });
      if (error) throw error;
      await logAuditEvent('UPDATE', 'role_permissions', selectedSystemRole, { action_detail: 'update_system_role_permissions' });
      toast.success(`Permisos de ${getRoleLabel(selectedSystemRole)} guardados.`);
    } catch (error) {
      console.error('Error al guardar permisos del rol:', error);
      toast.error(`No se pudieron guardar los permisos: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const openCustomRoleEditor = (role?: CustomAccessRole) => setCustomRoleDraft(role ? {
    id: role.id,
    name: role.name,
    slug: role.slug,
    description: role.description,
    color: role.color,
    permissions: normalizePermissions(role.permissions),
    is_active: role.is_active,
  } : emptyCustomRoleDraft());

  const saveCustomRole = async () => {
    if (!customRoleDraft) return;
    const name = customRoleDraft.name.trim();
    const slug = customRoleDraft.slug.trim() || slugifyRoleName(name);
    if (name.length < 2 || !slug) {
      toast.error('Escribe un nombre válido para el rol.');
      return;
    }
    setSavingCustomRole(true);
    try {
      const payload = {
        name,
        slug,
        description: customRoleDraft.description.trim(),
        color: customRoleDraft.color,
        permissions: normalizePermissions(customRoleDraft.permissions),
        is_active: customRoleDraft.is_active,
      };
      if (customRoleDraft.id) {
        const { data, error } = await supabase.from('access_roles').update(payload).eq('id', customRoleDraft.id).select('*').single();
        if (error) throw error;
        setCustomRoles((current) => current.map((role) => role.id === data.id ? { ...data, permissions: normalizePermissions(data.permissions as PermissionMap) } as CustomAccessRole : role));
        await logAuditEvent('UPDATE', 'access_roles', data.id, { action_detail: 'update_custom_role', name });
      } else {
        const { data, error } = await supabase.from('access_roles').insert({ ...payload, created_by: currentUserId }).select('*').single();
        if (error) throw error;
        setCustomRoles((current) => [...current, { ...data, permissions: normalizePermissions(data.permissions as PermissionMap) } as CustomAccessRole].sort((a, b) => a.name.localeCompare(b.name, 'es')));
        await logAuditEvent('CREATE', 'access_roles', data.id, { action_detail: 'create_custom_role', name });
      }
      toast.success(customRoleDraft.id ? 'Rol personalizado actualizado.' : 'Rol personalizado creado.');
      setCustomRoleDraft(null);
    } catch (error) {
      console.error('Error al guardar rol personalizado:', error);
      toast.error(`No se pudo guardar el rol: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setSavingCustomRole(false);
    }
  };

  const deleteCustomRole = async (role: CustomAccessRole) => {
    const assignedCount = profiles.filter((profile) => profile.custom_role_ids?.includes(role.id)).length;
    const accepted = await confirm({
      title: 'Eliminar rol personalizado',
      message: assignedCount
        ? `Este rol está asignado a ${assignedCount} cuenta(s). Se retirará de ellas y luego se eliminará.`
        : `Se eliminará el rol “${role.name}”.`,
      confirmText: 'Eliminar rol',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!accepted) return;
    try {
      const { error } = await supabase.rpc('delete_access_role', { target_role_id: role.id });
      if (error) throw error;
      setCustomRoles((current) => current.filter((item) => item.id !== role.id));
      setProfiles((current) => current.map((profile) => ({ ...profile, custom_role_ids: (profile.custom_role_ids ?? []).filter((id) => id !== role.id) })));
      await logAuditEvent('DELETE', 'access_roles', role.id, { action_detail: 'delete_custom_role', name: role.name, affected_users: assignedCount });
      toast.success('Rol personalizado eliminado.');
    } catch (error) {
      console.error('Error al eliminar rol personalizado:', error);
      toast.error(`No se pudo eliminar el rol: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const visibleMembers = useMemo(() => {
    const query = memberSearch.trim().toLocaleLowerCase('es');
    const linkedIds = new Set(profiles.map((profile) => profile.member_id).filter(Boolean));
    return members.filter((member) => {
      const matches = !query || `${member.first_name} ${member.last_name} ${member.dni ?? ''}`.toLocaleLowerCase('es').includes(query);
      return matches && (!linkedIds.has(member.id) || member.id === linkingUser?.member_id);
    }).slice(0, 80);
  }, [linkingUser?.member_id, memberSearch, members, profiles]);

  return (
    <div className="relative min-h-full overflow-hidden px-3 py-4 text-slate-900 sm:px-5 lg:px-7 dark:text-slate-100">
      <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-48 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1500px] space-y-5">
        <section className={`${glassPanel} overflow-hidden`}>
          <div className="grid gap-6 bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 px-5 py-6 text-white lg:grid-cols-[1fr_auto] lg:items-center lg:px-7">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-100">
                <ShieldCheck size={13} /> Seguridad y acceso
              </div>
              <h1 className="font-serif text-2xl font-bold tracking-tight sm:text-3xl">Usuarios, roles y permisos</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Administra quién puede entrar, qué puede consultar y qué puede editar. Los cambios se aplican a datos reales del sistema.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => void loadData(true)} disabled={refreshing} className={`${softButton} border-white/15 bg-white/10 text-white hover:border-white/30 hover:bg-white/15 hover:text-white`}>
                <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} /> Actualizar
              </button>
              <button type="button" onClick={() => { setActiveTab('roles'); openCustomRoleEditor(); }} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-400 px-4 text-xs font-black text-slate-950 shadow-lg shadow-amber-950/20 transition hover:-translate-y-0.5 hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
                <Plus size={16} /> Nuevo rol
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-200/70 sm:grid-cols-4 sm:divide-y-0 dark:divide-white/10">
            {[
              { label: 'Cuentas', value: stats.total, icon: Users, tone: 'text-blue-600 dark:text-blue-300' },
              { label: 'Activas', value: stats.active, icon: UserCheck, tone: 'text-emerald-600 dark:text-emerald-300' },
              { label: 'Administradores', value: stats.admins, icon: Shield, tone: 'text-amber-600 dark:text-amber-300' },
              { label: 'Sin ficha CRM', value: stats.unlinked, icon: Unlink, tone: 'text-violet-600 dark:text-violet-300' },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 px-4 py-4 sm:px-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 ${stat.tone}`}><stat.icon size={18} /></div>
                <div><p className="text-xl font-black leading-none">{stat.value}</p><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p></div>
              </div>
            ))}
          </div>
        </section>

        {databaseNotice && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-50/80 p-4 text-amber-900 backdrop-blur dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div><p className="text-xs font-black">Configuración pendiente en la base de datos</p><p className="mt-1 text-xs opacity-80">{databaseNotice}</p></div>
          </div>
        )}

        <nav className={`${glassPanel} flex gap-1 p-1.5`} aria-label="Secciones de acceso">
          {([
            { id: 'users' as const, label: 'Personas y cuentas', icon: Users },
            { id: 'roles' as const, label: 'Roles y permisos', icon: KeyRound },
          ]).map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl px-4 text-xs font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-lg dark:bg-white dark:text-slate-950' : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}`}>
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'users' ? (
          <section className="space-y-4">
            <div className={`${glassPanel} grid gap-3 p-3 md:grid-cols-[minmax(260px,1fr)_190px_190px]`}>
              <label className="relative block">
                <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Buscar por nombre, correo o ficha CRM…" className="h-11 w-full rounded-xl border border-slate-200/80 bg-white/70 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-slate-950/50" />
              </label>
              <label className="relative">
                <SlidersHorizontal size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as UserStatusFilter)} className="h-11 w-full appearance-none rounded-xl border border-slate-200/80 bg-white/70 pl-9 pr-3 text-xs font-bold outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/50">
                  <option value="all">Todos los estados</option><option value="active">Activos</option><option value="suspended">Suspendidos</option><option value="linked">Con ficha CRM</option><option value="unlinked">Sin ficha CRM</option>
                </select>
              </label>
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as 'all' | UserRole)} className="h-11 rounded-xl border border-slate-200/80 bg-white/70 px-3 text-xs font-bold outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/50">
                <option value="all">Todos los roles</option>{SYSTEM_ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}
              </select>
            </div>

            <div className="flex items-center justify-between px-1 text-xs text-slate-500 dark:text-slate-400"><span><strong className="text-slate-900 dark:text-white">{filteredProfiles.length}</strong> resultados</span><span>Permisos por rol + excepciones individuales</span></div>

            {loading ? (
              <div className={`${glassPanel} flex min-h-64 items-center justify-center`}><RefreshCw className="animate-spin text-blue-500" size={24} /></div>
            ) : filteredProfiles.length === 0 ? (
              <div className={`${glassPanel} flex min-h-64 flex-col items-center justify-center p-8 text-center`}><CircleUserRound size={34} className="text-slate-300" /><h2 className="mt-3 font-serif text-lg font-bold">No encontramos cuentas</h2><p className="mt-1 text-sm text-slate-500">Prueba con otro nombre o cambia los filtros.</p></div>
            ) : (
              <div className="grid gap-3 xl:grid-cols-2">
                {filteredProfiles.map((profile) => {
                  const assignedRoles = profile.roles?.length ? profile.roles : [profile.role];
                  const assignedCustomRoles = customRoles.filter((role) => profile.custom_role_ids?.includes(role.id));
                  return (
                    <article key={profile.id} className={`${glassPanel} group p-4 transition hover:-translate-y-0.5 hover:border-blue-300/70 hover:shadow-[0_24px_70px_-36px_rgba(37,99,235,0.45)]`}>
                      <div className="flex items-start gap-3">
                        {profile.photo_url ? <img src={profile.photo_url} alt="" className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-slate-200 dark:ring-white/10" /> : <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-sm font-black text-white shadow-lg">{initials(profile)}</div>}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-sm font-black text-slate-900 dark:text-white">{profileName(profile)}</h2>
                            {profile.banned ? <span className="rounded-full border border-rose-400/25 bg-rose-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-300">Suspendido</span> : <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-300">Activo</span>}
                            {profile.id === currentUserId && <span className="text-[9px] font-black uppercase tracking-wider text-blue-500">Tu cuenta</span>}
                          </div>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">{profile.email || 'Sin correo registrado'}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {assignedRoles.map((role) => <span key={role} className={`rounded-full border px-2 py-1 text-[9px] font-black ${getRoleBadgeClass(role)}`}>{getRoleLabel(role)}</span>)}
                            {assignedCustomRoles.map((role) => <span key={role.id} className="rounded-full border px-2 py-1 text-[9px] font-black" style={{ borderColor: `${role.color}55`, backgroundColor: `${role.color}16`, color: role.color }}>{role.name}</span>)}
                            {profile.permissions_override && <span className="rounded-full border border-fuchsia-400/25 bg-fuchsia-500/10 px-2 py-1 text-[9px] font-black text-fuchsia-700 dark:text-fuchsia-300"><Sparkles size={10} className="mr-1 inline" />Excepción</span>}
                          </div>
                        </div>
                        <button type="button" onClick={() => openUserEditor(profile)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/70 text-slate-500 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:hover:bg-blue-500/10 dark:hover:text-blue-300" aria-label={`Administrar acceso de ${profileName(profile)}`}><ChevronRight size={17} /></button>
                      </div>
                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/5">
                        {profile.member ? (
                          <button type="button" onClick={() => void unlinkMember(profile)} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700 hover:text-rose-600 dark:text-emerald-300"><Link2 size={13} /> {profile.member.first_name} {profile.member.last_name}</button>
                        ) : (
                          <button type="button" onClick={() => { setLinkingUser(profile); setMemberSearch(''); }} className="inline-flex items-center gap-1.5 text-[10px] font-bold text-blue-600 hover:text-blue-800 dark:text-blue-300"><Link2 size={13} /> Vincular ficha CRM</button>
                        )}
                        <div className="flex gap-1">
                          <button type="button" onClick={() => openUserEditor(profile)} className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-500/10 hover:text-blue-600" aria-label="Editar acceso"><Pencil size={14} /></button>
                          <button type="button" disabled={profile.id === currentUserId} onClick={() => void toggleBan(profile)} className="rounded-lg p-2 text-slate-400 transition hover:bg-amber-500/10 hover:text-amber-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label={profile.banned ? 'Reactivar cuenta' : 'Suspender cuenta'}>{profile.banned ? <CheckCircle2 size={14} /> : <Ban size={14} />}</button>
                          <button type="button" disabled={profile.id === currentUserId} onClick={() => void deleteUser(profile)} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30" aria-label="Eliminar cuenta"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section className="grid gap-5 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-4">
              <div className={`${glassPanel} p-4`}>
                <div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Roles del sistema</p><p className="mt-1 text-xs text-slate-500">Base compatible con todo el proyecto</p></div><LockKeyhole size={18} className="text-blue-500" /></div>
                <div className="mt-4 max-h-[430px] space-y-1 overflow-y-auto pr-1">
                  {SYSTEM_ROLES.map((role) => (
                    <button key={role.id} type="button" onClick={() => setSelectedSystemRole(role.id)} className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${selectedSystemRole === role.id ? 'border-blue-400/40 bg-blue-500/10 shadow-sm' : 'border-transparent hover:border-slate-200 hover:bg-white/70 dark:hover:border-white/10 dark:hover:bg-white/5'}`}>
                      <div className="flex items-center justify-between gap-2"><span className="text-xs font-black">{role.label}</span>{selectedSystemRole === role.id && <Check size={14} className="text-blue-500" />}</div>
                      <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-500 dark:text-slate-400">{role.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className={`${glassPanel} p-4`}>
                <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">Roles personalizados</p><p className="mt-1 text-xs text-slate-500">Se suman a los roles base</p></div><button type="button" onClick={() => openCustomRoleEditor()} disabled={Boolean(databaseNotice)} className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-white transition hover:-translate-y-0.5 disabled:opacity-40 dark:bg-white dark:text-slate-950" aria-label="Crear rol personalizado"><Plus size={16} /></button></div>
                <div className="mt-4 space-y-2">
                  {customRoles.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-white/15">Todavía no hay roles personalizados.</div> : customRoles.map((role) => {
                    const counts = countPermissionModules(role.permissions);
                    const assigned = profiles.filter((profile) => profile.custom_role_ids?.includes(role.id)).length;
                    return <div key={role.id} className="rounded-xl border border-slate-200/80 bg-white/60 p-3 dark:border-white/10 dark:bg-white/[0.03]"><div className="flex items-start gap-2"><span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: role.color }} /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-xs font-black">{role.name}</p>{!role.is_active && <span className="text-[8px] font-black uppercase text-slate-400">Inactivo</span>}</div><p className="mt-1 text-[10px] text-slate-500">{assigned} cuentas · {counts.edit} módulos editables</p></div><button type="button" onClick={() => openCustomRoleEditor(role)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-500/10 hover:text-blue-600" aria-label={`Editar ${role.name}`}><Pencil size={13} /></button><button type="button" onClick={() => void deleteCustomRole(role)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-600" aria-label={`Eliminar ${role.name}`}><Trash2 size={13} /></button></div></div>;
                  })}
                </div>
              </div>
            </aside>

            <div className={`${glassPanel} overflow-hidden`}>
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 px-5 py-4 dark:border-white/10">
                <div><div className="flex items-center gap-2"><Shield size={18} className="text-blue-500" /><h2 className="font-serif text-lg font-bold">{getRoleLabel(selectedSystemRole)}</h2></div><p className="mt-1 text-xs text-slate-500">Define el acceso predeterminado de todas las cuentas con este rol.</p></div>
                <div className="flex items-center gap-2"><span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-black text-slate-500 dark:bg-white/5">{profiles.filter((profile) => (profile.roles?.length ? profile.roles : [profile.role]).includes(selectedSystemRole)).length} cuentas</span><button type="button" disabled={loadingPermissions || selectedSystemRole === 'admin'} onClick={() => void saveSystemPermissions()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"><Save size={15} /> Guardar</button></div>
              </div>
              <div className="p-4 sm:p-5">
                {selectedSystemRole === 'admin' && <div className="mb-4 flex gap-3 rounded-xl border border-amber-300/40 bg-amber-50/80 p-3 text-xs text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-200"><ShieldCheck size={17} className="shrink-0" /><span>El rol Administrador siempre conserva acceso total. Esta regla evita dejar el panel sin control administrativo.</span></div>}
                {loadingPermissions ? <div className="flex min-h-64 items-center justify-center"><RefreshCw className="animate-spin text-blue-500" /></div> : <PermissionMatrix value={systemPermissions} onChange={setSystemPermissions} disabled={selectedSystemRole === 'admin'} />}
              </div>
            </div>
          </section>
        )}
      </div>

      {selectedUser && (
        <ModalShell title={profileName(selectedUser)} description={selectedUser.email || 'Cuenta sin correo'} icon={UserCog} onClose={() => setSelectedUser(null)} footer={<><button type="button" onClick={() => setSelectedUser(null)} className={softButton}>Cancelar</button><button type="button" disabled={savingUser} onClick={() => void saveUserAccess()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white transition hover:bg-blue-500 disabled:opacity-50"><Save size={15} /> {savingUser ? 'Guardando…' : 'Guardar acceso'}</button></>}>
          <div className="space-y-6">
            <section><div className="mb-3"><h3 className="text-sm font-black">Roles del sistema</h3><p className="mt-1 text-xs text-slate-500">Los permisos de todos los roles seleccionados se acumulan.</p></div><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{SYSTEM_ROLES.map((role) => { const checked = userRoles.includes(role.id); return <label key={role.id} className={`flex cursor-pointer items-start gap-2 rounded-xl border p-3 transition ${checked ? 'border-blue-400/40 bg-blue-500/10' : 'border-slate-200/80 bg-white/50 hover:border-blue-300 dark:border-white/10 dark:bg-white/[0.03]'}`}><input type="checkbox" checked={checked} onChange={() => setUserRoles((current) => current.includes(role.id) ? current.filter((item) => item !== role.id) : [...current, role.id])} className="mt-0.5 h-4 w-4 accent-blue-600" /><span><span className="block text-xs font-black">{role.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-slate-500">{role.description}</span></span></label>; })}</div><label className="mt-3 block text-xs font-bold text-slate-600 dark:text-slate-300">Rol principal<select value={primaryRole} onChange={(event) => { const role = event.target.value as UserRole; setPrimaryRole(role); setUserRoles((current) => current.includes(role) ? current : [...current, role]); }} className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white/70 px-3 text-xs outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/60">{(userRoles.length ? userRoles : (['guest'] as UserRole[])).map((role) => <option key={role} value={role}>{getRoleLabel(role)}</option>)}</select></label></section>

            <section className="border-t border-slate-200/80 pt-5 dark:border-white/10"><div className="mb-3"><h3 className="text-sm font-black">Roles personalizados</h3><p className="mt-1 text-xs text-slate-500">Perfiles de acceso creados para equipos o responsabilidades específicas.</p></div>{customRoles.length ? <div className="grid gap-2 sm:grid-cols-2">{customRoles.map((role) => { const checked = userCustomRoleIds.includes(role.id); return <label key={role.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? 'border-blue-400/40 bg-blue-500/10' : 'border-slate-200/80 dark:border-white/10'}`}><input type="checkbox" checked={checked} disabled={!role.is_active} onChange={() => setUserCustomRoleIds((current) => current.includes(role.id) ? current.filter((id) => id !== role.id) : [...current, role.id])} className="h-4 w-4 accent-blue-600" /><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: role.color }} /><span className="min-w-0"><span className="block truncate text-xs font-black">{role.name}</span><span className="block truncate text-[10px] text-slate-500">{role.is_active ? role.description || 'Rol personalizado' : 'Rol inactivo'}</span></span></label>; })}</div> : <div className="rounded-xl border border-dashed border-slate-300 p-4 text-center text-xs text-slate-400 dark:border-white/15">No hay roles personalizados disponibles.</div>}</section>

            <section className="border-t border-slate-200/80 pt-5 dark:border-white/10"><label className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/[0.06] p-4"><span><span className="flex items-center gap-2 text-sm font-black"><Sparkles size={16} className="text-fuchsia-500" /> Excepción individual</span><span className="mt-1 block text-xs leading-5 text-slate-500">Al activarla, esta matriz reemplaza todos los permisos heredados por roles para esta persona.</span></span><input type="checkbox" checked={useOverride} onChange={(event) => setUseOverride(event.target.checked)} className="h-5 w-5 shrink-0 accent-fuchsia-600" /></label>{useOverride && <div className="mt-3"><PermissionMatrix value={userPermissions} onChange={setUserPermissions} /></div>}</section>

            <section className="border-t border-slate-200/80 pt-5 dark:border-white/10"><div className="mb-3"><h3 className="text-sm font-black">Ministerios autorizados</h3><p className="mt-1 text-xs text-slate-500">Limita el alcance operativo a ministerios o departamentos concretos.</p></div><div className="grid max-h-52 gap-2 overflow-y-auto rounded-2xl border border-slate-200/80 bg-slate-50/60 p-3 sm:grid-cols-2 dark:border-white/10 dark:bg-white/[0.02]">{ministries.length ? ministries.map((ministry) => { const checked = allowedMinistryIds.includes(ministry.id); return <label key={ministry.id} className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition ${checked ? 'border-blue-400/40 bg-blue-500/10' : 'border-transparent hover:bg-white dark:hover:bg-white/5'}`}><input type="checkbox" checked={checked} onChange={() => setAllowedMinistryIds((current) => current.includes(ministry.id) ? current.filter((id) => id !== ministry.id) : [...current, ministry.id])} className="h-4 w-4 accent-blue-600" /><span className="min-w-0 flex-1 truncate">{ministry.name}</span><span className="text-[8px] uppercase text-slate-400">{ministry.category === 'departamento' ? 'Depto.' : 'Min.'}</span></label>; }) : <p className="col-span-2 p-3 text-center text-xs text-slate-400">No hay ministerios registrados.</p>}</div></section>
          </div>
        </ModalShell>
      )}

      {customRoleDraft && (
        <ModalShell title={customRoleDraft.id ? 'Editar rol personalizado' : 'Crear rol personalizado'} description="Define una responsabilidad reutilizable y asígnala a varias cuentas." icon={KeyRound} onClose={() => setCustomRoleDraft(null)} footer={<><button type="button" onClick={() => setCustomRoleDraft(null)} className={softButton}>Cancelar</button>{customRoleDraft.id && <button type="button" onClick={() => { const role = customRoles.find((item) => item.id === customRoleDraft.id); if (role) { setCustomRoleDraft(null); void deleteCustomRole(role); } }} className="inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black text-rose-600 hover:bg-rose-500/10"><Trash2 size={15} /> Eliminar</button>}<button type="button" disabled={savingCustomRole} onClick={() => void saveCustomRole()} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-black text-white hover:bg-blue-500 disabled:opacity-50"><Save size={15} /> {savingCustomRole ? 'Guardando…' : 'Guardar rol'}</button></>}>
          <div className="space-y-5"><div className="grid gap-3 sm:grid-cols-[1fr_130px]"><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Nombre<input value={customRoleDraft.name} onChange={(event) => setCustomRoleDraft((current) => current ? { ...current, name: event.target.value, slug: current.id ? current.slug : slugifyRoleName(event.target.value) } : current)} maxLength={60} placeholder="Ej. Coordinación de eventos" className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 bg-white/70 px-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/60" /></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Color<input type="color" value={customRoleDraft.color} onChange={(event) => setCustomRoleDraft((current) => current ? { ...current, color: event.target.value } : current)} className="mt-1.5 h-11 w-full cursor-pointer rounded-xl border border-slate-200 bg-white p-1.5 dark:border-white/10 dark:bg-slate-950" /></label></div><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Descripción<textarea value={customRoleDraft.description} onChange={(event) => setCustomRoleDraft((current) => current ? { ...current, description: event.target.value } : current)} maxLength={240} rows={3} placeholder="Explica cuándo debe asignarse este rol." className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-white/70 px-3 py-2.5 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950/60" /></label><label className="flex cursor-pointer items-center justify-between rounded-xl border border-slate-200/80 p-3 text-xs font-bold dark:border-white/10"><span><span className="block">Rol activo</span><span className="mt-0.5 block text-[10px] font-normal text-slate-500">Los roles inactivos dejan de otorgar permisos.</span></span><input type="checkbox" checked={customRoleDraft.is_active} onChange={(event) => setCustomRoleDraft((current) => current ? { ...current, is_active: event.target.checked } : current)} className="h-5 w-5 accent-blue-600" /></label><PermissionMatrix value={customRoleDraft.permissions} onChange={(permissions) => setCustomRoleDraft((current) => current ? { ...current, permissions } : current)} /></div>
        </ModalShell>
      )}

      {linkingUser && (
        <ModalShell title="Vincular ficha CRM" description={`Cuenta: ${profileName(linkingUser)}`} icon={Link2} onClose={() => setLinkingUser(null)} size="max-w-xl" footer={<button type="button" onClick={() => setLinkingUser(null)} className={softButton}>Cancelar</button>}>
          <label className="relative block"><Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" /><input autoFocus value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Buscar por nombre o identificación…" className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-950" /></label><div className="mt-3 max-h-[420px] space-y-1 overflow-y-auto">{visibleMembers.length ? visibleMembers.map((member) => <button key={member.id} type="button" onClick={() => void linkMember(member)} className="flex w-full items-center gap-3 rounded-xl border border-transparent p-3 text-left transition hover:border-blue-300 hover:bg-blue-500/[0.06]"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-600 dark:bg-white/5 dark:text-slate-300">{`${member.first_name[0] ?? ''}${member.last_name[0] ?? ''}`}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{member.first_name} {member.last_name}</p><p className="mt-0.5 text-[10px] text-slate-500">{member.dni ? `Identificación: ${member.dni}` : 'Sin identificación registrada'}</p></div><Link2 size={15} className="text-blue-500" /></button>) : <div className="p-8 text-center text-xs text-slate-400">No hay fichas disponibles con esa búsqueda.</div>}</div>
        </ModalShell>
      )}
    </div>
  );
}
