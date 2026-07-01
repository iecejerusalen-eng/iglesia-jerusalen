/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchOrCreateProfile, applyProfile, checkSessionLogic } from './authService';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';

// Mock dependencies
vi.mock('../../../config/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchOrCreateProfile', () => {
    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        first_name: 'John',
        last_name: 'Doe',
      },
    } as any;

    it('returns existing profile if found', async () => {
      const mockProfile = {
        role: 'member',
        roles: ['member'],
        first_name: 'John',
        last_name: 'Doe',
        ministry_id: null,
        email: 'test@example.com',
      };

      // Mock chain: supabase.from().select().eq().single()
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      // Mock role_permissions fetch
      const mockIn = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockSelectPerms = vi.fn().mockReturnValue({ in: mockIn });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockSelect };
        if (table === 'role_permissions') return { select: mockSelectPerms };
        return { select: vi.fn() };
      });

      const result = await fetchOrCreateProfile(mockUser);
      expect(result.role).toBe('member');
      expect(result.first_name).toBe('John');
      expect(mockSingle).toHaveBeenCalled();
    });
    
    it('creates guest profile if user does not exist', async () => {
      // Mock profiles fetch returning error (not found)
      const mockSelectEqSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSelectEqSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
      
      // Mock upsert
      const mockUpsertSingle = vi.fn().mockResolvedValue({
        data: { role: 'guest', roles: ['guest'], first_name: 'John', last_name: 'Doe' },
        error: null
      });
      const mockUpsertSelect = vi.fn().mockReturnValue({ single: mockUpsertSingle });
      const mockUpsert = vi.fn().mockReturnValue({ select: mockUpsertSelect });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockSelect, upsert: mockUpsert };
        return { select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
      });

      const result = await fetchOrCreateProfile(mockUser);
      expect(result.role).toBe('guest');
      expect(mockUpsert).toHaveBeenCalledWith(expect.objectContaining({
        role: 'guest',
        first_name: 'John'
      }), { onConflict: 'id' });
    });
  });

  describe('applyProfile', () => {
    it('sets state based on profile object', () => {
      const setMock = vi.fn();
      const mockProfile = {
        role: 'admin',
        roles: ['admin'],
        first_name: 'Jane',
        resolved_permissions: { dashboard: { view: true, edit: true } }
      };
      
      applyProfile(setMock, mockProfile, {} as any);
      
      expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
        role: 'admin',
        firstName: 'Jane',
        permissions: mockProfile.resolved_permissions,
        isLoading: false
      }));
    });

    it('falls back to guest if no profile provided', () => {
      const setMock = vi.fn();
      applyProfile(setMock, null, { user_metadata: {} } as any);
      
      expect(setMock).toHaveBeenCalledWith(expect.objectContaining({
        role: 'guest',
        roles: ['guest'],
        isLoading: false
      }));
    });
  });

  describe('checkSessionLogic', () => {
    it('signs out and shows toast if profile is banned', async () => {
      const setMock = vi.fn();
      
      // Mock getSession to return a valid session
      (supabase.auth.getSession as any).mockResolvedValue({
        data: { session: { user: { id: 'user-banned', email: 'banned@test.com' } } }
      });

      // Mock fetch profile returning banned: true
      const mockProfile = { 
        banned: true, 
        roles: ['guest'], 
        role: 'guest',
        first_name: 'Banned',
        last_name: 'User',
        email: 'banned@test.com'
      };
      const mockSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'profiles') return { select: mockSelect };
        return { select: vi.fn().mockReturnValue({ in: vi.fn().mockResolvedValue({ data: [], error: null }) }) };
      });

      await checkSessionLogic(setMock);

      expect(supabase.auth.signOut).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith('Tu cuenta ha sido suspendida por razones de seguridad.');
      expect(setMock).toHaveBeenCalledWith(expect.objectContaining({ user: null }));
    });
  });
});
