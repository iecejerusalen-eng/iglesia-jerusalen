import { useState, useEffect, Fragment } from 'react';
import { supabase } from '../../config/supabase';
import type { Profile, UserRole } from '../../types';
import { 
  Shield, 
  Search, 
  User, 
  Sliders, 
  Save, 
  X, 
  Info,
  RefreshCw,
  Ban,
  Trash2
} from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import { ADMIN_MODULES, MODULE_GROUPS } from '../../config/adminModules';
import { logAuditEvent } from '../../utils/auditLogger';

const ROLES: { id: UserRole; label: string }[] = [
  { id: 'guest', label: 'Invitado (Guest)' },
  { id: 'member', label: 'Miembro (Member)' },
  { id: 'leader', label: 'Líder de Ministerio' },
  { id: 'apoyo', label: 'Cuerpo de Apoyo' },
  { id: 'multimedia', label: 'Encargado Multimedia' },
  { id: 'editor', label: 'Editor General' },
  { id: 'secretary', label: 'Secretaria/o' },
  { id: 'pastor', label: 'Pastor' },
  { id: 'admin', label: 'Administrador (Admin)' },
];

const UsersManager = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [activeTab, setActiveTab] = useState<'users' | 'roles'>('users');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // CRM Members linking state
  const [members, setMembers] = useState<{ id: string; first_name: string; last_name: string; dni: string | null }[]>([]);
  const [linkingUser, setLinkingUser] = useState<Profile | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');

  // Role Permissions Tab State
  const [selectedRole, setSelectedRole] = useState<UserRole>('pastor');
  const [rolePermissions, setRolePermissions] = useState<Record<string, { view: boolean; edit: boolean }>>({});
  const [loadingRolePerms, setLoadingRolePerms] = useState(false);

  // User Override Modal State
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [useOverride, setUseOverride] = useState(false);
  const [userPermissions, setUserPermissions] = useState<Record<string, { view: boolean; edit: boolean }>>({});
  const [savingUserPerms, setSavingUserPerms] = useState(false);

  useEffect(() => {
    fetchProfiles();
    fetchMembers();
  }, []);

  useEffect(() => {
    if (activeTab === 'roles') {
      fetchRolePermissions(selectedRole);
    }
  }, [activeTab, selectedRole]);

  const fetchProfiles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          member:member_id (
            id,
            first_name,
            last_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error('Error fetching profiles:', err);
      toast.error('Error al cargar los usuarios: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name, dni')
        .is('deleted_at', null)
        .order('last_name', { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) {
      console.error('Error fetching members for select:', err);
    }
  };

  const handleLinkMember = async (userId: string, memberId: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ member_id: memberId, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      const targetUser = profiles.find(p => p.id === userId);
      const linkedMember = members.find(m => m.id === memberId);
      await logAuditEvent('UPDATE', 'profiles', userId, {
        action_detail: 'link_crm_member',
        member_id: memberId,
        member_name: linkedMember ? `${linkedMember.first_name} ${linkedMember.last_name}` : 'Unknown',
        user_email: targetUser?.email || null
      });

      setProfiles(prev =>
        prev.map(p => p.id === userId ? {
          ...p,
          member_id: memberId,
          member: linkedMember ? { id: linkedMember.id, first_name: linkedMember.first_name, last_name: linkedMember.last_name } : null
        } : p)
      );

      toast.success('Cuenta vinculada con éxito al miembro del CRM.');
      setLinkingUser(null);
      setMemberSearchQuery('');
    } catch (err: any) {
      console.error('Error linking member:', err);
      toast.error('No se pudo vincular la cuenta: ' + err.message);
    }
  };

  const handleUnlinkMember = async (userId: string) => {
    const confirmed = await confirm({
      title: 'Desvincular Miembro',
      message: '¿Estás seguro de desvincular esta cuenta de su ficha de miembro en el CRM?',
      confirmText: 'Desvincular',
      cancelText: 'Cancelar',
      variant: 'warning',
    });
    if (!confirmed) return;
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ member_id: null, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      const targetUser = profiles.find(p => p.id === userId);
      await logAuditEvent('UPDATE', 'profiles', userId, {
        action_detail: 'unlink_crm_member',
        old_member_id: targetUser?.member_id || null,
        user_email: targetUser?.email || null
      });

      setProfiles(prev =>
        prev.map(p => p.id === userId ? { ...p, member_id: null, member: null } : p)
      );

      toast.success('Cuenta desvinculada con éxito.');
    } catch (err: any) {
      console.error('Error unlinking member:', err);
      toast.error('No se pudo desvincular la cuenta: ' + err.message);
    }
  };

  const fetchRolePermissions = async (role: UserRole) => {
    setLoadingRolePerms(true);
    try {
      const { data, error } = await supabase
        .from('role_permissions')
        .select('permissions')
        .eq('role', role)
        .single();

      if (error) {
        // If it doesn't exist, start with empty permissions
        const empty: Record<string, { view: boolean; edit: boolean }> = {};
        ADMIN_MODULES.forEach(m => {
          empty[m.id] = { view: false, edit: false };
        });
        setRolePermissions(empty);
      } else {
        setRolePermissions(data.permissions || {});
      }
    } catch (err: any) {
      console.error('Error fetching role permissions:', err);
      toast.error('Error al cargar los permisos del rol');
    } finally {
      setLoadingRolePerms(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      const targetUser = profiles.find(p => p.id === userId);
      await logAuditEvent('ROLE_CHANGE', 'profiles', userId, {
        target_email: targetUser?.email || null,
        new_role: newRole,
        old_role: targetUser?.role || null
      });

      setProfiles(prev => 
        prev.map(p => p.id === userId ? { ...p, role: newRole } : p)
      );

      toast.success('Rol de usuario actualizado con éxito');
    } catch (err: any) {
      console.error('Error updating user role:', err);
      toast.error('No se pudo actualizar el rol: ' + err.message);
    }
  };

  // Role permissions saving
  const handleSaveRolePermissions = async () => {
    if (selectedRole === 'admin') {
      toast.warning('Los administradores siempre tienen todos los permisos activados.');
      return;
    }
    
    setLoadingRolePerms(true);
    try {
      const { error } = await supabase
        .from('role_permissions')
        .upsert({
          role: selectedRole,
          permissions: rolePermissions,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success(`Permisos para el rol ${selectedRole} guardados con éxito`);
    } catch (err: any) {
      console.error('Error saving role permissions:', err);
      toast.error('Error al guardar los permisos: ' + err.message);
    } finally {
      setLoadingRolePerms(false);
    }
  };

  // Toggle role view/edit checkboxes locally
  const handleRolePermToggle = (moduleId: string, type: 'view' | 'edit') => {
    if (selectedRole === 'admin') return;

    setRolePermissions(prev => {
      const current = prev[moduleId] || { view: false, edit: false };
      const nextVal = !current[type];
      
      // If view is turned off, edit must also be turned off
      let nextEdit = current.edit;
      let nextView = current.view;
      
      if (type === 'view') {
        nextView = nextVal;
        if (!nextVal) nextEdit = false;
      } else {
        nextEdit = nextVal;
        // If edit is turned on, view must also be turned on
        if (nextVal) nextView = true;
      }

      return {
        ...prev,
        [moduleId]: { view: nextView, edit: nextEdit }
      };
    });
  };

  // Open User override modal
  const handleOpenOverrideModal = (profile: Profile) => {
    setSelectedUser(profile);
    const override = profile.permissions_override;
    if (override) {
      setUseOverride(true);
      setUserPermissions(override);
    } else {
      setUseOverride(false);
      // Initialize with empty checkboxes
      const empty: Record<string, { view: boolean; edit: boolean }> = {};
      ADMIN_MODULES.forEach(m => {
        empty[m.id] = { view: false, edit: false };
      });
      setUserPermissions(empty);
    }
  };

  const handleUserPermToggle = (moduleId: string, type: 'view' | 'edit') => {
    setUserPermissions(prev => {
      const current = prev[moduleId] || { view: false, edit: false };
      const nextVal = !current[type];
      
      let nextEdit = current.edit;
      let nextView = current.view;
      
      if (type === 'view') {
        nextView = nextVal;
        if (!nextVal) nextEdit = false;
      } else {
        nextEdit = nextVal;
        if (nextVal) nextView = true;
      }

      return {
        ...prev,
        [moduleId]: { view: nextView, edit: nextEdit }
      };
    });
  };

  const handleSaveUserOverride = async () => {
    if (!selectedUser) return;
    setSavingUserPerms(true);
    
    const finalOverride = useOverride ? userPermissions : null;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          permissions_override: finalOverride,
          updated_at: new Date().toISOString() 
        })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Update state locally
      setProfiles(prev =>
        prev.map(p => p.id === selectedUser.id ? { ...p, permissions_override: finalOverride } : p)
      );

      toast.success('Permisos personalizados guardados con éxito');
      setSelectedUser(null);
    } catch (err: any) {
      console.error('Error saving user override:', err);
      toast.error('Error al guardar los permisos del usuario: ' + err.message);
    } finally {
      setSavingUserPerms(false);
    }
  };

  const handleToggleBan = async (profile: Profile) => {
    const actionText = profile.banned ? 'activar' : 'suspender/banear';
    const confirmed = await confirm({
      title: profile.banned ? 'Activar Usuario' : 'Suspender Usuario',
      message: `¿Estás seguro de que deseas ${actionText} a ${profile.first_name || ''} ${profile.last_name || ''}?`,
      confirmText: profile.banned ? 'Activar' : 'Suspender',
      cancelText: 'Cancelar',
      variant: profile.banned ? 'info' : 'danger',
    });
    if (!confirmed) return;

    try {
      const nextBanned = !profile.banned;
      const { error } = await supabase
        .from('profiles')
        .update({ banned: nextBanned, updated_at: new Date().toISOString() })
        .eq('id', profile.id);

      if (error) throw error;

      setProfiles(prev =>
        prev.map(p => p.id === profile.id ? { ...p, banned: nextBanned } : p)
      );

      toast.success(`Usuario ${nextBanned ? 'suspendido' : 'activado'} exitosamente.`);
    } catch (err: any) {
      console.error('Error toggling user ban:', err);
      toast.error('Error al cambiar estado de suspensión: ' + err.message);
    }
  };

  const handleDeleteUser = async (profile: Profile) => {
    const confirmed = await confirm({
      title: '¡ADVERTENCIA DE SEGURIDAD CRÍTICA!',
      message: `¿Estás seguro de que deseas eliminar permanentemente a ${profile.first_name || ''} ${profile.last_name || ''}?\n\nEsta acción eliminará tanto su perfil como su cuenta de inicio de sesión y no se puede deshacer.`,
      confirmText: 'Sí, Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    try {
      const { error } = await supabase.rpc('delete_user_by_admin', { target_user_id: profile.id });

      if (error) throw error;

      setProfiles(prev => prev.filter(p => p.id !== profile.id));
      toast.success('Usuario eliminado permanentemente.');
    } catch (err: any) {
      console.error('Error deleting user:', err);
      toast.error('Error al eliminar usuario: ' + err.message);
    }
  };

  // Filter profiles based on search term
  const filteredProfiles = profiles.filter(profile => {
    const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.toLowerCase();
    const email = profile.email ? profile.email.toLowerCase() : '';
    const term = searchTerm.toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-gray-150 dark:border-white/10">
        <div>
          <h1 className="text-2xl font-serif font-bold text-primary flex items-center gap-2">
            <Shield className="text-gold" />
            Gestión de Usuarios y Roles (RBAC)
          </h1>
          <p className="text-gray-400 text-xs mt-1">
            Controla y define el acceso modular de los miembros de tu equipo a las áreas del panel administrativo.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-white/10">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'users'
              ? 'border-gold text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Usuarios ({filteredProfiles.length})
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-5 py-2.5 font-medium text-sm border-b-2 transition-colors cursor-pointer ${
            activeTab === 'roles'
              ? 'border-gold text-primary font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Matriz de Permisos por Rol
        </button>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Search Bar */}
          <div className="flex items-center gap-3 max-w-md bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-white/10 px-3.5 py-2 shadow-xs">
            <Search className="text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-sm bg-transparent focus:outline-none text-gray-700 dark:text-gray-300"
            />
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-450 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-4">Usuario</th>
                    <th className="px-6 py-4">Correo Electrónico</th>
                    <th className="px-6 py-4">Miembro CRM</th>
                    <th className="px-6 py-4 text-center">Rol Asignado</th>
                    <th className="px-6 py-4 text-center">Permisos Adicionales</th>
                    <th className="px-6 py-4 text-center">Acciones de Seguridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-400">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, idx) => (
                      <tr key={idx} className="animate-pulse">
                        <td className="px-6 py-5"><div className="h-4 w-32 bg-gray-100 rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-4 w-48 bg-gray-100 rounded"></div></td>
                        <td className="px-6 py-5"><div className="h-4 w-40 bg-gray-100 rounded"></div></td>
                        <td className="px-6 py-5 text-center"><div className="h-8 w-28 bg-gray-100 rounded mx-auto"></div></td>
                        <td className="px-6 py-5 text-center"><div className="h-8 w-24 bg-gray-100 rounded mx-auto"></div></td>
                        <td className="px-6 py-5 text-center"><div className="h-8 w-36 bg-gray-100 rounded mx-auto"></div></td>
                      </tr>
                    ))
                  ) : filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                        No se encontraron usuarios registrados.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <tr key={profile.id} className={`hover:bg-gray-50/50 transition-colors ${profile.banned ? 'bg-red-50/25' : ''}`}>
                        <td className="px-6 py-4.5 font-semibold text-gray-800 dark:text-gray-100">
                          <div className="flex items-center gap-2">
                            <span>
                              {profile.first_name || profile.last_name 
                                ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
                                : 'Sin nombre registrado'}
                            </span>
                            {profile.banned && (
                              <span className="bg-red-100 text-red-800 text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5 select-none">
                                <Ban size={10} />
                                Suspendido
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-gray-500 dark:text-gray-450 font-mono text-xs">
                          {profile.email || 'Sin correo registrado'}
                        </td>
                        <td className="px-6 py-4.5">
                          {profile.member ? (
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-800 dark:text-gray-100 text-xs sm:text-sm">
                                {profile.member.first_name} {profile.member.last_name}
                              </span>
                              <button
                                onClick={() => handleUnlinkMember(profile.id)}
                                className="text-red-500 hover:text-red-700 text-[10px] font-bold cursor-pointer underline hover:no-underline"
                                title="Desvincular ficha del CRM"
                              >
                                Desvincular
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setLinkingUser(profile);
                                setMemberSearchQuery('');
                              }}
                              className="text-[10px] bg-blue-50 hover:bg-blue-100 text-primary border border-blue-150 px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                            >
                              🔗 Vincular Ficha
                            </button>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <select
                            value={profile.role}
                            disabled={profile.role === 'admin'}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value as UserRole)}
                            className="px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 focus:outline-none capitalize shadow-xs cursor-pointer inline-block disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {ROLES.map((r) => (
                              <option key={r.id} value={r.id}>{r.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <button
                            onClick={() => handleOpenOverrideModal(profile)}
                            disabled={profile.role === 'admin'}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                              profile.permissions_override
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : 'bg-white hover:bg-gray-50 text-gray-600 border-gray-200'
                            }`}
                          >
                            <Sliders size={12} />
                            {profile.permissions_override ? 'Personalizados' : 'Por Defecto'}
                          </button>
                        </td>
                        <td className="px-6 py-4.5 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {profile.role !== 'admin' ? (
                              <>
                                <button
                                  onClick={() => handleToggleBan(profile)}
                                  className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs border cursor-pointer ${
                                    profile.banned
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                                      : 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                  }`}
                                  title={profile.banned ? 'Activar acceso del usuario' : 'Suspender temporalmente al usuario'}
                                >
                                  <Ban size={12} />
                                  {profile.banned ? 'Activar' : 'Suspender'}
                                </button>
                                <button
                                  onClick={() => handleDeleteUser(profile)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border border-red-700"
                                  title="Eliminar permanentemente del sistema"
                                >
                                  <Trash2 size={12} />
                                  Eliminar
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider select-none">Inmune</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ROLE PERMISSIONS TAB */
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-150 dark:border-white/10 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-base font-serif font-bold text-primary">Permisos modular por Roles</h2>
              <p className="text-xs text-gray-400">Selecciona un rol para configurar los permisos de lectura y escritura predeterminados.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <label className="text-xs font-semibold text-gray-500 dark:text-gray-450">Seleccionar Rol:</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="px-3 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer shadow-xs"
              >
                {ROLES.filter(r => r.id !== 'admin').map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingRolePerms ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <RefreshCw className="animate-spin" size={24} />
              <span className="text-xs font-medium">Cargando matriz de permisos...</span>
            </div>
          ) : (
            <div className="border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-450 font-semibold text-xs uppercase tracking-wider">
                    <th className="px-6 py-3.5">Módulo Administrativo</th>
                    <th className="px-6 py-3.5 text-center w-36">Ver (view)</th>
                    <th className="px-6 py-3.5 text-center w-36">Editar/Crear (edit)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-400">
                  {MODULE_GROUPS.map((group) => {
                    const groupModules = ADMIN_MODULES.filter(m => m.group === group.key);
                    return (
                      <Fragment key={group.key}>
                        {/* Group Separator Row */}
                        <tr className="bg-gray-50/80 dark:bg-slate-950/60 font-bold border-b border-gray-150 dark:border-white/10">
                          <td colSpan={3} className="px-6 py-2.5 text-xs text-primary dark:text-gold uppercase tracking-wider font-extrabold">
                            <div className="flex items-center gap-2">
                              <group.icon size={14} className="text-gold" />
                              <span>{group.label}</span>
                            </div>
                          </td>
                        </tr>
                        {groupModules.map((mod) => {
                          const perm = rolePermissions[mod.id] || { view: false, edit: false };
                          return (
                            <tr key={mod.id} className="hover:bg-gray-50/50 transition-colors">
                              <td className="px-8 py-3.5">
                                <span className="font-semibold text-gray-800 dark:text-gray-100 text-xs sm:text-sm">{mod.label}</span>
                                <span className="text-[10px] text-gray-400 block font-mono mt-0.5">Clave: {mod.id}</span>
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.view}
                                  onChange={() => handleRolePermToggle(mod.id, 'view')}
                                  className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                />
                              </td>
                              <td className="px-6 py-3.5 text-center">
                                <input
                                  type="checkbox"
                                  checked={perm.edit}
                                  disabled={!perm.view}
                                  onChange={() => handleRolePermToggle(mod.id, 'edit')}
                                  className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4">
            <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5 bg-gray-50 dark:bg-slate-950 p-2.5 rounded-lg border border-gray-100 dark:border-white/5 max-w-lg">
              <Info size={16} className="text-primary flex-shrink-0" />
              Al activar "Editar", se otorgará automáticamente el permiso "Ver". Al desactivar "Ver", se revocará "Editar".
            </span>
            <button
              onClick={handleSaveRolePermissions}
              disabled={loadingRolePerms}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all disabled:opacity-55 cursor-pointer"
            >
              <Save size={14} />
              Guardar Permisos de Rol
            </button>
          </div>
        </div>
      )}

      {/* USER OVERRIDE DIALOG / MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-150 dark:border-white/10 flex items-center justify-between bg-primary text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  <User size={18} />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base">
                    Permisos de {selectedUser.first_name || ''} {selectedUser.last_name || ''}
                  </h3>
                  <p className="text-[10px] text-gray-300 font-mono mt-0.5">{selectedUser.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedUser(null)}
                className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Toggle override */}
              <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-950 rounded-xl border border-gray-150 dark:border-white/10">
                <div className="space-y-0.5">
                  <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-100">Personalizar permisos de este usuario</span>
                  <p className="text-[10px] text-gray-400">Si se desactiva, el usuario usará los permisos por defecto de su rol ({selectedUser.role}).</p>
                </div>
                <input
                  type="checkbox"
                  checked={useOverride}
                  onChange={(e) => setUseOverride(e.target.checked)}
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {/* Matrix view if override is enabled */}
              {useOverride && (
                <div className="border border-gray-150 dark:border-white/10 rounded-xl overflow-hidden">
                  <table className="w-full text-left border-collapse text-xs sm:text-sm">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-slate-950 border-b border-gray-150 dark:border-white/10 text-gray-500 dark:text-gray-450 font-semibold text-[10px] sm:text-xs uppercase tracking-wider">
                        <th className="px-4 py-2.5">Módulo</th>
                        <th className="px-4 py-2.5 text-center w-28">Ver (view)</th>
                        <th className="px-4 py-2.5 text-center w-28">Editar (edit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-gray-650 dark:text-gray-400">
                      {MODULE_GROUPS.map((group) => {
                        const groupModules = ADMIN_MODULES.filter(m => m.group === group.key);
                        return (
                          <Fragment key={group.key}>
                            {/* Group Separator Row */}
                            <tr className="bg-gray-50/80 dark:bg-slate-950/60 font-bold border-b border-gray-150 dark:border-white/10">
                              <td colSpan={3} className="px-4 py-1.5 text-[10px] text-primary dark:text-gold uppercase tracking-wider font-extrabold">
                                <div className="flex items-center gap-1.5">
                                  <group.icon size={12} className="text-gold" />
                                  <span>{group.label}</span>
                                </div>
                              </td>
                            </tr>
                            {groupModules.map((mod) => {
                              const perm = userPermissions[mod.id] || { view: false, edit: false };
                              return (
                                <tr key={mod.id} className="hover:bg-gray-50/20 transition-colors">
                                  <td className="px-6 py-2 font-medium text-gray-850">
                                    {mod.label}
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.view}
                                      onChange={() => handleUserPermToggle(mod.id, 'view')}
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                                    />
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={perm.edit}
                                      disabled={!perm.view}
                                      onChange={() => handleUserPermToggle(mod.id, 'edit')}
                                      className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                    />
                                  </td>
                                </tr>
                              );
                            })}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-5 bg-gray-50 dark:bg-slate-950 border-t border-gray-150 dark:border-white/10 flex justify-end gap-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 hover:bg-gray-100 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-semibold text-gray-500 dark:text-gray-450 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUserOverride}
                disabled={savingUserPerms}
                className="flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs shadow-md transition-all disabled:opacity-55 cursor-pointer"
              >
                {savingUserPerms ? 'Guardando...' : 'Guardar Permisos'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* LINK CRM MEMBER DIALOG / MODAL */}
      {linkingUser && (() => {
        const filteredList = members.filter(m => {
          const fullName = `${m.first_name || ''} ${m.last_name || ''}`.toLowerCase();
          const dni = (m.dni || '').toLowerCase();
          const query = memberSearchQuery.toLowerCase();
          return fullName.includes(query) || dni.includes(query);
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-scaleIn text-left">
              
              {/* Modal Header */}
              <div className="p-5 border-b border-gray-150 dark:border-white/10 flex items-center justify-between bg-primary text-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif font-bold text-base">
                    Vincular Cuenta a Miembro CRM
                  </h3>
                </div>
                <button 
                  onClick={() => setLinkingUser(null)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-4 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-950 flex-grow">
                <p className="text-xs text-gray-500 dark:text-gray-450 leading-relaxed">
                  Asocia la cuenta de <strong>{linkingUser.email}</strong> con su ficha de miembro correspondiente del CRM. Esto unifica sus aportes, roles e historial en un solo perfil y evita datos duplicados.
                </p>

                {/* Search Bar */}
                <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-gray-250 rounded-xl px-3 py-2 shadow-2xs flex-shrink-0">
                  <Search size={16} className="text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar miembro por nombre o DNI/Cédula..."
                    value={memberSearchQuery}
                    onChange={(e) => setMemberSearchQuery(e.target.value)}
                    className="w-full text-xs bg-transparent focus:outline-none text-gray-700 dark:text-gray-300 font-semibold"
                  />
                </div>

                {/* Members List */}
                <div className="border border-gray-200 dark:border-white/10 rounded-xl divide-y divide-gray-100 dark:divide-white/5 overflow-y-auto max-h-[260px] bg-white dark:bg-slate-900 shadow-2xs flex-grow min-h-0">
                  {filteredList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-400 font-medium">
                      No se encontraron miembros registrados en el CRM.
                    </div>
                  ) : (
                    filteredList.map((m) => (
                      <div key={m.id} className="p-3 hover:bg-gray-50/50 flex items-center justify-between transition-colors">
                        <div>
                          <span className="font-bold text-xs text-gray-800 dark:text-gray-100 block">
                            {m.first_name} {m.last_name}
                          </span>
                          <span className="text-[10px] text-gray-400 font-mono font-semibold">
                            Cédula/DNI: {m.dni || 'Sin registrar'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleLinkMember(linkingUser.id, m.id)}
                          className="text-[10px] font-extrabold text-white bg-primary hover:bg-blue-900 px-3.5 py-2 rounded-lg transition-all cursor-pointer shadow-sm shadow-primary/10"
                        >
                          Vincular Ficha
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-150 dark:border-white/10 flex justify-end flex-shrink-0">
                <button
                  onClick={() => setLinkingUser(null)}
                  className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-450 cursor-pointer transition-colors"
                >
                  Cerrar
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default UsersManager;
