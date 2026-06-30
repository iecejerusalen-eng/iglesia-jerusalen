import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { toast } from 'sonner';
import { logAuditEvent } from '../../../utils/auditLogger';

export interface EnrollmentRequest {
  id: string;
  course_id: string;
  user_id: string;
  status: 'pending' | 'approved' | 'rejected';
  notes: string;
  created_at: string;
  lms_courses?: { title: string };
  profiles?: { first_name: string; last_name: string; email: string };
}

export function useEnrollmentRequests() {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['lms-enrollment-requests'],
    queryFn: async () => {
      const { data: reqData, error: reqError } = await supabase
        .from('lms_enrollment_requests')
        .select(`
          *,
          lms_courses(title)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (reqError) {
        console.error('Error fetching enrollment requests:', reqError);
        toast.error('Error al cargar solicitudes');
        throw reqError;
      }

      if (!reqData || reqData.length === 0) return [];

      const userIds = [...new Set(reqData.map(r => r.user_id))];
      const { data: profData, error: profError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, email')
        .in('id', userIds);

      if (profError) throw profError;

      const mappedRequests = reqData.map(req => {
        const profile = profData?.find(p => p.id === req.user_id);
        return {
          ...req,
          profiles: profile ? {
            first_name: profile.first_name || '',
            last_name: profile.last_name || '',
            email: profile.email || ''
          } : undefined
        };
      });
      return mappedRequests as EnrollmentRequest[];
    },
  });

  const processRequest = useMutation({
    mutationFn: async ({ request, approve }: { request: EnrollmentRequest; approve: boolean }) => {
      if (approve) {
        // Insert student enrollment
        const { error: enrollError } = await supabase
          .from('lms_enrollments')
          .insert([{
            course_id: request.course_id,
            user_id: request.user_id,
            role: 'student'
          }]);
        if (enrollError) throw enrollError;
        
        // Update request status to approved
        const { error: reqError } = await supabase
          .from('lms_enrollment_requests')
          .update({ status: 'approved' })
          .eq('id', request.id);
        if (reqError) throw reqError;
        
      } else {
        // Update request status to rejected
        const { error: reqError } = await supabase
          .from('lms_enrollment_requests')
          .update({ status: 'rejected' })
          .eq('id', request.id);
        if (reqError) throw reqError;
      }

      await logAuditEvent('ENROLLMENT_PROCESS', 'lms_enrollment_requests', request.id, {
        course_id: request.course_id,
        course_title: request.lms_courses?.title || 'Unknown',
        student_id: request.user_id,
        student_name: request.profiles ? `${request.profiles.first_name} ${request.profiles.last_name}` : 'Unknown',
        approved: approve
      });
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ['lms-enrollment-requests'] });
      toast.success(approve ? 'Matrícula aprobada e inscrita con éxito' : 'Matrícula rechazada');
    },
    onError: () => {
      toast.error('Error al procesar la solicitud');
    }
  });

  return {
    requests,
    isLoading,
    processRequest,
  };
}
