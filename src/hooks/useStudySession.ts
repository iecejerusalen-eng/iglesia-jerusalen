import { useEffect, useState } from 'react';
import { supabase } from '../config/supabase';
import { useAuth } from '../features/auth/hooks/useAuth';

export function useStudySession(courseId: string | undefined) {
  const { user } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !courseId) return;

    let currentSessionId: string | null = null;
    let isActive = true;

    // Start a study session when entering the course
    const startSession = async () => {
      try {
        const { data, error } = await supabase
          .from('lms_study_sessions')
          .insert([
            {
              user_id: user.id,
              course_id: courseId,
            }
          ])
          .select('id')
          .single();

        if (error) throw error;
        if (isActive) {
          currentSessionId = data.id;
          setSessionId(data.id);
        }
      } catch (err) {
        console.error('Error starting study session:', err);
      }
    };

    // End the session when leaving or hiding the page
    const endSession = async (sId: string) => {
      try {
        // Calculate duration on the server side using SQL if possible, 
        // but since we need to do it from the client via update:
        // We'll just set ended_at and let a trigger calculate duration, 
        // or we fetch the row, calc it, and update.
        // Let's do a simple update of ended_at and a Postgres function/trigger should handle duration
        // Actually, to keep it simple, we'll calculate on client and send it.
        const { data: session } = await supabase
          .from('lms_study_sessions')
          .select('started_at')
          .eq('id', sId)
          .single();

        if (session && session.started_at) {
          const startedAt = new Date(session.started_at);
          const endedAt = new Date();
          const durationMinutes = Math.floor((endedAt.getTime() - startedAt.getTime()) / 60000);

          await supabase
            .from('lms_study_sessions')
            .update({
              ended_at: endedAt.toISOString(),
              duration_minutes: durationMinutes
            })
            .eq('id', sId);
        }

        // Also track the streak 
        await supabase
          .from('lms_study_streaks')
          .upsert(
            { user_id: user.id, study_date: new Date().toISOString().split('T')[0] }, 
            { onConflict: 'user_id, study_date' }
          );
          
      } catch (err) {
        console.error('Error ending study session:', err);
      }
    };

    startSession();

    // Handle page visibility change (user minimizes browser, switches tabs)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && currentSessionId) {
        endSession(currentSessionId);
      } else if (document.visibilityState === 'visible') {
        startSession(); // Start a new session when returning
      }
    };

    // Handle window unload (user closes tab or navigates away)
    const handleBeforeUnload = () => {
      if (currentSessionId) {
        // use navigator.sendBeacon for reliable delivery if possible, or synchronous fetch.
        // For simplicity, standard async call might fail on unload, but supabase client handles it reasonably well 
        // if we don't await, or we can just rely on the visibility change which fires before unload on mobile/modern browsers.
        endSession(currentSessionId);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      isActive = false;
      if (currentSessionId) {
        endSession(currentSessionId);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, courseId]);

  return { sessionId };
}
