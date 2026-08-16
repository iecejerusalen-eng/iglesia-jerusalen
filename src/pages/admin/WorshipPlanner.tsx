import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Link2,
  List,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Settings2,
  Sparkles,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import ConnectionInstructions from '../../components/admin/ConnectionInstructions';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import {
  DEFAULT_WORSHIP_RULES,
  generateWorshipServiceDrafts,
  type WorshipRule,
} from '../../features/worshipPlanner/serviceRules';

type PlannerView = 'month' | 'week' | 'day' | 'table';
type SchemaState = 'ready' | 'missing' | 'unknown';

interface WorshipService {
  id: string;
  service_date: string;
  title: string;
  service_type: string;
  start_time: string;
  end_time: string;
  status: 'draft' | 'planned' | 'confirmed' | 'completed' | 'cancelled';
  event_id: string | null;
  notes: string | null;
  generated_by_rule: boolean;
}

interface WorshipAssignment {
  id: string;
  service_id: string;
  role_key: string;
  role_label: string;
  slot_index: number;
  member_id: string | null;
  status: 'proposed' | 'invited' | 'confirmed' | 'declined' | 'unassigned';
  notes: string | null;
  members?: { first_name: string; last_name: string }[] | null;
}

interface MemberOption {
  id: string;
  first_name: string;
  last_name: string;
}

interface EventOption {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
}

interface HolyricsConnection {
  id: string;
  name: string;
  mode: 'local' | 'internet';
  last_seen_at: string | null;
  last_error: string | null;
  is_enabled: boolean;
}

interface NewServiceForm {
  service_date: string;
  title: string;
  service_type: string;
  start_time: string;
  end_time: string;
  event_id: string;
  notes: string;
}

const glassPanel = 'rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/60';
const softButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:text-primary';
const primaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45';

const dateKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const parseDate = (value: string) => new Date(`${value}T12:00:00`);
const formatDate = (value: string) => parseDate(value).toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const formatShortDate = (value: string) => parseDate(value).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
const minutesFromTime = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number);
  return (hours * 60) + minutes;
};
const initials = (firstName: string, lastName: string) => `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
const assignedMember = (assignment: WorshipAssignment) => assignment.members?.[0] ?? null;

const isMissingSchemaError = (error: { code?: string; message?: string } | null) => Boolean(
  error && (error.code === 'PGRST205' || /worship_|holyrics_.*(schema cache|does not exist)/i.test(error.message ?? '')),
);

const monthRange = (anchor: Date) => {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const end = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  return { start: dateKey(start), end: dateKey(end) };
};

const daysForMonth = (anchor: Date) => {
  const last = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const padding = first.getDay();
  return Array.from({ length: padding + last.getDate() }, (_, index) => {
    if (index < padding) return null;
    return new Date(anchor.getFullYear(), anchor.getMonth(), index - padding + 1);
  });
};

const startOfWeek = (date: Date) => {
  const value = new Date(date);
  value.setDate(value.getDate() - value.getDay());
  return value;
};

const endOfWeek = (date: Date) => {
  const value = startOfWeek(date);
  value.setDate(value.getDate() + 6);
  return value;
};

const defaultForm = (date: string): NewServiceForm => ({
  service_date: date,
  title: 'Culto dominical',
  service_type: 'general',
  start_time: '10:00',
  end_time: '12:00',
  event_id: '',
  notes: '',
});

const mapWorshipRule = (value: unknown): WorshipRule | null => {
  if (!value || typeof value !== 'object') return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== 'string' || typeof row.name !== 'string' || typeof row.title !== 'string') return null;
  const frequency = row.frequency === 'weekly' ? 'weekly' : row.frequency === 'monthly_nth_weekday' ? 'monthly_nth_weekday' : null;
  if (!frequency || typeof row.service_type !== 'string' || typeof row.start_time !== 'string' || typeof row.end_time !== 'string') return null;
  return {
    id: row.id,
    name: row.name,
    frequency,
    weekday: Number(row.weekday),
    weekOfMonth: row.week_of_month === null || row.week_of_month === undefined ? null : Number(row.week_of_month),
    monthOfYear: row.month_of_year === null || row.month_of_year === undefined ? null : Number(row.month_of_year),
    title: row.title,
    serviceType: row.service_type,
    startTime: row.start_time,
    endTime: row.end_time,
    priority: Number(row.priority ?? 0),
    active: row.is_active !== false,
  };
};

const assignmentRoles = [
  ['director', 'Director del culto'],
  ['vocalista', 'Vocalista'],
  ['guitarrista', 'Guitarrista'],
  ['pianista', 'Pianista'],
  ['bajista', 'Bajista'],
  ['baterista', 'Baterista'],
  ['ujier', 'Diácono / ujier'],
  ['orador', 'Pastor / expositor'],
  ['ofrenda', 'Encargado de ofrenda'],
] as const;

const WorshipPlanner = () => {
  const { hasPermission, isReadOnly } = usePermissions();
  const canView = hasPermission('events', 'view');
  const readOnly = isReadOnly('events');
  const [anchor, setAnchor] = useState(() => new Date());
  const [view, setView] = useState<PlannerView>('month');
  const [selectedDate, setSelectedDate] = useState(() => dateKey(new Date()));
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [services, setServices] = useState<WorshipService[]>([]);
  const [rules, setRules] = useState<WorshipRule[]>([]);
  const [assignments, setAssignments] = useState<WorshipAssignment[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [connections, setConnections] = useState<HolyricsConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [schemaState, setSchemaState] = useState<SchemaState>('unknown');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [newService, setNewService] = useState<NewServiceForm>(() => defaultForm(dateKey(new Date())));
  const [assignmentRole, setAssignmentRole] = useState<(typeof assignmentRoles)[number][0]>('pianista');
  const [assignmentMemberId, setAssignmentMemberId] = useState('');
  const [holyricsBusy, setHolyricsBusy] = useState(false);
  const [showConnectionEditor, setShowConnectionEditor] = useState(false);
  const [newConnection, setNewConnection] = useState({ name: '', mode: 'internet' as 'local' | 'internet', base_url: '' });

  const range = useMemo(() => monthRange(anchor), [anchor]);
  const selectedService = services.find((service) => service.id === selectedServiceId) ?? null;
  const selectedAssignments = assignments.filter((assignment) => assignment.service_id === selectedServiceId);
  const activeRules = rules.length ? rules : DEFAULT_WORSHIP_RULES;
  const upcoming = services.find((service) => service.status !== 'cancelled' && service.service_date >= dateKey(new Date()));
  const onlineHolyrics = connections.filter((connection) => connection.is_enabled && connection.last_seen_at && Date.now() - new Date(connection.last_seen_at).getTime() < 90_000).length;

  const loadData = useCallback(async () => {
    setLoading(true);
    const { start, end } = monthRange(anchor);
    const [servicesResult, rulesResult, membersResult, eventsResult, connectionsResult] = await Promise.all([
      supabase.from('worship_services').select('id,service_date,title,service_type,start_time,end_time,status,event_id,notes,generated_by_rule').gte('service_date', start).lte('service_date', end).order('service_date').order('start_time'),
      supabase.from('worship_service_rules').select('id,name,frequency,weekday,week_of_month,month_of_year,title,service_type,start_time,end_time,priority,is_active').order('priority', { ascending: false }),
      supabase.from('members').select('id,first_name,last_name').is('deleted_at', null).order('first_name').limit(500),
      supabase.from('events').select('id,title,start_date,end_date').gte('start_date', start).lte('start_date', end).order('start_date').limit(300),
      supabase.from('holyrics_connections').select('id,name,mode,last_seen_at,last_error,is_enabled').order('created_at', { ascending: false }),
    ]);

    const missing = isMissingSchemaError(servicesResult.error) || isMissingSchemaError(rulesResult.error) || isMissingSchemaError(connectionsResult.error);
    if (missing) {
      setSchemaState('missing');
      setSchemaError('Falta aplicar la migración del planificador y Holyrics en Supabase.');
      setServices([]);
      setRules([]);
      setConnections([]);
    } else if (servicesResult.error || rulesResult.error) {
      setSchemaState('unknown');
      const firstError = servicesResult.error ?? rulesResult.error;
      setSchemaError(firstError?.message ?? 'No se pudo consultar el planificador.');
    } else {
      setSchemaState('ready');
      setSchemaError(null);
      setServices((servicesResult.data ?? []) as WorshipService[]);
      setRules((rulesResult.data ?? []).map(mapWorshipRule).filter((rule): rule is WorshipRule => rule !== null));
      setConnections((connectionsResult.data ?? []) as HolyricsConnection[]);
    }

    if (!membersResult.error) setMembers((membersResult.data ?? []) as MemberOption[]);
    if (!eventsResult.error) setEvents((eventsResult.data ?? []) as EventOption[]);

    const loadedServices = (servicesResult.data ?? []) as WorshipService[];
    if (loadedServices.length) {
      const assignmentsResult = await supabase
        .from('worship_service_assignments')
        .select('id,service_id,role_key,role_label,slot_index,member_id,status,notes,members(first_name,last_name)')
        .in('service_id', loadedServices.map((service) => service.id))
        .order('role_key')
        .order('slot_index');
      if (!assignmentsResult.error) setAssignments((assignmentsResult.data ?? []) as WorshipAssignment[]);
    } else {
      setAssignments([]);
    }
    setLoading(false);
  }, [anchor]);

  useEffect(() => {
    if (!canView) return undefined;
    const timer = window.setTimeout(() => { void loadData(); }, 0);
    return () => window.clearTimeout(timer);
  }, [canView, loadData]);

  const moveMonth = (delta: number) => setAnchor((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));

  const selectService = (service: WorshipService) => {
    setSelectedServiceId(service.id);
    setSelectedDate(service.service_date);
    setView('day');
  };

  const generateMonth = async () => {
    if (schemaState !== 'ready' || readOnly) return;
    const drafts = generateWorshipServiceDrafts(range.start, range.end, activeRules);
    const existing = new Set(services.map((service) => `${service.service_date}|${service.start_time.slice(0, 5)}|${service.service_type}`));
    const missing = drafts.filter((draft) => !existing.has(`${draft.serviceDate}|${draft.startTime}|${draft.serviceType}`));
    if (!missing.length) {
      toast.info('Este mes ya tiene generados los cultos definidos por las reglas.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.from('worship_services').insert(missing.map((draft) => ({
      service_date: draft.serviceDate,
      title: draft.title,
      service_type: draft.serviceType,
      start_time: draft.startTime,
      end_time: draft.endTime,
      rule_id: rules.find((rule) => rule.id === draft.ruleId)?.id ?? null,
      generated_by_rule: true,
      status: 'planned',
    }))).select('id,service_date,title,service_type,start_time,end_time,status,event_id,notes,generated_by_rule');
    setBusy(false);
    if (error) {
      toast.error(`No se pudieron generar los cultos: ${error.message}`);
      return;
    }
    setServices((current) => [...current, ...((data ?? []) as WorshipService[])].sort((left, right) => `${left.service_date}${left.start_time}`.localeCompare(`${right.service_date}${right.start_time}`)));
    toast.success(`Se generaron ${missing.length} culto(s) con las reglas activas.`);
  };

  const saveService = async () => {
    if (readOnly || !newService.title.trim()) {
      toast.error('Completa el título del culto.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.from('worship_services').insert({
      service_date: newService.service_date,
      title: newService.title.trim(),
      service_type: newService.service_type.trim() || 'general',
      start_time: newService.start_time,
      end_time: newService.end_time,
      event_id: newService.event_id || null,
      notes: newService.notes.trim() || null,
      status: 'planned',
    }).select('id,service_date,title,service_type,start_time,end_time,status,event_id,notes,generated_by_rule').single();
    setBusy(false);
    if (error) {
      toast.error(`No se pudo guardar el culto: ${error.message}`);
      return;
    }
    const created = data as WorshipService;
    setServices((current) => [...current, created].sort((left, right) => `${left.service_date}${left.start_time}`.localeCompare(`${right.service_date}${right.start_time}`)));
    setSelectedServiceId(created.id);
    setSelectedDate(created.service_date);
    setShowEditor(false);
    toast.success('Culto creado.');
  };

  const addAssignment = async () => {
    if (!selectedService || !assignmentMemberId || readOnly) return;
    const role = assignmentRoles.find(([key]) => key === assignmentRole);
    if (!role) return;
    const currentSlots = selectedAssignments.filter((assignment) => assignment.role_key === role[0]);
    const slotIndex = currentSlots.reduce((max, assignment) => Math.max(max, assignment.slot_index), 0) + 1;
    setBusy(true);
    const { data, error } = await supabase.from('worship_service_assignments').insert({
      service_id: selectedService.id,
      role_key: role[0],
      role_label: role[1],
      slot_index: slotIndex,
      member_id: assignmentMemberId,
      status: 'proposed',
      source: 'manual',
    }).select('id,service_id,role_key,role_label,slot_index,member_id,status,notes,members(first_name,last_name)').single();
    setBusy(false);
    if (error) {
      toast.error(`No se pudo asignar la persona: ${error.message}`);
      return;
    }
    setAssignments((current) => [...current, data as WorshipAssignment]);
    setAssignmentMemberId('');
    toast.success('Asignación agregada.');
  };

  const testHolyrics = async () => {
    setHolyricsBusy(true);
    const { data, error } = await supabase.functions.invoke('holyrics-api', {
      body: { action: 'GetVersion', transport: 'request' },
    });
    setHolyricsBusy(false);
    if (error) {
      toast.error(`No se pudo probar Holyrics: ${error.message}`);
      return;
    }
    const result = data as { ok?: boolean; error?: string; response?: { response_status?: string } } | null;
    if (!result?.ok) {
      toast.error(result?.error ?? 'Holyrics respondió con un error.');
      return;
    }
    toast.success(`Holyrics respondió correctamente${result.response?.response_status ? ` · ${result.response.response_status}` : ''}.`);
    void loadData();
  };

  const testLocalHolyrics = async () => {
    setHolyricsBusy(true);
    try {
      const localResponse = await fetch('http://127.0.0.1:4892/holyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GetVersion', payload: {} }),
      });
      const result = await localResponse.json() as { ok?: boolean; error?: string; message?: string };
      if (!localResponse.ok || !result.ok) throw new Error(result.message ?? result.error ?? `HTTP ${localResponse.status}`);
      toast.success('El puente local respondió correctamente.');
      void loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo contactar el puente local.';
      toast.error(`Puente local no disponible: ${message}`);
    } finally {
      setHolyricsBusy(false);
    }
  };

  const saveConnection = async () => {
    if (readOnly || !newConnection.name.trim() || (newConnection.mode === 'local' && !newConnection.base_url.trim())) {
      toast.error('Completa el nombre y la URL local cuando corresponda.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.from('holyrics_connections').insert({
      name: newConnection.name.trim(),
      mode: newConnection.mode,
      base_url: newConnection.mode === 'local' ? newConnection.base_url.trim() : null,
      is_enabled: true,
    }).select('id,name,mode,last_seen_at,last_error,is_enabled').single();
    setBusy(false);
    if (error) {
      toast.error(`No se pudo registrar la conexión: ${error.message}`);
      return;
    }
    setConnections((current) => [data as HolyricsConnection, ...current]);
    setNewConnection({ name: '', mode: 'internet', base_url: '' });
    setShowConnectionEditor(false);
    toast.success('Conexión Holyrics registrada.');
  };

  const visibleServices = useMemo(() => {
    if (view === 'month' || view === 'table') return services;
    if (view === 'day') return services.filter((service) => service.service_date === selectedDate);
    const weekStart = dateKey(startOfWeek(parseDate(selectedDate)));
    const weekEnd = dateKey(endOfWeek(parseDate(selectedDate)));
    return services.filter((service) => service.service_date >= weekStart && service.service_date <= weekEnd);
  }, [services, selectedDate, view]);

  const serviceByDate = useMemo(() => {
    const map = new Map<string, WorshipService[]>();
    services.forEach((service) => map.set(service.service_date, [...(map.get(service.service_date) ?? []), service]));
    return map;
  }, [services]);

  const monthLabel = anchor.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });

  if (!canView) return null;

  return (
    <div className="min-h-full space-y-5 pb-10">
      <AdminHeader
        eyebrow="Producción · Organización del culto"
        title="Tiempo de Culto"
        description="Planifica personas, tiempos, contenido y conexiones para que cada culto llegue listo al escenario."
        action={<div className="flex flex-wrap gap-2"><button type="button" className={softButton} onClick={() => void loadData()} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar</button><button type="button" className={primaryButton} onClick={() => { setNewService(defaultForm(selectedDate)); setShowEditor(true); }} disabled={readOnly}><Plus size={15} /> Nuevo culto</button></div>}
      />

      <section className="relative overflow-hidden rounded-[2rem] bg-[#07152f] p-5 text-white shadow-[0_28px_90px_-38px_rgba(7,21,47,.8)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-sky-400/10 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-300"><Sparkles size={14} /> Planificador inteligente</div>
            <h2 className="max-w-3xl font-serif text-3xl font-bold tracking-tight sm:text-4xl">El culto empieza mucho antes de abrir las puertas.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">Reglas para fechas especiales, asignaciones con varios músicos por función y un orden listo para sincronizar con Holyrics.</p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><strong className="block text-2xl font-black">{services.length}</strong><span className="text-[10px] uppercase tracking-wide text-slate-300">Cultos</span></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><strong className="block text-2xl font-black">{activeRules.length}</strong><span className="text-[10px] uppercase tracking-wide text-slate-300">Reglas</span></div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3"><strong className="block text-2xl font-black">{onlineHolyrics}</strong><span className="text-[10px] uppercase tracking-wide text-slate-300">Holyrics</span></div>
          </div>
        </div>
      </section>

      <ConnectionInstructions
        eyebrow="Conexión sencilla · Holyrics"
        title="Elige una de las dos formas de conectar"
        description="Usa Internet si necesitas controlar Holyrics desde fuera de la iglesia. Usa Local si la computadora de producción está en la misma red. En ambos casos el token queda fuera del navegador."
        steps={[
          { title: 'Activa el API Server', description: 'En Holyrics abre Archivo → Configuración → API Server. Para Internet necesitas el plan Advanced; para Local crea un token con los permisos necesarios.' },
          { title: 'Registra el destino', description: 'En la tarjeta Holyrics pulsa “Registrar conexión”. Elige API por Internet o Puente local. La URL local tiene este formato: http://IP:PUERTO/api.' },
          { title: 'Configura el transporte', description: 'Internet usa secretos de Supabase. Local usa el puente instalado en la computadora de producción y conserva allí el token.' },
          { title: 'Prueba la conexión', description: 'Pulsa “Probar Internet” o “Probar local”. La comprobación usa GetVersion y solo muestra Online cuando Holyrics responde realmente.' },
          { title: 'Sincroniza el culto', description: 'Después de comprobar la conexión, el planificador podrá entregar letras, textos, eventos, anuncios y orden de culto al destino seleccionado.' },
        ]}
        command={'# Internet · configurar en Supabase\nnpx supabase secrets set HOLYRICS_API_KEY="TU_API_KEY" HOLYRICS_API_TOKEN="TU_TOKEN"\nnpx supabase functions deploy holyrics-api\n\n# Local · ejecutar en la PC con el puente\n$env:HOLYRICS_LOCAL_API_URL="http://IP_DEL_COMPUTADOR:PUERTO/api"\n$env:HOLYRICS_LOCAL_TOKEN="TOKEN_DE_HOLYRICS"\n$env:HOLYRICS_BRIDGE_ALLOWED_ORIGINS="https://TU_DOMINIO.com,http://localhost:5173"\ncd tools/holyrics-bridge\nnpm start'}
        commandLabel="PowerShell · Internet o puente local"
        helpUrl="https://github.com/holyrics/API-Server/blob/main/README-en.md"
        helpLabel="Ver API oficial"
        note="Si falla Local, revisa la IP, el puerto, el firewall de Windows y que el API Server acepte conexiones de la red. Si falla Internet, confirma que los secretos estén configurados en la misma instancia de Supabase donde está desplegada la función."
      />

      {schemaState === 'missing' && <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><strong>Falta activar el módulo en Supabase.</strong><p className="mt-1 text-xs opacity-80">La página ya está lista, pero necesita la migración `20260816130000_worship_planner_and_holyrics.sql`.</p></div></div><button type="button" className={softButton} onClick={() => void loadData()}><RefreshCw size={14} /> Volver a probar</button></section>}
      {schemaState === 'unknown' && schemaError && <section className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-200"><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><strong>No se pudo consultar el planificador.</strong><p className="mt-1 text-xs">{schemaError}</p></div></div></section>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]">
        <section className={`${glassPanel} min-w-0 p-4 sm:p-6`}>
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 pb-4 dark:border-white/10">
            <div className="flex items-center gap-2"><button type="button" aria-label="Mes anterior" className={softButton} onClick={() => moveMonth(-1)}><ChevronLeft size={16} /></button><button type="button" aria-label="Mes siguiente" className={softButton} onClick={() => moveMonth(1)}><ChevronRight size={16} /></button><h3 className="ml-1 font-serif text-2xl font-bold capitalize text-slate-900 dark:text-white">{monthLabel}</h3></div>
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100/80 p-1 dark:bg-white/5">{([['month', 'Mes', CalendarDays], ['week', 'Semana', CalendarDays], ['day', 'Día', Clock3], ['table', 'Tabla', List]] as const).map(([value, label, Icon]) => <button key={value} type="button" onClick={() => setView(value)} className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-[11px] font-black transition ${view === value ? 'bg-white text-primary shadow-sm dark:bg-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}><Icon size={14} /> {label}</button>)}</div>
          </div>

          {view === 'month' && <div className="mt-5 overflow-x-auto"><div className="min-w-[680px]"><div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black uppercase tracking-[.15em] text-slate-400">{['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => <div key={day} className="pb-2">{day}</div>)}</div><div className="grid grid-cols-7 gap-2">{daysForMonth(anchor).map((day, index) => { const key = day ? dateKey(day) : `empty-${index}`; const dayServices = day ? serviceByDate.get(key) ?? [] : []; const isSelected = key === selectedDate; return <button key={key} type="button" disabled={!day} onClick={() => day && (setSelectedDate(key), setView('day'))} className={`min-h-28 rounded-2xl border p-2 text-left transition ${day ? 'border-slate-200/80 bg-white/60 hover:-translate-y-0.5 hover:border-primary/40 dark:border-white/10 dark:bg-white/[.03]' : 'border-transparent bg-transparent'} ${isSelected ? 'ring-2 ring-primary/50' : ''}`}>{day && <><div className={`text-xs font-black ${isSelected ? 'text-primary' : 'text-slate-500 dark:text-slate-300'}`}>{day.getDate()}</div><div className="mt-2 space-y-1">{dayServices.map((service) => <span key={service.id} className={`block truncate rounded-lg px-2 py-1 text-[10px] font-bold ${service.service_type === 'santa_cena' ? 'bg-amber-100 text-amber-800 dark:bg-amber-300/10 dark:text-amber-200' : service.service_type === 'misionero' ? 'bg-sky-100 text-sky-800 dark:bg-sky-300/10 dark:text-sky-200' : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-300/10 dark:text-indigo-200'}`}>{service.start_time.slice(0, 5)} · {service.title}</span>)}</div></>}</button>; })}</div></div></div>}

          {view === 'day' && <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200/80 dark:border-white/10"><div className="max-h-[36rem] overflow-y-auto">{Array.from({ length: 48 }, (_, index) => { const minutes = index * 30; const hours = Math.floor(minutes / 60); const label = `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; const rowServices = visibleServices.filter((service) => Math.floor(minutesFromTime(service.start_time) / 30) * 30 === minutes); return <div key={label} className="grid min-h-14 grid-cols-[4.5rem_1fr] border-b border-slate-100 last:border-b-0 dark:border-white/5"><div className="border-r border-slate-100 px-3 py-2 text-[10px] font-black text-slate-400 dark:border-white/5">{label}</div><div className="space-y-2 p-2">{rowServices.map((service) => <button key={service.id} type="button" onClick={() => selectService(service)} className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${selectedServiceId === service.id ? 'border-primary/50 bg-primary/[.04]' : 'border-primary/10 bg-primary/[.03] hover:border-primary/30'}`}><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><Clock3 size={15} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-xs text-slate-800 dark:text-white">{service.title}</strong><span className="text-[10px] text-slate-500">{service.start_time.slice(0, 5)}–{service.end_time.slice(0, 5)}</span></span></button>)}</div></div>; })}</div></div>}
          {view !== 'month' && view !== 'day' && <div className="mt-5 space-y-3">{visibleServices.length ? visibleServices.map((service) => <button key={service.id} type="button" onClick={() => selectService(service)} className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition hover:-translate-y-0.5 ${selectedServiceId === service.id ? 'border-primary/50 bg-primary/[.04] shadow-sm' : 'border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-white/[.03]'}`}><div className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><CalendarDays size={20} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><strong className="truncate text-sm text-slate-900 dark:text-white">{service.title}</strong>{service.generated_by_rule && <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[9px] font-black uppercase text-amber-800 dark:bg-amber-300/10 dark:text-amber-200">Regla</span>}</div><p className="mt-1 text-xs capitalize text-slate-500 dark:text-slate-400">{formatDate(service.service_date)} · {service.start_time.slice(0, 5)}–{service.end_time.slice(0, 5)}</p></div><span className="hidden rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase text-slate-500 sm:inline-flex dark:bg-white/10 dark:text-slate-300">{service.status}</span></button>) : <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15"><CalendarDays className="mx-auto text-slate-400" size={24} /><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">No hay cultos en esta vista.</p><p className="mt-1 text-xs text-slate-500">Genera las reglas del mes o crea un culto manual.</p></div>}</div>}
        </section>

        <aside className="space-y-5">
          <section className={`${glassPanel} p-5`}><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Acciones rápidas</p><h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">Automatización</h3></div><Settings2 className="text-slate-400" size={19} /></div><button type="button" className={`${primaryButton} mt-4 w-full`} onClick={() => void generateMonth()} disabled={busy || schemaState !== 'ready' || readOnly}>{busy ? <Loader2 className="animate-spin" size={15} /> : <Sparkles size={15} />} Generar reglas de {monthLabel}</button><div className="mt-3 space-y-2">{activeRules.slice(0, 3).map((rule) => <div key={rule.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-white/5"><span className="truncate text-slate-600 dark:text-slate-300">{rule.name}</span><CheckCircle2 className="shrink-0 text-emerald-500" size={15} /></div>)}</div></section>

          <section className={`${glassPanel} p-5`}><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Próximo culto</p><h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">{upcoming?.title ?? 'Sin cultos próximos'}</h3></div><Clock3 className="text-primary" size={20} /></div>{upcoming ? <p className="mt-3 text-sm capitalize text-slate-500 dark:text-slate-400">{formatDate(upcoming.service_date)}<br /><span className="font-bold text-slate-700 dark:text-slate-200">{upcoming.start_time.slice(0, 5)} – {upcoming.end_time.slice(0, 5)}</span></p> : <p className="mt-3 text-xs text-slate-500">Crea un culto o genera las reglas del mes.</p>}</section>

          <section className={`${glassPanel} p-5`}><div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Integración</p><h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">Holyrics</h3></div>{onlineHolyrics ? <Wifi className="text-emerald-500" size={19} /> : <WifiOff className="text-slate-400" size={19} />}</div><p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">La clave permanece en el servidor. La red local se conecta mediante el puente de producción.</p><div className="mt-4 space-y-2">{connections.length ? connections.map((connection) => <div key={connection.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2 text-xs dark:bg-white/5"><span className="flex min-w-0 items-center gap-2"><span className={`size-2 rounded-full ${connection.last_seen_at && Date.now() - new Date(connection.last_seen_at).getTime() < 90_000 ? 'bg-emerald-500' : 'bg-slate-300'}`} /><span className="truncate text-slate-600 dark:text-slate-300">{connection.name}</span></span><span className="text-[10px] font-black uppercase text-slate-400">{connection.mode}</span></div>) : <p className="rounded-xl bg-slate-50 p-3 text-xs text-slate-500 dark:bg-white/5">Sin conexiones registradas todavía.</p>}</div><div className="mt-3 grid gap-2 sm:grid-cols-2"><button type="button" className={softButton} onClick={() => void testHolyrics()} disabled={holyricsBusy}>{holyricsBusy ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />} Probar Internet</button><button type="button" className={softButton} onClick={() => void testLocalHolyrics()} disabled={holyricsBusy}>{holyricsBusy ? <Loader2 className="animate-spin" size={14} /> : <Wifi size={14} />} Probar local</button></div><button type="button" className={`${softButton} mt-2 w-full`} onClick={() => setShowConnectionEditor(true)} disabled={readOnly}><Plus size={14} /> Registrar conexión</button></section>

          {selectedService && <section className={`${glassPanel} p-5`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Equipo asignado</p><h3 className="mt-1 font-serif text-xl font-bold text-slate-900 dark:text-white">{selectedService.title}</h3><p className="mt-1 text-xs capitalize text-slate-500">{formatShortDate(selectedService.service_date)} · {selectedService.start_time.slice(0, 5)}</p></div><button type="button" aria-label="Cerrar detalle" className="text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setSelectedServiceId(null)}><X size={18} /></button></div><div className="mt-4 space-y-2">{selectedAssignments.length ? selectedAssignments.map((assignment) => { const member = assignedMember(assignment); return <div key={assignment.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-2.5 dark:bg-white/5"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-black text-primary">{member ? initials(member.first_name, member.last_name) : '?'}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold text-slate-700 dark:text-slate-200">{member ? `${member.first_name} ${member.last_name}` : 'Sin asignar'}</p><p className="text-[10px] text-slate-500">{assignment.role_label} · puesto {assignment.slot_index}</p></div><span className="text-[10px] font-black uppercase text-slate-400">{assignment.status}</span></div>; }) : <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-white/15">Todavía no hay personas asignadas.</p>}</div><div className="mt-4 grid gap-2"><select aria-label="Función" value={assignmentRole} onChange={(event) => setAssignmentRole(event.target.value as (typeof assignmentRoles)[number][0])} className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white">{assignmentRoles.map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><div className="flex gap-2"><select aria-label="Persona" value={assignmentMemberId} onChange={(event) => setAssignmentMemberId(event.target.value)} className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white"><option value="">Seleccionar persona</option>{members.map((member) => <option key={member.id} value={member.id}>{member.first_name} {member.last_name}</option>)}</select><button type="button" className={primaryButton} onClick={() => void addAssignment()} disabled={!assignmentMemberId || busy || readOnly} aria-label="Agregar asignación"><Plus size={15} /></button></div></div></section>}
        </aside>
      </div>

      {showEditor && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><section className="w-full max-w-xl rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950" role="dialog" aria-modal="true" aria-labelledby="worship-service-editor-title"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Nuevo bloque de planificación</p><h2 id="worship-service-editor-title" className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Crear culto</h2></div><button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setShowEditor(false)}><X size={20} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Título</span><input value={newService.title} onChange={(event) => setNewService((current) => ({ ...current, title: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Fecha</span><input type="date" value={newService.service_date} onChange={(event) => setNewService((current) => ({ ...current, service_date: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Tipo</span><input value={newService.service_type} onChange={(event) => setNewService((current) => ({ ...current, service_type: event.target.value }))} placeholder="general, especial..." className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Inicio</span><input type="time" value={newService.start_time} onChange={(event) => setNewService((current) => ({ ...current, start_time: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label><label><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Final</span><input type="time" value={newService.end_time} onChange={(event) => setNewService((current) => ({ ...current, end_time: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label><label className="sm:col-span-2"><span className="mb-1.5 flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300"><Link2 size={13} /> Vincular evento</span><select value={newService.event_id} onChange={(event) => setNewService((current) => ({ ...current, event_id: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white"><option value="">Sin evento vinculado</option>{events.map((event) => <option key={event.id} value={event.id}>{event.title} · {formatShortDate(event.start_date)}</option>)}</select></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Notas</span><textarea value={newService.notes} onChange={(event) => setNewService((current) => ({ ...current, notes: event.target.value }))} rows={3} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label></div><div className="mt-6 flex justify-end gap-2"><button type="button" className={softButton} onClick={() => setShowEditor(false)}>Cancelar</button><button type="button" className={primaryButton} onClick={() => void saveService()} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Guardar culto</button></div></section></div>}
      {showConnectionEditor && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><section className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-slate-950" role="dialog" aria-modal="true" aria-labelledby="holyrics-connection-title"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Destino de producción</p><h2 id="holyrics-connection-title" className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Registrar Holyrics</h2></div><button type="button" className="text-slate-400 hover:text-slate-700 dark:hover:text-white" onClick={() => setShowConnectionEditor(false)}><X size={20} /></button></div><div className="mt-5 space-y-4"><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Nombre</span><input value={newConnection.name} onChange={(event) => setNewConnection((current) => ({ ...current, name: event.target.value }))} placeholder="Holyrics · Producción" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label><label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">Transporte</span><select value={newConnection.mode} onChange={(event) => setNewConnection((current) => ({ ...current, mode: event.target.value as 'local' | 'internet' }))} className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white"><option value="internet">API por Internet</option><option value="local">Puente local</option></select></label>{newConnection.mode === 'local' && <label className="block"><span className="mb-1.5 block text-xs font-bold text-slate-600 dark:text-slate-300">URL del API Server</span><input value={newConnection.base_url} onChange={(event) => setNewConnection((current) => ({ ...current, base_url: event.target.value }))} placeholder="http://192.168.1.50:50001/api" className="min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label>}<p className="text-xs leading-5 text-slate-500">El token no se guarda aquí: Internet usa secretos de la función y local usa variables del puente.</p></div><div className="mt-6 flex justify-end gap-2"><button type="button" className={softButton} onClick={() => setShowConnectionEditor(false)}>Cancelar</button><button type="button" className={primaryButton} onClick={() => void saveConnection()} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Registrar</button></div></section></div>}
    </div>
  );
};

export default WorshipPlanner;
