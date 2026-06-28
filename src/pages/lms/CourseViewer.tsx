import React, { useState, useEffect } from 'react';
import DOMPurify from 'dompurify';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { 
  ArrowLeft, BookOpen, CheckCircle, Video, FileText, 
  FileQuestion, MessageSquare, ChevronDown, ChevronRight, 
  Menu, X, Send, CheckCircle2, 
  User, Loader2, Save, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function CourseViewer() {
  const { id } = useParams<{ id: string }>();
  const { user, role, roles } = useAuthStore();
  const userRoles = roles || (role ? [role] : []);
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [modules, setModules] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [completions, setCompletions] = useState<Record<string, boolean>>({});

  // Active state
  const [activeLesson, setActiveLesson] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Collapsed sections
  const [collapsedSubjects, setCollapsedSubjects] = useState<Record<string, boolean>>({});
  const [collapsedModules, setCollapsedModules] = useState<Record<string, boolean>>({});

  // Forum State
  const [forumPosts, setForumPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [postingToForum, setPostingToForum] = useState(false);

  // Assignment State
  const [submission, setSubmission] = useState<any>(null);
  const [submittingAssignment, setSubmittingAssignment] = useState(false);
  const [assignmentText, setAssignmentText] = useState('');
  const [assignmentUrl, setAssignmentUrl] = useState('');

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState<number | null>(null);
  // Removed unused previousQuizAttempt state

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (id) {
      fetchCourseOutline();
    }
  }, [id, user]);

  useEffect(() => {
    if (activeLesson) {
      // Fetch data specific to the active lesson type
      if (activeLesson.type === 'forum') {
        fetchForumPosts(activeLesson.id);
      }
      if (activeLesson.type === 'assignment') {
        fetchAssignmentSubmission(activeLesson.id);
      }
      if (activeLesson.type === 'quiz') {
        fetchQuizAttempts(activeLesson.id);
      }
    }
  }, [activeLesson]);

  const fetchCourseOutline = async () => {
    setLoading(true);
    try {
      // 1. Fetch course details
      const { data: courseData, error: courseError } = await supabase
        .from('lms_courses')
        .select('*')
        .eq('id', id)
        .single();
        
      if (courseError) throw courseError;
      setCourse(courseData);

      // 2. Check if student has enrollment, if not and role is student, block or ask to request enrollment
      // 2. Check if student has enrollment, if not and user does not have lms staff/student roles, block
      const isLMSStaffOrStudent = userRoles.some(r => !['member', 'guest'].includes(r));
      if (!isLMSStaffOrStudent) {
        const { data: enrollment } = await supabase
          .from('lms_enrollments')
          .select('*')
          .eq('course_id', id)
          .eq('user_id', user?.id)
          .maybeSingle();

        if (!enrollment) {
          toast.error('No estás matriculado en este curso.');
          navigate('/lms/estudiante');
          return;
        }
      }

      // 3. Fetch subjects
      const { data: subjectsData } = await supabase
        .from('lms_subjects')
        .select('*')
        .eq('course_id', id)
        .order('order_index', { ascending: true });
        
      const fetchedSubjects = subjectsData || [];
      setSubjects(fetchedSubjects);

      if (fetchedSubjects.length > 0) {
        const subjectIds = fetchedSubjects.map(s => s.id);
        
        // 4. Fetch modules
        const { data: modulesData } = await supabase
          .from('lms_modules')
          .select('*')
          .in('subject_id', subjectIds)
          .order('order_index', { ascending: true });
          
        const fetchedModules = modulesData || [];
        setModules(fetchedModules);

        if (fetchedModules.length > 0) {
          const moduleIds = fetchedModules.map(m => m.id);
          
          // 5. Fetch lessons
          const { data: lessonsData } = await supabase
            .from('lms_lessons')
            .select('*')
            .in('module_id', moduleIds)
            .order('order_index', { ascending: true });
            
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
        .from('lms_lesson_completions')
        .select('lesson_id, is_completed')
        .eq('student_id', user?.id);

      const completionMap: Record<string, boolean> = {};
      (completionsData || []).forEach(c => {
        completionMap[c.lesson_id] = c.is_completed;
      });
      setCompletions(completionMap);

    } catch (err) {
      console.error('Error fetching course outline:', err);
      toast.error('Error al cargar la información del aula.');
    } finally {
      setLoading(false);
    }
  };

  // --- FORUM ACTIONS ---
  const fetchForumPosts = async (lessonId: string) => {
    try {
      const { data: postsData, error: postsError } = await supabase
        .from('lms_lesson_forum_posts')
        .select('*')
        .eq('lesson_id', lessonId)
        .order('created_at', { ascending: true });

      if (postsError) throw postsError;

      let mappedPosts: any[] = [];
      if (postsData && postsData.length > 0) {
        const userIds = [...new Set(postsData.map(p => p.user_id))];
        const { data: profData, error: profError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, photo_url, role, roles')
          .in('id', userIds);

        if (profError) throw profError;

        mappedPosts = postsData.map(post => {
          const profile = profData?.find(p => p.id === post.user_id);
          return {
            ...post,
            profiles: profile ? {
              first_name: profile.first_name || '',
              last_name: profile.last_name || '',
              photo_url: profile.photo_url || null,
              role: profile.role,
              roles: profile.roles || []
            } : null
          };
        });
      }
      setForumPosts(mappedPosts);
    } catch (err) {
      console.error('Error fetching forum posts:', err);
    }
  };

  const handlePostToForum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !activeLesson) return;

    setPostingToForum(true);
    try {
      const { error } = await supabase
        .from('lms_lesson_forum_posts')
        .insert([{
          lesson_id: activeLesson.id,
          user_id: user?.id,
          content: newPostContent.trim()
        }]);

      if (error) throw error;
      setNewPostContent('');
      await fetchForumPosts(activeLesson.id);
      toast.success('Mensaje publicado en el foro');
    } catch (err) {
      console.error(err);
      toast.error('Error al publicar mensaje');
    } finally {
      setPostingToForum(false);
    }
  };

  // --- ASSIGNMENT ACTIONS ---
  const fetchAssignmentSubmission = async (lessonId: string) => {
    try {
      const { data, error } = await supabase
        .from('lms_lesson_submissions')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setSubmission(data);
      if (data) {
        setAssignmentText(data.text_content || '');
        setAssignmentUrl(data.file_url || '');
      } else {
        setAssignmentText('');
        setAssignmentUrl('');
      }
    } catch (err) {
      console.error('Error fetching assignment submission:', err);
    }
  };

  const handleSaveSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeLesson) return;

    setSubmittingAssignment(true);
    try {
      const payload = {
        lesson_id: activeLesson.id,
        student_id: user?.id,
        text_content: assignmentText,
        file_url: assignmentUrl,
        submitted_at: new Date().toISOString()
      };

      if (submission) {
        const { error } = await supabase
          .from('lms_lesson_submissions')
          .update(payload)
          .eq('id', submission.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lms_lesson_submissions')
          .insert([payload]);
        if (error) throw error;
      }

      toast.success('Tarea entregada con éxito');
      await fetchAssignmentSubmission(activeLesson.id);
    } catch (err) {
      console.error(err);
      toast.error('Error al guardar la entrega');
    } finally {
      setSubmittingAssignment(false);
    }
  };

  // --- QUIZ ACTIONS ---
  const fetchQuizAttempts = async (lessonId: string) => {
    setQuizSubmitted(false);
    setQuizAnswers({});
    setQuizScore(null);
    try {
      const { data, error } = await supabase
        .from('lms_lesson_quiz_grades')
        .select('*')
        .eq('lesson_id', lessonId)
        .eq('student_id', user?.id)
        .order('completed_at', { ascending: false })
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setQuizSubmitted(true);
        setQuizScore(data.score);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleQuizSubmit = async () => {
    if (!activeLesson?.content) return;
    
    let parsedQuestions: any[] = [];
    try {
      parsedQuestions = JSON.parse(activeLesson.content);
    } catch {
      toast.error('Error en el formato del Cuestionario');
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
      const { error } = await supabase
        .from('lms_lesson_quiz_grades')
        .insert([{
          lesson_id: activeLesson.id,
          student_id: user?.id,
          score: finalScore,
          max_score: 10,
          answers: quizAnswers
        }]);

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
      toast.error('Error al subir los resultados del test');
    }
  };

  // --- COMPLETION LOGIC ---
  const toggleLessonCompletion = async (lessonId: string, forceStatus?: boolean) => {
    const currentStatus = completions[lessonId] || false;
    const targetStatus = forceStatus !== undefined ? forceStatus : !currentStatus;

    try {
      if (targetStatus) {
        const { error } = await supabase
          .from('lms_lesson_completions')
          .upsert([{
            lesson_id: lessonId,
            student_id: user?.id,
            is_completed: true
          }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lms_lesson_completions')
          .delete()
          .eq('lesson_id', lessonId)
          .eq('student_id', user?.id);
        if (error) throw error;
      }

      setCompletions(prev => ({ ...prev, [lessonId]: targetStatus }));
      toast.success(targetStatus ? 'Lección completada' : 'Lección marcada como pendiente');
    } catch (err) {
      console.error(err);
      toast.error('Error al actualizar el progreso');
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'video':
      case 'video_link':
        return <Video size={16} className="text-blue-500" />;
      case 'document':
      case 'resource':
        return <FileText size={16} className="text-emerald-500" />;
      case 'quiz':
        return <FileQuestion size={16} className="text-purple-500" />;
      case 'forum':
        return <MessageSquare size={16} className="text-amber-500" />;
      default:
        return <Globe size={16} className="text-indigo-500" />;
    }
  };

  const calculateProgress = () => {
    if (lessons.length === 0) return 0;
    const completedCount = Object.values(completions).filter(Boolean).length;
    return Math.round((completedCount / lessons.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 pt-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-gold" size={40} />
          <span className="text-sm font-semibold text-gray-500">Cargando tu aula virtual...</span>
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
          <Link to="/lms/estudiante" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-gray-500 dark:text-gray-400 cursor-pointer">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Aula Virtual</span>
            <h1 className="text-base md:text-lg font-bold font-serif line-clamp-1">{course.title}</h1>
          </div>
        </div>

        {/* Progress Circular/Badge */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-xs text-gray-400 font-semibold">Tu progreso</span>
            <span className="text-sm font-bold text-slate-800 dark:text-gray-150">{calculateProgress()}% Completado</span>
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

      <div className="flex-1 flex overflow-hidden relative">
        {/* Outline Sidebar Drawer */}
        <div className={`
          absolute lg:relative top-0 bottom-0 left-0 w-80 max-w-full bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-white/10 z-30 lg:z-10
          transform transition-transform duration-300 flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center lg:hidden">
            <span className="font-bold text-sm">Contenidos del Curso</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-full hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          {/* Syllabus Tree */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {subjects.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-10">Este curso aún no tiene temas asignados.</p>
            ) : (
              subjects.map((sub, sIdx) => {
                const isSubCollapsed = collapsedSubjects[sub.id];
                const subModules = modules.filter(m => m.subject_id === sub.id);

                return (
                  <div key={sub.id} className="space-y-1.5">
                    {/* Subject Header */}
                    <button
                      onClick={() => setCollapsedSubjects(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-left bg-slate-55 dark:bg-slate-950 font-serif font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-gray-300 hover:opacity-80 cursor-pointer"
                    >
                      <span className="truncate pr-2">M{sIdx + 1}: {sub.title}</span>
                      {isSubCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {/* Modules list */}
                    {!isSubCollapsed && (
                      <div className="pl-2 space-y-2 border-l border-gray-150 dark:border-white/5 ml-2">
                        {subModules.map((moduleObj) => {
                          const isModCollapsed = collapsedModules[moduleObj.id];
                          const moduleLessons = lessons.filter(l => l.module_id === moduleObj.id);

                          return (
                            <div key={moduleObj.id} className="space-y-1">
                              <button
                                onClick={() => setCollapsedModules(prev => ({ ...prev, [moduleObj.id]: !prev[moduleObj.id] }))}
                                className="w-full flex items-center justify-between p-1.5 text-left text-xs font-semibold text-gray-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
                              >
                                <span className="truncate pr-2">{moduleObj.title}</span>
                                {isModCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                              </button>

                              {/* Lessons list */}
                              {!isModCollapsed && (
                                <div className="space-y-0.5">
                                  {moduleLessons.map((les) => {
                                    const isActive = activeLesson?.id === les.id;
                                    const isComp = completions[les.id] || false;

                                    return (
                                      <button
                                        key={les.id}
                                        onClick={() => {
                                          setActiveLesson(les);
                                          setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-2.5 p-2 rounded-lg text-left text-xs font-medium transition-colors cursor-pointer ${
                                          isActive 
                                            ? 'bg-gold/15 text-gold font-bold dark:bg-gold/10' 
                                            : 'text-gray-650 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                      >
                                        <div onClick={(e) => { e.stopPropagation(); toggleLessonCompletion(les.id); }} className="cursor-pointer shrink-0">
                                          {isComp ? (
                                            <CheckCircle2 size={16} className="text-gold fill-gold/10" />
                                          ) : (
                                            <div className="w-4 h-4 rounded-full border border-gray-300 dark:border-white/20 hover:border-gold" />
                                          )}
                                        </div>
                                        <span className="shrink-0">{getLessonIcon(les.type)}</span>
                                        <span className="truncate flex-1">{les.title}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-white dark:bg-slate-950">
          <AnimatePresence mode="wait">
            {activeLesson ? (
              <motion.div
                key={activeLesson.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl mx-auto space-y-6"
              >
                {/* Lesson Header */}
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-gray-500 capitalize">
                      {activeLesson.type}
                    </span>
                    {completions[activeLesson.id] && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-900/30">
                        Completado
                      </span>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold font-serif text-slate-800 dark:text-white">{activeLesson.title}</h2>
                  {activeLesson.description && (
                    <p className="text-sm text-gray-450 dark:text-gray-400 mt-2 bg-slate-50 dark:bg-slate-900/40 p-4 rounded-xl border border-gray-150 dark:border-white/5 italic">
                      {activeLesson.description}
                    </p>
                  )}
                </div>

                {/* Lesson Core Content Renderer */}
                <div className="min-h-[30vh]">
                  
                  {/* TEXT/DOCUMENT */}
                  {(activeLesson.type === 'document' || activeLesson.type === 'resource') && (
                    <div 
                      className="prose dark:prose-invert max-w-none text-slate-850 dark:text-gray-300 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(activeLesson.content || '<p class="italic text-gray-400">Esta lección no contiene texto.</p>') }}
                    />
                  )}

                  {/* VIDEO PLAYER */}
                  {activeLesson.type === 'video' && activeLesson.content && (
                    <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-gray-100 dark:border-white/10 shadow-lg">
                      <iframe
                        src={activeLesson.content}
                        className="w-full h-full"
                        allowFullScreen
                        title={activeLesson.title}
                      />
                    </div>
                  )}

                  {/* EMBED H5P */}
                  {activeLesson.type === 'h5p' && activeLesson.content && (
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
                  {activeLesson.type === 'quiz' && (
                    <div className="space-y-6 bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-gray-150 dark:border-white/5">
                      <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-white/5">
                        <h3 className="font-bold font-serif text-sm">Cuestionario Evaluativo</h3>
                        {quizScore !== null && (
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${quizScore >= 7 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-750'}`}>
                            Calificación: {quizScore}/10
                          </span>
                        )}
                      </div>

                      {quizSubmitted ? (
                        <div className="text-center py-8 space-y-4">
                          <CheckCircle2 size={48} className="mx-auto text-green-600" />
                          <h4 className="font-bold text-lg">Examen enviado con éxito</h4>
                          <p className="text-xs text-gray-450 dark:text-gray-400">
                            Obtuviste una calificación de <strong>{quizScore}/10</strong>.
                            {quizScore !== null && quizScore >= 7 
                              ? ' ¡Felicidades! Has aprobado esta lección.' 
                              : ' No alcanzaste la nota mínima de 7/10. Inténtalo de nuevo cuando el docente reabra el intento.'
                            }
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
                            let questions: any[] = [];
                            try {
                              questions = JSON.parse(activeLesson.content || '[]');
                            } catch {
                              return <p className="text-xs text-red-500 italic">Error al decodificar preguntas del cuestionario.</p>;
                            }

                            if (questions.length === 0) {
                              return <p className="text-xs text-gray-450 italic text-center">Este examen no tiene preguntas aún.</p>;
                            }

                            return (
                              <>
                                {questions.map((q, idx) => (
                                  <div key={idx} className="space-y-3">
                                    <p className="text-xs font-bold text-slate-800 dark:text-gray-200">
                                      {idx + 1}. {q.question_text}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2 pl-3">
                                      {(q.options || []).map((opt: string, optIdx: number) => {
                                        const isSelected = quizAnswers[idx] === optIdx;
                                        return (
                                          <button
                                            key={optIdx}
                                            type="button"
                                            onClick={() => setQuizAnswers(prev => ({ ...prev, [idx]: optIdx }))}
                                            className={`p-3 text-left text-xs rounded-xl border transition-all cursor-pointer ${
                                              isSelected 
                                                ? 'bg-gold/10 border-gold text-gold font-semibold' 
                                                : 'bg-white dark:bg-slate-950 border-gray-200 dark:border-white/5 hover:border-gray-300'
                                            }`}
                                          >
                                            {opt}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}

                                <div className="pt-4 border-t border-gray-150 dark:border-white/5 flex justify-end">
                                  <button
                                    onClick={handleQuizSubmit}
                                    disabled={Object.keys(quizAnswers).length < questions.length}
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
                  {activeLesson.type === 'forum' && (
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-gray-150 dark:border-white/5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Foro de la Lección</span>
                        <p className="text-xs text-gray-500">Haz tus preguntas, comparte hallazgos y debate con tus compañeros y el maestro.</p>
                      </div>

                      {/* Post form */}
                      <form onSubmit={handlePostToForum} className="flex gap-2">
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
                          {postingToForum ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                          Publicar
                        </button>
                      </form>

                      {/* Posts thread */}
                      <div className="space-y-4">
                        {forumPosts.length === 0 ? (
                          <p className="text-center py-10 text-xs text-gray-450 italic">Aún no hay publicaciones en este foro. ¡Sé el primero!</p>
                        ) : (
                          forumPosts.map((post) => (
                            <div key={post.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-150 dark:border-white/5 shadow-2xs space-y-2">
                              <div className="flex items-center gap-3">
                                {post.profiles?.photo_url ? (
                                  <img loading="lazy" src={post.profiles.photo_url} alt="Profile" className="w-8 h-8 rounded-full object-cover border border-gray-150" />
                                ) : (
                                  <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-400">
                                    <User size={14} />
                                  </div>
                                )}
                                <div>
                                  <span className="font-bold text-xs block text-slate-850 dark:text-gray-200">
                                    {post.profiles?.first_name} {post.profiles?.last_name}
                                    {(() => {
                                      const postRoles = post.profiles?.roles || (post.profiles?.role ? [post.profiles.role] : []);
                                      const isInstructor = postRoles.some((r: any) => ['admin', 'pastor', 'maestro', 'docente'].includes(r));
                                      return isInstructor ? (
                                        <span className="ml-1.5 bg-gold/10 text-gold border border-gold/20 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                                          Maestro
                                        </span>
                                      ) : null;
                                    })()}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {new Date(post.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
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
                  {activeLesson.type === 'assignment' && (
                    <div className="space-y-6">
                      <div className="bg-slate-50 dark:bg-slate-900/30 p-6 rounded-2xl border border-gray-150 dark:border-white/5 space-y-4">
                        <div className="flex justify-between items-center pb-2 border-b border-gray-200 dark:border-white/5">
                          <h3 className="font-bold font-serif text-sm">Entregable de la Tarea</h3>
                          {submission?.grade ? (
                            <span className="bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-2.5 py-1 rounded-full">
                              Calificación: {submission.grade}
                            </span>
                          ) : (
                            <span className="bg-amber-50 text-amber-700 border border-amber-250 text-xs font-bold px-2.5 py-1 rounded-full">
                              {submission ? 'Entregada (Sin Calificar)' : 'Pendiente de Entrega'}
                            </span>
                          )}
                        </div>

                        {/* Grading feedback */}
                        {submission?.teacher_feedback && (
                          <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30">
                            <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 block uppercase mb-1">Comentario del Docente:</span>
                            <p className="text-xs text-blue-800 dark:text-gray-300 italic">{submission.teacher_feedback}</p>
                          </div>
                        )}

                        {/* Submission form */}
                        <form onSubmit={handleSaveSubmission} className="space-y-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Respuesta de Texto</label>
                            <textarea
                              rows={5}
                              value={assignmentText}
                              onChange={(e) => setAssignmentText(e.target.value)}
                              disabled={!!submission?.grade}
                              className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-950 focus:ring-2 focus:ring-gold focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                              placeholder="Redacta tu respuesta o explicación del proyecto aquí..."
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Enlace de archivo de entrega (Google Drive, Dropbox, etc.)</label>
                            <input
                              type="url"
                              value={assignmentUrl}
                              onChange={(e) => setAssignmentUrl(e.target.value)}
                              disabled={!!submission?.grade}
                              className="w-full px-4 py-2.5 border border-gray-200 dark:border-white/10 rounded-xl text-xs bg-white dark:bg-slate-950 focus:ring-2 focus:ring-gold focus:outline-none disabled:bg-slate-50 dark:disabled:bg-slate-900/50"
                              placeholder="https://drive.google.com/..."
                            />
                          </div>

                          {!submission?.grade && (
                            <div className="flex justify-end pt-2">
                              <button
                                type="submit"
                                disabled={submittingAssignment || (!assignmentText.trim() && !assignmentUrl.trim())}
                                className="px-5 py-2.5 bg-gold hover:bg-yellow-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                              >
                                {submittingAssignment ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
                                {submission ? 'Actualizar Entrega' : 'Entregar Tarea'}
                              </button>
                            </div>
                          )}
                        </form>
                      </div>
                    </div>
                  )}

                </div>

                {/* Mark as Complete Footer */}
                <div className="pt-6 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div className="text-xs text-gray-400">
                    Marca la lección cuando hayas terminado el estudio o las tareas solicitadas.
                  </div>
                  
                  <button
                    onClick={() => toggleLessonCompletion(activeLesson.id)}
                    className={`px-5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm ${
                      completions[activeLesson.id]
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gold hover:bg-yellow-600 text-white'
                    }`}
                  >
                    <CheckCircle size={16} />
                    {completions[activeLesson.id] ? 'Marcar como Pendiente' : 'Marcar como Completado'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/20 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 max-w-md mx-auto">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
                <h3 className="text-sm font-bold">Selecciona una lección</h3>
                <p className="text-xs text-gray-450 mt-1">Elige una materia y lección de la lista para comenzar a estudiar.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
