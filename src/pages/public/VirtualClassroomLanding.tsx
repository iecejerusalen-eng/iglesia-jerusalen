/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { ShinyButton } from '../../components/ui/magicui/shiny-button';
import { Marquee } from '../../components/ui/magicui/marquee';
import { Award, BookOpen, Calendar, Compass, GraduationCap, Loader2, User, Users, ArrowRight, CheckCircle2, ChevronRight, PlayCircle } from 'lucide-react';
import { motion } from 'framer-motion';

import { AnimeFadeUp, AnimeFlipIn } from '../../components/animations/AnimeWrappers';

const VirtualClassroomLanding = () => {
  const { user, userRole, firstName, lastName, logout, photoUrl } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<any[]>([]);
  const [heroContent, setHeroContent] = useState({
    title: 'Aula Virtual',
    subtitle: 'Ecosistema Educativo LMS',
    description: 'Plataforma de formación teológica y crecimiento espiritual. Accede a tus cursos, interactúa con docentes y realiza un seguimiento a tu aprendizaje.'
  });

  const [featuresContent, setFeaturesContent] = useState({
    items: [
      { title: 'Formación Integral', description: 'Cursos diseñados para un crecimiento profundo.' },
      { title: 'Comunidad Activa', description: 'Interactúa con docentes y compañeros.' },
      { title: 'Seguimiento', description: 'Evalúa tu progreso en tiempo real.' }
    ]
  });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase.from('lms_landing_content').select('*');
        if (!error && data) {
          const hero = data.find(d => d.section_key === 'hero');
          const features = data.find(d => d.section_key === 'features');
          if (hero?.content) setHeroContent(hero.content as any);
          if (features?.content) setFeaturesContent(features.content as any);
        }
        const { data: coursesData } = await supabase.from('lms_courses').select('*').eq('is_published', true).order('created_at', { ascending: false }).limit(6);
        if (coursesData) {
          setCourses(coursesData);
        } else {
          // Fallback if is_published doesn't exist, just get 6
          const { data: fallbackCourses } = await supabase.from('lms_courses').select('*').order('created_at', { ascending: false }).limit(6);
          if (fallbackCourses) setCourses(fallbackCourses);
        }
      } catch (err) {
        console.error('Error fetching landing content:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isTeacherOrAdmin = ['admin', 'pastor', 'leader', 'editor', 'docente', 'maestro'].includes(userRole || '');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Orbs */}
        <div className="absolute top-[20%] left-[20%] w-[40vw] h-[40vw] bg-indigo-500/10 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[20%] right-[20%] w-[35vw] h-[35vw] bg-amber-500/10 dark:bg-amber-600/10 rounded-full blur-[100px] pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>
        
        <Loader2 className="animate-spin text-indigo-500 dark:text-indigo-400 relative z-10" size={40} />
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium relative z-10">Cargando Ecosistema Educativo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-gray-800 dark:text-gray-100 transition-colors duration-500 relative overflow-hidden font-sans">
      
      {/* Background Orbs and Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50vw] h-[50vw] bg-indigo-400/20 dark:bg-indigo-700/20 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70"></div>
        <div className="absolute top-[30%] -right-[10%] w-[40vw] h-[40vw] bg-amber-400/20 dark:bg-amber-600/10 rounded-full blur-[120px] mix-blend-multiply dark:mix-blend-screen opacity-70"></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] bg-blue-400/10 dark:bg-blue-900/20 rounded-full blur-[140px] mix-blend-multiply dark:mix-blend-screen opacity-50"></div>
        
        {/* Subtle noise texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB2aWV3Qm94PSIwIDAgMjAwIDIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZUZpbHRlciI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWx0ZXI9InVybCgibm9pc2VGaWx0ZXIpIi8+PC9zdmc+')] opacity-[0.03] dark:opacity-[0.05] mix-blend-overlay"></div>
      </div>

      {/* Hero Section */}
      <div className="relative pt-32 pb-16 px-4 z-10 border-b border-indigo-900/5 dark:border-white/5 bg-white/40 dark:bg-[#0B0F19]/40 backdrop-blur-3xl">
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-8">
          <AnimeFadeUp delay={0} duration={800}>
            {heroContent.subtitle && (
              <span className="inline-flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-500/20 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest mb-4 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                </span>
                {heroContent.subtitle}
              </span>
            )}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-slate-900 dark:text-white drop-shadow-sm">
              {heroContent.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mt-4">
              {heroContent.description}
            </p>
          </AnimeFadeUp>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-12 md:py-16 space-y-16 relative z-10">
        
        {/* Dynamic State: Logged In vs Guest */}
        {user ? (
          /* Active Session Card */
          <AnimeFadeUp delay={100} duration={600} className="w-full">
            <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] p-6 md:p-10 shadow-2xl shadow-indigo-900/5 dark:shadow-black/50 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group hover:border-indigo-200 dark:hover:border-indigo-500/30 transition-colors duration-500">
              
              <div className="absolute right-0 bottom-0 opacity-[0.03] dark:opacity-[0.02] text-indigo-900 dark:text-white pointer-events-none -mr-12 -mb-12 transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-6">
                <GraduationCap size={240} />
              </div>

              <div className="flex items-center gap-6 text-left relative z-10 w-full md:w-auto">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-100 to-indigo-50 dark:from-indigo-900/50 dark:to-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/30 flex items-center justify-center shrink-0 overflow-hidden shadow-inner ring-4 ring-white/50 dark:ring-slate-900/50">
                  {photoUrl ? (
                    <img loading="lazy" 
                      src={photoUrl} 
                      alt="Perfil" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User size={32} />
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-extrabold uppercase tracking-widest block mb-1">Sesión Activa</span>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                    {firstName && lastName ? `${firstName} ${lastName}` : user.email}
                  </h2>
                  <div className="flex gap-3 items-center mt-2">
                    <span className="capitalize text-[10px] bg-amber-500 text-white font-extrabold px-2.5 py-1 rounded-md shadow-sm">
                      Rol: {userRole}
                    </span>
                    <span className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium bg-gray-100/50 dark:bg-slate-800/50 px-2.5 py-1 rounded-md border border-gray-200/50 dark:border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                      Conectado
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0 relative z-10">
                {isTeacherOrAdmin ? (
                  <>
                    <Link
                      to="/lms/docente"
                      className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                    >
                      <span>Panel de Docente</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/lms/estudiante"
                      className="px-6 py-3.5 bg-white/80 dark:bg-slate-800/80 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700/80 text-slate-700 dark:text-gray-200 font-bold rounded-xl text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                    >
                      <span>Entrar como Estudiante</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/lms/estudiante"
                    className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold rounded-xl text-sm shadow-lg shadow-indigo-500/25 transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:-translate-y-0.5"
                  >
                    <span>Ir a mi Aula Virtual</span>
                    <ArrowRight size={16} />
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="px-5 py-3.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 font-bold rounded-xl text-sm transition-all duration-300 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </AnimeFadeUp>
        ) : (
          /* Portal Options for Anonymous Users */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            
            {/* Student Card */}
            <AnimeFlipIn delay={0} duration={800} axis="Y">
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] p-8 shadow-xl shadow-indigo-900/5 dark:shadow-black/50 flex flex-col justify-between h-full hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform duration-700 group-hover:scale-110"></div>
                
                <div className="space-y-6 text-left relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-center shadow-sm">
                    <Users size={24} />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Portal de Estudiantes</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mt-3">
                      Ingresa para cursar materias bíblicas, rendir evaluaciones, ver reportes de calificaciones y descargar certificados.
                    </p>
                  </div>
                  
                  <ul className="space-y-3 pt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0">
                        <PlayCircle size={12} />
                      </div>
                      <span>Lecciones interactivas</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={12} />
                      </div>
                      <span>Cuestionarios y tareas</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-10 relative z-10 mt-auto">
                  <ShinyButton
                    onClick={() => navigate('/login?redirectTo=/lms/estudiante')}
                    className="w-full py-4 rounded-xl text-sm font-bold shadow-lg shadow-indigo-500/20"
                  >
                    <span>Ingresar como Estudiante</span>
                    <ArrowRight size={16} />
                  </ShinyButton>
                </div>
              </div>
            </AnimeFlipIn>

            {/* Teacher Card */}
            <AnimeFlipIn delay={150} duration={800} axis="Y">
              <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] p-8 shadow-xl shadow-indigo-900/5 dark:shadow-black/50 flex flex-col justify-between h-full hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all duration-500 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 dark:bg-amber-500/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform duration-700 group-hover:scale-110"></div>

                <div className="space-y-6 text-left relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-500 border border-amber-100 dark:border-amber-800/30 flex items-center justify-center shadow-sm">
                    <GraduationCap size={24} />
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Portal de Docentes</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium mt-3">
                      Área destinada a docentes de la iglesia. Revisa tus asignaturas asignadas, sube material, califica y gestiona.
                    </p>
                  </div>
                  
                  <ul className="space-y-3 pt-2 text-sm font-semibold text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                        <BookOpen size={12} />
                      </div>
                      <span>Gestión de contenido</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-500 flex items-center justify-center shrink-0">
                        <Award size={12} />
                      </div>
                      <span>Publicación de notas</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-10 relative z-10 mt-auto">
                  <Link
                    to="/login?redirectTo=/lms/docente"
                    className="w-full px-6 py-4 bg-white dark:bg-slate-800 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold rounded-xl text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:shadow-md hover:-translate-y-0.5"
                  >
                    <span>Ingresar como Docente</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </AnimeFlipIn>

          </div>
        )}

        {/* Public Course Catalog */}
        <div className="space-y-10 pt-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200/50 dark:border-indigo-500/20 px-4 py-1.5 rounded-full">
              Catálogo Abierto
            </span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Cursos Disponibles</h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">Explora nuestra oferta académica e inscríbete. Requiere iniciar sesión.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {courses.map((course, idx) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                key={course.id || idx} 
                className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-md border border-white/40 dark:border-white/10 rounded-3xl overflow-hidden shadow-lg shadow-indigo-900/5 dark:shadow-black/40 hover:shadow-xl dark:hover:shadow-indigo-500/10 transition-all duration-500 group flex flex-col hover:-translate-y-1"
              >
                <div className="h-56 overflow-hidden relative bg-gradient-to-br from-indigo-100 to-slate-100 dark:from-indigo-950 dark:to-slate-900">
                  {course.cover_image_url ? (
                    <img 
                      src={course.cover_image_url} 
                      alt={course.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" 
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-indigo-300 dark:text-indigo-800 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
                      <BookOpen size={48} className="mb-2 opacity-50" />
                      <span className="text-[10px] font-bold uppercase tracking-widest opacity-50">Sin Portada</span>
                    </div>
                  )}
                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="absolute top-4 left-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-extrabold text-indigo-600 dark:text-indigo-400 shadow-sm uppercase tracking-wider">
                    {course.course_code || 'CURSO'}
                  </div>
                </div>
                
                <div className="p-6 flex flex-col flex-grow relative">
                  <h3 className="font-bold font-serif text-xl text-slate-900 dark:text-white line-clamp-2 leading-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {course.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 line-clamp-3 flex-grow font-medium leading-relaxed">
                    {course.description || 'Sin descripción disponible.'}
                  </p>
                  
                  <div className="mt-8 pt-5 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <button 
                      onClick={() => navigate(user ? '/lms/estudiante' : '/login?redirectTo=/lms/estudiante')}
                      className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 flex items-center gap-1.5 transition-colors group/btn"
                    >
                      {user ? 'Ir al portal' : 'Iniciar sesión para acceder'}
                      <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Features Info Section */}
        <div className="bg-white/60 dark:bg-slate-900/40 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-[2rem] p-8 md:p-12 shadow-xl shadow-indigo-900/5 dark:shadow-black/50 space-y-10 text-left relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-bl-full -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="text-center max-w-2xl mx-auto space-y-3 relative z-10">
            <h2 className="text-3xl font-serif font-bold text-slate-900 dark:text-white tracking-tight">Crecimiento Integral</h2>
            <p className="text-sm md:text-base text-gray-500 dark:text-gray-400 font-medium">Equipándote con recursos interactivos y guías de estudio teológico sistemático.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 relative z-10">
            {featuresContent.items.map((item: any, idx: number) => {
              const icons = [BookOpen, Compass, Award, Calendar];
              const IconComp = icons[idx % icons.length];
              return (
                <div key={idx} className="space-y-3 p-4 rounded-2xl hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <IconComp size={20} />
                  </div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Marquee - Logros y Novedades de la Comunidad */}
        <div className="space-y-6 pt-6 pb-8">
          <div className="text-center space-y-3">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200/50 dark:border-amber-500/20 px-4 py-1.5 rounded-full">
              Comunidad en Acción
            </span>
            <h3 className="text-2xl font-serif font-bold text-slate-900 dark:text-white">
              Logros y Novedades
            </h3>
          </div>

          <Marquee pauseOnHover className="[--duration:30s] py-4">
            {[
              { name: 'Escuela de Teología', text: '¡12 nuevos egresados en Teología Sistemática I!' },
              { name: 'Escuela Dominical', text: 'Nuevas guías interactivas disponibles para Jóvenes' },
              { name: 'Certificación Digital', text: 'Verificación instantánea de diplomas con código QR' },
              { name: 'Escuela de Cadetes', text: 'Lanzamiento del nivel Conquistadores 2026' },
            ].map((card, i) => (
              <div
                key={i}
                className="w-80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/50 dark:border-white/10 rounded-2xl p-5 shadow-lg shadow-indigo-900/5 dark:shadow-black/30 flex items-center gap-4 shrink-0 mx-3 hover:-translate-y-1 transition-transform cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/40 dark:to-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/30 flex items-center justify-center shrink-0">
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{card.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed mt-1">{card.text}</p>
                </div>
              </div>
            ))}
          </Marquee>
        </div>

      </div>
    </div>
  );
};

export default VirtualClassroomLanding;

