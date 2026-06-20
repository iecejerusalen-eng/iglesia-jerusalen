import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { AnimeFadeUp, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import { BookOpen, ChevronDown, ChevronRight, ArrowLeft, GraduationCap, Lock, FolderOpen, Video, FileText, MessageSquare, ClipboardList, HelpCircle, CheckCircle } from 'lucide-react';
import type { LMSCourse, LMSSection, LMSActivity } from '../../types';
import BlockLessonRenderer from '../../components/public/BlockLessonRenderer';
import LMSAssignment from '../../components/public/lms/LMSAssignment';
import LMSForum from '../../components/public/lms/LMSForum';
import LMSQuiz from '../../components/public/lms/LMSQuiz';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { generateCourseBadgeSVG } from '../../utils/badgeGenerator';

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { role, user } = useAuthStore();
  const { width, height } = useWindowSize();
  const [course, setCourse] = useState<LMSCourse | null>(null);
  const [sections, setSections] = useState<LMSSection[]>([]);
  const [activities, setActivities] = useState<LMSActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'public' | 'teacher'>('public');
  const [completions, setCompletions] = useState<Record<string, boolean>>({});
  const [awardedBadge, setAwardedBadge] = useState<string | null>(null);
  const [showBadgeModal, setShowBadgeModal] = useState(false);

  // Roles that can see teacher content
  const canSeeTeacherContent = role === 'admin' || role === 'pastor' || role === 'maestro';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const { data: courseData, error } = await supabase
          .from('lms_courses')
          .select(`
            *,
            lms_sections (
              *,
              lms_activities (*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (courseData) {
          setCourse(courseData as any);
          
          let fetchedSections = (courseData.lms_sections as any[]) || [];
          // Sort sections by order_index
          fetchedSections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          setSections(fetchedSections);

          let fetchedActivities: LMSActivity[] = [];
          fetchedSections.forEach(sec => {
            const secActs = sec.lms_activities || [];
            secActs.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
            fetchedActivities = [...fetchedActivities, ...secActs];
          });
          setActivities(fetchedActivities);

          // Auto-expand the presentation block or the first section
          if (fetchedSections.length > 0) {
            const presentationBlock = fetchedSections.find(s => s.is_presentation_block);
            if (presentationBlock) {
              setExpandedSections({ [presentationBlock.id]: true });
            } else {
              setExpandedSections({ [fetchedSections[0].id]: true });
            }
          }
          // Fetch completions
          if (user) {
            const { data: compData } = await supabase
              .from('lms_activity_completions')
              .select('activity_id')
              .eq('student_id', user.id);
              
            if (compData) {
              const compMap: Record<string, boolean> = {};
              compData.forEach((c: any) => compMap[c.activity_id] = true);
              setCompletions(compMap);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id, user]);

  const markActivityAsCompleted = async (activityId: string, currentActivities = activities) => {
    if (!user || completions[activityId] || !course) return;

    setCompletions(prev => ({ ...prev, [activityId]: true }));
    
    try {
      await supabase.from('lms_activity_completions').upsert({
        student_id: user.id,
        activity_id: activityId,
        is_completed: true,
        completed_at: new Date().toISOString()
      });

      // Check progress
      const newCompletionsCount = Object.keys(completions).length + 1;
      if (newCompletionsCount >= currentActivities.length && currentActivities.length > 0) {
        await checkAndAwardBadge(course);
      }
    } catch (err) {
      console.error("Error saving completion", err);
    }
  };

  const checkAndAwardBadge = async (currentCourse: LMSCourse) => {
    if (!user) return;
    try {
      // check if badge exists
      const { data: existingBadge } = await supabase
        .from('lms_student_badges')
        .select('id')
        .eq('student_id', user.id)
        .eq('course_id', currentCourse.id)
        .maybeSingle();
        
      if (!existingBadge) {
        // Generate SVG
        const svg = generateCourseBadgeSVG(currentCourse.title);
        await supabase.from('lms_student_badges').insert({
          student_id: user.id,
          course_id: currentCourse.id,
          badge_name: 'Curso Completado',
          badge_svg: svg
        });
        setAwardedBadge(svg);
        setShowBadgeModal(true);
      }
    } catch (err) {
      console.error("Error checking/awarding badge", err);
    }
  };

  const toggleActivity = async (activityId: string) => {
    const isOpening = expandedActivity !== activityId;
    setExpandedActivity(isOpening ? activityId : null);
    setActiveTab('public');
    
    if (isOpening) {
      const act = activities.find(a => a.id === activityId);
      if (act && act.type !== 'quiz' && act.type !== 'assignment' && act.type !== 'forum') {
        // Auto complete for viewable resources
        await markActivityAsCompleted(activityId, activities);
      }
    }
  };

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface dark:bg-slate-950 transition-colors">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 bg-surface dark:bg-slate-950">
        <BookOpen size={56} className="mb-3 opacity-30" />
        <p className="text-lg font-medium">Curso no encontrado</p>
        <Link to="/programas" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-2 hover:underline">← Volver al Aula Virtual</Link>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video_link': return <Video size={16} className="text-blue-500" />;
      case 'resource': return <FileText size={16} className="text-emerald-500" />;
      case 'forum': return <MessageSquare size={16} className="text-amber-500" />;
      case 'assignment': return <ClipboardList size={16} className="text-rose-500" />;
      case 'quiz': return <HelpCircle size={16} className="text-purple-500" />;
      default: return <BookOpen size={16} className="text-indigo-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'video_link': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30';
      case 'resource': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30';
      case 'forum': return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/30';
      case 'assignment': return 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/30';
      case 'quiz': return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/30';
      default: return 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/30';
    }
  };

  const renderActivityCard = (activity: LMSActivity) => {
    return (
      <AnimeFadeUp
        key={activity.id}
        className={`border rounded-xl overflow-hidden transition-colors shadow-xs ${expandedActivity === activity.id ? getActivityColor(activity.type) : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-white/10 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
      >
        {/* Activity header */}
        <button
          onClick={() => toggleActivity(activity.id)}
          className="w-full flex items-center gap-4 p-4 text-left cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-slate-800 rounded-lg flex-shrink-0">
            {getActivityIcon(activity.type)}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm flex items-center gap-2">
              {activity.title}
              {completions[activity.id] && (
                <CheckCircle size={14} className="text-emerald-500 flex-shrink-0" />
              )}
            </h3>
            {activity.teacher_content && canSeeTeacherContent && (
              <span className="text-[9px] bg-purple-100 dark:bg-purple-950/50 text-purple-750 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded mt-1 inline-block border border-purple-200 dark:border-purple-800/30">
                + Guía del Maestro
              </span>
            )}
          </div>
          {expandedActivity === activity.id ? (
            <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          )}
        </button>

        {/* Activity content */}
        <div className="overflow-hidden transition-all duration-300">
          {expandedActivity === activity.id && (
            <AnimeFadeUp
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100 dark:border-white/10 bg-slate-50/20 dark:bg-slate-950/20">
                {/* Tabs */}
                {canSeeTeacherContent && activity.teacher_content && (
                  <div className="flex border-b border-gray-100 dark:border-white/10 px-5 bg-white dark:bg-slate-900">
                    <button
                      onClick={() => setActiveTab('public')}
                      className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'public'
                          ? 'border-indigo-600 text-indigo-750 dark:text-indigo-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      📖 Contenido Estudiante
                    </button>
                    <button
                      onClick={() => setActiveTab('teacher')}
                      className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                        activeTab === 'teacher'
                          ? 'border-purple-600 text-purple-750 dark:text-purple-400'
                          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <GraduationCap size={14} /> Guía del Maestro
                    </button>
                  </div>
                )}

                {/* Content */}
                <div className="p-5">
                  {activeTab === 'public' ? (
                    <div>
                      {(activity.type === 'video_link' && activity.settings?.video_url) || (activity.type === 'video' && activity.content) ? (
                        <div className="mb-4 aspect-video rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                          <iframe
                            src={activity.settings?.video_url || activity.content}
                            className="w-full h-full"
                            allowFullScreen
                            title="Video de clase"
                          />
                        </div>
                      ) : null}
                      {activity.type === 'h5p' && activity.content && (
                        <div className="mb-4 aspect-video rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                          <iframe
                            src={activity.content}
                            className="w-full h-full border-0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            title="H5P Interactive Content"
                          />
                        </div>
                      )}
                      {activity.content ? (
                        <BlockLessonRenderer content={activity.content} lessonId={activity.id} />
                      ) : (
                        <div className="text-sm text-gray-500 italic">No hay contenido de texto adicional.</div>
                      )}

                      {/* Botón de Interacción si es Tarea o Foro o Quiz */}
                      {user ? (
                        <>
                          {activity.type === 'assignment' && <LMSAssignment activity={activity} studentId={user.id} onComplete={() => markActivityAsCompleted(activity.id)} />}
                          {activity.type === 'forum' && <LMSForum activity={activity} courseId={course.id} />}
                          {activity.type === 'quiz' && <LMSQuiz activity={activity} onComplete={() => markActivityAsCompleted(activity.id)} />}
                        </>
                      ) : (
                        (activity.type === 'assignment' || activity.type === 'quiz' || activity.type === 'forum') && (
                          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
                            <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 p-3 rounded-lg text-xs flex items-center gap-2">
                              <Lock size={14} /> Debes iniciar sesión para participar en esta actividad.
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  ) : (
                    <div className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap size={18} className="text-purple-650 dark:text-purple-400" />
                        <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm">Manual del Maestro</h4>
                        <span className="text-[10px] bg-purple-200 dark:bg-purple-900/40 text-purple-850 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-300/30 dark:border-purple-700/30">Exclusivo</span>
                      </div>
                      <BlockLessonRenderer content={activity.teacher_content || ''} lessonId={activity.id} />
                    </div>
                  )}
                </div>
              </div>
            </AnimeFadeUp>
          )}
        </div>
      </AnimeFadeUp>
    );
  };

  const presentationBlock = sections.find(s => s.is_presentation_block);
  const studyModules = sections.filter(s => !s.is_presentation_block);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/20 to-white dark:from-slate-950 dark:to-slate-950 transition-colors duration-200">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-indigo-800 to-indigo-950 text-white overflow-hidden shadow-md">
        {course.cover_image_url && (
          <img src={course.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs" />
        )}
        <div className="relative max-w-4xl mx-auto px-4 py-16">
          <Link to="/programas" className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-xs font-semibold uppercase tracking-wider mb-6 transition-colors">
            <ArrowLeft size={14} /> Volver al Aula Virtual
          </Link>
          <AnimeFadeUp>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white border border-white/30 backdrop-blur-sm">
                Curso
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3 tracking-tight">{course.title}</h1>
            {course.description && <p className="text-indigo-200 text-sm md:text-base max-w-2xl font-light leading-relaxed">{course.description}</p>}
            <div className="flex items-center gap-4 mt-6 text-indigo-300 text-xs">
              <span className="flex items-center gap-1"><FolderOpen size={13} /> {sections.length} Módulos</span>
              <span className="flex items-center gap-1"><BookOpen size={13} /> {activities.length} Actividades</span>
              {canSeeTeacherContent && (
                <span className="flex items-center gap-1 bg-purple-600/35 border border-purple-400/20 px-2.5 py-0.5 rounded-full text-purple-200 text-[10px] font-semibold tracking-wide uppercase">
                  <GraduationCap size={12} /> Acceso de Maestro
                </span>
              )}
            </div>
          </AnimeFadeUp>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Progress Bar */}
        {user && activities.length > 0 && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tu progreso en el curso</h3>
              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                {Math.round((Object.keys(completions).length / activities.length) * 100)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.round((Object.keys(completions).length / activities.length) * 100)}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Bloque Cero / Presentación (PACIE) */}
        {presentationBlock && (
          <div className="mb-10 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl p-5 md:p-6 shadow-sm">
             <div className="flex items-center gap-3 mb-4 border-b border-indigo-100 dark:border-indigo-900/50 pb-4">
               <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                 <BookOpen size={20} />
               </div>
               <div>
                 <h2 className="text-lg font-bold text-indigo-900 dark:text-indigo-100">{presentationBlock.title}</h2>
                 {presentationBlock.description && <p className="text-xs text-indigo-600/80 dark:text-indigo-300/80">{presentationBlock.description}</p>}
               </div>
             </div>
             
             <div className="space-y-3">
               {activities.filter(a => a.section_id === presentationBlock.id).map((activity) => 
                 renderActivityCard(activity)
               )}
             </div>
          </div>
        )}

        {/* Módulos de Estudio */}
        {studyModules.length === 0 ? (
          !presentationBlock && (
            <div className="text-center py-20 text-gray-400 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-xs">
              <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-medium text-sm">Este curso aún no tiene contenido</p>
            </div>
          )
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-gray-800 dark:text-gray-100 mb-2">Contenido del Curso</h3>
            {studyModules.map((section, modIndex) => {
              const sectionActivities = activities.filter(a => a.section_id === section.id);
              const isExpanded = !!expandedSections[section.id];

              return (
                <div key={section.id} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-4 md:p-5 shadow-xs space-y-3">
                  {/* Section header toggle */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-start justify-between text-left cursor-pointer group"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md border border-indigo-100 dark:border-indigo-900/50">
                          Módulo {modIndex + 1}
                        </span>
                        <span className="text-xxs text-gray-400 dark:text-gray-500">({sectionActivities.length} actividades)</span>
                      </div>
                      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                        {section.title}
                      </h2>
                      {section.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light max-w-2xl leading-normal mt-1">
                          {section.description}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-white dark:group-hover:bg-slate-700 transition shadow-xxs flex-shrink-0">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>

                  {/* Section Activities list */}
                  <div className="overflow-hidden transition-all duration-300">
                    {isExpanded && (
                      <AnimeZoomIn
                        className="overflow-hidden"
                      >
                        <div className="pt-4 space-y-2.5">
                          {sectionActivities.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 dark:bg-slate-800/50 rounded-lg">No hay actividades en este módulo todavía.</p>
                          ) : (
                            sectionActivities.map((activity) => renderActivityCard(activity))
                          )}
                        </div>
                      </AnimeZoomIn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Teacher content info for non-authorized users */}
        {!canSeeTeacherContent && activities.some(a => a.teacher_content) && (
          <div className="mt-10 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center shadow-inner max-w-md mx-auto">
            <Lock size={20} className="mx-auto mb-2 text-gray-450 dark:text-gray-400" />
            <p className="text-xs text-gray-700 dark:text-gray-200 font-semibold">Guías del Maestro Protegidas</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
              Este curso incluye material exclusivo para instructores. Si tienes el rol de Maestro, Pastor o Administrador, inicia sesión para acceder.
            </p>
          </div>
        )}
      </div>

      {/* Badge Modal */}
      {showBadgeModal && awardedBadge && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <Confetti width={width} height={height} recycle={false} numberOfPieces={500} />
          <AnimeZoomIn className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden border border-gray-200 dark:border-white/10">
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-50/50 to-transparent dark:from-yellow-900/20 dark:to-transparent" />
            <div className="relative z-10">
              <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">¡Felicidades!</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">Has completado satisfactoriamente todas las actividades del curso <strong className="text-indigo-600 dark:text-indigo-400">{course.title}</strong>.</p>
              
              <div className="flex justify-center mb-6">
                <div 
                  className="w-48 h-48 drop-shadow-xl transform transition-transform hover:scale-105"
                  dangerouslySetInnerHTML={{ __html: awardedBadge }} 
                />
              </div>

              <p className="text-xs text-gray-500 mb-6 italic">Esta insignia se ha añadido a tu perfil de estudiante.</p>

              <button 
                onClick={() => setShowBadgeModal(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                Continuar
              </button>
            </div>
          </AnimeZoomIn>
        </div>
      )}
    </div>
  );
};

export default ProgramDetail;
