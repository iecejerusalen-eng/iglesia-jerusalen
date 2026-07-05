/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../config/supabase';
import { 
  GraduationCap, 
  User, 
  Users, 
  ArrowRight, 
  BookOpen, 
  Compass, 
  Award,
  Calendar,
  Loader2
} from 'lucide-react';
import { AnimeFadeUp, AnimeFlipIn } from '../../components/animations/AnimeWrappers';

const VirtualClassroomLanding = () => {
  const { user, userRole, firstName, lastName, logout, photoUrl } = useAuthStore();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
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
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-gold" size={40} />
        <p className="mt-4 text-sm text-gray-500 font-semibold">Cargando Plataforma...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-gray-800 dark:text-gray-100 transition-colors duration-500">
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-950 text-white py-20 px-4 overflow-hidden border-b border-indigo-500/10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-400 via-transparent to-transparent"></div>
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <AnimeFadeUp delay={0} duration={600}>
            {heroContent.subtitle && (
              <span className="inline-flex bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-2 leading-none">
                {heroContent.subtitle}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-tight">
              {heroContent.title}
            </h1>
            <p className="text-indigo-200 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mt-2">
              {heroContent.description}
            </p>
          </AnimeFadeUp>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 md:py-16 space-y-12">
        
        {/* Dynamic State: Logged In vs Guest */}
        {user ? (
          /* Active Session Card */
          <AnimeFadeUp delay={100} duration={600} className="w-full">
            <div className="bg-white dark:bg-slate-900 border border-indigo-150 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-[0.02] text-indigo-900 dark:text-white pointer-events-none -mr-8 -mb-8">
                <GraduationCap size={200} />
              </div>
              <div className="flex items-center gap-4 text-left">
                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                  {photoUrl ? (
                    <img loading="lazy" 
                      src={photoUrl} 
                      alt="Perfil" 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <User size={28} />
                  )}
                </div>
                <div>
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">Sesión Activa</span>
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {firstName && lastName ? `${firstName} ${lastName}` : user.email}
                  </h2>
                  <div className="flex gap-2 items-center mt-1">
                    <span className="capitalize text-[9px] bg-gold text-white font-extrabold px-2 py-0.5 rounded shadow-2xs">
                      Rol: {userRole}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      Conectado
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
                {isTeacherOrAdmin ? (
                  <>
                    <Link
                      to="/lms/docente"
                      className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Ir al Panel de Docente</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      to="/lms/estudiante"
                      className="px-6 py-3 bg-white dark:bg-slate-800 border border-gray-250 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-sm shadow-2xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Entrar como Estudiante</span>
                    </Link>
                  </>
                ) : (
                  <Link
                    to="/lms/estudiante"
                    className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ir a mi Aula de Estudiante</span>
                    <ArrowRight size={16} />
                  </Link>
                )}

                <button
                  onClick={handleLogout}
                  className="px-5 py-3 hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500 border border-transparent hover:border-red-200 dark:hover:border-red-900/30 font-bold rounded-xl text-sm transition-all duration-200 cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </AnimeFadeUp>
        ) : (
          /* Portal Options for Anonymous Users */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Student Card */}
            <AnimeFlipIn delay={0} duration={800} axis="Y">
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all group">
                <div className="space-y-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shadow-3xs">
                    <Users size={22} />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-gray-100">Portal de Estudiantes</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    Ingresa para cursar materias bíblicas, rendir evaluaciones parciales y finales, ver tus reportes de calificaciones académicos y descargar certificados de aprobación.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs font-semibold text-gray-650 dark:text-gray-350">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      <span>Acceso a lecciones interactivas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      <span>Cuestionarios y tareas en línea</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      <span>Control de progreso individual</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-8">
                  <Link
                    to="/login?redirectTo=/lms/estudiante"
                    className="w-full px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ingresar como Estudiante</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </AnimeFlipIn>

            {/* Teacher Card */}
            <AnimeFlipIn delay={150} duration={800} axis="Y">
              <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-8 shadow-sm flex flex-col justify-between h-full hover:border-indigo-300 dark:hover:border-indigo-500 hover:shadow-md transition-all group">
                <div className="space-y-4 text-left">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-center shadow-3xs">
                    <GraduationCap size={22} />
                  </div>
                  <h2 className="font-serif text-2xl font-bold text-gray-800 dark:text-gray-100">Portal de Docentes</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                    Área destinada a docentes de la iglesia. Revisa tus asignaturas asignadas, sube nuevo material educativo, califica a tus alumnos matriculados y gestiona las lecciones.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs font-semibold text-gray-650 dark:text-gray-350">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      <span>Gestión de contenido de materias</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      <span>Revisión y publicación de notas</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-gold"></div>
                      <span>Estadísticas de participación</span>
                    </li>
                  </ul>
                </div>
                <div className="pt-8">
                  <Link
                    to="/login?redirectTo=/lms/docente"
                    className="w-full px-6 py-3.5 bg-white dark:bg-slate-800 border border-gray-250 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-200 font-bold rounded-xl text-sm shadow-2xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Ingresar como Docente</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </AnimeFlipIn>

          </div>
        )}

        {/* Features Info Section */}
        <div className="bg-white dark:bg-slate-900 border border-gray-150 dark:border-white/10 rounded-3xl p-6 md:p-10 shadow-2xs space-y-8 text-left">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl font-serif font-bold text-primary dark:text-white">Una Plataforma de Crecimiento Integral</h2>
            <p className="text-xs md:text-sm text-gray-400 font-medium">Equipándote con recursos interactivos y guías de estudio teológico sistemático.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuresContent.items.map((item: any, idx: number) => {
              const icons = [BookOpen, Compass, Award, Calendar];
              const IconComp = icons[idx % icons.length];
              return (
                <div key={idx} className="space-y-2">
                  <div className="text-indigo-600 dark:text-indigo-400">
                    <IconComp size={24} />
                  </div>
                  <h3 className="font-bold text-sm text-gray-800 dark:text-gray-100">{item.title}</h3>
                  <p className="text-xs text-gray-405 dark:text-gray-500 font-medium leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default VirtualClassroomLanding;
