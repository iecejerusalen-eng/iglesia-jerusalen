import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronDown, ChevronRight, ArrowLeft, GraduationCap, Lock, FolderOpen } from 'lucide-react';
import type { Program, ProgramModule, ProgramLesson } from '../../types';
import BlockLessonRenderer from '../../components/public/BlockLessonRenderer';

const ProgramDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { role } = useAuthStore();
  const [program, setProgram] = useState<Program | null>(null);
  const [modules, setModules] = useState<ProgramModule[]>([]);
  const [lessons, setLessons] = useState<ProgramLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLesson, setExpandedLesson] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({});
  const [activeTab, setActiveTab] = useState<'public' | 'teacher'>('public');

  // Roles that can see teacher content
  const canSeeTeacherContent = role === 'admin' || role === 'pastor' || role === 'maestro';

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      setLoading(true);

      try {
        const [programRes, modulesRes, lessonsRes] = await Promise.all([
          supabase.from('programs').select('*').eq('id', id).single(),
          supabase.from('program_modules').select('*').eq('program_id', id).order('order'),
          supabase.from('program_lessons').select('*').eq('program_id', id).order('order'),
        ]);

        if (programRes.data) setProgram(programRes.data);
        if (modulesRes.data) {
          setModules(modulesRes.data);
          // Auto-expand the first module by default
          if (modulesRes.data.length > 0) {
            setExpandedModules({ [modulesRes.data[0].id]: true });
          }
        }
        if (lessonsRes.data) setLessons(lessonsRes.data);
      } catch (err) {
        console.error('Error fetching modules data, falling back to flat lessons:', err);
        const [programRes, lessonsRes] = await Promise.all([
          supabase.from('programs').select('*').eq('id', id).single(),
          supabase.from('program_lessons').select('*').eq('program_id', id).order('order'),
        ]);
        if (programRes.data) setProgram(programRes.data);
        if (lessonsRes.data) setLessons(lessonsRes.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [id]);

  const toggleLesson = (lessonId: string) => {
    setExpandedLesson(expandedLesson === lessonId ? null : lessonId);
    setActiveTab('public');
  };

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleId]: !prev[moduleId],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base dark:bg-slate-950 transition-colors">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600 dark:border-indigo-400"></div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-gray-400 bg-base dark:bg-slate-950">
        <BookOpen size={56} className="mb-3 opacity-30" />
        <p className="text-lg font-medium">Programa no encontrado</p>
        <Link to="/programas" className="text-indigo-600 dark:text-indigo-400 text-sm font-medium mt-2 hover:underline">← Volver a programas</Link>
      </div>
    );
  }

  const renderLessonCard = (lesson: ProgramLesson, index: number) => {
    return (
      <motion.div
        key={lesson.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors shadow-xs"
      >
        {/* Lesson header */}
        <button
          onClick={() => toggleLesson(lesson.id)}
          className="w-full flex items-center gap-4 p-4 text-left cursor-pointer hover:bg-gray-50/50 dark:hover:bg-slate-800/40 transition-colors"
        >
          <span className="w-8 h-8 flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/60 text-indigo-750 dark:text-indigo-300 rounded-lg text-xs font-bold flex-shrink-0">
            {index + 1}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm">{lesson.title}</h3>
            {lesson.teacher_content && canSeeTeacherContent && (
              <span className="text-[9px] bg-purple-100 dark:bg-purple-950/50 text-purple-750 dark:text-purple-300 font-bold px-1.5 py-0.5 rounded mt-1 inline-block border border-purple-200 dark:border-purple-800/30">
                + Guía del Maestro disponible
              </span>
            )}
          </div>
          {expandedLesson === lesson.id ? (
            <ChevronDown size={18} className="text-gray-400 flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="text-gray-400 flex-shrink-0" />
          )}
        </button>

        {/* Lesson content */}
        <AnimatePresence>
          {expandedLesson === lesson.id && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-gray-100 dark:border-white/10 bg-slate-50/20 dark:bg-slate-950/20">
                {/* Tabs (only if teacher content is accessible) */}
                {canSeeTeacherContent && lesson.teacher_content && (
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
                    <BlockLessonRenderer content={lesson.public_content || ''} lessonId={lesson.id} />
                  ) : (
                    <div className="bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/30 rounded-xl p-5">
                      <div className="flex items-center gap-2 mb-3">
                        <GraduationCap size={18} className="text-purple-650 dark:text-purple-400" />
                        <h4 className="font-semibold text-purple-800 dark:text-purple-300 text-sm">Manual del Maestro</h4>
                        <span className="text-[10px] bg-purple-200 dark:bg-purple-900/40 text-purple-850 dark:text-purple-200 px-2 py-0.5 rounded-full font-bold border border-purple-300/30 dark:border-purple-700/30">Exclusivo</span>
                      </div>
                      <BlockLessonRenderer content={lesson.teacher_content || ''} lessonId={lesson.id} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  // Lessons belonging to no module
  const standaloneLessons = lessons.filter(l => !l.module_id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/20 to-white dark:from-slate-950 dark:to-slate-950 transition-colors duration-200">
      {/* Hero Header */}
      <div className="relative bg-gradient-to-r from-indigo-800 to-indigo-950 text-white overflow-hidden shadow-md">
        {program.cover_image && (
          <img src={program.cover_image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 filter blur-xs" />
        )}
        <div className="relative max-w-4xl mx-auto px-4 py-16">
          <Link to="/programas" className="inline-flex items-center gap-1.5 text-indigo-300 hover:text-white text-xs font-semibold uppercase tracking-wider mb-6 transition-colors">
            <ArrowLeft size={14} /> Volver a Programas
          </Link>
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl md:text-4xl font-serif font-bold mb-3 tracking-tight">{program.title}</h1>
            {program.description && <p className="text-indigo-200 text-sm md:text-base max-w-2xl font-light leading-relaxed">{program.description}</p>}
            <div className="flex items-center gap-4 mt-6 text-indigo-300 text-xs">
              {modules.length > 0 && (
                <span className="flex items-center gap-1"><FolderOpen size={13} /> {modules.length} {modules.length === 1 ? 'módulo' : 'módulos'}</span>
              )}
              <span className="flex items-center gap-1"><BookOpen size={13} /> {lessons.length} {lessons.length === 1 ? 'lección' : 'lecciones'}</span>
              {canSeeTeacherContent && (
                <span className="flex items-center gap-1 bg-purple-600/35 border border-purple-400/20 px-2.5 py-0.5 rounded-full text-purple-200 text-[10px] font-semibold tracking-wide uppercase">
                  <GraduationCap size={12} /> Acceso de Maestro
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Main Lessons List */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {lessons.length === 0 ? (
          <div className="text-center py-20 text-gray-400 bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-2xl shadow-xs">
            <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm">Este programa aún no tiene lecciones</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. Render Modules with their lessons */}
            {modules.map((module, modIndex) => {
              const moduleLessons = lessons.filter(l => l.module_id === module.id);
              const isExpanded = !!expandedModules[module.id];

              return (
                <div key={module.id} className="bg-slate-50/50 dark:bg-slate-900/50 border border-gray-150 dark:border-white/10 rounded-2xl p-4 md:p-5 shadow-xs space-y-3">
                  {/* Module header toggle */}
                  <button
                    onClick={() => toggleModule(module.id)}
                    className="w-full flex items-start justify-between text-left cursor-pointer group"
                  >
                    <div className="space-y-1 pr-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100/70 dark:bg-indigo-950/50 px-2 py-0.5 rounded-md">
                          Volumen {modIndex + 1}
                        </span>
                        <span className="text-xxs text-gray-400 dark:text-gray-500">({moduleLessons.length} lecciones)</span>
                      </div>
                      <h2 className="text-base font-bold text-gray-800 dark:text-gray-100 group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors">
                        {module.title}
                      </h2>
                      {module.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-light max-w-2xl leading-normal">
                          {module.description}
                        </p>
                      )}
                    </div>
                    <div className="w-8 h-8 rounded-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-500 dark:text-gray-400 group-hover:bg-slate-50 dark:group-hover:bg-slate-700 transition shadow-xxs flex-shrink-0">
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </div>
                  </button>

                  {/* Module Lessons list */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 space-y-2.5">
                          {moduleLessons.length === 0 ? (
                            <p className="text-xs text-gray-400 italic py-2 text-center">No hay lecciones en este volumen todavía.</p>
                          ) : (
                            moduleLessons.map((lesson, index) => renderLessonCard(lesson, index))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}

            {/* 2. Standalone lessons (if any) */}
            {standaloneLessons.length > 0 && (
              <div className="space-y-3">
                {modules.length > 0 && (
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-1 mt-6">
                    Lecciones Generales
                  </h3>
                )}
                <div className="space-y-2.5">
                  {standaloneLessons.map((lesson, index) => renderLessonCard(lesson, index))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Teacher content info for non-authorized users */}
        {!canSeeTeacherContent && lessons.some(l => l.teacher_content) && (
          <div className="mt-10 bg-slate-50 dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl p-6 text-center shadow-inner max-w-md mx-auto">
            <Lock size={20} className="mx-auto mb-2 text-gray-450 dark:text-gray-400" />
            <p className="text-xs text-gray-700 dark:text-gray-200 font-semibold">Guías del Maestro Protegidas</p>
            <p className="text-[11px] text-gray-400 mt-0.5 leading-normal">
              Este programa incluye material exclusivo para instructores. Si tienes el rol de Maestro, Pastor o Administrador, inicia sesión para acceder.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramDetail;
