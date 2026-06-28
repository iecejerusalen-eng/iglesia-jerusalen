import { create } from 'zustand';
import type { User, Subscription } from '@supabase/supabase-js';
import { supabase } from '../config/supabase';
import type { UserRole } from '../types';
import { checkSessionLogic, initializeAuthLogic } from '../features/auth/services/authService';

export interface AuthState {
  user: User | null;
  role: UserRole | null;
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
  setUserRole: (role: UserRole | null) => void;
  setRoles: (roles: UserRole[] | null) => void;
  setMemberId: (memberId: string | null) => void;
  setProfileInfo: (firstName: string | null, lastName: string | null, photoUrl?: string | null) => void;
  logout: () => Promise<void>;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
  initializeAuth: () => void;
}

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
    await supabase.auth.signOut();
    set({ user: null, role: null, userRole: null, roles: null, firstName: null, lastName: null, photoUrl: null, ministryId: null, allowedMinistries: null, memberId: null, permissions: null });
  },
  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, userRole: null, roles: null, firstName: null, lastName: null, photoUrl: null, ministryId: null, allowedMinistries: null, memberId: null, permissions: null });
  },

  checkSession: () => checkSessionLogic(set),
  initializeAuth: () => initializeAuthLogic(set, get),
}));
