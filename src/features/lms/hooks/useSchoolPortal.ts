import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { useAuthStore } from '../../../store/useAuthStore';
import type {
  LMSSchool,
  LMSSchoolAccessRequest,
  LMSSchoolMemberRole,
  LMSSchoolMembership,
} from '../../../types';

export type SchoolPortalMode = 'student' | 'teacher';

export interface SchoolPortalSchool extends LMSSchool {
  accessRole: LMSSchoolMemberRole | null;
  accessStatus: 'granted' | 'pending' | 'rejected' | 'none';
  membership: LMSSchoolMembership | null;
  request: LMSSchoolAccessRequest | null;
}

const ADMIN_ROLES = new Set(['admin', 'pastor', 'editor']);

export function useSchoolPortal(mode: SchoolPortalMode) {
  const queryClient = useQueryClient();
  const { user, roles, role: primaryRole } = useAuthStore();
  const effectiveRoles = roles?.length ? roles : primaryRole ? [primaryRole] : [];
  const hasGlobalAccess = effectiveRoles.some((role) => ADMIN_ROLES.has(role));

  const portalQuery = useQuery({
    queryKey: ['lms-school-portal', user?.id, mode, hasGlobalAccess],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<SchoolPortalSchool[]> => {
      if (!user?.id) throw new Error('Debes iniciar sesión para acceder al Aula Virtual.');

      const [schoolsResult, membershipsResult, requestsResult] = await Promise.all([
        supabase
          .from('lms_schools')
          .select('id, name, slug, description, cover_image_url, color, leader_id, ministry_id, is_active, sort_order, created_at, updated_at, school_type, settings')
          .eq('is_active', true)
          .order('sort_order', { ascending: true }),
        supabase
          .from('lms_school_memberships')
          .select('id, school_id, user_id, role, status, level_id, approved_by, joined_at, metadata')
          .eq('user_id', user.id)
          .eq('status', 'active'),
        supabase
          .from('lms_school_access_requests')
          .select('id, school_id, user_id, requested_role, requested_level_id, status, message, decision_note, reviewed_by, reviewed_at, created_at, updated_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
      ]);

      if (schoolsResult.error) throw schoolsResult.error;
      if (membershipsResult.error) throw membershipsResult.error;
      if (requestsResult.error) throw requestsResult.error;

      const memberships = (membershipsResult.data ?? []) as LMSSchoolMembership[];
      const requests = (requestsResult.data ?? []) as LMSSchoolAccessRequest[];

      return (schoolsResult.data ?? []).map((school) => {
        const membership = memberships.find((item) => {
          if (item.school_id !== school.id) return false;
          return mode === 'teacher'
            ? item.role === 'teacher' || item.role === 'coordinator'
            : item.role === 'student';
        }) ?? null;
        const request = requests.find((item) => item.school_id === school.id) ?? null;
        const accessStatus = hasGlobalAccess || membership
          ? 'granted'
          : request?.status === 'pending'
            ? 'pending'
            : request?.status === 'rejected'
              ? 'rejected'
              : 'none';

        return {
          ...school,
          accessRole: hasGlobalAccess ? 'coordinator' : membership?.role ?? null,
          accessStatus,
          membership,
          request,
        } as SchoolPortalSchool;
      });
    },
  });

  const requestAccess = useMutation({
    mutationFn: async ({ schoolId, levelId, message }: { schoolId: string; levelId?: string; message?: string }) => {
      if (!user?.id) throw new Error('Debes iniciar sesión para solicitar acceso.');
      const { error } = await supabase.from('lms_school_access_requests').insert({
        school_id: schoolId,
        user_id: user.id,
        requested_role: mode,
        requested_level_id: levelId || null,
        message: message?.trim() || null,
        status: 'pending',
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['lms-school-portal', user?.id] });
    },
  });

  return {
    schools: portalQuery.data ?? [],
    isLoading: portalQuery.isLoading,
    error: portalQuery.error,
    refetch: portalQuery.refetch,
    requestAccess,
    hasGlobalAccess,
  };
}
