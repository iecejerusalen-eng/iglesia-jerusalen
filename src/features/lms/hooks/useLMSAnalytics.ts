import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';

export interface LMSAnalyticsData {
  totalStudents: number;
  activeCourses: number;
  totalCompletions: number;
  averageScore: number;
  enrollmentByCourse: { name: string; count: number }[];
  completionTimeline: { date: string; count: number }[];
}

export function useLMSAnalytics() {
  const [data, setData] = useState<LMSAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch total enrollments
        const { error: enrollError } = await supabase
          .from('lms_enrollments')
          .select('course_id, id, status, created_at');
        
        if (enrollError) throw enrollError;

        // 2. Fetch active courses
        const { data: courses, error: coursesError } = await supabase
          .from('lms_courses')
          .select('id, title, status')
          .eq('status', 'published');
          
        if (coursesError) throw coursesError;

        // 3. Fetch lesson completions
        const { data: completions, error: compError } = await supabase
          .from('lms_lesson_completions')
          .select('id, completed_at, is_completed')
          .eq('is_completed', true);
          
        if (compError) throw compError;

        // 4. Fetch quiz grades for average score
        const { data: grades, error: gradesError } = await supabase
          .from('lms_lesson_quiz_grades')
          .select('score');
          
        if (gradesError) throw gradesError;

        // --- Aggregations ---
        // Actually, we should fetch user_id.
        
        const { data: enrollmentsWithUser } = await supabase
          .from('lms_enrollments')
          .select('course_id, user_id, status, created_at');
          
        const uniqueStudents = enrollmentsWithUser ? new Set(enrollmentsWithUser.map(e => e.user_id)).size : 0;

        const activeCourses = courses ? courses.length : 0;
        const totalCompletions = completions ? completions.length : 0;

        let avgScore = 0;
        if (grades && grades.length > 0) {
          const sum = grades.reduce((acc, curr) => acc + (curr.score || 0), 0);
          avgScore = Math.round((sum / grades.length) * 10) / 10;
        }

        // Enrollment by Course
        const courseMap = new Map<string, string>();
        courses?.forEach(c => courseMap.set(c.id, c.title));

        const enrollmentCounts: Record<string, number> = {};
        enrollmentsWithUser?.forEach(e => {
          if (courseMap.has(e.course_id)) {
            const title = courseMap.get(e.course_id)!;
            enrollmentCounts[title] = (enrollmentCounts[title] || 0) + 1;
          }
        });

        const enrollmentByCourse = Object.keys(enrollmentCounts)
          .map(name => ({ name, count: enrollmentCounts[name] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5); // top 5

        // Completion Timeline (last 30 days)
        const timelineCounts: Record<string, number> = {};
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        completions?.forEach(c => {
          if (c.completed_at) {
            const date = new Date(c.completed_at);
            if (date >= thirtyDaysAgo) {
              const dateString = date.toISOString().split('T')[0];
              timelineCounts[dateString] = (timelineCounts[dateString] || 0) + 1;
            }
          }
        });

        // Fill empty dates
        const completionTimeline = [];
        for (let i = 29; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          const dateString = d.toISOString().split('T')[0];
          completionTimeline.push({
            date: dateString.substring(5), // MM-DD
            count: timelineCounts[dateString] || 0
          });
        }

        setData({
          totalStudents: uniqueStudents,
          activeCourses,
          totalCompletions,
          averageScore: avgScore,
          enrollmentByCourse,
          completionTimeline
        });

      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  return { data, isLoading, error };
}
