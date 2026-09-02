import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Calendar, Clock, Files, FileText, GraduationCap, LayoutDashboard, Loader2, LockKeyhole, MessageSquareText, RefreshCw, ShieldAlert, Users } from 'lucide-react';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import type { LMSSchool, Ministry } from '../../types';
import MinistryOverview from '../../components/admin/ministry/MinistryOverview';
import MinistryMembers from '../../components/admin/ministry/MinistryMembers';
import SmartScheduler from '../../components/admin/ministry/SmartScheduler';
import MeetingNotes from '../../components/admin/ministry/MeetingNotes';
import MinistryCalendar from '../../components/admin/ministry/MinistryCalendar';
import { AcademicStaffManager } from '../../features/lms/components/AcademicStaffManager';
import { CoursesList } from '../../features/lms/components/CoursesList';
import { useCourses } from '../../features/lms/hooks/useCourses';
import MinistryEditorial from '../../components/admin/ministry/MinistryEditorial';
import MinistryPagesEditor from '../../components/admin/ministry/MinistryPagesEditor';

type MinistryTab = 'resumen' | 'paginas' | 'miembros' | 'calendario' | 'planificador' | 'actas' | 'publicaciones' | 'escuela';

export default function MinistryDashboard() {
  const { id } = useParams();
  const { canEditMinistry } = usePermissions();
  const { courses } = useCourses();
  const [ministry, setMinistry] = useState<Ministry | null>(null);
  const [school, setSchool] = useState<LMSSchool | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<MinistryTab>('resumen');

  const fetchMinistry = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError(null);
    try {
      const [ministryResult, schoolResult] = await Promise.all([
        supabase.from('ministries').select('id, name, slug, category, description, leader_name, schedule, image_url, theme_color, anniversary_date, created_at').eq('id', id).maybeSingle(),
        supabase.from('lms_schools').select('*').eq('ministry_id', id).maybeSingle(),
      ]);
      if (ministryResult.error) throw ministryResult.error;
      if (schoolResult.error) throw schoolResult.error;
      setMinistry(ministryResult.data);
      setSchool(schoolResult.data as LMSSchool | null);
    } catch (caughtError: unknown) {
      console.error('Error fetching ministry dashboard:', caughtError);
      setLoadError(caughtError instanceof Error ? caughtError.message : 'No fue posible cargar el ministerio.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void fetchMinistry(); }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchMinistry]);

  if (loading) {
    return <div className="flex min-h-[420px] items-center justify-center"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (loadError) {
    return (
      <div role="alert" className="rounded-3xl border border-red-200 bg-white/75 px-6 py-16 text-center shadow-sm backdrop-blur-xl dark:border-red-500/20 dark:bg-slate-900/70">
        <ShieldAlert size={44} className="mx-auto text-red-500" />
        <h2 className="mt-4 font-serif text-xl font-bold text-slate-800 dark:text-white">No pudimos abrir este panel</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 dark:text-slate-400">{loadError}</p>
        <button type="button" onClick={() => void fetchMinistry()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white"><RefreshCw size={15} /> Reintentar</button>
      </div>
    );
  }

  if (!ministry) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/75 px-6 py-16 text-center dark:border-white/10 dark:bg-slate-900/70">
        <ShieldAlert size={44} className="mx-auto text-red-500" />
        <h2 className="mt-4 font-serif text-xl font-bold text-slate-800 dark:text-white">Ministerio no encontrado</h2>
        <Link to="/admin/ministerios" className="mt-3 inline-block text-sm font-bold text-primary hover:underline">Volver al directorio</Link>
      </div>
    );
  }

  const canEdit = canEditMinistry(ministry.id);
  const tabs: Array<{ id: MinistryTab; label: string; icon: typeof Users }> = [
    { id: 'resumen', label: 'Centro de control', icon: LayoutDashboard },
    { id: 'paginas', label: 'Páginas', icon: Files },
    { id: 'miembros', label: 'Equipo', icon: Users },
    { id: 'calendario', label: 'Agenda', icon: Calendar },
    { id: 'planificador', label: 'Disponibilidad', icon: Clock },
    { id: 'actas', label: 'Actas', icon: FileText },
    { id: 'publicaciones', label: 'Publicaciones', icon: MessageSquareText },
  ];
  if (school) tabs.push({ id: 'escuela', label: 'Escuela académica', icon: GraduationCap });

  return (
    <div className="relative space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-primary px-6 py-7 text-white shadow-[0_25px_70px_-35px_rgba(15,23,42,.75)] md:px-8">
        {ministry.image_url && <img src={ministry.image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
        <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/95 to-primary/70" />
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full blur-3xl" style={{ backgroundColor: `${ministry.theme_color || '#C99A49'}55` }} />
        <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <Link to="/admin/ministerios" aria-label="Volver a ministerios" className="rounded-2xl border border-white/15 bg-white/10 p-3 text-white backdrop-blur-xl transition hover:bg-white/20"><ArrowLeft size={20} /></Link>
            <div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-church-gold-light">
                <span>{ministry.category === 'departamento' ? 'Departamento' : 'Ministerio de servicio'}</span>
                {!canEdit && <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-slate-300"><LockKeyhole size={11} /> Solo lectura</span>}
              </div>
              <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight md:text-4xl">{ministry.name}</h1>
              <p className="mt-2 text-sm text-slate-300">Organiza el equipo, la agenda, los acuerdos y la disponibilidad desde un solo lugar.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs sm:flex">
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl"><span className="block text-[10px] uppercase tracking-wider text-slate-400">Responsable</span><strong className="mt-1 block max-w-44 truncate">{ministry.leader_name || 'Por definir'}</strong></div>
            <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl"><span className="block text-[10px] uppercase tracking-wider text-slate-400">Horario</span><strong className="mt-1 block max-w-44 truncate">{ministry.schedule || 'Por definir'}</strong></div>
          </div>
        </div>
      </section>

      <div className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/60 shadow-[0_20px_65px_-45px_rgba(15,23,42,.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/50">
        <div className="flex overflow-x-auto border-b border-slate-200/70 bg-white/50 p-2 scrollbar-hide dark:border-white/10 dark:bg-slate-900/40" role="tablist" aria-label="Herramientas del ministerio">
          {tabs.map((tab) => (
            <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 whitespace-nowrap rounded-2xl px-5 py-3 text-sm font-bold transition ${activeTab === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/15' : 'text-slate-500 hover:bg-white hover:text-slate-800 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white'}`}>
              <tab.icon size={17} />{tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 md:p-6">
          {activeTab === 'resumen' && <MinistryOverview ministry={ministry} canEdit={canEdit} onUpdated={setMinistry} />}
          {activeTab === 'paginas' && <MinistryPagesEditor ministry={ministry} canEdit={canEdit} />}
          {activeTab === 'miembros' && <MinistryMembers ministryId={ministry.id} />}
          {activeTab === 'calendario' && <MinistryCalendar ministryId={ministry.id} />}
          {activeTab === 'planificador' && <SmartScheduler ministryId={ministry.id} />}
          {activeTab === 'actas' && <MeetingNotes ministryId={ministry.id} />}
          {activeTab === 'publicaciones' && <MinistryEditorial ministry={ministry} canEdit={canEdit} />}
          {activeTab === 'escuela' && school && (
            <div className="space-y-8">
              <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 to-blue-50 p-6 dark:border-indigo-900/50 dark:from-slate-900 dark:to-indigo-950/30 md:flex-row">
                <div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl text-xl font-bold text-white shadow-lg" style={{ backgroundColor: school.color || '#4F46E5' }}>{school.name.substring(0, 2).toUpperCase()}</div><div><h2 className="font-serif text-xl font-bold text-slate-900 dark:text-white">{school.name}</h2><p className="text-sm text-slate-500 dark:text-slate-400">Administración académica vinculada al departamento.</p></div></div>
                <Link to="/admin/lms" className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-indigo-700">Aula Virtual Central <ArrowRight size={16} /></Link>
              </div>
              <section><h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white"><BookOpen className="text-church-gold-medium" size={20} /> Cursos de la escuela</h3><CoursesList courses={courses.filter((course) => course.school_id === school.id)} /></section>
              <section className="border-t border-slate-200 pt-8 dark:border-white/10"><h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800 dark:text-white"><Users className="text-emerald-500" size={20} /> Plantilla docente</h3><AcademicStaffManager schoolId={school.id} /></section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
