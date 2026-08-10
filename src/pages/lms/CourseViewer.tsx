import React, { useCallback, useEffect, useMemo, useState } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  ArrowLeft, CheckCircle, ChevronRight, FileText, 
  Menu, Send, 
  User, Loader2, MessageSquare, Award
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import RichTextRenderer from "../../components/common/RichTextRenderer";
import confetti from "canvas-confetti";
import { CourseDashboard } from "../../features/lms/components/CourseDashboard";
import { SyncLinksManager } from "../../features/lms/components/SyncLinksManager";
import { AssignmentDropzone } from "../../features/lms/components/AssignmentDropzone";
import { ForumViewer } from "../../features/lms/components/ForumViewer";
import { Leaderboard } from "../../features/lms/components/Leaderboard";
import { CircularProgress } from "../../components/ui/CircularProgress";
import { NextUpWidget } from "../../features/student-dashboard/components/NextUpWidget";
import { QuizPlayer } from "../../features/student-dashboard/components/QuizPlayer";
import { CourseCalendarTab } from "../../features/lms/CourseCalendarTab";
import { CourseGradesTab } from "../../features/lms/CourseGradesTab";
import { CourseActivitiesTab } from "../../features/lms/CourseActivitiesTab";
import { CourseClassmatesTab } from "../../features/lms/CourseClassmatesTab";
import { CourseSidebar } from "../../features/lms/components/CourseSidebar";
import type { LMSCourse, LMSLesson, LMSModule } from '../../types';

interface CourseViewCourse extends LMSCourse {
  course_code?: string | null;
  long_description?: string | null;
}

interface CourseViewLesson extends Omit<LMSLesson, 'settings'> {
  estimated_minutes?: number | null;
  settings?: (Record<string, unknown> & { file_url?: string }) | null;
}

interface ForumPostProfile {
  first_name: string;
  last_name: string;
  photo_url: string | null;
  role: string | null;
  roles: string[];
}

interface ForumPostView {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles: ForumPostProfile | null;
}

export default function CourseViewer() {
  const { id } = useParams<{ id: string }>();
  const { user, role, roles } = useAuthStore();
  const userId = user?.id;
  const userRoles = useMemo(() => roles || (role ? [role] : []), [role, roles]);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<CourseViewCourse | null>(null);
  const [modules, setModules] = useState<LMSModule[]>([]);
  const [lessons, setLessons] = useState<CourseViewLesson[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [badgeAwarded, setBadgeAwarded] = useState(false);
  const [certificateId, setCertificateId] = useState<string | null>(null);

  // Active state
  const [activeLesson, setActiveLesson] = useState<CourseViewLesson | null>(null);
  const [activeTabId, setActiveTabId] = useState<string>("general");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Forum State
  const [forumPosts, setForumPosts] = useState<ForumPostView[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postingToForum, setPostingToForum] = useState(false);

  // Quiz State
  const [, setQuizSubmitted] = useState(false);
  const [, setQuizScore] = useState<number | null>(null);

  const [isLegacyCourse, setIsLegacyCourse] = useState(false);

  const fetchCourseOutline = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from("lms_courses")
        .select("*")
        .eq("id", id)
        .single();

      if (courseError) throw courseError;
      setCourse(courseData);

      // 2. El acceso depende de una matrícula o asignación real al curso.
      if (!userId) {
        navigate('/login');
        return;
      }
      const hasGlobalAcademicAccess = userRoles.some((currentRole) => ['admin', 'pastor', 'editor'].includes(currentRole));
      if (!hasGlobalAcademicAccess) {
        const [enrollmentResult, teacherResult] = await Promise.all([
          supabase
            .from("lms_enrollments")
            .select("id")
            .eq("course_id", id)
            .eq("user_id", userId)
            .or('status.eq.active,status.is.null')
            .maybeSingle(),
          supabase
            .from('lms_course_teachers')
            .select('id')
            .eq('course_id', id)
            .eq('user_id', userId)
            .maybeSingle(),
        ]);
        if (enrollmentResult.error) throw enrollmentResult.error;
        if (teacherResult.error) throw teacherResult.error;

        if (!enrollmentResult.data && !teacherResult.data) {
          toast.error("No estás matriculado en este curso.");
          navigate("/lms/estudiante");
          return;
        }
      }

      // 3. Fetch user completions on mount
      const [lessonCompRes, actCompRes] = await Promise.all([
        supabase
          .from("lms_lesson_completions")
          .select("lesson_id, is_completed")
          .eq("student_id", userId),
        supabase
          .from("lms_activity_completions")
          .select("activity_id, is_completed")
          .eq("student_id", userId),
      ]);

      const compMap: Record<string, boolean> = {};
      if (lessonCompRes.data) {
        for (const item of lessonCompRes.data) {
          if (item.is_completed && item.lesson_id) {
            compMap[item.lesson_id] = true;
          }
        }
      }
      if (actCompRes.data) {
        for (const item of actCompRes.data) {
          if (item.is_completed && item.activity_id) {
            compMap[item.activity_id] = true;
          }
        }
      }
      setCompletions(compMap);

      // Check existing certificate for this student and course
      try {
        const { data: existingCert } = await supabase
          .from("lms_certificates")
          .select("id, code_url")
          .eq("course_id", id)
          .eq("user_id", userId)
          .maybeSingle();

        if (existingCert) {
          setCertificateId(existingCert.id || existingCert.code_url);
        } else {
          const { data: existingIssued } = await supabase
            .from("lms_certificates_issued")
            .select("id, validation_hash")
            .eq("course_id", id)
            .eq("student_id", userId)
            .maybeSingle();

          if (existingIssued) {
            setCertificateId(existingIssued.id || existingIssued.validation_hash);
          }
        }
      } catch (certCheckErr) {
        console.error("Error checking existing certificate:", certCheckErr);
      }

      // 4. Fetch subjects (4-tier model)
      const { data: subjectsData } = await supabase
        .from("lms_subjects")
        .select("*")
        .eq("course_id", id)
        .order("order_index", { ascending: true });

      const fetchedSubjects = subjectsData || [];

      if (fetchedSubjects.length > 0) {
        setIsLegacyCourse(false);
        const subjectIds = fetchedSubjects.map((s) => s.id);

        // Fetch modules
        const { data: modulesData } = await supabase
          .from("lms_modules")
          .select("*")
          .in("subject_id", subjectIds)
          .order("order_index", { ascending: true });

        const fetchedModules = modulesData || [];
        setModules(fetchedModules);

        if (fetchedModules.length > 0) {
          const moduleIds = fetchedModules.map((m) => m.id);

          // Fetch lessons
          const { data: lessonsData } = await supabase
            .from("lms_lessons")
            .select("*")
            .in("module_id", moduleIds)
            .order("order_index", { ascending: true });

          const fetchedLessons = (lessonsData || []) as CourseViewLesson[];
          setLessons(fetchedLessons);

          if (fetchedLessons.length > 0) {
            setActiveLesson(fetchedLessons[0]);
          }
        }
      } else {
        // Fallback to PACIE/weekly section model (lms_sections & lms_activities)
        setIsLegacyCourse(true);
        const { data: sectionsData } = await supabase
          .from("lms_sections")
          .select("*")
          .eq("course_id", id)
          .order("order_index", { ascending: true });

        const fetchedSections = sectionsData || [];
        const syntheticModules: LMSModule[] = fetchedSections.map((sec) => ({
          id: sec.id,
          subject_id: sec.course_id,
          title: sec.title,
          description: sec.description,
          order_index: sec.order_index,
          is_hidden: false,
          created_at: sec.created_at,
          updated_at: sec.created_at,
        }));
        setModules(syntheticModules);

        if (fetchedSections.length > 0) {
          const sectionIds = fetchedSections.map((s) => s.id);
          const { data: activitiesData } = await supabase
            .from("lms_activities")
            .select("*")
            .in("section_id", sectionIds)
            .order("order_index", { ascending: true });

          const fetchedActivities = activitiesData || [];
          const syntheticLessons: CourseViewLesson[] = fetchedActivities.map((act) => ({
            id: act.id,
            module_id: act.section_id,
            title: act.title,
            type: act.type as CourseViewLesson['type'],
            content: act.content,
            description: act.description,
            settings: act.settings as Record<string, unknown> & { file_url?: string },
            metadata: act.metadata as Record<string, unknown> | null,
            order_index: act.order_index,
            created_at: act.created_at,
            updated_at: act.updated_at,
          }));

          setLessons(syntheticLessons);

          if (syntheticLessons.length > 0) {
            setActiveLesson(syntheticLessons[0]);
          }
        }
      }

    } catch (err) {
      console.error("Error fetching course outline:", err);
      toast.error("Error al cargar la información del aula.");
    } finally {
      setLoading(false);
    }
  }, [id, navigate, userId, userRoles]);

  // --- FORUM ACTIONS ---
  const fetchForumPosts = useCallback(async (lessonId: string) => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("lms_lesson_forum_posts")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

      if (postsError) throw postsError;

      let mappedPosts: ForumPostView[] = [];
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map((p) => p.user_id))];
        const { data: profData, error: profError } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, photo_url, role, roles")
          .in("id", userIds);

        if (profError) throw profError;

        mappedPosts = postsData.map((post) => {
          const profile = profData?.find((p) => p.id === post.user_id);
          return {
            ...post,
            profiles: profile
              ? {
                  first_name: profile.first_name || "",
                  last_name: profile.last_name || "",
                  photo_url: profile.photo_url || null,
                  role: profile.role,
                  roles: profile.roles || [],
                }
              : null,
          };
        });
      }
      setForumPosts(mappedPosts);
    } catch (err) {
      console.error("Error fetching forum posts:", err);
    }
  }, []);

  const handlePostToForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !activeLesson) return;

    setPostingToForum(true);
    try {
      const { error } = await supabase.from("lms_lesson_forum_posts").insert([
        {
          lesson_id: activeLesson.id,
          user_id: user?.id,
          content: newPostContent.trim(),
        },
      ]);

      if (error) throw error;
      setNewPostContent("");
      await fetchForumPosts(activeLesson.id);
      toast.success("Mensaje publicado en el foro");
    } catch (err) {
      console.error(err);
      toast.error("Error al publicar mensaje");
    } finally {
      setPostingToForum(false);
    }
  };

  // --- QUIZ ACTIONS ---
  const fetchQuizAttempts = useCallback(async (lessonId: string) => {
    setQuizSubmitted(false);
    setQuizScore(null);
    try {
      const { data, error } = await supabase
        .from("lms_lesson_quiz_grades")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("student_id", userId)
        .order("completed_at", { ascending: false })
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setQuizSubmitted(true);
        setQuizScore(data.score);
      }
    } catch (err) {
      console.error(err);
    }
  }, [userId]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (id) {
      const timeoutId = window.setTimeout(() => {
        void fetchCourseOutline();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [fetchCourseOutline, id, navigate, user]);

  useEffect(() => {
    if (!activeLesson) return;

    const timeoutId = window.setTimeout(() => {
      if (activeLesson.type === "forum") {
        void fetchForumPosts(activeLesson.id);
      }
      if (activeLesson.type === "quiz") {
        void fetchQuizAttempts(activeLesson.id);
      }
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [activeLesson, fetchForumPosts, fetchQuizAttempts]);

  // --- COMPLETION LOGIC ---
  const toggleLessonCompletion = async (
    lessonId: string,
    forceStatus?: boolean,
  ) => {
    if (!userId) return;
    const currentStatus = completions[lessonId] || false;
    const targetStatus =
      forceStatus !== undefined ? forceStatus : !currentStatus;

    try {
      if (isLegacyCourse) {
        const { error } = await supabase.from("lms_activity_completions").upsert(
          [
            {
              activity_id: lessonId,
              student_id: userId,
              is_completed: targetStatus,
              completed_at: new Date().toISOString(),
            },
          ],
          { onConflict: "activity_id,student_id" }
        );
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lms_lesson_completions").upsert(
          [
            {
              lesson_id: lessonId,
              student_id: userId,
              is_completed: targetStatus,
              completed_at: new Date().toISOString(),
            },
          ],
          { onConflict: "lesson_id,student_id" }
        );
        if (error) throw error;
      }

      setCompletions((prev) => ({ ...prev, [lessonId]: targetStatus }));

      // Real XP & Streaks Gamification
      if (targetStatus && !currentStatus) {
        try {
          const { data: currentStats } = await supabase
            .from("lms_student_stats")
            .select("*")
            .eq("student_id", userId)
            .maybeSingle();

          const now = new Date();
          const todayStr = now.toISOString().split("T")[0];

          let newXp = 25;
          let newStreak = 1;
          let maxStreak = 1;

          if (currentStats) {
            newXp = (currentStats.xp_total || 0) + 25;
            const lastActivity = currentStats.last_activity_date
              ? new Date(currentStats.last_activity_date).toISOString().split("T")[0]
              : null;

            if (lastActivity === todayStr) {
              newStreak = currentStats.current_streak || 1;
            } else {
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStr = yesterday.toISOString().split("T")[0];

              if (lastActivity === yesterdayStr) {
                newStreak = (currentStats.current_streak || 0) + 1;
              } else {
                newStreak = 1;
              }
            }
            maxStreak = Math.max(currentStats.longest_streak || 0, newStreak);
          }

          const newLevel = Math.floor(Math.sqrt(newXp / 100)) + 1;

          await supabase.from("lms_student_stats").upsert(
            [
              {
                student_id: userId,
                xp_total: newXp,
                level: newLevel,
                current_streak: newStreak,
                longest_streak: maxStreak,
                last_activity_date: now.toISOString(),
                updated_at: now.toISOString(),
              },
            ],
            { onConflict: "student_id" }
          );

          await supabase.from("lms_xp_logs").insert([
            {
              student_id: userId,
              action_type: "lesson_completed",
              xp_amount: 25,
              reference_id: lessonId,
            },
          ]);

          toast.success("¡+25 XP ganados! Lección completada 🎉");
        } catch (xpErr) {
          console.error("Error updating XP and streak:", xpErr);
        }
      } else {
        toast.success(
          targetStatus ? "Lección completada" : "Lección marcada como pendiente",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el progreso");
    }
  };

  const calculateProgress = useCallback(() => {
    if (lessons.length === 0) return 0;
    const completedCount = Object.values(completions).filter(Boolean).length;
    return Math.round((completedCount / lessons.length) * 100);
  }, [completions, lessons.length]);

  /** Finds the next lesson in sequence after the current activeLesson */
  const getNextLesson = () => {
    if (!activeLesson || lessons.length === 0) return null;
    const currentIdx = lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIdx === -1 || currentIdx >= lessons.length - 1) return null;
    return lessons[currentIdx + 1];
  };

  /** Navigate to the next available lesson */
  const handleNextLesson = () => {
    const next = getNextLesson();
    if (next) {
      const parentModule = modules.find((m) =>
        lessons.some((l) => l.module_id === m.id && l.id === next.id)
      );
      if (parentModule) setActiveTabId(parentModule.id);
      setActiveLesson(next);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const awardCompletionBadge = useCallback(async () => {
    if (!userId || !id) return;
    try {
      const { data: existingBadge } = await supabase
        .from("lms_student_badges")
        .select("id")
        .eq("student_id", userId)
        .eq("course_id", id)
        .eq("badge_name", "Curso Completado")
        .maybeSingle();

      if (!existingBadge) {
        const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gold w-full h-full"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`;

        await supabase.from("lms_student_badges").insert([
          {
            student_id: userId,
            course_id: id,
            badge_name: "Curso Completado",
            badge_svg: badgeSvg,
          },
        ]);

        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#D4AF37", "#FFDF00", "#C5B358", "#4F46E5"],
        });

        toast.success(
          "¡Felicidades! Has completado el curso y obtenido una insignia.",
          {
            duration: 5000,
            icon: "🎓",
          },
        );
      }
      setBadgeAwarded(true);

      // Auto-Certificate Trigger
      let existingCertId: string | null = null;
      const { data: existingCert } = await supabase
        .from("lms_certificates")
        .select("id, code_url")
        .eq("course_id", id)
        .eq("user_id", userId)
        .maybeSingle();

      if (existingCert) {
        existingCertId = existingCert.id || existingCert.code_url;
      } else {
        const { data: existingIssued } = await supabase
          .from("lms_certificates_issued")
          .select("id, validation_hash")
          .eq("course_id", id)
          .eq("student_id", userId)
          .maybeSingle();

        if (existingIssued) {
          existingCertId = existingIssued.id || existingIssued.validation_hash;
        }
      }

      if (!existingCertId) {
        const validationHash = `CERT-${id.slice(0, 8)}-${userId.slice(0, 8)}-${Date.now()}`;

        const { data: newCert } = await supabase
          .from("lms_certificates")
          .insert([
            {
              user_id: userId,
              course_id: id,
              grade: 100,
              code_url: validationHash,
              issued_at: new Date().toISOString(),
            },
          ])
          .select("id")
          .maybeSingle();

        const { data: newIssued } = await supabase
          .from("lms_certificates_issued")
          .insert([
            {
              student_id: userId,
              course_id: id,
              validation_hash: validationHash,
              issue_date: new Date().toISOString(),
            },
          ])
          .select("id")
          .maybeSingle();

        existingCertId = newCert?.id || newIssued?.id || validationHash;
      }

      if (existingCertId) {
        setCertificateId(existingCertId);
      }
    } catch (error) {
      console.error("Error awarding badge/certificate:", error);
    }
  }, [id, userId]);

  useEffect(() => {
    if (lessons.length > 0 && calculateProgress() === 100 && !badgeAwarded) {
      const timeoutId = window.setTimeout(() => {
        void awardCompletionBadge();
      }, 0);
      return () => window.clearTimeout(timeoutId);
    }
  }, [awardCompletionBadge, badgeAwarded, calculateProgress, lessons.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex items-center justify-center pt-20 relative overflow-hidden">
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="flex flex-col items-center gap-4 relative z-10">
          <Loader2 className="animate-spin text-indigo-500" size={48} />
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Cargando tu aula virtual...
          </span>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen pt-20 bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-gray-100 transition-colors flex flex-col relative overflow-hidden">
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-indigo-500/5 dark:bg-indigo-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
        <div className="absolute -bottom-[20%] -left-[10%] w-[40vw] h-[40vw] bg-amber-500/5 dark:bg-amber-600/5 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
      </div>

      <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border-b border-indigo-100 dark:border-white/10 py-4 px-6 sticky top-20 z-20 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            to="/lms/estudiante"
            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-gray-500 dark:text-gray-400 cursor-pointer transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] text-indigo-500 dark:text-indigo-400 font-extrabold uppercase tracking-widest block mb-0.5">
              Aula Virtual
            </span>
            <h1 className="text-base md:text-lg font-bold font-serif line-clamp-1 text-slate-900 dark:text-white">
              {course.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {certificateId && (
            <Link
              to={`/certificados/${certificateId}`}
              className="px-3.5 py-1.5 bg-gold hover:bg-yellow-600 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Award size={16} />
              Ver Certificado
            </Link>
          )}
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider mb-1">
              Tu progreso
            </span>
            <span className="text-sm font-extrabold text-slate-800 dark:text-white">
              {calculateProgress()}% Completado
            </span>
          </div>
          <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
            <div
              className="bg-gradient-to-r from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500 h-full transition-all duration-700 ease-out"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2.5 border border-indigo-100 dark:border-white/10 rounded-xl lg:hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Sidebar (Desktop) */}
        <div className="hidden lg:block shrink-0 h-full">
          <CourseSidebar 
            modules={modules}
            lessons={lessons}
            completions={completions}
            activeLesson={activeLesson}
            onSelectLesson={setActiveLesson}
            userRoles={userRoles}
          />
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, x: -300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -300 }}
              className="fixed inset-0 z-50 lg:hidden flex"
            >
              <div className="bg-white dark:bg-slate-900 w-80 h-full shadow-2xl relative">
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-white/10 rounded-full"
                >
                  <ArrowLeft size={20} className="text-gray-500" />
                </button>
                <CourseSidebar 
                  modules={modules}
                  lessons={lessons}
                  completions={completions}
                  activeLesson={activeLesson}
                  onSelectLesson={(lesson) => {
                    setActiveLesson(lesson);
                    setIsMobileMenuOpen(false);
                  }}
                  userRoles={userRoles}
                />
              </div>
              <div 
                className="flex-1 bg-black/50 backdrop-blur-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative pb-20">
          <div className="relative w-full h-56 md:h-64 bg-slate-900 overflow-hidden">
            {course.cover_image_url ? (
              <img
                src={course.cover_image_url}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
            <div className="absolute top-4 right-6 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gold animate-pulse" />
              <span className="text-gold font-bold text-xs">{calculateProgress()}% Completado</span>
            </div>

            <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 pb-6">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <span className="px-3 py-1 bg-gold/20 text-gold border border-gold/30 rounded-full text-xs font-bold uppercase tracking-wider mb-4 inline-block">
                    {course.course_code || "Curso Virtual"}
                  </span>
                  <h1 className="text-3xl md:text-5xl font-black text-white font-serif tracking-tight leading-tight max-w-3xl">
                    {course.title}
                  </h1>
                  {course.description && (
                    <p className="mt-3 text-gray-300 max-w-2xl text-sm md:text-base line-clamp-2">
                      {course.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-2">
                <button
                  onClick={() => {
                    setActiveTabId("general");
                    setActiveLesson(null);
                  }}
                  className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTabId === "general" ? "border-gold text-gold" : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-gray-200"}`}
                >
                  Información General
                </button>
                <button
                  onClick={() => {
                    setActiveTabId("calendar");
                    setActiveLesson(null);
                  }}
                  className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTabId === "calendar" ? "border-gold text-gold" : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-gray-200"}`}
                >
                  Calendario
                </button>
                <button
                  onClick={() => {
                    setActiveTabId("grades");
                    setActiveLesson(null);
                  }}
                  className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTabId === "grades" ? "border-gold text-gold" : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-gray-200"}`}
                >
                  Calificaciones
                </button>
                <button
                  onClick={() => {
                    setActiveTabId("activities");
                    setActiveLesson(null);
                  }}
                  className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTabId === "activities" ? "border-gold text-gold" : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-gray-200"}`}
                >
                  Actividades
                </button>
                <button
                  onClick={() => {
                    setActiveTabId("classmates");
                    setActiveLesson(null);
                  }}
                  className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 ${activeTabId === "classmates" ? "border-gold text-gold" : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-gray-200"}`}
                >
                  Compañeros
                </button>
                {modules
                  .filter(
                    (m) =>
                      userRoles.includes("admin") ||
                      userRoles.includes("maestro") ||
                      !m.is_hidden,
                  )
                  .map((mod, idx) => (
                    <button
                      key={mod.id}
                      onClick={() => {
                        setActiveTabId(mod.id);
                        setActiveLesson(null);
                      }}
                      className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 hidden ${activeTabId === mod.id ? "border-gold text-gold" : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-gray-200"}`}
                    >
                      {mod.title || `Módulo ${idx + 1}`}
                    </button>
                  ))}
                <button
                  onClick={() => {
                    setActiveTabId("forums");
                    setActiveLesson(null);
                  }}
                  className={`px-4 py-3 text-sm font-bold whitespace-nowrap transition-all border-b-2 flex items-center gap-2 ${
                    activeTabId === "forums" || activeTabId === "forum"
                      ? "border-gold text-gold"
                      : "border-transparent text-gray-500 hover:text-slate-800 dark:hover:text-gray-200"
                  }`}
                >
                  <MessageSquare size={16} /> Foros
                </button>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="max-w-7xl mx-auto px-4 py-8 relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/5 dark:bg-indigo-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <AnimatePresence mode="wait">
              {!activeLesson && (activeTabId === "forum" || activeTabId === "forums") && (
                <motion.div
                  key="forums-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 relative z-10"
                >
                  <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Foros de Debate</h2>
                    <ForumViewer courseId={id || ''} />
                  </div>
                </motion.div>
              )}
              {!activeLesson && activeTabId === "general" && (
                <motion.div
                  key="general-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-8 relative z-10"
                >
                  <SyncLinksManager courseId={id || ""} />

                  <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-150 dark:border-white/10 shadow-sm">
                    <div className="flex flex-col md:flex-row gap-8 items-start">
                      <div className="flex-1">
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4">
                          Acerca de este curso
                        </h2>
                        <RichTextRenderer
                          className="prose dark:prose-invert max-w-none text-slate-700 dark:text-gray-300"
                          html={DOMPurify.sanitize(
                            course.long_description || course.description || "",
                          )}
                        />
                      </div>
                      
                      <div className="w-full md:w-80 space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
                          <CircularProgress 
                            percentage={lessons.length > 0 ? (Object.values(completions).filter(Boolean).length / lessons.length) * 100 : 0} 
                            size={120} 
                            strokeWidth={8} 
                          />
                          <h3 className="mt-4 font-bold text-slate-800 dark:text-white">Progreso del Curso</h3>
                          <p className="text-sm text-gray-500">
                            {Object.values(completions).filter(Boolean).length} de {lessons.length} lecciones completadas
                          </p>
                          {certificateId && (
                            <Link
                              to={`/certificados/${certificateId}`}
                              className="mt-4 w-full py-2 bg-gold hover:bg-yellow-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
                            >
                              <Award size={16} />
                              Ver Certificado
                            </Link>
                          )}
                        </div>
                        
                        {(() => {
                          const nextLesson = lessons.find(l => !completions[l.id]);
                          if (nextLesson) {
                            return (
                              <NextUpWidget 
                                courseId={id || ""}
                                courseTitle={course?.title || ""}
                                lessonTitle={nextLesson.title}
                                type={nextLesson.type}
                                timeEstimate={nextLesson.estimated_minutes || 15}
                              />
                            );
                          }
                          return null;
                        })()}
                      </div>
                    </div>
                  </div>
                    
                  <div className="mt-8">
                    <Leaderboard courseId={id || ""} />
                  </div>
                </motion.div>
              )}

              {!activeLesson && activeTabId === "calendar" && (
                <motion.div
                  key="calendar-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <CourseCalendarTab courseId={id || ""} />
                </motion.div>
              )}

              {!activeLesson && activeTabId === "grades" && (
                <motion.div
                  key="grades-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <CourseGradesTab courseId={id || ""} />
                </motion.div>
              )}

              {!activeLesson && activeTabId === "activities" && (
                <motion.div
                  key="activities-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <CourseActivitiesTab courseId={id || ""} />
                </motion.div>
              )}

              {!activeLesson && activeTabId === "classmates" && (
                <motion.div
                  key="classmates-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <CourseClassmatesTab courseId={id || ""} />
                </motion.div>
              )}

              {!activeLesson && activeTabId !== "general" && activeTabId !== "forums" && activeTabId !== "forum" && activeTabId !== "calendar" && activeTabId !== "grades" && activeTabId !== "activities" && activeTabId !== "classmates" && (
                <motion.div
                  key="dashboard-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <CourseDashboard
                    module={modules.find((m) => m.id === activeTabId) ?? null}
                    lessons={lessons}
                    completions={completions}
                    onSelectLesson={setActiveLesson}
                  />
                </motion.div>
              )}

              {activeLesson && (
                <motion.div
                  key={activeLesson.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                  className="max-w-4xl mx-auto space-y-8 relative z-10"
                >
                  <button
                    onClick={() => setActiveLesson(null)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors mb-4"
                  >
                    <ArrowLeft size={16} /> Volver a las unidades
                  </button>
                  {/* Lesson Header */}
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-slate-200 dark:bg-slate-800 text-gray-500 capitalize">
                        {activeLesson.type}
                      </span>
                      {completions[activeLesson.id] && (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                          Completado
                        </span>
                      )}
                      <button
                        onClick={() => {
                          setActiveTabId('forums');
                          if (window.innerWidth < 1024) setIsMobileMenuOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors flex items-center gap-3 ${
                          activeTabId === 'forum' || activeTabId === 'forums' ? 'bg-gold/10 text-gold' : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <MessageSquare size={18} />
                        Foros de Debate
                      </button>
                    </div>
                    <h2 className="text-3xl md:text-4xl font-extrabold font-serif text-slate-900 dark:text-white tracking-tight">
                      {activeLesson.title}
                    </h2>
                    {activeLesson.description && (
                      <p className="text-base text-gray-500 dark:text-gray-400 mt-4 bg-white/60 dark:bg-slate-900/40 backdrop-blur-md p-5 rounded-2xl border border-gray-200 dark:border-white/10 italic leading-relaxed">
                        {activeLesson.description}
                      </p>
                    )}
                  </div>

                  {/* Lesson Core Content Renderer */}
                  <div className="min-h-[30vh]">
                    {/* TEXT/DOCUMENT */}
                    {(activeLesson.type === "document" ||
                      activeLesson.type === "resource") && (
                      <div className="space-y-6">
                        {activeLesson.settings?.file_url &&
                        activeLesson.settings.file_url
                          .toLowerCase()
                          .endsWith(".pdf") ? (
                          <div className="w-full h-[70vh] rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-lg bg-slate-100 dark:bg-slate-900 relative">
                            <iframe
                              src={`${activeLesson.settings.file_url}#toolbar=0`}
                              className="w-full h-full absolute inset-0"
                              title="Visor PDF"
                            />
                          </div>
                        ) : activeLesson.settings?.file_url ? (
                          <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-gray-200 dark:border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <FileText size={32} className="text-gold" />
                              <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">
                                  Archivo Adjunto
                                </h4>
                                <p className="text-xs text-gray-500">
                                  Haz clic para descargar o abrir en una nueva
                                  pestaña.
                                </p>
                              </div>
                            </div>
                            <a
                              href={activeLesson.settings.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-gold hover:bg-yellow-600 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                            >
                              Abrir Archivo
                            </a>
                          </div>
                        ) : null}

                        {activeLesson.content && (
                          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-6 md:p-10 rounded-3xl border border-gray-150 dark:border-white/10 shadow-sm">
                            <RichTextRenderer
                              className="prose dark:prose-invert max-w-none text-slate-800 dark:text-gray-200 text-base md:text-lg leading-loose font-sans"
                              html={DOMPurify.sanitize(
                                activeLesson.content || "",
                              )}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* VIDEO PLAYER */}
                    {activeLesson.type === "video" && activeLesson.content && (
                      <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black border border-gray-200 dark:border-white/10 shadow-2xl relative group">
                        <div className="absolute inset-0 pointer-events-none border border-white/10 rounded-3xl z-10" />
                        <iframe
                          src={activeLesson.content}
                          className="w-full h-full z-0 relative"
                          allowFullScreen
                          title={activeLesson.title}
                        />
                      </div>
                    )}

                    {/* EMBED H5P */}
                    {activeLesson.type === "h5p" && activeLesson.content && (
                      <div className="w-full min-h-[500px] rounded-2xl overflow-hidden bg-white border border-gray-100 dark:border-white/10 shadow-lg">
                        <iframe
                          src={activeLesson.content}
                          className="w-full h-[500px]"
                          allowFullScreen
                          title={activeLesson.title}
                        />
                      </div>
                    )}

                    {/* QUIZ TAKING */}
                    {activeLesson.type === "quiz" && (
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-2 md:p-6 rounded-2xl border border-gray-150 dark:border-white/5">
                        <QuizPlayer 
                          lessonId={activeLesson.id} 
                          onComplete={() => {
                            if (!completions[activeLesson.id]) {
                              toggleLessonCompletion(activeLesson.id, true);
                            }
                          }}
                        />
                      </div>
                    )}

                    {/* DISCUSSION FORUM */}
                    {activeLesson.type === "forum" && (
                      <div className="space-y-6">
                        <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-gray-150 dark:border-white/5">
                          <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                            Foro de la Lección
                          </span>
                          <p className="text-xs text-gray-500">
                            Haz tus preguntas, comparte hallazgos y debate con
                            tus compañeros y el maestro.
                          </p>
                        </div>

                        {/* Post form */}
                        <form
                          onSubmit={handlePostToForum}
                          className="flex gap-2"
                        >
                          <input
                            type="text"
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                            placeholder="Escribe tu duda o aporte al foro..."
                            className="flex-1 px-4 py-2 border border-gray-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-950 focus:ring-2 focus:ring-gold focus:outline-none"
                          />
                          <button
                            type="submit"
                            disabled={postingToForum || !newPostContent.trim()}
                            className="px-4 py-2 bg-gold hover:bg-yellow-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                          >
                            {postingToForum ? (
                              <Loader2 className="animate-spin" size={14} />
                            ) : (
                              <Send size={14} />
                            )}
                            Publicar
                          </button>
                        </form>

                        {/* Posts thread */}
                        <div className="space-y-4">
                          {forumPosts.length === 0 ? (
                            <p className="text-center py-10 text-xs text-gray-450 italic">
                              Aún no hay publicaciones en este foro. ¡Sé el
                              primero!
                            </p>
                          ) : (
                            forumPosts.map((post) => (
                              <div
                                key={post.id}
                                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/5 shadow-2xs space-y-2"
                              >
                                <div className="flex items-center gap-3">
                                  {post.profiles?.photo_url ? (
                                    <img
                                      loading="lazy"
                                      src={post.profiles.photo_url}
                                      alt="Profile"
                                      className="w-8 h-8 rounded-full object-cover border border-gray-150"
                                    />
                                  ) : (
                                    <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400">
                                      <User size={14} />
                                    </div>
                                  )}
                                  <div>
                                    <span className="font-bold text-xs block text-slate-850 dark:text-gray-200">
                                      {post.profiles?.first_name}{" "}
                                      {post.profiles?.last_name}
                                      {(() => {
                                        const postRoles =
                                          post.profiles?.roles ||
                                          (post.profiles?.role
                                            ? [post.profiles.role]
                                            : []);
                                        const isInstructor = postRoles.some(
                                          (r: string) =>
                                            [
                                              "admin",
                                              "pastor",
                                              "maestro",
                                              "docente",
                                            ].includes(r),
                                        );
                                        return isInstructor ? (
                                          <span className="ml-1.5 bg-gold/10 text-gold border border-gold/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                            Maestro
                                          </span>
                                        ) : null;
                                      })()}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {new Date(
                                        post.created_at,
                                      ).toLocaleDateString("es-ES", {
                                        day: "numeric",
                                        month: "short",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-xs text-slate-700 dark:text-gray-300 leading-relaxed pl-1">
                                  {post.content}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    {/* ASSIGNMENT SUBMISSION */}
                    {activeLesson.type === "assignment" && (
                      <div className="mt-8">
                        <h3 className="text-lg font-bold font-serif mb-4 flex items-center gap-2">
                          <FileText className="text-gold" />
                          Entrega de Tarea
                        </h3>
                        <AssignmentDropzone 
                          courseId={course.id} 
                          lessonId={activeLesson.id}
                          onSuccess={() => toggleLessonCompletion(activeLesson.id, true)} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Mark as Complete & Next Lesson Footer */}
                  <div className="sticky bottom-4 z-30 mt-8 pt-4 pb-4 px-6 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-4 transition-all">
                    {/* Progress */}
                    <div className="flex-1 w-full max-w-sm">
                      <div className="flex items-center gap-3 mb-1.5">
                        <span className="text-xs font-bold text-slate-700 dark:text-gray-300">Progreso del curso</span>
                        <span className="text-xs font-bold text-gold ml-auto">{calculateProgress()}%</span>
                      </div>
                      <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-gold to-emerald-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${calculateProgress()}%` }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                      {certificateId && calculateProgress() === 100 ? (
                        <Link
                          to={`/certificados/${certificateId}`}
                          className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md bg-gold hover:bg-yellow-500 text-white border-transparent hover:-translate-y-0.5"
                        >
                          <Award size={18} />
                          Ver Certificado
                        </Link>
                      ) : (
                        <button
                          onClick={() => toggleLessonCompletion(activeLesson.id)}
                          className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm border ${
                            completions[activeLesson.id]
                              ? "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 hover:bg-green-500/20"
                              : "bg-gold hover:bg-yellow-500 text-white border-transparent shadow-gold/20 hover:shadow-gold/40 hover:-translate-y-0.5"
                          }`}
                        >
                          <CheckCircle size={18} className={completions[activeLesson.id] ? "" : "animate-pulse"} />
                          {completions[activeLesson.id]
                            ? "Completado"
                            : "Marcar como Completado"}
                        </button>
                      )}

                      {getNextLesson() && (
                        <button
                          onClick={handleNextLesson}
                          className="flex-1 md:flex-none px-6 py-3 rounded-xl text-sm font-bold tracking-wide transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-gray-100 border border-transparent hover:-translate-y-0.5"
                        >
                          Siguiente
                          <ChevronRight size={18} />
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
