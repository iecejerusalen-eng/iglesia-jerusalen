import { create } from 'zustand';
import type { User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { UserRole } from '../types';
import { ADMIN_MODULES } from '../config/adminModules';
import { toast } from 'sonner';

interface AuthState {
  user: User | null;
  role: UserRole | null;
  userRole: UserRole | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  ministryId: string | null;
  allowedMinistries: string[] | null;
  memberId: string | null;
  permissions: Record<string, { view: boolean; edit: boolean }> | null;
  isLoading: boolean;
  _authInitialized: boolean;
  _authSubscription: Subscription | null;
  setUser: (user: User | null) => void;
  setRole: (role: UserRole | null) => void;
  setUserRole: (role: UserRole | null) => void;
  setMemberId: (memberId: string | null) => void;
  setProfileInfo: (firstName: string | null, lastName: string | null, photoUrl?: string | null) => void;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  initializeAuth: () => void;
}

const defaultFallbackPermissions: Record<string, { view: boolean; edit: boolean }> = ADMIN_MODULES.reduce((acc, m) => {
  acc[m.id] = { view: m.id === 'dashboard', edit: false };
  return acc;
}, {} as Record<string, { view: boolean; edit: boolean }>);

/**
 * Fetches the profile (role, first_name, last_name, ministry_id, permissions_override, photo_url, member_id, email, allowed_ministries) for a given user.
 * If the profile doesn't exist, creates a basic 'guest' profile from user metadata and email.
 * If it exists but has missing email/name columns, updates them from metadata.
 */
async function fetchOrCreateProfile(user: User) {
  const userId = user.id;
  const userMetadata = user.user_metadata;
  const userEmail = user.email;

  // Try to fetch existing profile
  const { data, error } = await supabase
    .from('profiles')
    .select('role, first_name, last_name, ministry_id, permissions_override, photo_url, member_id, email, banned, allowed_ministries')
    .eq('id', userId)
    .single();

  let profileData = data;

  const firstName = userMetadata?.first_name || userMetadata?.full_name?.split(' ')[0] || null;
  const lastName = userMetadata?.last_name || userMetadata?.full_name?.split(' ').slice(1).join(' ') || null;

  if (error || !data) {
    // Profile doesn't exist — create one with guest role
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        email: userEmail,
        role: 'guest',
        banned: false
      }, { onConflict: 'id' })
      .select('role, first_name, last_name, ministry_id, permissions_override, photo_url, member_id, email, banned, allowed_ministries')
      .single();

    if (insertError) {
      console.error('Error creating profile:', insertError);
      profileData = { role: 'guest', first_name: firstName, last_name: lastName, ministry_id: null, allowed_ministries: null, permissions_override: null, photo_url: null, member_id: null, email: userEmail, banned: false };
    } else {
      profileData = newProfile;
    }
  } else {
    // Profile exists — check if email, first_name, or last_name are missing and update them
    const needsUpdate = !data.email || (!data.first_name && firstName) || (!data.last_name && lastName);
    if (needsUpdate) {
      const updates: Record<string, any> = {};
      if (!data.email && userEmail) updates.email = userEmail;
      if (!data.first_name && firstName) updates.first_name = firstName;
      if (!data.last_name && lastName) updates.last_name = lastName;

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select('role, first_name, last_name, ministry_id, permissions_override, photo_url, member_id, email, banned, allowed_ministries')
        .single();

      if (!updateError && updatedProfile) {
        profileData = updatedProfile;
      }
    }
  }

  const resolvedProfile = profileData || { role: 'guest', first_name: null, last_name: null, ministry_id: null, allowed_ministries: null, permissions_override: null, photo_url: null, member_id: null, email: null, banned: false };

  // Resolve active permissions
  let permissions = resolvedProfile.permissions_override;
  if (permissions) {
    // Merge user-specific overrides with defaults to support new modules seamlessly
    permissions = { ...defaultFallbackPermissions, ...permissions };
  } else {
    const { data: rolePermData, error: roleError } = await supabase
      .from('role_permissions')
      .select('permissions')
      .eq('role', resolvedProfile.role)
      .single();
    
    if (!roleError && rolePermData) {
      // Merge role-level permissions with defaults to support new modules seamlessly
      permissions = { ...defaultFallbackPermissions, ...rolePermData.permissions };
    } else {
      if (resolvedProfile.role === 'admin') {
        permissions = ADMIN_MODULES.reduce((acc, m) => {
          acc[m.id] = { view: true, edit: true };
          return acc;
        }, {} as Record<string, { view: boolean; edit: boolean }>);
      } else {
        permissions = defaultFallbackPermissions;
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
function applyProfile(
  set: (state: Partial<AuthState>) => void,
  profile: any,
  user: User
) {
  if (profile) {
    set({
      user,
      role: profile.role as UserRole,
      userRole: profile.role as UserRole,
      firstName: profile.first_name,
      lastName: profile.last_name,
      photoUrl: profile.photo_url || user.user_metadata?.avatar_url || null,
      ministryId: profile.ministry_id,
      allowedMinistries: profile.allowed_ministries || null,
      memberId: profile.member_id || null,
      permissions: profile.resolved_permissions,
      isLoading: false,
    });
  } else {
    set({
      user,
      role: 'guest',
      userRole: 'guest',
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  userRole: null,
  firstName: null,
  lastName: null,
  photoUrl: null,
  ministryId: null,
  allowedMinistries: null,
  memberId: null,
  permissions: null,
  isLoading: true,
  _authInitialized: false,
  _authSubscription: null,

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role, userRole: role }),
  setUserRole: (userRole) => set({ userRole, role: userRole }),
  setMemberId: (memberId) => set({ memberId }),
  setProfileInfo: (firstName, lastName, photoUrl) => set((state) => ({ 
    firstName, 
    lastName, 
    photoUrl: photoUrl !== undefined ? photoUrl : state.photoUrl 
  })),

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, userRole: null, firstName: null, lastName: null, photoUrl: null, ministryId: null, allowedMinistries: null, memberId: null, permissions: null });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, userRole: null, firstName: null, lastName: null, photoUrl: null, ministryId: null, allowedMinistries: null, memberId: null, permissions: null });
  },

  checkSession: async () => {
    if (import.meta.env.DEV) {
      const mockUser = {
        id: '2e523d97-61c5-45b5-a424-938be3dddd67',
        email: 'estebanico10@gmail.com',
        user_metadata: {
          first_name: 'Esteban',
          last_name: 'Nicola'
        }
      } as any;
      const mockPermissions = ADMIN_MODULES.reduce((acc, m) => {
        acc[m.id] = { view: true, edit: true };
        return acc;
      }, {} as Record<string, { view: boolean; edit: boolean }>);
      set({
        user: mockUser,
        role: 'admin',
        userRole: 'admin',
        firstName: 'Esteban',
        lastName: 'Nicola',
        allowedMinistries: null,
        permissions: mockPermissions,
        isLoading: false,
      });
      return;
    }
    set({ isLoading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchOrCreateProfile(session.user);
        if (profile.banned) {
          await supabase.auth.signOut();
          set({ user: null, role: null, userRole: null, firstName: null, lastName: null, ministryId: null, memberId: null, permissions: null, isLoading: false });
          toast.error('Tu cuenta ha sido suspendida por razones de seguridad.');
          return;
        }
        applyProfile(set, profile, session.user);
      } else {
        set({ user: null, role: null, userRole: null, firstName: null, lastName: null, ministryId: null, memberId: null, permissions: null, isLoading: false });
      }
    } catch (error) {
      console.error('Error checking session:', error);
      set({ user: null, role: null, userRole: null, firstName: null, lastName: null, ministryId: null, memberId: null, permissions: null, isLoading: false });
    }
  },

  initializeAuth: () => {
    // Prevent double initialization (React 18 StrictMode calls useEffect twice)
    if (get()._authInitialized) return;
    set({ _authInitialized: true, isLoading: true });

    const init = async () => {
      if (import.meta.env.DEV) {
        const mockUser = {
          id: '2e523d97-61c5-45b5-a424-938be3dddd67',
          email: 'estebanico10@gmail.com',
          user_metadata: {
            first_name: 'Esteban',
            last_name: 'Nicola'
          }
        } as any;
        const mockPermissions = ADMIN_MODULES.reduce((acc, m) => {
          acc[m.id] = { view: true, edit: true };
          return acc;
        }, {} as Record<string, { view: boolean; edit: boolean }>);
        set({
          user: mockUser,
          role: 'admin',
          userRole: 'admin',
          firstName: 'Esteban',
          lastName: 'Nicola',
          permissions: mockPermissions,
          isLoading: false,
        });
        return;
      }

      // 1. Get the initial session (catches OAuth redirect tokens from the URL hash)
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
        console.error('Error getting initial session:', err);
        set({ isLoading: false });
      }

      // 2. Listen for future auth changes (sign-in, sign-out, token refresh)
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[Auth Event]', event, session?.user?.email);

        const currentUser = get().user;

        if (session?.user) {
          // If the user ID is the same (e.g. token refresh or window focus), update the session user
          // without triggering the global loading state or profile fetch, preventing component unmounting
          if (currentUser && currentUser.id === session.user.id) {
            set({ user: session.user });
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
            console.error('Error in onAuthStateChange profile fetch:', err);
            set({ isLoading: false });
          }
        } else {
          set({
            user: null,
            role: null,
            userRole: null,
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
  },
}));
