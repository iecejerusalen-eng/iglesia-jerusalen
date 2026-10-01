import { create } from 'zustand';
import type { User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { UserRole } from '../types';
import { checkSessionLogic, initializeAuthLogic } from '../features/auth/services/authService';

export interface AuthState {
  user: User | null;
  /** Rol principal del usuario. Usar siempre este campo. */
  role: UserRole | null;
  /** @deprecated Alias de `role` mantenido por compatibilidad. Usar `role` directamente. */
  userRole: UserRole | null;
  roles: UserRole[] | null;
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
  /** @deprecated Usar `setRole` directamente. */
  setUserRole: (role: UserRole | null) => void;
  setRoles: (roles: UserRole[] | null) => void;
  setMemberId: (memberId: string | null) => void;
  setProfileInfo: (firstName: string | null, lastName: string | null, photoUrl?: string | null) => void;
  /** Cierra la sesión del usuario, cancela el listener de auth y limpia el estado. */
  logout: () => Promise<void>;
  /** @deprecated Alias de `logout`. Usar `logout` directamente. */
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  initializeAuth: () => void;
}

/** Estado vacío centralizado para limpiar la sesión sin duplicación */
const SESSION_CLEARED_STATE: Partial<AuthState> = {
  user: null,
  role: null,
  userRole: null,
  roles: null,
  firstName: null,
  lastName: null,
  photoUrl: null,
  ministryId: null,
  allowedMinistries: null,
  memberId: null,
  permissions: null,
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  role: null,
  userRole: null,
  roles: null,
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
  setRoles: (roles) => set({ roles }),
  setMemberId: (memberId) => set({ memberId }),
  setProfileInfo: (firstName, lastName, photoUrl) => set((state) => ({ 
    firstName, 
    lastName, 
    photoUrl: photoUrl !== undefined ? photoUrl : state.photoUrl 
  })),

  logout: async () => {
    // Cancelar el listener de onAuthStateChange antes de cerrar sesión
    // para evitar que se dispare el evento SIGNED_OUT y genere un ciclo redundante
    const subscription = get()._authSubscription;
    if (subscription) {
      subscription.unsubscribe();
      set({ _authSubscription: null, _authInitialized: false });
    }
    await supabase.auth.signOut();
    set(SESSION_CLEARED_STATE);
  },

  signOut: async () => {
    // Alias de logout por compatibilidad con código existente
    return get().logout();
  },

  checkSession: () => checkSessionLogic(set),
  initializeAuth: () => initializeAuthLogic(set, get),
}));
