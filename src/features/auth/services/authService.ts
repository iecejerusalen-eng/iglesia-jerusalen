import type { User } from '@supabase/supabase-js';
import { supabase } from '../../../config/supabase';
import { ADMIN_MODULES } from '../../../config/adminModules';
import type { UserRole } from '../../../types';
import type { AuthState } from '../../../store/useAuthStore';
import { toast } from 'sonner';
import { logger } from '../../../utils/logger';
import { mergePermissions, normalizePermissions } from '../../access-control/accessControl';
import type { CustomAccessRole, PermissionMap } from '../../access-control/types';

import { useThemeStore, type AdminPreferences } from '../../../store/useThemeStore';

export interface UserProfile {
  role?: string | null;
  roles?: string[] | null;
  custom_role_ids?: string[] | null;
  first_name?: string | null;
  last_name?: string | null;
  photo_url?: string | null;
  ministry_id?: string | null;
  allowed_ministries?: string[] | null;
  member_id?: string | null;
  email?: string | null;
  banned?: boolean;
  permissions_override?: Record<string, { view: boolean; edit: boolean }> | null;
  resolved_permissions?: Record<string, { view: boolean; edit: boolean }> | null;
  admin_preferences?: AdminPreferences | null;
}

export const defaultFallbackPermissions: Record<string, { view: boolean; edit: boolean }> = ADMIN_MODULES.reduce((acc, m) => {
  acc[m.id] = { view: m.id === 'dashboard', edit: false };
  return acc;
}, {} as Record<string, { view: boolean; edit: boolean }>);

/**
 * Fetches the profile for a given user.
 * Safe and resilient against database schema variations.
 */
export async function fetchOrCreateProfile(user: User) {
  const userId = user.id;
  const userMetadata = user.user_metadata;
  const userEmail = user.email;

  // Fetch existing profile in a single query
  const { data, error } = await supabase
    .from('profiles')
    .select('role, roles, custom_role_ids, first_name, last_name, ministry_id, permissions_override, photo_url, member_id, email, banned, allowed_ministries, admin_preferences')
    .eq('id', userId)
    .maybeSingle();

  let profileData = data;

  const firstName = userMetadata?.first_name || userMetadata?.full_name?.split(' ')[0] || null;
  const lastName = userMetadata?.last_name || userMetadata?.full_name?.split(' ').slice(1).join(' ') || null;

  if (error) {
    logger.error('Error fetching user profile:', error);
    throw error;
  }

  if (!data) {
    // Profile doesn't exist — create one with guest role
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        role: 'guest',
        roles: ['guest'],
        banned: false
      }, { onConflict: 'id' })
      .select('role, roles, custom_role_ids, first_name, last_name, ministry_id, permissions_override, photo_url, member_id, email, banned, allowed_ministries, admin_preferences')
      .single();

    if (insertError) {
      logger.error('Error creating profile:', insertError);
      throw insertError;
    } else {
      profileData = newProfile;
    }
  } else {
    // Profile exists — check if email, first_name, or last_name are missing and update them
    const needsUpdate = !data.email || (!data.first_name && firstName) || (!data.last_name && lastName);
    if (needsUpdate) {
      const updates: Record<string, unknown> = {};
      if (!data.email && userEmail) updates.email = userEmail;
      if (!data.first_name && firstName) updates.first_name = firstName;
      if (!data.last_name && lastName) updates.last_name = lastName;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('role, roles, custom_role_ids, first_name, last_name, ministry_id, permissions_override, photo_url, member_id, email, banned, allowed_ministries, admin_preferences')
        .single();

      if (updateError) {
        logger.warn('No se pudieron completar los datos básicos del perfil:', updateError);
      } else if (updatedProfile) {
        profileData = updatedProfile;
      }
    }
  }

  const rawProfileObj = (profileData || {}) as Record<string, unknown>;
  const resolvedProfile: UserProfile = {
    role: (rawProfileObj.role as string) || 'guest',
    roles: (rawProfileObj.roles as string[]) || ['guest'],
    custom_role_ids: (rawProfileObj.custom_role_ids as string[]) || [],
    first_name: (rawProfileObj.first_name as string) || null,
    last_name: (rawProfileObj.last_name as string) || null,
    ministry_id: (rawProfileObj.ministry_id as string) || null,
    allowed_ministries: (rawProfileObj.allowed_ministries as string[]) || null,
    permissions_override: (rawProfileObj.permissions_override as Record<string, { view: boolean; edit: boolean }>) || null,
    photo_url: (rawProfileObj.photo_url as string) || null,
    member_id: (rawProfileObj.member_id as string) || null,
    email: (rawProfileObj.email as string) || null,
    banned: !!rawProfileObj.banned,
    admin_preferences: (rawProfileObj.admin_preferences as AdminPreferences) || {},
  };

  // Resolve active permissions
  let permissions: PermissionMap | null | undefined = resolvedProfile.permissions_override;
  if (permissions) {
    permissions = { ...defaultFallbackPermissions, ...normalizePermissions(permissions) };
  } else {
    const rolesToLoad = resolvedProfile.roles && resolvedProfile.roles.length > 0
      ? resolvedProfile.roles
      : [resolvedProfile.role];

    if (rolesToLoad.includes('admin')) {
      permissions = ADMIN_MODULES.reduce((acc, m) => {
        acc[m.id] = { view: true, edit: true };
        return acc;
      }, {} as Record<string, { view: boolean; edit: boolean }>);
    } else {
      permissions = { ...defaultFallbackPermissions };
      try {
        const { data: rolePermData, error: roleError } = await supabase
          .from('role_permissions')
          .select('role, permissions')
          .in('role', rolesToLoad);
        
        if (roleError) {
          logger.error('Error loading system role permissions:', roleError);
          throw roleError;
        }
        if (rolePermData) {
          for (const row of rolePermData) {
            const rolePerms = row.permissions || {};
            for (const modId of Object.keys(rolePerms)) {
              if (!permissions[modId]) {
                permissions[modId] = { view: false, edit: false };
              }
              permissions[modId].view = permissions[modId].view || !!rolePerms[modId]?.view;
              permissions[modId].edit = permissions[modId].edit || !!rolePerms[modId]?.edit;
            }
          }
        }
      } catch (err) {
        logger.error('Role permissions lookup failed:', err);
        throw err;
      }

      const customRoleIds = resolvedProfile.custom_role_ids ?? [];
      if (customRoleIds.length > 0) {
        try {
          const { data: customRoleData, error: customRoleError } = await supabase
            .from('access_roles')
            .select('permissions')
            .in('id', customRoleIds)
            .eq('is_active', true);

          if (customRoleError) {
            logger.error('Error loading custom role permissions:', customRoleError);
            throw customRoleError;
          }
          if (customRoleData) {
            permissions = mergePermissions(
              permissions,
              ...(customRoleData ?? []).map((role) => role.permissions as CustomAccessRole['permissions']),
            );
          }
        } catch (err) {
          logger.error('Custom access role lookup failed:', err);
          throw err;
        }
      }
    }
  }

  return {
    ...resolvedProfile,
    resolved_permissions: permissions
  };
}

/**
 * Sets the store state from a profile object.
 */
export function applyProfile(
  set: (state: Partial<AuthState>) => void,
  profile: UserProfile | null | undefined,
  user: User
) {
  if (profile) {
    set({
      user,
      role: profile.role as UserRole,
      userRole: profile.role as UserRole,
      roles: (profile.roles || [profile.role]) as UserRole[],
      firstName: profile.first_name,
      lastName: profile.last_name,
      photoUrl: profile.photo_url || user.user_metadata?.avatar_url || null,
      ministryId: profile.ministry_id,
      allowedMinistries: profile.allowed_ministries || null,
      memberId: profile.member_id || null,
      permissions: profile.resolved_permissions,
      isLoading: false,
    });
    
    // Apply admin preferences if available
    const adminPrefs = profile.admin_preferences;
    if (adminPrefs) {
      useThemeStore.getState().setAdminPreferences(adminPrefs);
    }
  } else {
    set({
      user,
      role: 'guest',
      userRole: 'guest',
      roles: ['guest'],
      firstName: user.user_metadata?.first_name || null,
      lastName: user.user_metadata?.last_name || null,
      photoUrl: user.user_metadata?.avatar_url || null,
      ministryId: null,
      allowedMinistries: null,
      memberId: null,
      permissions: defaultFallbackPermissions,
      isLoading: false,
    });
  }
}

export const checkSessionLogic = async (set: (state: Partial<AuthState>) => void) => {
  set({ isLoading: true });
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const profile = await fetchOrCreateProfile(session.user);
      if (profile.banned) {
        await supabase.auth.signOut();
        set({ user: null, role: null, userRole: null, roles: null, firstName: null, lastName: null, ministryId: null, memberId: null, permissions: null, isLoading: false });
        toast.error('Tu cuenta ha sido suspendida por razones de seguridad.');
        return;
      }
      applyProfile(set, profile, session.user);
    } else {
      set({ user: null, role: null, userRole: null, roles: null, firstName: null, lastName: null, ministryId: null, memberId: null, permissions: null, isLoading: false });
    }
  } catch (error) {
    logger.error('Error checking session:', error);
    toast.error('No se pudo validar tu perfil y permisos. Vuelve a iniciar sesión.');
    set({ user: null, role: null, userRole: null, roles: null, firstName: null, lastName: null, ministryId: null, memberId: null, permissions: null, isLoading: false });
  }
};

export const initializeAuthLogic = (
  set: (state: Partial<AuthState>) => void,
  get: () => AuthState
) => {
  if (get()._authInitialized) return;
  set({ _authInitialized: true, isLoading: true });

  const init = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user);
        if (profile.banned) {
          await supabase.auth.signOut();
          set({ isLoading: false });
          toast.error('Tu cuenta ha sido suspendida por razones de seguridad.');
          return;
        }
        applyProfile(set, profile, session.user);
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      logger.error('Error getting initial session:', err);
      set({ user: null, role: null, userRole: null, roles: null, firstName: null, lastName: null, photoUrl: null, ministryId: null, allowedMinistries: null, memberId: null, permissions: null, isLoading: false });
      toast.error('No se pudo cargar tu perfil y permisos.');
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('[Auth Event]', { event, email: session?.user?.email });

      const currentUser = get().user;

      if (session?.user) {
        if (currentUser && currentUser.id === session.user.id) {
          if (JSON.stringify(currentUser.user_metadata) !== JSON.stringify(session.user.user_metadata)) {
            set({ user: session.user });
          }
          return;
        }

        set({ user: session.user, isLoading: true });
        try {
          const profile = await fetchOrCreateProfile(session.user);
          if (profile.banned) {
            await supabase.auth.signOut();
            set({ isLoading: false });
            toast.error('Tu cuenta ha sido suspendida por razones de seguridad.');
            return;
          }
          applyProfile(set, profile, session.user);
        } catch (err) {
          logger.error('Error in onAuthStateChange profile fetch:', err);
          set({ user: null, role: null, userRole: null, roles: null, firstName: null, lastName: null, photoUrl: null, ministryId: null, allowedMinistries: null, memberId: null, permissions: null, isLoading: false });
          toast.error('No se pudo actualizar tu perfil y permisos.');
        }
      } else {
        set({
          user: null,
          role: null,
          userRole: null,
          roles: null,
          firstName: null,
          lastName: null,
          permissions: null,
          isLoading: false,
        });
      }
    });

    set({ _authSubscription: subscription });
  };

  init();
};
