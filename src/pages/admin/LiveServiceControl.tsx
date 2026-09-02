import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { CheckCircle2, Loader2, Radio, Save, Square, PlayCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import BlockEditor from '../../components/admin/BlockEditor';

interface ServiceOption { id: string; title: string; service_date: string; start_time: string; }
interface AgendaOption { id: string; title: string; position: number; }
interface LiveSessionRow { id: string; service_id: string; status: 'scheduled' | 'live' | 'ended' | 'archived'; title: string; stream_url: string | null; current_item_id: string | null; live_summary: string | null; content_blocks: unknown[]; }
interface ProductionStateRow { id: string; session_id: string; source: 'manual' | 'holyrics' | 'propresenter'; is_visible: boolean; current_title: string | null; current_text: string | null; current_slide_index: number; total_slides: number; announcement: string | null; announcement_visible: boolean; stage_url: string | null; screen_url: string | null; camera_feeds: unknown; }
interface PollRow { id: string; question: string; options: string[]; status: 'draft' | 'published' | 'closed'; }
interface QuestionRow { id: string; question: string; display_name: string | null; status: 'pending' | 'approved' | 'answered' | 'rejected'; answer: string | null; }
interface PrayerRequestRow { id: string; request: string; is_private: boolean; status: 'pending' | 'in_prayer' | 'answered' | 'rejected'; }
interface SalvationDecisionRow { id: string; name: string; phone: string | null; status: 'pending' | 'contacted' | 'closed'; created_at: string; }
interface StreamLink { platform: 'youtube' | 'facebook' | 'vimeo' | 'twitch' | 'other'; url: string; label: string; }

const detectStreamPlatform = (url: string): StreamLink['platform'] => {
  const normalized = url.toLowerCase();
  if (normalized.includes('youtube.com') || normalized.includes('youtu.be')) return 'youtube';
  if (normalized.includes('facebook.com') || normalized.includes('fb.watch')) return 'facebook';
  if (normalized.includes('vimeo.com')) return 'vimeo';
  if (normalized.includes('twitch.tv')) return 'twitch';
  return 'other';
};

const LiveServiceControl = () => {
  const { hasPermission, isReadOnly } = usePermissions();
  const canView = hasPermission('production', 'view') || hasPermission('events', 'view');
  const readOnly = isReadOnly('production');
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [agenda, setAgenda] = useState<AgendaOption[]>([]);
  const [session, setSession] = useState<LiveSessionRow | null>(null);
  const [productionState, setProductionState] = useState<ProductionStateRow | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [title, setTitle] = useState('Culto en Vivo · Iglesia Jerusalén');
  const [streamUrl, setStreamUrl] = useState('');
  const [streamLinksText, setStreamLinksText] = useState('');
  const [summary, setSummary] = useState('');
  const [contentBlocks, setContentBlocks] = useState('[]');
  const [polls, setPolls] = useState<PollRow[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<PrayerRequestRow[]>([]);
  const [salvationDecisions, setSalvationDecisions] = useState<SalvationDecisionRow[]>([]);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState('');
  const [pollStatus, setPollStatus] = useState<PollRow['status']>('draft');
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({});
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [attendanceInput, setAttendanceInput] = useState('0');
  const [currentItemId, setCurrentItemId] = useState('');
  const [status, setStatus] = useState<LiveSessionRow['status']>('scheduled');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [productionSource, setProductionSource] = useState<ProductionStateRow['source']>('manual');
  const [productionVisible, setProductionVisible] = useState(true);
  const [currentTitle, setCurrentTitle] = useState('');
  const [currentText, setCurrentText] = useState('');
  const [slideIndex, setSlideIndex] = useState('0');
  const [totalSlides, setTotalSlides] = useState('0');
  const [announcement, setAnnouncement] = useState('');
  const [announcementVisible, setAnnouncementVisible] = useState(false);
  const [stageUrl, setStageUrl] = useState('');
  const [screenUrl, setScreenUrl] = useState('');
  const [cameraFeedsText, setCameraFeedsText] = useState('');

  useEffect(() => {
    if (!canView) return undefined;
    let mounted = true;
    const load = async () => {
      const today = new Date().toISOString().slice(0, 10);
      const [servicesResult, sessionsResult] = await Promise.all([
        supabase.from('worship_services').select('id,title,service_date,start_time').gte('service_date', today).neq('status', 'cancelled').order('service_date').order('start_time').limit(20),
        supabase.from('live_service_sessions').select('id,service_id,status,title,stream_url,stream_links,current_item_id,live_summary,content_blocks').in('status', ['scheduled', 'live']).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      if (!mounted) return;
      if (servicesResult.error || sessionsResult.error) {
        const error = servicesResult.error ?? sessionsResult.error;
        console.error('No se pudo cargar el control del Culto en Vivo.', error);
        toast.error(`No se pudo cargar el control: ${error?.message ?? 'error desconocido'}`);
        setLoading(false);
        return;
      }
      const loadedServices = (servicesResult.data ?? []) as ServiceOption[];
      const loadedSession = (sessionsResult.data ?? null) as LiveSessionRow | null;
      setServices(loadedServices);
      setSession(loadedSession);
      const selectedService = loadedSession?.service_id ?? loadedServices[0]?.id ?? '';
      setServiceId(selectedService);
      if (loadedSession) {
        setTitle(loadedSession.title);
        setStreamUrl(loadedSession.stream_url ?? '');
        const rawStreamLinks = (loadedSession as LiveSessionRow & { stream_links?: unknown }).stream_links;
        const storedLinks: unknown[] = Array.isArray(rawStreamLinks) ? rawStreamLinks : [];
        setStreamLinksText(storedLinks.map((item) => typeof item === 'object' && item !== null && 'url' in item && typeof item.url === 'string' ? item.url : '').filter(Boolean).join('\n'));
        setSummary(loadedSession.live_summary ?? '');
        setContentBlocks(JSON.stringify(loadedSession.content_blocks ?? []));
        setCurrentItemId(loadedSession.current_item_id ?? '');
        setStatus(loadedSession.status);
        const [pollsResult, questionsResult, attendanceResult, prayerResult, productionResult, salvationResult] = await Promise.all([
          supabase.from('live_polls').select('id,question,options,status').eq('session_id', loadedSession.id).order('created_at'),
          supabase.from('live_questions').select('id,question,display_name,status,answer').eq('session_id', loadedSession.id).order('created_at', { ascending: false }).limit(100),
          supabase.from('live_service_attendance').select('attendance_count').eq('session_id', loadedSession.id).maybeSingle(),
          supabase.from('live_prayer_requests').select('id,request,is_private,status').eq('session_id', loadedSession.id).order('created_at', { ascending: false }).limit(100),
          supabase.from('live_service_production_state').select('id,session_id,source,is_visible,current_title,current_text,current_slide_index,total_slides,announcement,announcement_visible,stage_url,screen_url,camera_feeds').eq('session_id', loadedSession.id).maybeSingle(),
          supabase.from('live_salvation_decisions').select('id,name,phone,status,created_at').eq('session_id', loadedSession.id).order('created_at', { ascending: false }).limit(100),
        ]);
        if (pollsResult.error || questionsResult.error || attendanceResult.error || prayerResult.error || salvationResult.error) {
          const error = pollsResult.error ?? questionsResult.error ?? attendanceResult.error ?? prayerResult.error ?? salvationResult.error;
          console.error('No se pudo cargar la interacción del culto.', error);
          toast.error(`No se pudo cargar la interacción: ${error?.message ?? 'error desconocido'}`);
        } else {
          setPolls((pollsResult.data ?? []) as PollRow[]);
          setQuestions((questionsResult.data ?? []) as QuestionRow[]);
          const count = attendanceResult.data?.attendance_count ?? 0;
          setAttendanceCount(count);
          setAttendanceInput(String(count));
          setPrayerRequests((prayerResult.data ?? []) as PrayerRequestRow[]);
          setSalvationDecisions((salvationResult.data ?? []) as SalvationDecisionRow[]);
        }
        if (productionResult.error) {
          console.error('No se pudo cargar el estado de producción del culto.', productionResult.error);
        } else if (productionResult.data) {
          const loadedProduction = productionResult.data as ProductionStateRow;
          setProductionState(loadedProduction);
          setProductionSource(loadedProduction.source);
          setProductionVisible(loadedProduction.is_visible);
          setCurrentTitle(loadedProduction.current_title ?? '');
          setCurrentText(loadedProduction.current_text ?? '');
          setSlideIndex(String(loadedProduction.current_slide_index));
          setTotalSlides(String(loadedProduction.total_slides));
          setAnnouncement(loadedProduction.announcement ?? '');
          setAnnouncementVisible(loadedProduction.announcement_visible);
          setStageUrl(loadedProduction.stage_url ?? '');
          setScreenUrl(loadedProduction.screen_url ?? '');
          const feeds = Array.isArray(loadedProduction.camera_feeds) ? loadedProduction.camera_feeds : [];
          setCameraFeedsText(feeds.map((feed) => {
            if (!feed || typeof feed !== 'object') return '';
            const record = feed as Record<string, unknown>;
            return typeof record.label === 'string' && typeof record.url === 'string' ? `${record.label} | ${record.url}` : '';
          }).filter(Boolean).join('\n'));
        }
      }
      setLoading(false);
    };
    void load();
    return () => { mounted = false; };
  }, [canView]);

  useEffect(() => {
    if (!serviceId) { const timer = window.setTimeout(() => setAgenda([]), 0); return () => window.clearTimeout(timer); }
    let mounted = true;
    const loadAgenda = async () => {
      const { data, error } = await supabase.from('worship_service_items').select('id,title,position').eq('service_id', serviceId).order('position');
      if (!mounted) return;
      if (error) {
        console.error('No se pudo cargar la agenda del culto.', error);
        toast.error(`No se pudo cargar la agenda: ${error.message}`);
        return;
      }
      setAgenda((data ?? []) as AgendaOption[]);
    };
    void loadAgenda();
    return () => { mounted = false; };
  }, [serviceId]);

  const saveSession = async (nextStatus: LiveSessionRow['status'] = status) => {
    if (readOnly || !serviceId || !title.trim()) {
      toast.error('Selecciona un culto y escribe un título.');
      return;
    }
    setBusy(true);
    let parsedBlocks: unknown;
    try {
      parsedBlocks = JSON.parse(contentBlocks);
      if (!Array.isArray(parsedBlocks)) throw new Error('El editor debe contener una lista de bloques.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Contenido de bloques inválido.';
      toast.error(message);
      setBusy(false);
      return;
    }
    const streamLinks = streamLinksText.split('\n').map((url) => url.trim()).filter(Boolean).filter((url) => url.startsWith('https://')).map((url, index): StreamLink => ({ platform: detectStreamPlatform(url), url, label: `${detectStreamPlatform(url).toUpperCase()} ${index + 1}` }));
    const payload = {
      service_id: serviceId,
      title: title.trim(),
      stream_url: streamUrl.trim() || null,
      stream_links: streamLinks,
      current_item_id: currentItemId || null,
      live_summary: summary.trim() || null,
      content_blocks: parsedBlocks,
      status: nextStatus,
      started_at: nextStatus === 'live' ? new Date().toISOString() : session?.status === 'live' ? undefined : null,
    };
    const result = session
      ? await supabase.from('live_service_sessions').update(payload).eq('id', session.id).select('id,service_id,status,title,stream_url,current_item_id,live_summary').single()
      : await supabase.from('live_service_sessions').insert(payload).select('id,service_id,status,title,stream_url,current_item_id,live_summary').single();
    setBusy(false);
    if (result.error) {
      console.error('No se pudo guardar la sesión del Culto en Vivo.', result.error);
      toast.error(`No se pudo guardar la sesión: ${result.error.message}`);
      return;
    }
    const saved = result.data as LiveSessionRow;
    setSession(saved);
    setStatus(saved.status);
    toast.success(saved.status === 'ended' ? 'Culto finalizado. La prédica se archivará automáticamente.' : 'Sesión del culto actualizada.');
  };

  const saveAttendance = async (nextCount: number) => {
    if (!session || readOnly) return;
    const safeCount = Math.max(0, Math.min(100000, Math.round(nextCount)));
    const { data, error } = await supabase.from('live_service_attendance').upsert({ session_id: session.id, attendance_count: safeCount }, { onConflict: 'session_id' }).select('attendance_count').single();
    if (error) {
      console.error('No se pudo guardar el contador de asistencia.', error);
      toast.error(`No se pudo guardar la asistencia: ${error.message}`);
      return;
    }
    const savedCount = data.attendance_count;
    setAttendanceCount(savedCount);
    setAttendanceInput(String(savedCount));
  };

  const createPoll = async () => {
    if (!session || readOnly || pollQuestion.trim().length < 5) {
      toast.error('Publica primero una sesión y escribe una pregunta de encuesta.');
      return;
    }
    const options = pollOptions.split('\n').map((option) => option.trim()).filter(Boolean);
    if (options.length < 2) {
      toast.error('La encuesta necesita al menos dos opciones.');
      return;
    }
    const { data, error } = await supabase.from('live_polls').insert({ session_id: session.id, question: pollQuestion.trim(), options, status: pollStatus, sort_order: polls.length }).select('id,question,options,status').single();
    if (error) {
      console.error('No se pudo crear la encuesta del culto.', error);
      toast.error(`No se pudo crear la encuesta: ${error.message}`);
      return;
    }
    setPolls((current) => [...current, data as PollRow]);
    setPollQuestion('');
    setPollOptions('');
    toast.success('Encuesta creada.');
  };

  const updateQuestion = async (question: QuestionRow, nextStatus: QuestionRow['status']) => {
    if (readOnly) return;
    const answer = answerDrafts[question.id] ?? question.answer ?? null;
    const { data, error } = await supabase.from('live_questions').update({ status: nextStatus, answer: answer || null, answered_at: nextStatus === 'answered' ? new Date().toISOString() : null }).eq('id', question.id).select('id,question,display_name,status,answer').single();
    if (error) {
      console.error('No se pudo moderar la pregunta del culto.', error);
      toast.error(`No se pudo actualizar la pregunta: ${error.message}`);
      return;
    }
    setQuestions((current) => current.map((item) => item.id === question.id ? data as QuestionRow : item));
    toast.success('Pregunta actualizada.');
  };

  const updatePrayerRequest = async (request: PrayerRequestRow, nextStatus: PrayerRequestRow['status']) => {
    if (readOnly) return;
    const { data, error } = await supabase.from('live_prayer_requests').update({ status: nextStatus }).eq('id', request.id).select('id,request,is_private,status').single();
    if (error) {
      console.error('No se pudo actualizar la petición de oración.', error);
      toast.error(`No se pudo actualizar la petición: ${error.message}`);
      return;
    }
    setPrayerRequests((current) => current.map((item) => item.id === request.id ? data as PrayerRequestRow : item));
  };

  const updateSalvationDecision = async (decision: SalvationDecisionRow, nextStatus: SalvationDecisionRow['status']) => {
    if (readOnly) return;
    const { data, error } = await supabase.from('live_salvation_decisions').update({ status: nextStatus }).eq('id', decision.id).select('id,name,phone,status,created_at').single();
    if (error) {
      console.error('No se pudo actualizar el seguimiento pastoral.', error);
      toast.error(`No se pudo actualizar el seguimiento: ${error.message}`);
      return;
    }
    setSalvationDecisions((current) => current.map((item) => item.id === decision.id ? data as SalvationDecisionRow : item));
    toast.success('Seguimiento pastoral actualizado.');
  };

  const saveProductionState = async () => {
    if (!session || readOnly) return;
    const cameraFeeds = cameraFeedsText.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
      const [label, url] = line.split('|').map((value) => value.trim());
      return label && url?.startsWith('https://') ? { label, url } : null;
    }).filter((feed): feed is { label: string; url: string } => feed !== null);
    const payload = {
      session_id: session.id,
      source: productionSource,
      is_visible: productionVisible,
      current_title: currentTitle.trim() || null,
      current_text: currentText.trim() || null,
      current_slide_index: Math.max(0, Number(slideIndex) || 0),
      total_slides: Math.max(0, Number(totalSlides) || 0),
      announcement: announcement.trim() || null,
      announcement_visible: announcementVisible,
      stage_url: stageUrl.startsWith('https://') ? stageUrl.trim() : null,
      screen_url: screenUrl.startsWith('https://') ? screenUrl.trim() : null,
      camera_feeds: cameraFeeds,
      last_synced_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('live_service_production_state').upsert(payload, { onConflict: 'session_id' }).select('id,session_id,source,is_visible,current_title,current_text,current_slide_index,total_slides,announcement,announcement_visible,stage_url,screen_url,camera_feeds').single();
    if (error) {
      console.error('No se pudo publicar el estado de producción.', error);
      toast.error(`No se pudo publicar producción: ${error.message}`);
      return;
    }
    setProductionState(data as ProductionStateRow);
    toast.success('Estado de producción publicado en Culto en Vivo.');
  };

  if (!canView) return <div className="p-8 text-sm text-slate-500">No tienes permisos para administrar el Culto en Vivo.</div>;

  return <div className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-slate-950 sm:px-8">
    <Helmet><title>Control de Culto en Vivo | Administración</title></Helmet>
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-amber-300">Producción · Comunidad</p><h1 className="mt-2 font-serif text-3xl font-bold">Control de Culto en Vivo</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Publica la sesión, sincroniza el bloque actual y acompaña la transmisión desde una sola pantalla.</p></div><div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2 text-xs font-bold"><Radio size={15} className={status === 'live' ? 'text-rose-400' : 'text-slate-400'} /> {status === 'live' ? 'EN VIVO' : status.toUpperCase()}</div></div>
      </header>
      {loading ? <div className="flex justify-center py-20"><Loader2 className="animate-spin text-amber-600" /></div> : <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-7">
        <div className="grid gap-5 md:grid-cols-2">
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Culto planificado</span><select value={serviceId} onChange={(event) => setServiceId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white"><option value="">Seleccionar culto</option>{services.map((item) => <option key={item.id} value={item.id}>{item.service_date} · {item.start_time.slice(0, 5)} · {item.title}</option>)}</select></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Estado</span><select value={status} onChange={(event) => setStatus(event.target.value as LiveSessionRow['status'])} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white"><option value="scheduled">Programado</option><option value="live">En vivo</option><option value="ended">Finalizar y archivar</option></select></label>
          <label className="block md:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Título público</span><input value={title} onChange={(event) => setTitle(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Transmisiones HTTPS</span><textarea value={streamLinksText} onChange={(event) => { setStreamLinksText(event.target.value); setStreamUrl(event.target.value.split('\n')[0]?.trim() || ''); }} rows={3} placeholder="Una URL por línea: YouTube, Facebook, Vimeo o Twitch" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-950 dark:text-white" /><span className="mt-1 block text-[10px] text-slate-400">Si queda vacío, el culto no mostrará ningún reproductor.</span></label>
          <label className="block"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Bloque actual</span><select value={currentItemId} onChange={(event) => setCurrentItemId(event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white"><option value="">Primero de la agenda</option>{agenda.map((item) => <option key={item.id} value={item.id}>{item.position}. {item.title}</option>)}</select></label>
          <label className="block md:col-span-2"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">Resumen editorial en vivo</span><textarea value={summary} onChange={(event) => setSummary(event.target.value)} rows={4} placeholder="Idea principal, versículos o llamados que el equipo quiera compartir..." className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
        </div>
        <section className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/[.04]"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">Conteo sencillo</p><h2 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">Asistencia presencial</h2><p className="mt-1 text-xs text-slate-500">Solo cantidad total. No se solicitan nombres ni datos de miembros.</p></div><div className="flex items-center gap-2"><button type="button" aria-label="Disminuir asistencia" disabled={readOnly || !session} onClick={() => void saveAttendance(attendanceCount - 1)} className="flex size-11 items-center justify-center rounded-xl bg-white text-xl font-black text-slate-700 shadow-sm dark:bg-slate-950 dark:text-white">−</button><input aria-label="Cantidad de asistentes" value={attendanceInput} onChange={(event) => setAttendanceInput(event.target.value.replace(/[^0-9]/g, ''))} onBlur={() => void saveAttendance(Number(attendanceInput || 0))} className="h-14 w-24 rounded-xl border border-emerald-200 bg-white text-center text-2xl font-black text-emerald-700 outline-none dark:border-emerald-400/30 dark:bg-slate-950 dark:text-emerald-300" inputMode="numeric" /><button type="button" aria-label="Aumentar asistencia" disabled={readOnly || !session} onClick={() => void saveAttendance(attendanceCount + 1)} className="flex size-11 items-center justify-center rounded-xl bg-emerald-500 text-xl font-black text-white shadow-sm">+</button></div></div></section>
        <section className="mt-7 border-t border-slate-100 pt-6 dark:border-white/10">
          <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-indigo-500">Editor manual</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Contenido del culto</h2><p className="mt-1 text-xs text-slate-500">Escribe y ordena el contenido que aparecerá después de la transmisión. El bloque de resumen automático está desactivado.</p></div>
          <BlockEditor content={contentBlocks} onChange={setContentBlocks} disabled={readOnly} excludeTypes={['sermon_summary']} />
        </section>
        <section className="mt-7 border-t border-slate-100 pt-6 dark:border-white/10">
          <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-500">Puente de producción</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Lo que está pasando en las pantallas</h2><p className="mt-1 text-xs text-slate-500">Este estado es el contrato común para Holyrics, ProPresenter y la página pública. Los conectores podrán actualizarlo automáticamente.</p></div>
          <div className="grid gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-white/[.04] md:grid-cols-2">
            <label className="block text-xs font-bold text-slate-500">Fuente<select value={productionSource} onChange={(event) => setProductionSource(event.target.value as ProductionStateRow['source'])} className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white"><option value="manual">Manual</option><option value="holyrics">Holyrics</option><option value="propresenter">ProPresenter</option></select></label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-slate-950"><input type="checkbox" checked={productionVisible} onChange={(event) => setProductionVisible(event.target.checked)} /> Mostrar producción al público</label>
            <label className="block text-xs font-bold text-slate-500">Título actual<input value={currentTitle} onChange={(event) => setCurrentTitle(event.target.value)} placeholder="Ej. Coro 2 · Grande es tu fidelidad" className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500">Diapositiva<input value={slideIndex} onChange={(event) => setSlideIndex(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" placeholder="0" className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500 md:col-span-2">Letra o texto actual<textarea value={currentText} onChange={(event) => setCurrentText(event.target.value)} rows={3} placeholder="Texto de la diapositiva que se mostrará al público..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500">Anuncios en vivo<textarea value={announcement} onChange={(event) => setAnnouncement(event.target.value)} rows={2} placeholder="Aviso breve para la transmisión" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
            <label className="flex items-center gap-2 self-end rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold dark:border-white/10 dark:bg-slate-950"><input type="checkbox" checked={announcementVisible} onChange={(event) => setAnnouncementVisible(event.target.checked)} /> Mostrar anuncio ahora</label>
            <label className="block text-xs font-bold text-slate-500">URL de pantalla pública<input type="url" value={screenUrl} onChange={(event) => setScreenUrl(event.target.value)} placeholder="https://..." className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500">URL de vista de escenario<input type="url" value={stageUrl} onChange={(event) => setStageUrl(event.target.value)} placeholder="https://..." className="mt-1.5 min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /></label>
            <label className="block text-xs font-bold text-slate-500 md:col-span-2">Cámaras visibles<textarea value={cameraFeedsText} onChange={(event) => setCameraFeedsText(event.target.value)} rows={3} placeholder="Cámara principal | https://...\nPlano alabanza | https://..." className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-slate-950 dark:text-white" /><span className="mt-1 block text-[10px] font-normal text-slate-400">Una cámara por línea: etiqueta | URL HTTPS. No se aceptan puertos locales.</span></label>
          </div>
          <button type="button" disabled={readOnly || !session} onClick={() => void saveProductionState()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-xs font-black text-white"><Radio size={15} /> Publicar estado de producción</button>
          {productionState && <span className="ml-3 text-xs text-emerald-600">Última publicación disponible para Culto en Vivo.</span>}
        </section>
        <section className="mt-7 grid gap-6 border-t border-slate-100 pt-6 dark:border-white/10 lg:grid-cols-2">
          <div>
            <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-600">Interacción</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Encuestas en vivo</h2></div>
            <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-white/[.04]"><input value={pollQuestion} onChange={(event) => setPollQuestion(event.target.value)} placeholder="Pregunta de la encuesta" className="min-h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-slate-950 dark:text-white" /><textarea value={pollOptions} onChange={(event) => setPollOptions(event.target.value)} rows={4} placeholder="Una opción por línea" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-950 dark:text-white" /><div className="flex gap-2"><select value={pollStatus} onChange={(event) => setPollStatus(event.target.value as PollRow['status'])} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-slate-950 dark:text-white"><option value="draft">Borrador</option><option value="published">Publicada</option></select><button type="button" onClick={() => void createPoll()} disabled={readOnly || !session} className="rounded-xl bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950">Crear encuesta</button></div></div>
            <div className="mt-4 space-y-2">{polls.map((poll) => <div key={poll.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-3 text-xs dark:border-white/10"><span className="min-w-0"><strong className="block truncate text-slate-800 dark:text-white">{poll.question}</strong><span className="text-slate-500">{poll.options.length} opciones · {poll.status}</span></span><button type="button" disabled={readOnly} onClick={() => void supabase.from('live_polls').update({ status: poll.status === 'published' ? 'closed' : 'published' }).eq('id', poll.id).then((result) => { if (result.error) { console.error('No se pudo cambiar el estado de la encuesta.', result.error); toast.error(result.error.message); return; } setPolls((current) => current.map((item) => item.id === poll.id ? { ...item, status: item.status === 'published' ? 'closed' : 'published' } : item)); })} className="shrink-0 rounded-lg border border-slate-200 px-2 py-1.5 font-bold text-slate-600 dark:border-white/10 dark:text-slate-300">{poll.status === 'published' ? 'Cerrar' : 'Publicar'}</button></div>)}</div>
          </div>
          <div>
            <div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-violet-500">Moderación</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Preguntas del público</h2></div>
            <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">{questions.length ? questions.map((question) => <article key={question.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-start justify-between gap-3"><p className="text-sm leading-6 text-slate-800 dark:text-slate-200">{question.question}</p><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">{question.status}</span></div>{question.display_name && <p className="mt-2 text-[11px] text-slate-400">{question.display_name}</p>}<textarea value={answerDrafts[question.id] ?? question.answer ?? ''} onChange={(event) => setAnswerDrafts((current) => ({ ...current, [question.id]: event.target.value }))} rows={2} placeholder="Respuesta del equipo (opcional)" className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs dark:border-white/10 dark:bg-slate-950 dark:text-white" /><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={readOnly} onClick={() => void updateQuestion(question, 'approved')} className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">Aprobar</button><button type="button" disabled={readOnly} onClick={() => void updateQuestion(question, 'answered')} className="rounded-lg bg-violet-100 px-2.5 py-1.5 text-[11px] font-bold text-violet-700">Responder</button><button type="button" disabled={readOnly} onClick={() => void updateQuestion(question, 'rejected')} className="rounded-lg bg-rose-100 px-2.5 py-1.5 text-[11px] font-bold text-rose-700">Rechazar</button></div></article>) : <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-white/[.04]">Todavía no hay preguntas enviadas para esta sesión.</p>}</div>
          </div>
        </section>
        <section className="mt-7 border-t border-slate-100 pt-6 dark:border-white/10"><div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-rose-500">Intercesión</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Peticiones de oración</h2><p className="mt-1 text-xs text-slate-500">Se reciben sin nombres. Las privadas solo las ve el equipo autorizado.</p></div><div className="grid gap-3 md:grid-cols-2">{prayerRequests.length ? prayerRequests.map((request) => <article key={request.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-start justify-between gap-3"><p className="text-sm leading-6 text-slate-800 dark:text-slate-200">{request.request}</p><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">{request.status}</span></div><p className="mt-2 text-[10px] text-slate-400">{request.is_private ? 'Petición privada' : 'Petición compartible'}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={readOnly} onClick={() => void updatePrayerRequest(request, 'in_prayer')} className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-700">En oración</button><button type="button" disabled={readOnly} onClick={() => void updatePrayerRequest(request, 'answered')} className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">Respondida</button><button type="button" disabled={readOnly} onClick={() => void updatePrayerRequest(request, 'rejected')} className="rounded-lg bg-rose-100 px-2.5 py-1.5 text-[11px] font-bold text-rose-700">Descartar</button></div></article>) : <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-white/[.04]">Todavía no hay peticiones de oración en esta sesión.</p>}</div></section>
        <section className="mt-7 border-t border-slate-100 pt-6 dark:border-white/10"><div className="mb-4"><p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-600">Seguimiento pastoral</p><h2 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Decisiones de fe</h2><p className="mt-1 text-xs text-slate-500">Datos enviados voluntariamente durante la transmisión. Solo el equipo autorizado puede verlos.</p></div><div className="grid gap-3 md:grid-cols-2">{salvationDecisions.length ? salvationDecisions.map((decision) => <article key={decision.id} className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-800 dark:text-slate-200">{decision.name}</p>{decision.phone && <p className="mt-1 text-xs text-slate-500">{decision.phone}</p>}</div><span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase text-slate-500 dark:bg-white/10 dark:text-slate-300">{decision.status}</span></div><p className="mt-2 text-[10px] text-slate-400">{new Date(decision.created_at).toLocaleString('es-CO')}</p><div className="mt-3 flex flex-wrap gap-2"><button type="button" disabled={readOnly} onClick={() => void updateSalvationDecision(decision, 'contacted')} className="rounded-lg bg-amber-100 px-2.5 py-1.5 text-[11px] font-bold text-amber-700">Marcar contactado</button><button type="button" disabled={readOnly} onClick={() => void updateSalvationDecision(decision, 'closed')} className="rounded-lg bg-emerald-100 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700">Cerrar seguimiento</button></div></article>) : <p className="rounded-2xl bg-slate-50 p-4 text-xs text-slate-500 dark:bg-white/[.04]">Todavía no hay decisiones de fe registradas en esta sesión.</p>}</div></section>
        <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5 dark:border-white/10"><button type="button" disabled={busy || readOnly} onClick={() => void saveSession('scheduled')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300"><Save size={15} /> Guardar programación</button><button type="button" disabled={busy || readOnly} onClick={() => void saveSession('live')} className="inline-flex items-center gap-2 rounded-xl bg-rose-500 px-4 py-2.5 text-xs font-bold text-white"><PlayCircle size={15} /> Publicar en vivo</button><button type="button" disabled={busy || readOnly || !session} onClick={() => void saveSession('ended')} className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white dark:bg-white dark:text-slate-950"><Square size={14} /> Finalizar culto</button></div>
        {session?.status === 'ended' && <p className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><CheckCircle2 size={15} /> El cierre ya fue procesado y la prédica quedó vinculada.</p>}
      </section>}
    </div>
  </div>;
};

export default LiveServiceControl;
