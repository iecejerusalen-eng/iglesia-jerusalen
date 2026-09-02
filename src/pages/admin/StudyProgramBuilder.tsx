import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CalendarDays, CheckCircle2, ChevronDown, ChevronUp, Eye, FileKey2, Plus, Save, Settings2, Trash2, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import BlockEditor from '../../components/admin/BlockEditor';
import MediaUploader from '../../components/common/MediaUploader';
import type { StudyCohort, StudyMembership, StudyProgram, StudyProgramLesson, StudyProgramSection } from '../../features/study-programs/types';
import { usePermissions } from '../../hooks/usePermissions';
import { useConfirmStore } from '../../store/useConfirmStore';

type BuilderTab = 'content' | 'groups' | 'settings';
interface LessonDraft { id?: string; section_id: string; title: string; summary: string; lesson_type: StudyProgramLesson['lesson_type']; content: string; facilitatorContent: string; estimated_minutes: number | null; }
interface CohortDraft { id?: string; name: string; description: string; status: StudyCohort['status']; capacity: number | null; starts_on: string; ends_on: string; schedule_text: string; meeting_provider: StudyCohort['meeting_provider']; meeting_url: string; }
interface ProfileOption { id: string; first_name: string | null; last_name: string | null; email: string | null; }

const emptyCohort: CohortDraft = { name: '', description: '', status: 'planned', capacity: null, starts_on: '', ends_on: '', schedule_text: '', meeting_provider: 'google_meet', meeting_url: '' };
const parseBlocks = (value: unknown): string => JSON.stringify(Array.isArray(value) ? value : [], null, 2);

export default function StudyProgramBuilder() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isReadOnly } = usePermissions();
  const confirm = useConfirmStore((state) => state.confirm);
  const readOnly = isReadOnly('study_programs');
  const [program, setProgram] = useState<StudyProgram | null>(null);
  const [sections, setSections] = useState<StudyProgramSection[]>([]);
  const [cohorts, setCohorts] = useState<StudyCohort[]>([]);
  const [memberships, setMemberships] = useState<StudyMembership[]>([]);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [newMemberId, setNewMemberId] = useState('');
  const [newMemberCohortId, setNewMemberCohortId] = useState('');
  const [tab, setTab] = useState<BuilderTab>('content');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
  const [cohortDraft, setCohortDraft] = useState<CohortDraft | null>(null);
  const [facilitatorTab, setFacilitatorTab] = useState(false);
  const requireEditAccess = () => {
    if (!readOnly) return true;
    toast.error('Tu rol permite consultar este programa, pero no editarlo.');
    return false;
  };

  const load = useCallback(async () => {
    setLoading(true);
    const [programResult, sectionsResult, cohortsResult, membershipsResult, profilesResult] = await Promise.all([
      supabase.from('study_programs').select('*').eq('id', id).single(),
      supabase.from('study_program_sections').select('*, study_program_lessons(*)').eq('program_id', id).order('order_index'),
      supabase.from('study_cohorts').select('*').eq('program_id', id).order('created_at', { ascending: false }),
      supabase.from('study_memberships').select('*, profiles:user_id(first_name, last_name, email)').eq('program_id', id).order('created_at', { ascending: false }),
      supabase.from('profiles').select('id,first_name,last_name,email').neq('banned', true).order('first_name').limit(500),
    ]);
    setLoading(false);
    const firstError = programResult.error ?? sectionsResult.error ?? cohortsResult.error ?? membershipsResult.error ?? profilesResult.error;
    if (firstError) {
      console.error('No se pudo cargar el constructor del programa.', firstError);
      toast.error('No se pudo abrir el programa. Verifica que la migración esté instalada.');
      return;
    }
    setProgram(programResult.data as StudyProgram);
    setSections((sectionsResult.data ?? []).map((section) => ({
      ...section,
      lessons: (section.study_program_lessons ?? []).sort((a: StudyProgramLesson, b: StudyProgramLesson) => a.order_index - b.order_index),
    })) as StudyProgramSection[]);
    setCohorts((cohortsResult.data ?? []) as StudyCohort[]);
    setMemberships((membershipsResult.data ?? []) as StudyMembership[]);
    setProfiles((profilesResult.data ?? []) as ProfileOption[]);
  }, [id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const saveProgram = async () => {
    if (!program || readOnly) return;
    setSaving(true);
    const { error } = await supabase.from('study_programs').update({
      title: program.title, slug: program.slug, summary: program.summary, description: program.description,
      cover_image_url: program.cover_image_url, program_type: program.program_type, modality: program.modality,
      access_type: program.access_type, audience: program.audience, category: program.category, duration_label: program.duration_label,
      difficulty: program.difficulty, requires_facilitator: program.requires_facilitator,
      allows_guest_progress: program.allows_guest_progress, offline_enabled: program.offline_enabled,
      is_featured: program.is_featured, status: program.status,
      published_at: program.status === 'published' ? program.published_at ?? new Date().toISOString() : null,
    }).eq('id', program.id);
    setSaving(false);
    if (error) { console.error('No se guardó la configuración.', error); toast.error('No se pudo guardar.'); return; }
    toast.success('Cambios guardados.');
  };

  const addSection = async () => {
    if (!newSectionTitle.trim() || !program || !requireEditAccess()) return;
    const { error } = await supabase.from('study_program_sections').insert({ program_id: program.id, title: newSectionTitle.trim(), order_index: sections.length });
    if (error) { console.error('No se pudo crear la etapa.', error); toast.error('No se pudo crear la etapa.'); return; }
    setNewSectionTitle(''); await load();
  };

  const removeSection = async (section: StudyProgramSection) => {
    if (!requireEditAccess()) return;
    const accepted = await confirm({ title: 'Eliminar etapa', message: `Se eliminarán “${section.title}” y todas sus lecciones.`, confirmText: 'Eliminar etapa', variant: 'danger' });
    if (!accepted) return;
    const { error } = await supabase.from('study_program_sections').delete().eq('id', section.id);
    if (error) { console.error('No se pudo eliminar la etapa.', error); toast.error('No se pudo eliminar.'); return; }
    await load();
  };

  const moveSection = async (index: number, direction: -1 | 1) => {
    if (!requireEditAccess()) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= sections.length) return;
    const current = sections[index]; const target = sections[targetIndex];
    const temporaryIndex = sections.length + 1000;
    const first = await supabase.from('study_program_sections').update({ order_index: temporaryIndex }).eq('id', current.id);
    if (first.error) { console.error('No se pudo reordenar la etapa.', first.error); toast.error('No se pudo reordenar.'); return; }
    const second = await supabase.from('study_program_sections').update({ order_index: index }).eq('id', target.id);
    const third = await supabase.from('study_program_sections').update({ order_index: targetIndex }).eq('id', current.id);
    if (second.error || third.error) { console.error('El reordenamiento quedó incompleto.', second.error ?? third.error); toast.error('No se pudo completar el orden. Recarga antes de continuar.'); return; }
    await load();
  };

  const openLesson = async (sectionId: string, lesson?: StudyProgramLesson) => {
    let facilitatorContent = '[]';
    if (lesson) {
      const { data, error } = await supabase.from('study_lesson_facilitator_content').select('content_blocks').eq('lesson_id', lesson.id).maybeSingle();
      if (error) { console.error('No se pudo cargar la guía privada.', error); toast.error('No se pudo cargar el material del facilitador.'); return; }
      facilitatorContent = parseBlocks(data?.content_blocks);
    }
    setFacilitatorTab(false);
    setLessonDraft(lesson ? { id: lesson.id, section_id: sectionId, title: lesson.title, summary: lesson.summary, lesson_type: lesson.lesson_type, content: parseBlocks(lesson.content_blocks), facilitatorContent, estimated_minutes: lesson.estimated_minutes } : { section_id: sectionId, title: '', summary: '', lesson_type: 'lesson', content: '[]', facilitatorContent: '[]', estimated_minutes: null });
  };

  const saveLesson = async (event: React.FormEvent) => {
    event.preventDefault(); if (!lessonDraft || !requireEditAccess()) return;
    setSaving(true);
    const section = sections.find((item) => item.id === lessonDraft.section_id);
    const payload = { section_id: lessonDraft.section_id, title: lessonDraft.title.trim(), summary: lessonDraft.summary, lesson_type: lessonDraft.lesson_type, content_blocks: JSON.parse(lessonDraft.content), estimated_minutes: lessonDraft.estimated_minutes, order_index: lessonDraft.id ? section?.lessons.find((item) => item.id === lessonDraft.id)?.order_index ?? 0 : section?.lessons.length ?? 0 };
    const result = lessonDraft.id
      ? await supabase.from('study_program_lessons').update(payload).eq('id', lessonDraft.id).select('id').single()
      : await supabase.from('study_program_lessons').insert(payload).select('id').single();
    if (result.error) { setSaving(false); console.error('No se pudo guardar la lección.', result.error); toast.error('No se pudo guardar la lección.'); return; }
    const { error: privateError } = await supabase.from('study_lesson_facilitator_content').upsert({ lesson_id: result.data.id, content_blocks: JSON.parse(lessonDraft.facilitatorContent) }, { onConflict: 'lesson_id' });
    setSaving(false);
    if (privateError) { console.error('La lección se guardó, pero falló la guía privada.', privateError); toast.warning('La lección se guardó, pero no su guía privada.'); return; }
    toast.success('Lección y guía del facilitador guardadas.'); setLessonDraft(null); await load();
  };

  const deleteLesson = async (lesson: StudyProgramLesson) => {
    if (!requireEditAccess()) return;
    const accepted = await confirm({ title: 'Eliminar lección', message: `¿Eliminar “${lesson.title}”? Esta acción no se puede deshacer.`, confirmText: 'Eliminar lección', variant: 'danger' });
    if (!accepted) return;
    const { error } = await supabase.from('study_program_lessons').delete().eq('id', lesson.id);
    if (error) { console.error('No se pudo eliminar la lección.', error); toast.error('No se pudo eliminar.'); return; }
    await load();
  };

  const saveCohort = async (event: React.FormEvent) => {
    event.preventDefault(); if (!cohortDraft || !program || !requireEditAccess()) return;
    const { id: cohortId, meeting_url: meetingUrl, ...publicCohort } = cohortDraft;
    const payload = { ...publicCohort, program_id: program.id, capacity: cohortDraft.capacity || null, starts_on: cohortDraft.starts_on || null, ends_on: cohortDraft.ends_on || null, schedule_text: cohortDraft.schedule_text || null };
    const result = cohortId
      ? await supabase.from('study_cohorts').update(payload).eq('id', cohortId).select('id').single()
      : await supabase.from('study_cohorts').insert(payload).select('id').single();
    if (result.error) { console.error('No se pudo guardar el grupo.', result.error); toast.error('No se pudo guardar el grupo.'); return; }
    if (meetingUrl) {
      const { error: privateAccessError } = await supabase.from('study_cohort_private_access').upsert({ cohort_id: result.data.id, meeting_url: meetingUrl });
      if (privateAccessError) {
        console.error('El grupo se creó, pero no se guardó su enlace privado.', privateAccessError);
        toast.warning('El grupo se creó, pero debes volver a registrar el enlace privado.');
        await load();
        return;
      }
    }
    toast.success(cohortId ? 'Grupo actualizado.' : 'Grupo creado.'); setCohortDraft(null); await load();
  };

  const editCohort = async (cohort: StudyCohort) => {
    const { data, error } = await supabase.from('study_cohort_private_access').select('meeting_url').eq('cohort_id', cohort.id).maybeSingle();
    if (error) { console.error('No se pudo consultar el enlace privado.', error); toast.error('No se pudo abrir la configuración del grupo.'); return; }
    setCohortDraft({ id: cohort.id, name: cohort.name, description: cohort.description, status: cohort.status, capacity: cohort.capacity,
      starts_on: cohort.starts_on ?? '', ends_on: cohort.ends_on ?? '', schedule_text: cohort.schedule_text ?? '',
      meeting_provider: cohort.meeting_provider, meeting_url: data?.meeting_url ?? '' });
  };

  const updateMembership = async (membership: StudyMembership, status: StudyMembership['status']) => {
    if (!requireEditAccess()) return;
    const { error } = await supabase.from('study_memberships').update({
      status,
      joined_at: status === 'active' ? membership.joined_at ?? new Date().toISOString() : membership.joined_at,
    }).eq('id', membership.id);
    if (error) { console.error('No se pudo actualizar la participación.', error); toast.error('No se pudo actualizar la solicitud.'); return; }
    toast.success(status === 'active' ? 'Participante aprobado.' : 'Solicitud actualizada.');
    await load();
  };

  const updateMembershipRole = async (membership: StudyMembership, memberRole: StudyMembership['member_role']) => {
    if (!requireEditAccess()) return;
    const { error } = await supabase.from('study_memberships').update({ member_role: memberRole }).eq('id', membership.id);
    if (error) { console.error('No se pudo cambiar el rol del programa.', error); toast.error('No se pudo cambiar el rol.'); return; }
    toast.success('Rol del programa actualizado.');
    await load();
  };

  const addMember = async () => {
    if (!program || !newMemberId || !requireEditAccess()) return;
    const cohortId = newMemberCohortId || cohorts[0]?.id || null;
    const { error } = await supabase.from('study_memberships').insert({
      program_id: program.id, cohort_id: cohortId, user_id: newMemberId,
      member_role: 'participant', status: 'active', joined_at: new Date().toISOString(),
    });
    if (error?.code === '23505') { toast.info('Esta persona ya pertenece al grupo seleccionado.'); return; }
    if (error) { console.error('No se pudo agregar la integrante.', error); toast.error('No se pudo agregar la integrante.'); return; }
    setNewMemberId(''); toast.success('Integrante agregada.'); await load();
  };

  const lessonCount = useMemo(() => sections.reduce((total, section) => total + section.lessons.length, 0), [sections]);
  if (loading) return <div className="h-[36rem] animate-pulse rounded-[2rem] bg-slate-200 dark:bg-white/5" />;
  if (!program) return <div className="rounded-3xl border border-red-200 bg-red-50 p-10 text-center text-red-800">No se pudo abrir este programa. Instala la migración pendiente y vuelve a intentarlo.</div>;

  return <div className="space-y-6 pb-20">
    <header className="rounded-[2rem] border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/5"><div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center"><div className="flex items-start gap-4"><button onClick={() => navigate('/admin/programas')} className="rounded-xl border border-slate-200 p-2.5 dark:border-white/10"><ArrowLeft /></button><div><div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${program.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{program.status === 'published' ? 'Publicado' : 'Borrador'}</span><span className="text-xs text-slate-500">{sections.length} etapas · {lessonCount} lecciones</span></div><h1 className="mt-2 font-serif text-2xl font-bold sm:text-3xl">{program.title}</h1></div></div><div className="flex flex-wrap gap-2"><button onClick={() => window.open(`/programas/${program.slug}`, '_blank', 'noopener,noreferrer')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold dark:border-white/10"><Eye size={17} /> Vista previa</button><button onClick={saveProgram} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save size={17} />{saving ? 'Guardando…' : 'Guardar'}</button></div></div></header>
    {readOnly && <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm font-medium text-blue-900 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-100">Vista de consulta: tu rol puede revisar el programa y sus grupos, pero no modificarlo.</div>}
    <nav className="flex gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/75 p-2 dark:border-white/10 dark:bg-white/5">{([['content', BookOpen, 'Contenido'], ['groups', Users, 'Grupos y encuentros'], ['settings', Settings2, 'Presentación y acceso']] as const).map(([value, Icon, label]) => <button key={value} onClick={() => setTab(value)} className={`flex shrink-0 items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ${tab === value ? 'bg-blue-700 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'}`}><Icon size={17} />{label}</button>)}</nav>

    {tab === 'content' && <section className="grid gap-5 xl:grid-cols-[1fr_19rem]"><div className="space-y-4">{sections.map((section, index) => <article key={section.id} className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"><div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-amber-300">Etapa {index + 1}</span><h2 className="mt-1 font-serif text-xl font-bold">{section.title}</h2></div><div className="flex gap-1"><button onClick={() => moveSection(index, -1)} disabled={index === 0} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-25 dark:hover:bg-white/5"><ChevronUp size={17} /></button><button onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} className="rounded-lg p-2 hover:bg-slate-100 disabled:opacity-25 dark:hover:bg-white/5"><ChevronDown size={17} /></button><button onClick={() => removeSection(section)} className="rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-400/10"><Trash2 size={17} /></button></div></div><div className="mt-4 space-y-2">{section.lessons.map((lesson, lessonIndex) => <div key={lesson.id} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 dark:border-white/10"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold dark:bg-white/10">{lessonIndex + 1}</span><button onClick={() => openLesson(section.id, lesson)} className="min-w-0 flex-1 text-left"><strong className="block truncate text-sm">{lesson.title}</strong><span className="text-[11px] text-slate-500">{lesson.lesson_type}</span></button><button onClick={() => deleteLesson(lesson)} className="p-2 text-red-500"><Trash2 size={16} /></button></div>)}<button onClick={() => openLesson(section.id)} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-blue-300 p-3 text-sm font-bold text-blue-700 dark:text-blue-300"><Plus size={16} /> Agregar lección o actividad</button></div></article>)}{!sections.length && <div className="rounded-3xl border border-dashed border-slate-300 p-14 text-center text-slate-500 dark:border-white/15"><BookOpen className="mx-auto mb-3" />Comienza creando la primera etapa del programa.</div>}</div><aside className="h-fit rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-bold">Nueva etapa</h3><p className="mt-1 text-xs leading-5 text-slate-500">Organiza el recorrido en semanas, capítulos o momentos.</p><input value={newSectionTitle} onChange={(event) => setNewSectionTitle(event.target.value)} placeholder="Ej. Semana 1" className="mt-4 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm dark:border-white/10 dark:bg-slate-950" /><button onClick={addSection} className="mt-3 w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white">Crear etapa</button></aside></section>}

    {tab === 'groups' && <section>
      <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="font-serif text-2xl font-bold">Grupos y cohortes</h2><p className="mt-1 text-sm text-slate-500">Configura cada grupo con sus fechas, cupos, horario y enlace real de reunión.</p></div><button onClick={() => setCohortDraft(emptyCohort)} disabled={readOnly} className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 text-sm font-bold text-white disabled:opacity-50"><Plus size={17} /> Nuevo grupo</button></div>
      {!readOnly && cohorts.length > 0 && <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 dark:border-blue-400/20 dark:bg-blue-400/10"><h3 className="text-sm font-bold">Agregar integrante desde el CRM</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Solo se vinculan cuentas reales registradas; no se crean nombres ficticios.</p><div className="mt-3 grid gap-2 sm:grid-cols-[1fr_15rem_auto]"><select value={newMemberId} onChange={(event) => setNewMemberId(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950"><option value="">Selecciona una persona…</option>{profiles.filter((profile) => !memberships.some((membership) => membership.user_id === profile.id && membership.cohort_id === (newMemberCohortId || cohorts[0]?.id))).map((profile) => <option key={profile.id} value={profile.id}>{`${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || profile.email || 'Usuario'}</option>)}</select><select value={newMemberCohortId || cohorts[0]?.id || ''} onChange={(event) => setNewMemberCohortId(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950">{cohorts.map((cohort) => <option key={cohort.id} value={cohort.id}>{cohort.name}</option>)}</select><button type="button" onClick={() => void addMember()} disabled={!newMemberId} className="rounded-xl bg-blue-700 px-5 text-sm font-bold text-white disabled:opacity-50">Agregar</button></div></div>}
      {cohorts.length ? <div className="grid gap-4 xl:grid-cols-2">{cohorts.map((cohort) => {
        const cohortMembers = memberships.filter((membership) => membership.cohort_id === cohort.id);
        const pending = cohortMembers.filter((membership) => membership.status === 'pending');
        return <article key={cohort.id} className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5">
          <div className="flex items-center justify-between"><CalendarDays className="text-blue-700 dark:text-amber-300" /><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase dark:bg-white/10">{cohort.status}</span></div>
          <div className="mt-4 flex items-center justify-between gap-3"><h3 className="font-serif text-xl font-bold">{cohort.name}</h3>{!readOnly && <button type="button" onClick={() => void editCohort(cohort)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-bold dark:border-white/10">Configurar</button>}</div><p className="mt-2 text-sm text-slate-500">{cohort.schedule_text || 'Horario pendiente'}</p>
          <div className="mt-4 flex gap-4 text-xs text-slate-500"><span>{cohort.capacity ? `${cohort.capacity} cupos` : 'Sin límite'}</span><span>{cohortMembers.filter((membership) => membership.status === 'active').length} participantes</span><span>{pending.length} pendientes</span></div>
          {cohortMembers.length > 0 && <div className="mt-5 space-y-2 border-t border-slate-200 pt-4 dark:border-white/10">{cohortMembers.map((membership) => {
            const fullName = `${membership.profiles?.first_name ?? ''} ${membership.profiles?.last_name ?? ''}`.trim() || membership.profiles?.email || 'Miembro de la iglesia';
            return <div key={membership.id} className="flex flex-col gap-2 rounded-xl bg-slate-100 p-3 sm:flex-row sm:items-center dark:bg-white/5"><div className="min-w-0 flex-1"><strong className="block truncate text-xs">{fullName}</strong><span className="text-[10px] uppercase text-slate-500">{membership.status}</span></div>{membership.status === 'active' && !readOnly && <select value={membership.member_role} onChange={(event) => updateMembershipRole(membership, event.target.value as StudyMembership['member_role'])} className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[11px] font-bold dark:border-white/10 dark:bg-slate-900"><option value="participant">Participante</option><option value="facilitator">Facilitador</option><option value="moderator">Moderador</option><option value="analyst">Analista</option><option value="editor">Editor</option><option value="director">Director</option></select>}{membership.status === 'pending' && !readOnly && <div className="flex gap-2"><button onClick={() => updateMembership(membership, 'active')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white">Aprobar</button><button onClick={() => updateMembership(membership, 'declined')} className="rounded-lg bg-red-50 px-3 py-1.5 text-[11px] font-bold text-red-700 dark:bg-red-400/10 dark:text-red-300">Rechazar</button></div>}</div>;
          })}</div>}
        </article>;
      })}</div> : <div className="rounded-3xl border border-dashed border-slate-300 p-14 text-center text-slate-500 dark:border-white/15"><Users className="mx-auto mb-3" />Este programa todavía no tiene grupos configurados.</div>}
    </section>}

    {tab === 'settings' && <section className="grid gap-6 lg:grid-cols-[1fr_20rem]"><div className="rounded-2xl border border-slate-200 bg-white/80 p-6 dark:border-white/10 dark:bg-white/5"><h2 className="font-serif text-2xl font-bold">Presentación pública</h2><div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="sm:col-span-2 text-sm font-bold">Nombre<input value={program.title} onChange={(event) => setProgram({ ...program, title: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label><label className="sm:col-span-2 text-sm font-bold">Resumen<textarea value={program.summary} onChange={(event) => setProgram({ ...program, summary: event.target.value })} rows={3} className="mt-2 w-full rounded-xl border border-slate-200 p-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label><label className="text-sm font-bold">Categoría<input value={program.category} onChange={(event) => setProgram({ ...program, category: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label><label className="text-sm font-bold">Audiencia<input value={program.audience} onChange={(event) => setProgram({ ...program, audience: event.target.value })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label><label className="text-sm font-bold">Estado<select value={program.status} onChange={(event) => setProgram({ ...program, status: event.target.value as StudyProgram['status'] })} className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-3 font-normal dark:border-white/10 dark:bg-slate-950"><option value="draft">Borrador</option><option value="published">Publicado</option><option value="archived">Archivado</option></select></label><label className="text-sm font-bold">Duración visible<input value={program.duration_label ?? ''} onChange={(event) => setProgram({ ...program, duration_label: event.target.value })} placeholder="Ej. 6 semanas" className="mt-2 h-12 w-full rounded-xl border border-slate-200 px-4 font-normal dark:border-white/10 dark:bg-slate-950" /></label></div></div><aside className="space-y-5"><div className="rounded-2xl border border-slate-200 bg-white/80 p-5 dark:border-white/10 dark:bg-white/5"><h3 className="font-bold">Portada</h3>{program.cover_image_url && <img src={program.cover_image_url} alt="Portada actual" className="mt-4 aspect-video w-full rounded-xl object-cover" />}<div className="mt-4"><MediaUploader onUploadSuccess={(url) => setProgram({ ...program, cover_image_url: url })} folder="study-programs" allowedFormats={['jpg', 'jpeg', 'png', 'webp']} label="Subir portada" /></div></div><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-100"><CheckCircle2 className="mb-3" /><strong>Separación segura</strong><p className="mt-2 text-xs leading-5">El contenido del facilitador se almacena aparte y no puede aparecer en la respuesta pública.</p></div></aside></section>}

    {lessonDraft && <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/75 p-3 backdrop-blur-sm"><form onSubmit={saveLesson} className="mx-auto my-5 max-w-6xl rounded-[2rem] bg-white p-5 shadow-2xl dark:bg-slate-900 sm:p-7"><div className="flex items-start justify-between gap-4"><div><span className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-amber-300">Constructor por bloques</span><h2 className="mt-1 font-serif text-2xl font-bold">{lessonDraft.id ? 'Editar lección' : 'Nueva lección'}</h2></div><button type="button" onClick={() => setLessonDraft(null)} className="rounded-xl border border-slate-200 p-2 dark:border-white/10"><X /></button></div><div className="mt-6 grid gap-4 sm:grid-cols-[1fr_12rem_9rem]"><input required disabled={readOnly} value={lessonDraft.title} onChange={(event) => setLessonDraft({ ...lessonDraft, title: event.target.value })} placeholder="Título de la lección" className="h-12 rounded-xl border border-slate-200 px-4 disabled:opacity-70 dark:border-white/10 dark:bg-slate-950" /><select disabled={readOnly} value={lessonDraft.lesson_type} onChange={(event) => setLessonDraft({ ...lessonDraft, lesson_type: event.target.value as StudyProgramLesson['lesson_type'] })} className="h-12 rounded-xl border border-slate-200 px-3 disabled:opacity-70 dark:border-white/10 dark:bg-slate-950"><option value="lesson">Lección</option><option value="devotional">Devocional</option><option value="reading">Lectura</option><option value="activity">Actividad</option><option value="meeting">Encuentro</option><option value="download">Descarga</option></select><input disabled={readOnly} type="number" min="1" max="1440" value={lessonDraft.estimated_minutes ?? ''} onChange={(event) => setLessonDraft({ ...lessonDraft, estimated_minutes: event.target.value ? Number(event.target.value) : null })} placeholder="Minutos" className="h-12 rounded-xl border border-slate-200 px-3 disabled:opacity-70 dark:border-white/10 dark:bg-slate-950" /></div><textarea disabled={readOnly} value={lessonDraft.summary} onChange={(event) => setLessonDraft({ ...lessonDraft, summary: event.target.value })} placeholder="Resumen breve" rows={2} className="mt-4 w-full rounded-xl border border-slate-200 p-3 disabled:opacity-70 dark:border-white/10 dark:bg-slate-950" /><div className="mt-6 flex gap-2 rounded-2xl bg-slate-100 p-2 dark:bg-white/5"><button type="button" onClick={() => setFacilitatorTab(false)} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ${!facilitatorTab ? 'bg-blue-700 text-white' : ''}`}><BookOpen size={17} /> Contenido del participante</button><button type="button" onClick={() => setFacilitatorTab(true)} className={`flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold ${facilitatorTab ? 'bg-amber-300 text-slate-950' : ''}`}><FileKey2 size={17} /> Guía privada del facilitador</button></div><div className="mt-5">{facilitatorTab ? <BlockEditor disabled={readOnly} content={lessonDraft.facilitatorContent} onChange={(value) => setLessonDraft({ ...lessonDraft, facilitatorContent: value })} /> : <BlockEditor disabled={readOnly} content={lessonDraft.content} onChange={(value) => setLessonDraft({ ...lessonDraft, content: value })} />}</div><div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-white/10"><button type="button" onClick={() => setLessonDraft(null)} className="rounded-xl px-5 py-3 text-sm font-bold">Cerrar</button>{!readOnly && <button disabled={saving} className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar lección'}</button>}</div></form></div>}

    {cohortDraft && <div className="fixed inset-0 z-[110] overflow-y-auto bg-slate-950/75 p-4 backdrop-blur-sm"><form onSubmit={saveCohort} className="mx-auto my-8 max-w-3xl rounded-[2rem] bg-white p-7 shadow-2xl dark:bg-slate-900"><div className="flex justify-between"><h2 className="font-serif text-2xl font-bold">Nuevo grupo</h2><button type="button" onClick={() => setCohortDraft(null)}><X /></button></div><p className="mt-2 text-sm text-slate-500">No inventamos horarios ni enlaces: publica el grupo cuando hayas registrado sus datos reales.</p><div className="mt-6 grid gap-4 sm:grid-cols-2"><input required value={cohortDraft.name} onChange={(event) => setCohortDraft({ ...cohortDraft, name: event.target.value })} placeholder="Nombre, ej. Chicas Sabias" className="h-12 rounded-xl border border-slate-200 px-4 dark:border-white/10 dark:bg-slate-950" /><select value={cohortDraft.status} onChange={(event) => setCohortDraft({ ...cohortDraft, status: event.target.value as StudyCohort['status'] })} className="h-12 rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"><option value="planned">En planificación</option><option value="open">Inscripciones abiertas</option><option value="active">Activo</option><option value="completed">Finalizado</option></select><input type="date" value={cohortDraft.starts_on} onChange={(event) => setCohortDraft({ ...cohortDraft, starts_on: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950" /><input type="date" value={cohortDraft.ends_on} onChange={(event) => setCohortDraft({ ...cohortDraft, ends_on: event.target.value })} className="h-12 rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950" /><input value={cohortDraft.schedule_text} onChange={(event) => setCohortDraft({ ...cohortDraft, schedule_text: event.target.value })} placeholder="Horario real" className="h-12 rounded-xl border border-slate-200 px-4 dark:border-white/10 dark:bg-slate-950" /><input type="number" min="1" value={cohortDraft.capacity ?? ''} onChange={(event) => setCohortDraft({ ...cohortDraft, capacity: event.target.value ? Number(event.target.value) : null })} placeholder="Cupos (opcional)" className="h-12 rounded-xl border border-slate-200 px-4 dark:border-white/10 dark:bg-slate-950" /><select value={cohortDraft.meeting_provider ?? ''} onChange={(event) => setCohortDraft({ ...cohortDraft, meeting_provider: event.target.value as StudyCohort['meeting_provider'] })} className="h-12 rounded-xl border border-slate-200 px-3 dark:border-white/10 dark:bg-slate-950"><option value="google_meet">Google Meet</option><option value="zoom">Zoom</option><option value="teams">Teams</option><option value="other">Otra</option></select><input type="url" value={cohortDraft.meeting_url} onChange={(event) => setCohortDraft({ ...cohortDraft, meeting_url: event.target.value })} placeholder="Enlace privado de la reunión" className="h-12 rounded-xl border border-slate-200 px-4 dark:border-white/10 dark:bg-slate-950" /><textarea value={cohortDraft.description} onChange={(event) => setCohortDraft({ ...cohortDraft, description: event.target.value })} rows={3} placeholder="Descripción del grupo" className="sm:col-span-2 rounded-xl border border-slate-200 p-4 dark:border-white/10 dark:bg-slate-950" /></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={() => setCohortDraft(null)} className="rounded-xl px-5 py-3 text-sm font-bold">Cancelar</button><button className="rounded-xl bg-blue-700 px-6 py-3 text-sm font-bold text-white">Crear grupo</button></div></form></div>}
  </div>;
}
