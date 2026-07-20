/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from "react";
import DOMPurify from "dompurify";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../store/useAuthStore";
import { 
  ArrowLeft, CheckCircle, FileText, 
  Menu, Send, CheckCircle2, 
  User, Loader2, MessageSquare
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

export default function CourseViewer() {
  const { id } = useParams<{ id: string }>();
  const { user, role, roles } = useAuthStore();
  const userRoles = roles || (role ? [role] : []);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [badgeAwarded, setBadgeAwarded] = useState(false);

  // Active state
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [activeTabId, setActiveTabId] = useState<string>("general");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Removed unused collapsed sections state

  // Forum State
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState("");
  const [postingToForum, setPostingToForum] = useState(false);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  // Removed unused previousQuizAttempt state

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (id) {
      fetchCourseOutline();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    if (activeLesson) {
      // Fetch data specific to the active lesson type
      if (activeLesson.type === "forum") {
        fetchForumPosts(activeLesson.id);
      }
      if (activeLesson.type === "assignment") {
        // No assignment fetch required
      }
      if (activeLesson.type === "quiz") {
        fetchQuizAttempts(activeLesson.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLesson]);

  async function fetchCourseOutline() {
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

      // 2. Check if student has enrollment, if not and user does not have lms staff/student roles, block
      const isLMSStaffOrStudent = userRoles.some(
        (r) => !["member", "guest"].includes(r),
      );
      if (!isLMSStaffOrStudent) {
        const { data: enrollment } = await supabase
          .from("lms_enrollments")
          .select("*")
          .eq("course_id", id)
          .eq("user_id", user?.id)
          .maybeSingle();

        if (!enrollment) {
          toast.error("No estás matriculado en este curso.");
          navigate("/lms/estudiante");
          return;
        }
      }

      // 3. Fetch subjects
      const { data: subjectsData } = await supabase
        .from("lms_subjects")
        .select("*")
        .eq("course_id", id)
        .order("order_index", { ascending: true });

      const fetchedSubjects = subjectsData || [];
      // setSubjects(fetchedSubjects); // Assuming setSubjects is defined elsewhere

      if (fetchedSubjects.length > 0) {
        const subjectIds = fetchedSubjects.map((s) => s.id);

        // 4. Fetch modules
        const { data: modulesData } = await supabase
          .from("lms_modules")
          .select("*")
          .in("subject_id", subjectIds)
          .order("order_index", { ascending: true });

        const fetchedModules = modulesData || [];
        setModules(fetchedModules);

        if (fetchedModules.length > 0) {
          const moduleIds = fetchedModules.map((m) => m.id);

          // 5. Fetch lessons
          const { data: lessonsData } = await supabase
            .from("lms_lessons")
            .select("*")
            .in("module_id", moduleIds)
            .order("order_index", { ascending: true });

          const fetchedLessons = lessonsData || [];
          setLessons(fetchedLessons);

          // Auto-select first lesson
          if (fetchedLessons.length > 0) {
            setActiveLesson(fetchedLessons[0]);
          }
        }
      }

      // 6. Fetch completions
      const { data: completionsData } = await supabase
        .from("lms_lesson_completions")
        .select("lesson_id, is_completed")
        .eq("student_id", user?.id);

      const completionMap: Record<string, boolean> = {};
      (completionsData || []).forEach((c) => {
        completionMap[c.lesson_id] = c.is_completed;
      });
      setCompletions(completionMap);
    } catch (err) {
      console.error("Error fetching course outline:", err);
      toast.error("Error al cargar la información del aula.");
    } finally {
      setLoading(false);
    }
  }

  // --- FORUM ACTIONS ---
  async function fetchForumPosts(lessonId: string) {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from("lms_lesson_forum_posts")
        .select("*")
        .eq("lesson_id", lessonId)
        .order("created_at", { ascending: true });

      if (postsError) throw postsError;

      let mappedPosts: any[] = [];
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
  }

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
  async function fetchQuizAttempts(lessonId: string) {
    setQuizSubmitted(false);
    setQuizAnswers({});
    setQuizScore(null);
    try {
      const { data, error } = await supabase
        .from("lms_lesson_quiz_grades")
        .select("*")
        .eq("lesson_id", lessonId)
        .eq("student_id", user?.id)
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
  }

  const handleQuizSubmit = async () => {
    if (!activeLesson?.content) return;

    let parsedQuestions: any[];
    try {
      parsedQuestions = JSON.parse(activeLesson.content);
    } catch {
      toast.error("Error en el formato del Cuestionario");
      return;
    }

    let correctCount = 0;
    parsedQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_answer) {
        correctCount++;
      }
    });

    const finalScore = Math.round((correctCount / parsedQuestions.length) * 10); // scale out of 10

    try {
      const { error } = await supabase.from("lms_lesson_quiz_grades").insert([
        {
          lesson_id: activeLesson.id,
          student_id: user?.id,
          score: finalScore,
          max_score: 10,
          answers: quizAnswers,
        },
      ]);

      if (error) throw error;

      setQuizScore(finalScore);
      setQuizSubmitted(true);
      toast.success(`Cuestionario calificado: ${finalScore}/10`);

      // Auto complete the lesson if score is above passing grade (e.g. 7)
      if (finalScore >= 7) {
        await toggleLessonCompletion(activeLesson.id, true);
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al subir los resultados del test");
    }
  };

  // --- COMPLETION LOGIC ---
  const toggleLessonCompletion = async (
    lessonId: string,
    forceStatus?: boolean,
  ) => {
    const currentStatus = completions[lessonId] || false;
    const targetStatus =
      forceStatus !== undefined ? forceStatus : !currentStatus;

    try {
      if (targetStatus) {
        const { error } = await supabase.from("lms_lesson_completions").upsert([
          {
            lesson_id: lessonId,
            student_id: user?.id,
            is_completed: true,
          },
        ]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("lms_lesson_completions")
          .delete()
          .eq("lesson_id", lessonId)
          .eq("student_id", user?.id);
        if (error) throw error;
      }

      setCompletions((prev) => ({ ...prev, [lessonId]: targetStatus }));
      toast.success(
        targetStatus ? "Lección completada" : "Lección marcada como pendiente",
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al actualizar el progreso");
    }
  };

  const calculateProgress = () => {
    if (lessons.length === 0) return 0;
    const completedCount = Object.values(completions).filter(Boolean).length;
    return Math.round((completedCount / lessons.length) * 100);
  };

  useEffect(() => {
    if (lessons.length > 0 && calculateProgress() === 100 && !badgeAwarded) {
      awardCompletionBadge();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completions, lessons.length, badgeAwarded]);

  const awardCompletionBadge = async () => {
    try {
      // Check if badge already exists
      const { data: existingBadge } = await supabase
        .from("lms_student_badges")
        .select("id")
        .eq("student_id", user?.id)
        .eq("course_id", id)
        .eq("badge_name", "Curso Completado")
        .single();

      if (!existingBadge) {
        // Insert badge
        const badgeSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-gold w-full h-full"><path d="M3.85 8.62a4 4 0 0 1 4.78-4.77 4 4 0 0 1 6.74 0 4 4 0 0 1 4.78 4.78 4 4 0 0 1 0 6.74 4 4 0 0 1-4.77 4.78 4 4 0 0 1-6.75 0 4 4 0 0 1-4.78-4.77 4 4 0 0 1 0-6.76Z"/><path d="m9 12 2 2 4-4"/></svg>`;

        await supabase.from("lms_student_badges").insert([
          {
            student_id: user?.id,
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
    } catch (error) {
      console.error("Error awarding badge:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-gold" size={40} />
          <span className="text-sm font-semibold text-gray-500">
            Cargando tu aula virtual...
          </span>
        </div>
      </div>
    );
  }

  if (!course) return null;

  return (
    <div className="min-h-screen pt-20 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-gray-150 transition-colors flex flex-col">
      {/* Top Banner / Navbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-250 dark:border-white/10 py-4 px-6 sticky top-20 z-20 flex justify-between items-center shadow-xs">
        <div className="flex items-center gap-3">
          <Link
            to="/lms/estudiante"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
              Aula Virtual
            </span>
            <h1 className="text-base md:text-lg font-bold font-serif line-clamp-1">
              {course.title}
            </h1>
          </div>
        </div>

        {/* Progress Circular/Badge */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-gray-400 font-semibold">
              Tu progreso
            </span>
            <span className="text-sm font-bold text-slate-800 dark:text-gray-150">
              {calculateProgress()}% Completado
            </span>
          </div>
          <div className="w-16 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className="bg-gold h-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 border border-gray-200 dark:border-white/10 rounded-lg lg:hidden cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative pb-20">
          {/* Hero Banner */}
          <div className="relative w-full h-64 md:h-80 bg-slate-900 overflow-hidden">
            {course.cover_image_url ? (
              <img
                src={course.cover_image_url}
                alt="Cover"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-slate-900" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

            <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-6 pb-8">
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

          {/* Nav Tabs */}
          <div className="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar py-2">
                <button
                  onClick={() => {
                    setActiveTabId("general");
                    setActiveLesson(null);
                  }}
                  className={`px-5 py-3 text-sm font-bold whitespace-nowrap rounded-2xl transition-all ${activeTabId === "general" ? "bg-gold text-white shadow-md" : "text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                >
                  Información General
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
                      className={`px-5 py-3 text-sm font-bold whitespace-nowrap rounded-2xl transition-all ${activeTabId === mod.id ? "bg-gold text-white shadow-md" : "text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
                    >
                      {mod.title || `Módulo ${idx + 1}`}
                    </button>
                  ))}
                <button
                  onClick={() => {
                    setActiveTabId("forums");
                    setActiveLesson(null);
                  }}
                  className={`px-5 py-3 text-sm font-bold whitespace-nowrap rounded-2xl transition-all flex items-center gap-2 ${activeTabId === "forums" ? "bg-gold text-white shadow-md" : "text-gray-500 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
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
                    
                  <div className="mt-8">
                    <Leaderboard courseId={id || ""} />
                  </div>
                </motion.div>
              )}

              {activeTabId === "forums" && (
                <motion.div
                  key="forums-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <ForumViewer courseId={id || ""} />
                </motion.div>
              )}

              {!activeLesson && activeTabId !== "general" && activeTabId !== "forums" && (
                <motion.div
                  key="dashboard-tab"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="relative z-10"
                >
                  <CourseDashboard
                    module={modules.find((m) => m.id === activeTabId)}
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
                      <div className="space-y-6 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-gray-150 dark:border-white/5">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/5">
                          <h3 className="font-bold font-serif text-sm">
                            Cuestionario Evaluativo
                          </h3>
                          {quizScore !== null && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${quizScore >= 7 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-750"}`}
                            >
                              Calificación: {quizScore}/10
                            </span>
                          )}
                        </div>

                        {quizSubmitted ? (
                          <div className="text-center py-8 space-y-4">
                            <CheckCircle2
                              size={48}
                              className="mx-auto text-green-600"
                            />
                            <h4 className="font-bold text-lg">
                              Examen enviado con éxito
                            </h4>
                            <p className="text-xs text-gray-450 dark:text-gray-400">
                              Obtuviste una calificación de{" "}
                              <strong>{quizScore}/10</strong>.
                              {quizScore !== null && quizScore >= 7
                                ? " ¡Felicidades! Has aprobado esta lección."
                                : " No alcanzaste la nota mínima de 7/10. Inténtalo de nuevo cuando el docente reabra el intento."}
                            </p>
                            <button
                              onClick={() => {
                                setQuizSubmitted(false);
                                setQuizAnswers({});
                                setQuizScore(null);
                              }}
                              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Reintentar Cuestionario
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-6">
                            {(() => {
                              let questions: any[];
                              try {
                                questions = JSON.parse(
                                  activeLesson.content || "[]",
                                );
                              } catch {
                                return (
                                  <p className="text-xs text-red-500 italic">
                                    Error al decodificar preguntas del
                                    cuestionario.
                                  </p>
                                );
                              }

                              if (questions.length === 0) {
                                return (
                                  <p className="text-xs text-gray-450 italic text-center">
                                    Este examen no tiene preguntas aún.
                                  </p>
                                );
                              }

                              return (
                                <>
                                  {questions.map((q, idx) => (
                                    <div key={idx} className="space-y-3">
                                      <p className="text-xs font-bold text-slate-800 dark:text-gray-200">
                                        {idx + 1}. {q.question_text}
                                      </p>
                                      <div className="grid grid-cols-1 gap-2 pl-3">
                                        {(q.options || []).map(
                                          (opt: string, optIdx: number) => {
                                            const isSelected =
                                              quizAnswers[idx] === optIdx;
                                            return (
                                              <button
                                                key={optIdx}
                                                type="button"
                                                onClick={() =>
                                                  setQuizAnswers((prev) => ({
                                                    ...prev,
                                                    [idx]: optIdx,
                                                  }))
                                                }
                                                className={`p-3 text-left text-xs rounded-xl border transition-all cursor-pointer ${
                                                  isSelected
                                                    ? "bg-gold/10 border-gold text-gold font-semibold"
                                                    : "bg-white dark:bg-slate-950 border-gray-200 dark:border-white/5 hover:border-gray-300"
                                                }`}
                                              >
                                                {opt}
                                              </button>
                                            );
                                          },
                                        )}
                                      </div>
                                    </div>
                                  ))}

                                  <div className="pt-4 border-t border-gray-150 dark:border-white/5 flex justify-end">
                                    <button
                                      onClick={handleQuizSubmit}
                                      disabled={
                                        Object.keys(quizAnswers).length <
                                        questions.length
                                      }
                                      className="px-6 py-2.5 bg-gold hover:bg-yellow-600 disabled:bg-gray-250 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                                    >
                                      Enviar Cuestionario
                                    </button>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        )}
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
                                          (r: any) =>
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
                          activityId={activeLesson.id}
                          onSuccess={() => toggleLessonCompletion(activeLesson.id, true)} 
                        />
                      </div>
                    )}
                  </div>

                  {/* Mark as Complete Footer */}
                  <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-xs text-gray-400">
                      Marca la lección cuando hayas terminado el estudio o las
                      tareas solicitadas.
                    </div>

                    <button
                      onClick={() => toggleLessonCompletion(activeLesson.id)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                        completions[activeLesson.id]
                          ? "bg-green-600 hover:bg-green-700 text-white"
                          : "bg-gold hover:bg-yellow-600 text-white"
                      }`}
                    >
                      <CheckCircle size={16} />
                      {completions[activeLesson.id]
                        ? "Marcar como Pendiente"
                        : "Marcar como Completado"}
                    </button>
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
