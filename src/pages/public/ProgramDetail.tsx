import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { AnimeFadeUp, AnimeZoomIn } from '../../components/animations/AnimeWrappers';
import { BookOpen, ChevronDown, ChevronRight, ArrowLeft, FolderOpen, Video, FileText } from 'lucide-react';
import type { OpenResource, OpenSection, OpenActivity } from '../../types';
import BlockLessonRenderer from '../../components/public/BlockLessonRenderer';

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<OpenResource | null>(null);
  const [sections, setSections] = useState<OpenSection[]>([]);
  const [activities, setActivities] = useState<OpenActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const { data: courseData, error } = await supabase
          .from('open_resources')
          .select(`
            *,
            open_sections (
              *,
              open_activities (*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (courseData) {
          setCourse(courseData as any);
          
          let fetchedSections = (courseData.open_sections as any[]) || [];
          // Sort sections by order_index
          fetchedSections.sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
          setSections(fetchedSections);

          let fetchedActivities: OpenActivity[] = [];
          fetchedSections.forEach(sec => {
            const secActs = sec.open_activities || [];
            secActs.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0));
            fetchedActivities = [...fetchedActivities, ...secActs];
          });
          setActivities(fetchedActivities);

          // Auto-expand the first section
          if (fetchedSections.length > 0) {
            setExpandedSections({ [fetchedSections[0].id]: true });
          }
        }
      } catch (err) {
        console.error('Error fetching course data:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const toggleActivity = (activityId: string) => {
    const isOpening = expandedActivity !== activityId;
    setExpandedActivity(isOpening ? activityId : null);
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
        <p className="text-lg font-medium">Programa no encontrado</p>
        <Link to="/programas" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-2 hover:underline">← Volver a Programas y Estudios</Link>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'video_link': return <Video size={16} className="text-blue-500" />;
      case 'resource': return <FileText size={16} className="text-emerald-500" />;
      default: return <BookOpen size={16} className="text-indigo-500" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'video_link': return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/30';
      case 'resource': return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/30';
      default: return 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900/30';
    }
  };

  const renderActivityCard = (activity: OpenActivity) => {
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
            </h3>
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
            <AnimeFadeUp className="overflow-hidden">
              <div className="border-t border-gray-100 dark:border-white/10 bg-slate-50/20 dark:bg-slate-950/20 p-5">
                {(activity.type === 'video_link' && activity.settings?.video_url) || (activity.type === 'video' && activity.content) ? (
                  <div className="mb-4 aspect-video rounded-xl overflow-hidden bg-black/5 dark:bg-white/5">
                    <iframe
                      src={activity.settings?.video_url || activity.content || ''}
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
              </div>
            </AnimeFadeUp>
          )}
        </div>
      </AnimeFadeUp>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/20 to-white dark:from-slate-950 dark:to-slate-950 transition-colors duration-200">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-indigo-800 to-indigo-950 text-white overflow-hidden shadow-md">
        {course.cover_image_url && (
          <img src={course.cover_image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs" />
        )}
        <div className="relative max-w-4xl mx-auto px-4 py-16">
          <Link to="/programas" className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-xs font-semibold uppercase tracking-wider mb-6 transition-colors">
            <ArrowLeft size={14} /> Volver a Programas y Estudios
          </Link>
          <AnimeFadeUp>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase bg-white/20 px-2 py-0.5 rounded text-white border border-white/30 backdrop-blur-sm">
                Programa
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3 tracking-tight">{course.title}</h1>
            {course.description && <p className="text-indigo-200 text-sm md:text-base max-w-2xl font-light leading-relaxed">{course.description}</p>}
            <div className="flex items-center gap-4 mt-6 text-indigo-300 text-xs">
              <span className="flex items-center gap-1"><FolderOpen size={13} /> {sections.length} Módulos</span>
              <span className="flex items-center gap-1"><BookOpen size={13} /> {activities.length} Recursos</span>
            </div>
          </AnimeFadeUp>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Módulos de Estudio */}
        {sections.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-xs">
            <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">Este programa aún no tiene contenido</p>
          </div>
        ) : (
          <div className="space-y-6">
            <h3 className="text-xl font-bold font-serif text-gray-800 dark:text-gray-100 mb-2">Contenido del Programa</h3>
            {sections.map((section, modIndex) => {
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
                        <span className="text-xxs text-gray-400 dark:text-gray-500">({sectionActivities.length} recursos)</span>
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
                      <AnimeZoomIn className="overflow-hidden">
                        <div className="pt-4 space-y-2.5">
                          {sectionActivities.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 dark:bg-slate-800/50 rounded-lg">No hay recursos en este módulo todavía.</p>
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
      </div>
    </div>
  );
};

export default ProgramDetail;
