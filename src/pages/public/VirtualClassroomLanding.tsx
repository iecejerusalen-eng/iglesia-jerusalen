import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Play,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import { ShinyButton } from '../../components/ui/magicui/shiny-button';
import type { LMSCourse } from '../../types';

interface LandingHeroContent {
  title: string;
  subtitle: string;
  description: string;
}

interface LandingFeature {
  title: string;
  description: string;
}

interface LandingFeaturesContent {
  items: LandingFeature[];
}

type PublishedCourse = Pick<
  LMSCourse,
  'id' | 'title' | 'description' | 'cover_image_url' | 'duration' | 'schedule'
>;

const DEFAULT_HERO: LandingHeroContent = {
  title: 'Aprende. Crece. Sirve.',
  subtitle: 'Aula Virtual Jerusalén',
  description: 'Una experiencia de formación bíblica clara y cercana, diseñada para avanzar a tu ritmo y aplicar cada aprendizaje en tu vida diaria.',
};

const DEFAULT_FEATURES: LandingFeaturesContent = {
  items: [
    { title: 'Aprendizaje guiado', description: 'Rutas claras, lecciones organizadas y acompañamiento docente.' },
    { title: 'Progreso visible', description: 'Tareas, calificaciones y avances reunidos en un solo lugar.' },
    { title: 'Formación con propósito', description: 'Contenido bíblico práctico para crecer y servir mejor.' },
  ],
};

const FEATURE_ICONS = [BookOpen, Users, Award];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function parseHeroContent(value: unknown): LandingHeroContent | null {
  if (!isRecord(value)) return null;
  const { title, subtitle, description } = value;
  if (typeof title !== 'string' || typeof subtitle !== 'string' || typeof description !== 'string') return null;
  return { title, subtitle, description };
}

function parseFeaturesContent(value: unknown): LandingFeaturesContent | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const items = value.items.filter((item): item is LandingFeature =>
    isRecord(item) && typeof item.title === 'string' && typeof item.description === 'string'
  );
  return items.length > 0 ? { items } : null;
}

function isPublishedCourse(value: unknown): value is PublishedCourse {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.title === 'string'
    && (value.description === null || typeof value.description === 'string')
    && (value.cover_image_url === null || typeof value.cover_image_url === 'string');
}

const VirtualClassroomLanding = () => {
  const { user, userRole, firstName, lastName, logout, photoUrl } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [courses, setCourses] = useState<PublishedCourse[]>([]);
  const [heroContent, setHeroContent] = useState<LandingHeroContent>(DEFAULT_HERO);
  const [featuresContent, setFeaturesContent] = useState<LandingFeaturesContent>(DEFAULT_FEATURES);

  useEffect(() => {
    let isMounted = true;

    const fetchContent = async () => {
      try {
        const [contentResult, coursesResult] = await Promise.all([
          supabase.from('lms_landing_content').select('section_key, content'),
          supabase
            .from('lms_courses')
            .select('id, title, description, cover_image_url, duration, schedule')
            .eq('is_published', true)
            .order('created_at', { ascending: false })
            .limit(6),
        ]);

        if (contentResult.error) throw contentResult.error;
        if (coursesResult.error) throw coursesResult.error;
        if (!isMounted) return;

        const heroSection = contentResult.data?.find((section) => section.section_key === 'hero');
        const featuresSection = contentResult.data?.find((section) => section.section_key === 'features');
        const parsedHero = parseHeroContent(heroSection?.content);
        const parsedFeatures = parseFeaturesContent(featuresSection?.content);

        if (parsedHero) setHeroContent(parsedHero);
        if (parsedFeatures) setFeaturesContent(parsedFeatures);
        const uniqueCourses = new Map<string, PublishedCourse>();
        (coursesResult.data ?? []).filter(isPublishedCourse).forEach((course) => {
          const key = course.title.trim().toLocaleLowerCase('es');
          if (!uniqueCourses.has(key)) uniqueCourses.set(key, course);
        });
        setCourses([...uniqueCourses.values()]);
      } catch (error) {
        console.error('Error al cargar el Aula Virtual:', error);
        if (isMounted) setLoadError('No pudimos actualizar el catálogo en este momento. Puedes ingresar a tu aula y continuar tus cursos.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchContent();
    return () => { isMounted = false; };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isTeacherOrAdmin = ['admin', 'pastor', 'leader', 'editor', 'docente', 'maestro'].includes(userRole || '');
  const studentDestination = user ? '/lms/estudiante' : '/login?redirectTo=/lms/estudiante';

  if (loading) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-slate-50 dark:bg-slate-950">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
          <Loader2 className="animate-spin" size={25} />
        </span>
        <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Preparando tu espacio de aprendizaje...</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-[#f7f8fb] text-slate-900 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[44rem] bg-[radial-gradient(circle_at_15%_20%,rgba(79,70,229,0.16),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(212,175,55,0.16),transparent_28%)]" />

      <section id="lms_hero" className="relative px-4 pb-12 pt-28 sm:px-6 sm:pb-16 sm:pt-32 lg:px-8 lg:pb-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.08fr_.92fr] lg:gap-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-200/80 bg-white/80 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-700 shadow-sm backdrop-blur dark:border-indigo-400/20 dark:bg-indigo-500/10 dark:text-indigo-300">
              <Sparkles size={13} />
              {heroContent.subtitle}
            </span>
            <h1 className="max-w-3xl font-serif text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-7xl">
              {heroContent.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
              {heroContent.description}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <ShinyButton onClick={() => navigate(studentDestination)} className="min-h-12 rounded-xl px-6 text-sm font-bold shadow-lg shadow-indigo-600/20">
                {user ? 'Continuar aprendiendo' : 'Entrar al Aula Virtual'}
                <ArrowRight size={17} />
              </ShinyButton>
              <a href="#lms_courses" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white/80 px-6 text-sm font-bold text-slate-700 transition hover:border-indigo-300 hover:text-indigo-700 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-200">
                Explorar cursos
                <BookOpen size={17} />
              </a>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" />Avanza a tu ritmo</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" />Acompañamiento docente</span>
              <span className="flex items-center gap-2"><CheckCircle2 size={15} className="text-emerald-500" />Certificados digitales</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.08 }} className="relative">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[#111d3d] p-5 text-white shadow-2xl shadow-indigo-950/20 sm:p-7">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_10%,rgba(212,175,55,.24),transparent_32%)]" />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-2xl bg-white/10"><GraduationCap size={23} className="text-gold" /></span>
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Formación activa</span>
                </div>
                <p className="mt-12 text-xs font-bold uppercase tracking-[0.18em] text-indigo-200">Tu aprendizaje, organizado</p>
                <h2 className="mt-2 max-w-md font-serif text-2xl font-bold sm:text-3xl">Todo lo que necesitas para avanzar, en un solo lugar.</h2>
                <div className="mt-7 grid grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { value: '24/7', label: 'Acceso', icon: Clock3 },
                    { value: '100%', label: 'En línea', icon: Play },
                    { value: '1', label: 'Comunidad', icon: Users },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/10 bg-white/7 p-3 sm:p-4">
                      <stat.icon size={15} className="mb-3 text-gold" />
                      <p className="text-lg font-black sm:text-xl">{stat.value}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="relative mx-auto max-w-7xl space-y-16 px-4 pb-20 sm:px-6 lg:px-8">
        {loadError && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-900 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200" role="status">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{loadError}</span>
          </div>
        )}

        {user && (
          <section id="lms_portals" className="flex flex-col gap-5 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                {photoUrl ? <img src={photoUrl} alt="Perfil" className="h-full w-full object-cover" /> : <User size={24} />}
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Sesión activa</p>
                <h2 className="truncate text-lg font-bold">{firstName && lastName ? `${firstName} ${lastName}` : user.email}</h2>
                <p className="text-xs capitalize text-slate-500 dark:text-slate-400">{userRole || 'Estudiante'}</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              {isTeacherOrAdmin && <Link to="/lms/docente" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 px-4 text-sm font-bold dark:border-white/10">Panel docente</Link>}
              <Link to="/lms/estudiante" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-500">Mi aula <ArrowRight size={16} /></Link>
              <button type="button" onClick={handleLogout} className="min-h-11 rounded-xl px-4 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10">Salir</button>
            </div>
          </section>
        )}

        {!user && (
          <section id="lms_portals" className="grid gap-4 md:grid-cols-2">
            {[
              { title: 'Soy estudiante', text: 'Continúa tus cursos, revisa tareas y consulta tu progreso.', icon: BookOpen, href: '/login?redirectTo=/lms/estudiante', action: 'Entrar como estudiante', accent: 'indigo' },
              { title: 'Soy docente', text: 'Organiza contenidos, acompaña estudiantes y administra calificaciones.', icon: GraduationCap, href: '/login?redirectTo=/lms/docente', action: 'Entrar como docente', accent: 'amber' },
            ].map((portal) => (
              <article key={portal.title} className="group rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-slate-900 sm:p-7">
                <span className={`flex size-12 items-center justify-center rounded-2xl ${portal.accent === 'indigo' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300'}`}><portal.icon size={22} /></span>
                <h2 className="mt-6 font-serif text-2xl font-bold">{portal.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{portal.text}</p>
                <Link to={portal.href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-300">{portal.action}<ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link>
              </article>
            ))}
          </section>
        )}

        <section id="lms_courses">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">Catálogo académico</p>
              <h2 className="mt-2 font-serif text-3xl font-bold sm:text-4xl">Cursos destacados</h2>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Elige una ruta y comienza tu formación.</p>
            </div>
            <button type="button" onClick={() => navigate(studentDestination)} className="inline-flex items-center gap-2 text-sm font-bold text-indigo-600 dark:text-indigo-300">Ir a mi aula <ArrowRight size={16} /></button>
          </div>

          {courses.length > 0 ? (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course, index) => (
                <motion.article key={course.id} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.05 }} className="group overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900">
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                    {course.cover_image_url ? <img src={course.cover_image_url} alt={course.title} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><BookOpen size={42} className="text-slate-300 dark:text-slate-600" /></div>}
                    <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 shadow-sm backdrop-blur dark:bg-slate-950/85 dark:text-indigo-300">Curso virtual</span>
                  </div>
                  <div className="p-5">
                    <h3 className="line-clamp-2 font-serif text-xl font-bold">{course.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{course.description || 'Formación bíblica organizada para avanzar paso a paso.'}</p>
                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                      <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-500"><CalendarDays size={14} />{course.duration || course.schedule || 'Acceso flexible'}</span>
                      <button type="button" onClick={() => navigate(studentDestination)} className="flex size-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 transition group-hover:bg-indigo-600 group-hover:text-white dark:bg-indigo-500/10 dark:text-indigo-300" aria-label={`Acceder a ${course.title}`}><ArrowRight size={17} /></button>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          ) : !loadError ? (
            <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center dark:border-white/15"><BookOpen className="mx-auto text-slate-300" size={36} /><p className="mt-3 text-sm font-semibold text-slate-500">Próximamente publicaremos nuevos cursos.</p></div>
          ) : null}
        </section>

        <section id="lms_features" className="rounded-[2rem] bg-slate-900 p-6 text-white sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
            <div>
              <span className="flex size-12 items-center justify-center rounded-2xl bg-gold/15 text-gold"><ShieldCheck size={22} /></span>
              <h2 className="mt-5 font-serif text-3xl font-bold">Una experiencia pensada para avanzar</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">Menos distracciones, más claridad y acompañamiento en cada etapa de tu formación.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {featuresContent.items.slice(0, 3).map((feature, index) => {
                const Icon = FEATURE_ICONS[index] ?? BookOpen;
                return <div key={feature.title} className="rounded-2xl border border-white/10 bg-white/5 p-5"><Icon size={19} className="text-gold" /><h3 className="mt-4 text-sm font-bold">{feature.title}</h3><p className="mt-2 text-xs leading-relaxed text-slate-400">{feature.description}</p></div>;
              })}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default VirtualClassroomLanding;
