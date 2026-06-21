import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  GraduationCap, BookOpen, Download, Eye, Video, 
  Calendar, Clock, Users, X, AlertCircle, 
  CheckCircle, PlusCircle, Search, Bookmark, Lock, GraduationCap as PathIcon
} from 'lucide-react';
import type { LMSCourse, Study } from '../../types';
import { toast } from 'sonner';

interface CourseCategory {
  id: string;
  name: string;
  description: string;
}

export default function ProgramsOverview() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'studies' | 'programs'>('programs');
  const [loading, setLoading] = useState(true);

  // Data states
  const [studies, setStudies] = useState<Study[]>([]);
  const [courses, setCourses] = useState<LMSCourse[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  
  // User enrollment / request states
  const [userEnrollments, setUserEnrollments] = useState<Record<string, any>>({});
  const [userRequests, setUserRequests] = useState<Record<string, string>>({}); // course_id -> status
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [courseProgress, setCourseProgress] = useState<Record<string, number>>({});

  // Filter & Search states
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [videoModalUrl, setVideoModalUrl] = useState<string | null>(null);
  const [submittingEnrollment, setSubmittingEnrollment] = useState<string>('');

  useEffect(() => {
    fetchInitialData();
  }, [activeTab]);

  useEffect(() => {
    if (user) {
      fetchUserEnrollmentsAndRequests();
    } else {
      setUserEnrollments({});
      setUserRequests({});
      setCourseProgress({});
    }
  }, [user, courses]);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'studies') {
        const { data, error } = await supabase
          .from('studies')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        setStudies(data || []);
      } else {
        // Fetch courses and categories
        const { data: coursesData, error: coursesError } = await supabase
          .from('lms_courses')
          .select('*, lms_course_categories(name)')
          .eq('is_published', true)
          .order('created_at', { ascending: true });
        
        if (coursesError) throw coursesError;
        setCourses(coursesData || []);

        const { data: catsData } = await supabase
          .from('lms_course_categories')
          .select('*')
          .order('created_at', { ascending: true });
        setCategories(catsData || []);

        // Fetch enrollment counts
        const { data: enrollments } = await supabase
          .from('lms_enrollments')
          .select('course_id');
        
        const counts: Record<string, number> = {};
        enrollments?.forEach((e: any) => {
          counts[e.course_id] = (counts[e.course_id] || 0) + 1;
        });
        setEnrollmentCounts(counts);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEnrollmentsAndRequests = async () => {
    if (!user) return;
    try {
      // Fetch enrollments
      const { data: enrolls } = await supabase
        .from('lms_enrollments')
        .select('*')
        .eq('user_id', user.id);

      const enrollMap: Record<string, any> = {};
      enrolls?.forEach(e => {
        enrollMap[e.course_id] = e;
      });
      setUserEnrollments(enrollMap);

      // Fetch enrollment requests
      const { data: reqs } = await supabase
        .from('lms_enrollment_requests')
        .select('*')
        .eq('user_id', user.id);

      const reqMap: Record<string, string> = {};
      reqs?.forEach(r => {
        reqMap[r.course_id] = r.status;
      });
      setUserRequests(reqMap);

      // Calculate progress for enrolled courses
      if (enrolls && enrolls.length > 0 && courses.length > 0) {
        const progressMap: Record<string, number> = {};
        for (const enr of enrolls) {
          // Fetch total activities/lessons
          const { data: lessons } = await supabase
            .from('lms_lessons')
            .select('id, lms_modules!inner(subject_id, lms_subjects!inner(course_id))')
            .eq('lms_modules.lms_subjects.course_id', enr.course_id);
          
          const total = lessons?.length || 0;
          let completed = 0;

          if (lessons && lessons.length > 0) {
            const lessonIds = lessons.map(l => l.id);
            const { data: progressData } = await supabase
              .from('lms_lesson_completions')
              .select('is_completed')
              .eq('student_id', user.id)
              .in('lesson_id', lessonIds)
              .eq('is_completed', true);
            completed = progressData?.length || 0;
          }

          progressMap[enr.course_id] = total > 0 ? Math.round((completed / total) * 100) : 0;
        }
        setCourseProgress(progressMap);
      }
    } catch (err) {
      console.error('Error fetching user enrollments/requests:', err);
    }
  };

  const handleEnrollRequest = async (courseId: string) => {
    if (!user) {
      toast.error('Debes iniciar sesión para inscribirte');
      navigate(`/login?redirectTo=/programas`);
      return;
    }
    setSubmittingEnrollment(courseId);
    try {
      const { error } = await supabase
        .from('lms_enrollment_requests')
        .insert([{
          course_id: courseId,
          user_id: user.id,
          status: 'pending',
          notes: 'Solicitud enviada desde catálogo público'
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.warning('Ya tienes una solicitud pendiente para este programa.');
        } else {
          throw error;
        }
      } else {
        toast.success('¡Solicitud de inscripción enviada! Un administrador revisará tu solicitud.');
        fetchUserEnrollmentsAndRequests();
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Error al enviar la solicitud: ' + err.message);
    } finally {
      setSubmittingEnrollment('');
    }
  };

  // Filters for studies
  const categoriesList = ['Todos', 'Damas', 'Caballeros', 'Jóvenes', 'Generales'];
  const filteredStudies = studies.filter(s => {
    const matchesCategory = selectedCategoryFilter === 'Todos' || s.category === selectedCategoryFilter;
    const matchesSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Group courses by categories (Rutas)
  const coursesByCategory = (catName: string) => {
    return courses.filter(c => {
      const courseCat = (c.lms_course_categories as any)?.name || 'Otros Programas';
      return courseCat === catName;
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/30 to-white dark:from-slate-950 dark:to-slate-950 transition-colors duration-200">
      
      {/* Hero */}
      <div className="relative bg-gradient-to-r from-indigo-850 via-indigo-900 to-slate-900 text-white py-16 px-4 border-b border-indigo-500/10 overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-300 via-transparent to-transparent"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <GraduationCap size={52} className="mx-auto mb-4 text-gold opacity-90 animate-pulse" />
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-3 tracking-tight">Programas y Estudios</h1>
          <p className="text-indigo-200 text-base md:text-lg max-w-xl mx-auto font-light">
            Recursos bíblicos gratuitos y rutas guiadas para el crecimiento espiritual de toda la familia.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Toggle Pestañas (Tabs) */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-150 dark:bg-slate-900 p-1.5 rounded-2xl flex gap-1 shadow-inner border border-gray-200 dark:border-white/5 relative">
            <button
              onClick={() => { setActiveTab('programs'); setSelectedCategoryFilter('Todos'); setSearchQuery(''); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'programs' ? 'bg-indigo-650 text-white shadow-md' : 'text-gray-650 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <PathIcon size={16} />
              Rutas de Discipulado
            </button>
            <button
              onClick={() => { setActiveTab('studies'); setSelectedCategoryFilter('Todos'); setSearchQuery(''); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 relative flex items-center gap-2 cursor-pointer ${
                activeTab === 'studies' ? 'bg-indigo-650 text-white shadow-md' : 'text-gray-650 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white'
              }`}
            >
              <BookOpen size={16} />
              Explorar Estudios
            </button>
          </div>
        </div>

        {/* CONTENIDO DE ESTUDIOS */}
        {activeTab === 'studies' && (
          <div className="space-y-8">
            {/* Search and Filters Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-200 dark:border-white/10 shadow-xs">
              {/* Category selector chips */}
              <div className="flex flex-wrap gap-1.5">
                {categoriesList.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${
                      selectedCategoryFilter === cat 
                        ? 'bg-gold text-white shadow-xs' 
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-450 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'Todos' ? 'Todos los Recursos' : `Para ${cat}`}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar estudio o tema..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-xs bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-white/10 rounded-xl outline-none focus:ring-2 focus:ring-gold/30 dark:focus:ring-gold/25 focus:border-gold transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : filteredStudies.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-xxs">
                <BookOpen size={56} className="mx-auto mb-3 opacity-20 text-gray-400" />
                <p className="text-lg font-medium text-gray-500">No se encontraron estudios</p>
                <p className="text-sm text-gray-400 mt-1">Intenta ajustando los filtros o buscando con otros términos.</p>
              </div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
              >
                <AnimatePresence>
                  {filteredStudies.map((study) => {
                    const categoryColors: Record<string, string> = {
                      Damas: 'bg-rose-500/10 text-rose-500 border border-rose-500/25',
                      Caballeros: 'bg-blue-500/10 text-blue-500 border border-blue-500/25',
                      Jóvenes: 'bg-purple-500/10 text-purple-500 border border-purple-500/25',
                      Generales: 'bg-amber-500/10 text-amber-500 border border-amber-500/25'
                    };

                    return (
                      <motion.div
                        key={study.id}
                        layout
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-500 transition-all duration-300 flex flex-col group text-left h-full"
                      >
                        {/* Cover */}
                        <div className="h-44 bg-gray-100 dark:bg-slate-800 relative overflow-hidden shrink-0">
                          {study.cover_image_url ? (
                            <img src={study.cover_image_url} alt={study.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900/40 flex items-center justify-center">
                              <BookOpen size={40} className="text-indigo-300 dark:text-indigo-800" />
                            </div>
                          )}
                          <div className="absolute top-3 left-3">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${categoryColors[study.category] || 'bg-gray-500 text-white'}`}>
                              {study.category}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                          <div className="space-y-2">
                            <h3 className="font-serif font-bold text-lg text-slate-850 dark:text-white leading-snug group-hover:text-indigo-650 transition-colors line-clamp-2">
                              {study.title}
                            </h3>
                            {study.description && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-3 font-light leading-relaxed">
                                {study.description}
                              </p>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="pt-5 border-t border-gray-100 dark:border-white/5 mt-5 flex flex-wrap gap-2 justify-end">
                            {study.video_url && (
                              <button
                                onClick={() => setVideoModalUrl(study.video_url)}
                                className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-400 rounded-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Ver video de clase"
                              >
                                <Video size={13} />
                                Video
                              </button>
                            )}
                            
                            {study.read_now_url && (
                              <a
                                href={study.read_now_url}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-gray-100 dark:bg-slate-850 hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <Eye size={13} />
                                Leer
                              </a>
                            )}

                            {study.pdf_url && (
                              <a
                                href={study.pdf_url}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg text-xxs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xxs transition-colors cursor-pointer"
                              >
                                <Download size={13} />
                                PDF
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        )}

        {/* CONTENIDO DE PROGRAMAS (RUTAS DE DISCIPULADO) */}
        {activeTab === 'programs' && (
          <div className="space-y-12">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
              </div>
            ) : categories.length === 0 && courses.length === 0 ? (
              <div className="text-center py-20 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl shadow-xxs">
                <GraduationCap size={56} className="mx-auto mb-3 opacity-20 text-gray-400" />
                <p className="text-lg font-medium text-gray-500">No hay programas de discipulado disponibles</p>
                <p className="text-sm text-gray-400 mt-1">Pronto se anunciarán las próximas fechas de inscripción.</p>
              </div>
            ) : (
              <div className="space-y-16">
                {categories.map((cat, idx) => {
                  const catCourses = coursesByCategory(cat.name);
                  if (catCourses.length === 0) return null;

                  return (
                    <div key={cat.id} className="space-y-6 text-left relative">
                      {/* Section Header */}
                      <div className="border-l-4 border-indigo-600 pl-4 space-y-1">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-600 dark:text-indigo-400">
                          Ruta Nivel {idx + 1}
                        </span>
                        <h2 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
                          {cat.name}
                        </h2>
                        {cat.description && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 font-light max-w-3xl leading-relaxed">
                            {cat.description}
                          </p>
                        )}
                      </div>

                      {/* Pathways/Timeline layout of courses */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2">
                        {catCourses.map((course) => {
                          const enrolled = !!userEnrollments[course.id];
                          const requestStatus = userRequests[course.id];
                          const totalEnrolled = enrollmentCounts[course.id] || 0;
                          const spotsAvailable = course.capacity ? Math.max(0, course.capacity - totalEnrolled) : 0;
                          const progress = courseProgress[course.id] || 0;

                          return (
                            <motion.div
                              key={course.id}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
                            >
                              {/* Background Pattern accent */}
                              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50/30 dark:bg-indigo-950/10 rounded-bl-full pointer-events-none -mr-4 -mt-4"></div>

                              <div className="space-y-4">
                                {/* Header / Cover metadata info */}
                                <div className="flex gap-4 items-start">
                                  <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 shrink-0 overflow-hidden flex items-center justify-center">
                                    {course.cover_image_url ? (
                                      <img src={course.cover_image_url} alt={course.title} className="w-full h-full object-cover" />
                                    ) : (
                                      <GraduationCap size={28} />
                                    )}
                                  </div>
                                  <div>
                                    <h3 className="font-serif font-bold text-lg text-slate-850 dark:text-white leading-snug">
                                      {course.title}
                                    </h3>
                                    
                                    {/* Meta Tags */}
                                    <div className="flex flex-wrap gap-2 mt-1.5 text-xxs font-bold text-indigo-600 dark:text-indigo-400">
                                      {course.duration && (
                                        <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/50">
                                          <Clock size={11} /> {course.duration}
                                        </span>
                                      )}
                                      {course.schedule && (
                                        <span className="flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-md border border-indigo-100/50">
                                          <Calendar size={11} /> {course.schedule}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <p className="text-xs text-gray-500 dark:text-gray-400 font-light leading-relaxed">
                                  {course.description || 'Sin descripción detallada del programa.'}
                                </p>

                                {/* Spots / Capacity Details */}
                                <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-550 pt-2 border-t border-gray-100 dark:border-white/5">
                                  <span className="flex items-center gap-1 font-medium">
                                    <Users size={12} /> matriculados: {totalEnrolled}
                                  </span>
                                  {course.capacity ? (
                                    <span className={`font-semibold ${spotsAvailable > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                                      {spotsAvailable > 0 ? `${spotsAvailable} cupos disponibles` : 'Sin cupos'}
                                    </span>
                                  ) : (
                                    <span className="text-green-600 dark:text-green-400 font-semibold">Cupo libre</span>
                                  )}
                                </div>

                                {/* Enrolled Course Progress */}
                                {enrolled && (
                                  <div className="pt-2">
                                    <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-1">
                                      <span>Tu avance en el aula</span>
                                      <span>{progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 dark:bg-slate-800 rounded-full h-1.5">
                                      <div 
                                        className="bg-emerald-500 h-1.5 rounded-full transition-all duration-1000"
                                        style={{ width: `${progress}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Button Logic */}
                              <div className="pt-6 mt-4 border-t border-gray-100 dark:border-white/5 flex justify-end">
                                {enrolled ? (
                                  <Link
                                    to={`/lms/curso/${course.id}`}
                                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer"
                                  >
                                    <CheckCircle size={14} />
                                    Ir al Aula
                                  </Link>
                                ) : requestStatus === 'pending' ? (
                                  <button
                                    disabled
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-gray-500 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-gray-200 dark:border-white/5"
                                  >
                                    <AlertCircle size={14} />
                                    Solicitud Pendiente
                                  </button>
                                ) : requestStatus === 'rejected' ? (
                                  <button
                                    onClick={() => handleEnrollRequest(course.id)}
                                    disabled={submittingEnrollment === course.id}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                                  >
                                    {submittingEnrollment === course.id ? (
                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <PlusCircle size={14} />
                                        Re-intentar Inscripción
                                      </>
                                    )}
                                  </button>
                                ) : course.capacity && spotsAvailable === 0 ? (
                                  <button
                                    disabled
                                    className="px-5 py-2.5 bg-gray-100 dark:bg-slate-800 text-red-400 dark:text-red-500/80 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                                  >
                                    <Lock size={14} />
                                    Cupo Completo
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleEnrollRequest(course.id)}
                                    disabled={submittingEnrollment === course.id}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
                                  >
                                    {submittingEnrollment === course.id ? (
                                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                                    ) : (
                                      <>
                                        <Bookmark size={14} />
                                        Inscríbete
                                      </>
                                    )}
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* Video Lightbox Modal */}
      {videoModalUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="relative w-full max-w-4xl aspect-video rounded-3xl overflow-hidden shadow-2xl bg-black border border-white/10">
            <button
              onClick={() => setVideoModalUrl(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/60 hover:bg-black/85 text-white rounded-full transition-colors cursor-pointer border border-white/10"
              title="Cerrar video"
            >
              <X size={20} />
            </button>
            <iframe
              src={videoModalUrl}
              className="w-full h-full border-0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              title="Video de Estudio"
            />
          </div>
        </div>
      )}

    </div>
  );
}
