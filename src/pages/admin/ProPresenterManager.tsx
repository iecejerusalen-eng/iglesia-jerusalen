import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronRight,
  Circle,
  Copy,
  Download,
  KeyRound,
  Link2,
  Loader2,
  MonitorPlay,
  Pause,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wifi,
  WifiOff,
  X,
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import type { Song, SongArrangement } from '../../types';
import {
  buildProPresenterPayload,
  formatProPresenterPayloadText,
  type ProPresenterContentMode,
} from '../../features/songs/utils/propresenterPayload';

type ConnectionMode = 'alpha' | 'ndi' | 'web';
type PanelTab = 'overview' | 'connections' | 'control' | 'settings';
type CommandType = 'test_connection' | 'show_lyrics' | 'show_chords' | 'clear_output' | 'next_slide' | 'previous_slide' | 'trigger_slide' | 'sync_service';
type SchemaState = 'ready' | 'missing' | 'unknown';

interface ProPresenterConnection {
  id: string;
  name: string;
  mode: ConnectionMode;
  description: string;
  computer_name: string | null;
  app_version: string | null;
  last_seen_at: string | null;
  last_error: string | null;
  is_enabled: boolean;
  created_at: string;
}

interface SongOption {
  id: string;
  title: string;
  artist: string | null;
  original_key: string | null;
  bpm: number | null;
}

type CommandPayload = Record<string, unknown>;

interface CommandRecord {
  id: string;
  connection_id: string;
  command_type: CommandType;
  status: 'pending' | 'sent' | 'acknowledged' | 'failed' | 'cancelled';
  error_message: string | null;
  created_at: string;
  acknowledged_at: string | null;
}

const modeMeta: Record<ConnectionMode, { label: string; description: string; accent: string }> = {
  alpha: { label: 'Alpha / Key-Fill', description: 'Salida transparente para switcher, SDI o gráficos.', accent: 'from-amber-400 to-orange-500' },
  ndi: { label: 'NDI con alpha', description: 'Overlay transparente por red local.', accent: 'from-sky-400 to-blue-600' },
  web: { label: 'Web page', description: 'Página web dentro de ProPresenter para prototipos.', accent: 'from-violet-400 to-fuchsia-600' },
};

const glassPanel = 'rounded-[1.75rem] border border-white/70 bg-white/75 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/55';
const softButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-blue-400/50 dark:hover:text-blue-300';

const formatLastSeen = (value: string | null) => {
  if (!value) return 'Sin conexión todavía';
  const seconds = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 10) return 'En línea ahora';
  if (seconds < 60) return `Hace ${seconds}s`;
  if (seconds < 3600) return `Hace ${Math.round(seconds / 60)} min`;
  return new Date(value).toLocaleString('es-EC', { dateStyle: 'short', timeStyle: 'short' });
};

const isOnline = (value: string | null) => Boolean(value && Date.now() - new Date(value).getTime() < 45_000);

const isMissingProPresenterSchema = (error: { code?: string; message?: string } | null) => Boolean(
  error && (error.code === 'PGRST205' || /propresenter_(connections|commands).*(schema cache|does not exist)/i.test(error.message ?? '')),
);

const createPairingCode = () => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const value = Array.from(bytes, (byte) => alphabet[byte % alphabet.length]).join('');
  return `JER-${value.match(/.{1,4}/g)?.join('-') ?? value}`;
};

const ProPresenterManager = () => {
  const [searchParams] = useSearchParams();
  const requestedSongId = searchParams.get('song') ?? '';
  const { isReadOnly, hasPermission } = usePermissions();
  const readOnly = isReadOnly('propresenter');
  const canView = hasPermission('propresenter', 'view');
  const [tab, setTab] = useState<PanelTab>(requestedSongId ? 'control' : 'overview');
  const [connections, setConnections] = useState<ProPresenterConnection[]>([]);
  const [commands, setCommands] = useState<CommandRecord[]>([]);
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [selectedConnectionId, setSelectedConnectionId] = useState('');
  const [selectedSongId, setSelectedSongId] = useState(requestedSongId);
  const [selectedSongDetail, setSelectedSongDetail] = useState<Song | null>(null);
  const [selectedArrangementId, setSelectedArrangementId] = useState('original');
  const [loadingSong, setLoadingSong] = useState(Boolean(requestedSongId));
  const [loading, setLoading] = useState(true);
  const [schemaState, setSchemaState] = useState<SchemaState>('unknown');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [pairingConnectionId, setPairingConnectionId] = useState('');
  const [newConnection, setNewConnection] = useState({ name: '', mode: 'ndi' as ConnectionMode, description: '' });

  const selectedConnection = useMemo(
    () => connections.find((connection) => connection.id === selectedConnectionId) ?? connections[0] ?? null,
    [connections, selectedConnectionId],
  );

  const selectSong = useCallback((songId: string) => {
    setSelectedSongDetail(null);
    setSelectedArrangementId('original');
    setLoadingSong(Boolean(songId));
    setSelectedSongId(songId);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [connectionResult, songsResult, commandResult] = await Promise.all([
      supabase.from('propresenter_connections').select('id, name, mode, description, computer_name, app_version, last_seen_at, last_error, is_enabled, created_at').order('created_at', { ascending: false }),
      supabase.from('songs').select('id, title, artist, original_key, bpm').eq('status', 'published').order('title').limit(500),
      supabase.from('propresenter_commands').select('id, connection_id, command_type, status, error_message, created_at, acknowledged_at').order('created_at', { ascending: false }).limit(20),
    ]);

    const missingSchema = isMissingProPresenterSchema(connectionResult.error) || isMissingProPresenterSchema(commandResult.error);
    if (missingSchema) {
      setSchemaState('missing');
      setSchemaError('Supabase todavía no reconoce las tablas de control de ProPresenter. Aplica la migración indicada abajo para habilitar conexiones y comandos.');
    } else if (connectionResult.error) {
      setSchemaState('unknown');
      toast.error(`No se pudieron cargar las conexiones: ${connectionResult.error.message}`);
    } else {
      setSchemaState('ready');
      setSchemaError(null);
      const loaded = (connectionResult.data ?? []) as ProPresenterConnection[];
      setConnections(loaded);
      setSelectedConnectionId((current) => current || loaded[0]?.id || '');
    }
    if (!songsResult.error) setSongs((songsResult.data ?? []) as SongOption[]);
    if (commandResult.error && !missingSchema) toast.error(`No se pudo cargar la cola de comandos: ${commandResult.error.message}`);
    else setCommands((commandResult.data ?? []) as CommandRecord[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!selectedSongId) return undefined;
    let active = true;
    const loadSong = async () => {
      const [songResult, arrangementsResult] = await Promise.all([
        supabase.from('songs').select('*').eq('id', selectedSongId).single(),
        supabase.from('song_arrangements').select('*').eq('song_id', selectedSongId).eq('status', 'published').order('is_default', { ascending: false }).order('name'),
      ]);
      if (!active) return;
      setLoadingSong(false);
      if (songResult.error) {
        console.error('No se pudo cargar la alabanza para ProPresenter.', songResult.error);
        setSelectedSongDetail(null);
        toast.error('No se pudo preparar la alabanza seleccionada.');
        return;
      }
      const migrationPending = arrangementsResult.error?.code === '42P01' || arrangementsResult.error?.code === 'PGRST205';
      if (arrangementsResult.error && !migrationPending) {
        console.error('No se pudieron cargar las versiones para ProPresenter.', arrangementsResult.error);
        setSelectedSongDetail(null);
        toast.error('No se pudieron cargar las versiones de esta alabanza.');
        return;
      }
      const arrangements = ((arrangementsResult.data ?? []) as unknown as SongArrangement[]);
      setSelectedSongDetail({ ...(songResult.data as unknown as Song), song_arrangements: arrangements });
      setSelectedArrangementId(arrangements.find((arrangement) => arrangement.is_default)?.id ?? 'original');
    };
    void loadSong();
    return () => { active = false; };
  }, [selectedSongId]);

  useEffect(() => {
    if (!canView) return undefined;
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canView, loadData]);

  useEffect(() => {
    if (!canView) return undefined;
    const channel = supabase
      .channel('propresenter-manager-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'propresenter_connections' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setConnections((current) => current.filter((connection) => connection.id !== String(payload.old.id)));
          return;
        }
        const next = payload.new as ProPresenterConnection;
        setConnections((current) => {
          const exists = current.some((connection) => connection.id === next.id);
          return exists ? current.map((connection) => connection.id === next.id ? { ...connection, ...next } : connection) : [next, ...current];
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'propresenter_commands' }, (payload) => {
        if (payload.eventType === 'DELETE') {
          setCommands((current) => current.filter((command) => command.id !== String(payload.old.id)));
          return;
        }
        const next = payload.new as CommandRecord;
        setCommands((current) => {
          const exists = current.some((command) => command.id === next.id);
          return exists ? current.map((command) => command.id === next.id ? { ...command, ...next } : command) : [next, ...current].slice(0, 20);
        });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [canView]);

  const createConnection = async () => {
    if (schemaState !== 'ready') {
      toast.info('Aplica primero la migración de ProPresenter en Supabase.');
      return;
    }
    if (readOnly || !newConnection.name.trim()) {
      toast.error('Escribe un nombre para la computadora.');
      return;
    }
    setBusy(true);
    const code = createPairingCode();
    const { data, error } = await supabase.rpc('create_propresenter_connection', {
      p_name: newConnection.name.trim(),
      p_mode: newConnection.mode,
      p_description: newConnection.description.trim(),
      p_pairing_code: code,
    });
    setBusy(false);
    if (error) {
      if (error.code === 'PGRST202' || /create_propresenter_connection/i.test(error.message)) {
        setSchemaState('missing');
        setSchemaError('Las tablas existen, pero falta aplicar la migración de entrega segura de ProPresenter.');
      }
      toast.error(`No se pudo crear la conexión: ${error.message}`);
      return;
    }
    const created = (Array.isArray(data) ? data[0] : data) as ProPresenterConnection | null;
    if (!created) {
      toast.error('Supabase no devolvió la conexión creada.');
      return;
    }
    setConnections((current) => [created, ...current]);
    setSelectedConnectionId(created.id);
    setPairingCode(code);
    setPairingConnectionId(created.id);
    setShowCreate(false);
    setNewConnection({ name: '', mode: 'ndi', description: '' });
    toast.success('Conexión creada. Guarda el código de emparejamiento.');
  };

  const removeConnection = async (connection: ProPresenterConnection) => {
    if (readOnly || !window.confirm(`¿Eliminar la conexión “${connection.name}”?`)) return;
    const { error } = await supabase.from('propresenter_connections').delete().eq('id', connection.id);
    if (error) toast.error(`No se pudo eliminar: ${error.message}`);
    else {
      setConnections((current) => current.filter((item) => item.id !== connection.id));
      if (selectedConnectionId === connection.id) setSelectedConnectionId('');
      toast.success('Conexión eliminada.');
    }
  };

  const sendCommand = async (commandType: CommandType, payload: CommandPayload = {}) => {
    if (schemaState !== 'ready') {
      toast.info('Aplica primero la migración de ProPresenter en Supabase.');
      return;
    }
    if (readOnly || !selectedConnection) {
      toast.error('Selecciona una conexión con permisos de edición.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.from('propresenter_commands').insert({
      connection_id: selectedConnection.id,
      command_type: commandType,
      payload,
      status: 'pending',
    }).select('id, connection_id, command_type, status, error_message, created_at, acknowledged_at').single();
    setBusy(false);
    if (error) toast.error(`No se pudo enviar la orden: ${error.message}`);
    else {
      if (data) setCommands((current) => [data as CommandRecord, ...current].slice(0, 20));
      toast.success('Orden enviada a la cola local.');
    }
  };

  const selectedSong = songs.find((song) => song.id === selectedSongId) ?? null;
  const onlineCount = connections.filter((connection) => isOnline(connection.last_seen_at)).length;

  if (!canView) return null;

  return (
    <div className="min-h-full space-y-5 pb-10">
      <AdminHeader
        eyebrow="Producción · Integración local"
        title="Panel ProPresenter"
        description="Conecta las alabanzas, la Biblia y el orden del culto con las computadoras de producción autorizadas."
        action={<button type="button" onClick={() => void loadData()} className={softButton}><RefreshCw size={15} /> Actualizar estado</button>}
      />

      <section className="relative overflow-hidden rounded-[2rem] bg-[#07152f] p-5 text-white shadow-[0_28px_90px_-38px_rgba(7,21,47,.8)] sm:p-7">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-sky-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative grid gap-7 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
          <div>
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-sky-300"><Sparkles size={14} /> Centro de producción</div>
            <h2 className="max-w-3xl font-serif text-3xl font-bold tracking-tight sm:text-4xl">Una consola para dirigir todo el culto.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">El sitio administra el contenido y el conector local lo entrega a ProPresenter. La conexión es saliente, auditable y limitada a los roles que tú autorices.</p>
            <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-emerald-200"><ShieldCheck size={14} /> Sin exponer puertos públicos</span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-slate-200"><Link2 size={14} /> Comandos con confirmación</span>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-xs text-slate-300"><span>Estado de la red de producción</span><Wifi size={16} className="text-emerald-300" /></div>
            <div className="mt-3 flex items-end gap-3"><strong className="text-4xl font-black">{onlineCount}</strong><span className="pb-1 text-sm text-slate-300">de {connections.length} conectadas</span></div>
            <button type="button" onClick={() => setTab('connections')} className="mt-4 inline-flex items-center gap-2 text-xs font-black text-sky-300 hover:text-white">Administrar dispositivos <ChevronRight size={14} /></button>
          </div>
        </div>
      </section>

      <nav className={`${glassPanel} flex gap-1 overflow-x-auto p-1.5`} aria-label="Secciones del panel ProPresenter">
        {([
          ['overview', 'Resumen', MonitorPlay],
          ['connections', 'Conexiones', Wifi],
          ['control', 'Control en vivo', SlidersHorizontal],
          ['settings', 'Configuración', Settings2],
        ] as const).map(([value, label, Icon]) => (
          <button key={value} type="button" onClick={() => setTab(value)} className={`inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-xs font-black transition ${tab === value ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'}`}><Icon size={15} /> {label}</button>
        ))}
      </nav>

      {loading ? <div className={`${glassPanel} flex min-h-52 items-center justify-center`}><Loader2 className="animate-spin text-primary" /></div> : schemaState === 'missing' ? <SchemaSetupCard error={schemaError} onRetry={() => void loadData()} /> : (
        <>
          {tab === 'overview' && <OverviewTab connections={connections} onNew={() => setShowCreate(true)} onSelect={(id) => { setSelectedConnectionId(id); setTab('control'); }} />}
          {tab === 'connections' && <ConnectionsTab connections={connections} selectedId={selectedConnection?.id ?? ''} readOnly={readOnly} onNew={() => setShowCreate(true)} onSelect={setSelectedConnectionId} onDelete={(connection) => void removeConnection(connection)} />}
          {tab === 'control' && <EnhancedControlTab connections={connections} selectedConnection={selectedConnection} selectedSong={selectedSong} songDetail={selectedSongDetail} selectedArrangementId={selectedArrangementId} loadingSong={loadingSong} selectedSongId={selectedSongId} songs={songs} commands={commands} readOnly={readOnly} busy={busy} onSelectConnection={setSelectedConnectionId} onSelectSong={selectSong} onSelectArrangement={setSelectedArrangementId} onSend={sendCommand} />}
          {tab === 'settings' && <EnhancedSettingsTab />}
        </>
      )}

      {showCreate && <CreateConnectionModal value={newConnection} busy={busy} onChange={setNewConnection} onClose={() => setShowCreate(false)} onSubmit={() => void createConnection()} />}
      {pairingCode && <EnhancedPairingCodeModal code={pairingCode} connectionId={pairingConnectionId} onClose={() => { setPairingCode(''); setPairingConnectionId(''); }} />}
    </div>
  );
};

const OverviewTab = ({ connections, onNew, onSelect }: { connections: ProPresenterConnection[]; onNew: () => void; onSelect: (id: string) => void }) => (
  <div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
    <section className={`${glassPanel} p-5 sm:p-6`}>
      <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-gold">Flujo recomendado</p><h3 className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">De la alabanza a la pantalla</h3></div><button type="button" onClick={onNew} className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20" aria-label="Agregar conexión"><Plus size={18} /></button></div>
      <div className="mt-6 space-y-3">
        {[['01', 'Prepara el culto', 'Selecciona el orden, las canciones y la versión musical.'], ['02', 'Sincroniza', 'Envía solo letra, letra + acordes o la presentación completa.'], ['03', 'Dirige en vivo', 'Avanza slides, muestra Biblia y controla el overlay desde cualquier dispositivo autorizado.']].map(([number, title, description]) => <div key={number} className="flex gap-4 rounded-2xl border border-slate-200/70 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-xs font-black text-amber-700 dark:text-amber-300">{number}</span><div><strong className="text-sm text-slate-800 dark:text-white">{title}</strong><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p></div></div>)}
      </div>
    </section>
    <section className={`${glassPanel} p-5 sm:p-6`}><div className="flex items-center justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Dispositivos recientes</p><h3 className="mt-1 text-xl font-bold text-slate-800 dark:text-white">Conexiones</h3></div><button type="button" onClick={onNew} className={softButton}><Plus size={15} /> Nueva</button></div><div className="mt-5 space-y-2">{connections.slice(0, 4).map((connection) => <button key={connection.id} type="button" onClick={() => onSelect(connection.id)} className="flex w-full items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/55 p-3 text-left transition hover:-translate-y-0.5 hover:border-blue-300 dark:border-white/10 dark:bg-white/5"><span className={`flex size-10 items-center justify-center rounded-xl bg-gradient-to-br ${modeMeta[connection.mode].accent} text-white`}><MonitorPlay size={18} /></span><span className="min-w-0 flex-1"><strong className="block truncate text-sm text-slate-800 dark:text-white">{connection.name}</strong><span className="mt-0.5 flex items-center gap-1.5 text-[11px] text-slate-500"><Circle size={8} fill={isOnline(connection.last_seen_at) ? '#10b981' : '#94a3b8'} className={isOnline(connection.last_seen_at) ? 'text-emerald-500' : 'text-slate-400'} />{formatLastSeen(connection.last_seen_at)}</span></span><ChevronRight size={16} className="text-slate-400" /></button>)}{connections.length === 0 && <EmptyState onNew={onNew} />}</div></section>
  </div>
);

const ConnectionsTab = ({ connections, selectedId, readOnly, onNew, onSelect, onDelete }: { connections: ProPresenterConnection[]; selectedId: string; readOnly: boolean; onNew: () => void; onSelect: (id: string) => void; onDelete: (connection: ProPresenterConnection) => void }) => (
  <section className={`${glassPanel} p-5 sm:p-6`}><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-gold">Acceso controlado por roles</p><h3 className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Computadoras autorizadas</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Concede el módulo “Panel ProPresenter” desde Usuarios & Permisos a los editores de producción.</p></div><button type="button" onClick={onNew} disabled={readOnly} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-white shadow-lg shadow-primary/20 disabled:opacity-40"><Plus size={15} /> Registrar computadora</button></div><div className="mt-6 grid gap-3 lg:grid-cols-2">{connections.map((connection) => { const online = isOnline(connection.last_seen_at); return <article key={connection.id} className={`rounded-2xl border p-4 transition ${selectedId === connection.id ? 'border-blue-400 bg-blue-50/60 shadow-lg shadow-blue-500/10 dark:border-blue-400/50 dark:bg-blue-950/20' : 'border-slate-200/70 bg-white/55 dark:border-white/10 dark:bg-white/5'}`}><div className="flex items-start gap-3"><span className={`flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br ${modeMeta[connection.mode].accent} text-white`}><MonitorPlay size={20} /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><h4 className="truncate text-sm font-black text-slate-800 dark:text-white">{connection.name}</h4><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}><Circle size={7} fill="currentColor" />{online ? 'Online' : 'Offline'}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{connection.computer_name || 'Esperando al conector local'} · {modeMeta[connection.mode].label}</p></div><button type="button" onClick={() => onDelete(connection)} disabled={readOnly} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label={`Eliminar ${connection.name}`}><Trash2 size={15} /></button></div><div className="mt-4 grid grid-cols-2 gap-2 text-[11px]"><div className="rounded-xl bg-slate-100/80 p-2.5 dark:bg-white/5"><span className="block text-slate-400">Último contacto</span><strong className="mt-1 block text-slate-700 dark:text-slate-200">{formatLastSeen(connection.last_seen_at)}</strong></div><div className="rounded-xl bg-slate-100/80 p-2.5 dark:bg-white/5"><span className="block text-slate-400">Versión</span><strong className="mt-1 block text-slate-700 dark:text-slate-200">{connection.app_version || 'Pendiente'}</strong></div></div>{connection.last_error && <p className="mt-3 flex items-start gap-2 rounded-xl bg-red-50 p-2.5 text-[11px] text-red-700 dark:bg-red-400/10 dark:text-red-300"><AlertTriangle size={14} className="mt-0.5 shrink-0" />{connection.last_error}</p>}<button type="button" onClick={() => onSelect(connection.id)} className="mt-4 inline-flex items-center gap-1 text-xs font-black text-primary dark:text-sky-300">Abrir control <ChevronRight size={14} /></button></article>; })}{connections.length === 0 && <div className="lg:col-span-2"><EmptyState onNew={onNew} /></div>}</div></section>
);

interface EnhancedControlTabProps {
  connections: ProPresenterConnection[];
  selectedConnection: ProPresenterConnection | null;
  selectedSong: SongOption | null;
  songDetail: Song | null;
  selectedArrangementId: string;
  loadingSong: boolean;
  selectedSongId: string;
  songs: SongOption[];
  commands: CommandRecord[];
  readOnly: boolean;
  busy: boolean;
  onSelectConnection: (id: string) => void;
  onSelectSong: (id: string) => void;
  onSelectArrangement: (id: string) => void;
  onSend: (command: CommandType, payload?: CommandPayload) => Promise<void>;
}

const EnhancedControlTab = ({
  connections,
  selectedConnection,
  selectedSong,
  songDetail,
  selectedArrangementId,
  loadingSong,
  selectedSongId,
  songs,
  commands,
  readOnly,
  busy,
  onSelectConnection,
  onSelectSong,
  onSelectArrangement,
  onSend,
}: EnhancedControlTabProps) => {
  const [songSearch, setSongSearch] = useState('');
  const [contentMode, setContentMode] = useState<ProPresenterContentMode>('lyrics');
  const [linesPerSlide, setLinesPerSlide] = useState(2);
  const online = isOnline(selectedConnection?.last_seen_at ?? null);
  const arrangements = songDetail?.song_arrangements ?? [];
  const activeArrangement = arrangements.find((arrangement) => arrangement.id === selectedArrangementId) ?? null;
  const preparedSong = useMemo<Song | null>(() => {
    if (!songDetail || !activeArrangement) return songDetail;
    return {
      ...songDetail,
      lyrics: activeArrangement.lyrics,
      structure_blocks: activeArrangement.structure_blocks,
      resource_links: activeArrangement.resource_links,
      original_key: activeArrangement.original_key,
      preferred_accidentals: activeArrangement.preferred_accidentals,
      capo: activeArrangement.capo,
      bpm: activeArrangement.bpm,
      time_signature: activeArrangement.time_signature,
    };
  }, [activeArrangement, songDetail]);
  const preview = useMemo(
    () => preparedSong ? buildProPresenterPayload(preparedSong, {
      mode: contentMode,
      arrangementId: activeArrangement?.id ?? null,
      linesPerSlide,
    }) : null,
    [activeArrangement?.id, contentMode, linesPerSlide, preparedSong],
  );
  const filteredSongs = useMemo(() => {
    const query = songSearch.trim().toLocaleLowerCase('es');
    if (!query) return songs;
    return songs.filter((song) => `${song.title} ${song.artist ?? ''}`.toLocaleLowerCase('es').includes(query));
  }, [songSearch, songs]);
  const visibleCommands = commands.filter((command) => !selectedConnection || command.connection_id === selectedConnection.id).slice(0, 5);
  const canSendContent = Boolean(selectedConnection && selectedSong && preview?.slides.length && !loadingSong && !readOnly && !busy);

  const createPayload = (mode: ProPresenterContentMode): CommandPayload | null => {
    if (!preparedSong || !selectedConnection) return null;
    const content = buildProPresenterPayload(preparedSong, {
      mode,
      arrangementId: activeArrangement?.id ?? null,
      linesPerSlide,
    });
    return {
      content,
      output_mode: selectedConnection.mode,
      slide_index: 0,
    };
  };

  const sendContent = (command: 'show_lyrics' | 'show_chords' | 'sync_service', mode: ProPresenterContentMode) => {
    const payload = createPayload(mode);
    if (!payload) return;
    void onSend(command, payload);
  };

  const preparedText = (mode: ProPresenterContentMode) => {
    if (!preparedSong) return '';
    const content = buildProPresenterPayload(preparedSong, {
      mode,
      arrangementId: activeArrangement?.id ?? null,
      linesPerSlide: mode === 'lyrics' ? linesPerSlide : 1,
    });
    return formatProPresenterPayloadText(content, mode);
  };

  const copyPreparedText = async (mode: ProPresenterContentMode) => {
    const text = preparedText(mode);
    if (!text) {
      toast.error('Esta versión no tiene contenido para copiar.');
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      toast.success(mode === 'lyrics'
        ? 'Letra copiada para importar en ProPresenter'
        : 'Pares de acordes y letra copiados para Stage');
    } catch (error) {
      console.error('No se pudo copiar el texto preparado para ProPresenter.', error);
      toast.error('El navegador no permitió copiar el contenido.');
    }
  };

  const downloadPreparedText = (mode: ProPresenterContentMode) => {
    const text = preparedText(mode);
    if (!text || !preparedSong) {
      toast.error('Esta versión no tiene contenido para descargar.');
      return;
    }
    const safeTitle = preparedSong.title
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'alabanza';
    const file = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${safeTitle}-${mode === 'lyrics' ? 'letra' : 'stage-acordes'}.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    toast.success('Archivo de importación descargado.');
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[.72fr_1.28fr]">
      <section className={`${glassPanel} h-fit p-5 sm:p-6`}>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-gold"><SlidersHorizontal size={14} /> Salida</div>
        <h3 className="mt-2 font-serif text-2xl font-bold text-primary dark:text-white">Computadora de producción</h3>
        <label htmlFor="propresenter-connection" className="mt-5 block text-xs font-bold text-slate-500">Computadora</label>
        <select id="propresenter-connection" value={selectedConnection?.id ?? ''} onChange={(event) => onSelectConnection(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white">
          <option value="">Selecciona una conexión…</option>
          {connections.map((connection) => <option key={connection.id} value={connection.id}>{connection.name} · {modeMeta[connection.mode].label}</option>)}
        </select>
        {selectedConnection ? (
          <div className="mt-4 rounded-2xl border border-slate-200/70 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-2 text-sm font-black text-slate-800 dark:text-white"><Circle size={9} fill={online ? '#10b981' : '#94a3b8'} className={online ? 'text-emerald-500' : 'text-slate-400'} />{online ? 'Conector en línea' : 'Conector desconectado'}</div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{modeMeta[selectedConnection.mode].description}</p>
            <button type="button" disabled={readOnly || busy} onClick={() => void onSend('test_connection')} className={`${softButton} mt-4 w-full`}><Wifi size={14} /> Probar API de ProPresenter</button>
          </div>
        ) : <div className="mt-4"><EmptyState /></div>}
        <div className="mt-5 rounded-2xl bg-blue-50/80 p-4 text-[11px] leading-5 text-blue-800 dark:bg-blue-400/10 dark:text-blue-200">
          <ShieldCheck size={15} className="mb-2" />Alpha y NDI se configuran como salidas dentro de ProPresenter. Este panel prepara y dirige el contenido sin abrir el puerto local a Internet.
        </div>
      </section>

      <section className={`${glassPanel} min-w-0 p-5 sm:p-6`}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Canción → diapositivas</p><h3 className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Preparar presentación</h3></div>
          <span className="inline-flex items-center gap-2 self-start rounded-full bg-emerald-100 px-3 py-1.5 text-[10px] font-black uppercase text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Radio size={13} /> Snapshot completo</span>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <label className="text-xs font-bold text-slate-500">Buscar canción
            <input value={songSearch} onChange={(event) => setSongSearch(event.target.value)} placeholder="Título o artista…" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white" />
          </label>
          <label className="text-xs font-bold text-slate-500">Canción
            <select value={selectedSongId} onChange={(event) => onSelectSong(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white">
              <option value="">Selecciona una alabanza…</option>
              {filteredSongs.map((song) => <option key={song.id} value={song.id}>{song.title}{song.artist ? ` · ${song.artist}` : ''}</option>)}
            </select>
          </label>
        </div>

        {loadingSong && <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-500 dark:bg-white/5"><Loader2 size={15} className="animate-spin" /> Preparando letra y versiones…</div>}

        {songDetail && !loadingSong && (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-xs font-bold text-slate-500">Versión
                <select value={selectedArrangementId} onChange={(event) => onSelectArrangement(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                  <option value="original">Original</option>
                  {arrangements.map((arrangement) => <option key={arrangement.id} value={arrangement.id}>{arrangement.name}{arrangement.is_default ? ' · predeterminada' : ''}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Contenido
                <select value={contentMode} onChange={(event) => setContentMode(event.target.value as ProPresenterContentMode)} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                  <option value="lyrics">Solo letra</option>
                  <option value="lyrics-chords">Letra + acordes</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Líneas por slide
                <select value={linesPerSlide} onChange={(event) => setLinesPerSlide(Number(event.target.value))} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white/80 px-3 text-sm font-bold text-slate-700 outline-none focus:border-blue-400 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                  {[1, 2, 4].map((count) => <option key={count} value={count}>{count}</option>)}
                </select>
              </label>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-slate-500">
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10">Tonalidad: <strong>{preparedSong?.original_key || 'Sin definir'}</strong></span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><strong>{preparedSong?.bpm || '—'}</strong> BPM</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 dark:bg-white/10"><strong>{preview?.slides.length ?? 0}</strong> diapositivas</span>
            </div>
          </>
        )}

        {preview && preview.slides.length > 0 ? (
          <div className="mt-5">
            <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-center"><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Vista previa</p><span className="text-[10px] text-slate-400">Pulsa una para enviarla</span></div>
            <div className="flex snap-x gap-3 overflow-x-auto pb-2">
              {preview.slides.slice(0, 12).map((slide) => (
                <button key={slide.id} type="button" disabled={!canSendContent} onClick={() => void onSend('trigger_slide', { content: preview, slide_index: slide.index, output_mode: selectedConnection?.mode ?? 'web' })} className="min-h-28 w-48 shrink-0 snap-start rounded-2xl border border-slate-200 bg-slate-950 p-3 text-left text-white transition hover:border-sky-400 disabled:opacity-50">
                  <span className="text-[9px] font-black uppercase tracking-wider text-sky-300">{slide.section} · {slide.index + 1}</span>
                  <span className="mt-3 line-clamp-4 whitespace-pre-line text-xs font-bold leading-5">{slide.text}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 rounded-2xl border border-indigo-200/70 bg-indigo-50/70 p-4 dark:border-indigo-400/20 dark:bg-indigo-400/10">
              <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-center">
                <div>
                  <p className="text-xs font-black text-indigo-950 dark:text-indigo-100">Importación manual y Stage</p>
                  <p className="mt-1 max-w-2xl text-[11px] leading-5 text-indigo-800/75 dark:text-indigo-200/75">La letra usa párrafos vacíos como separación de diapositivas. Stage coloca una línea de acordes sobre cada frase para mantener la sincronía.</p>
                </div>
                <div className="grid shrink-0 gap-2 sm:grid-cols-2">
                  <button type="button" onClick={() => void copyPreparedText('lyrics')} className={softButton}><Copy size={14} /> Copiar letra</button>
                  <button type="button" onClick={() => downloadPreparedText('lyrics')} className={softButton}><Download size={14} /> Descargar .txt</button>
                  <button type="button" onClick={() => void copyPreparedText('lyrics-chords')} className={softButton}><Copy size={14} /> Copiar Stage + acordes</button>
                  <button type="button" onClick={() => downloadPreparedText('lyrics-chords')} className={softButton}><Download size={14} /> Stage .txt</button>
                </div>
              </div>
            </div>
          </div>
        ) : selectedSong && !loadingSong ? <p className="mt-5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">Esta versión todavía no contiene líneas de letra válidas.</p> : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <ActionButton icon={Play} label="Mostrar solo letra" disabled={!canSendContent} onClick={() => sendContent('show_lyrics', 'lyrics')} />
          <ActionButton icon={Sparkles} label="Mostrar letra + acordes" disabled={!canSendContent} onClick={() => sendContent('show_chords', 'lyrics-chords')} />
          <ActionButton icon={RefreshCw} label="Sincronizar presentación" disabled={!canSendContent} onClick={() => sendContent('sync_service', contentMode)} />
          <ActionButton icon={ChevronRight} label="Siguiente slide" disabled={!selectedConnection || readOnly || busy} onClick={() => void onSend('next_slide')} />
          <ActionButton icon={ChevronRight} label="Slide anterior" disabled={!selectedConnection || readOnly || busy} onClick={() => void onSend('previous_slide')} />
          <ActionButton icon={Pause} label="Limpiar salida" danger disabled={!selectedConnection || readOnly || busy} onClick={() => void onSend('clear_output')} />
        </div>

        <div className="mt-5 border-t border-slate-200/70 pt-4 dark:border-white/10">
          <div className="flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[.18em] text-slate-400">Últimas órdenes</p><span className="text-[10px] text-slate-400">en vivo</span></div>
          <div className="mt-3 space-y-2">
            {visibleCommands.map((command) => <div key={command.id} className="flex items-center gap-2 rounded-xl bg-slate-50/80 px-3 py-2 text-[11px] dark:bg-white/5"><span className={`size-2 rounded-full ${command.status === 'acknowledged' ? 'bg-emerald-500' : command.status === 'failed' ? 'bg-red-500' : command.status === 'sent' ? 'bg-blue-500' : 'bg-amber-400'}`} /><span className="min-w-0 flex-1 truncate font-bold text-slate-600 dark:text-slate-300">{command.command_type.replaceAll('_', ' ')}</span><span className="text-slate-400">{command.status}</span></div>)}
            {visibleCommands.length === 0 && <p className="text-xs text-slate-400">Todavía no hay órdenes para esta conexión.</p>}
          </div>
        </div>
      </section>
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick, disabled, danger = false }: { icon: typeof Play; label: string; onClick: () => void; disabled: boolean; danger?: boolean }) => <button type="button" disabled={disabled} onClick={onClick} className={`flex min-h-12 items-center justify-center gap-2 rounded-xl border px-3 text-xs font-black transition hover:-translate-y-0.5 disabled:opacity-40 ${danger ? 'border-red-200 bg-red-50 text-red-700 hover:border-red-300 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-300' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-blue-300 hover:text-blue-700 dark:border-white/10 dark:bg-white/5 dark:text-slate-200'}`}><Icon size={16} />{label}</button>;

const EnhancedSettingsTab = () => (
  <div className="grid gap-5 xl:grid-cols-2">
    <section className={`${glassPanel} p-5 sm:p-6`}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-gold"><Settings2 size={14} /> Salidas reales</div>
      <h3 className="mt-2 font-serif text-2xl font-bold text-primary dark:text-white">Cómo se entrega el contenido</h3>
      <div className="mt-5 space-y-3">
        {(Object.keys(modeMeta) as ConnectionMode[]).map((mode) => (
          <article key={mode} className="rounded-2xl border border-slate-200/70 bg-white/55 p-4 dark:border-white/10 dark:bg-white/5">
            <div className="flex items-center gap-3"><span className={`size-3 rounded-full bg-gradient-to-br ${modeMeta[mode].accent}`} /><strong className="text-sm text-slate-800 dark:text-white">{modeMeta[mode].label}</strong></div>
            <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">{modeMeta[mode].description}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 rounded-2xl bg-amber-50 p-4 text-xs leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"><strong>Importante:</strong> Alpha/Key-Fill y NDI son configuraciones de salida de ProPresenter. El conector entrega la letra; ProPresenter y el switcher deciden cómo se compone la señal.</p>
    </section>
    <section className={`${glassPanel} p-5 sm:p-6`}>
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-slate-400"><KeyRound size={14} /> Seguridad operativa</div>
      <h3 className="mt-2 font-serif text-2xl font-bold text-primary dark:text-white">Acceso mínimo y auditable</h3>
      <div className="mt-5 space-y-3 text-xs leading-5 text-slate-600 dark:text-slate-300">
        <p className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><strong className="block text-slate-800 dark:text-white">Roles autorizados</strong>El módulo <em>propresenter</em> controla quién puede ver o enviar órdenes. Concede Editar solamente al equipo que dirige la presentación.</p>
        <p className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><strong className="block text-slate-800 dark:text-white">Conexión saliente</strong>La computadora consulta una cola segura; no necesitas publicar el puerto local de ProPresenter.</p>
        <p className="rounded-2xl bg-slate-50 p-4 dark:bg-white/5"><strong className="block text-slate-800 dark:text-white">Snapshots de canciones</strong>Cada orden incluye la versión, tonalidad, BPM y diapositivas exactas para que una edición posterior no cambie un culto ya preparado.</p>
      </div>
    </section>
  </div>
);

const EnhancedPairingCodeModal = ({ code, connectionId, onClose }: { code: string; connectionId: string; onClose: () => void }) => {
  const setupText = `PROPRESENTER_CONNECTION_ID=${connectionId}\nPROPRESENTER_PAIRING_CODE=${code}`;
  const copy = async () => {
    await navigator.clipboard.writeText(setupText);
    toast.success('Identificador y código copiados.');
  };
  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md" role="presentation">
      <section className={`${glassPanel} w-full max-w-lg bg-white/95 p-6 text-center dark:bg-slate-950/95`} role="dialog" aria-modal="true" aria-labelledby="pairing-code-title">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"><Check size={28} /></div>
        <h2 id="pairing-code-title" className="mt-4 font-serif text-2xl font-bold text-primary dark:text-white">Datos de emparejamiento</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">El conector necesita ambos valores. El código caduca a los 15 minutos y se invalida después del primer uso.</p>
        <div className="mt-5 space-y-3 text-left">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/5"><span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">ID de conexión</span><code className="mt-1 block break-all text-xs font-bold text-slate-700 dark:text-slate-200">{connectionId}</code></div>
          <div className="rounded-2xl border border-dashed border-blue-300 bg-blue-50 px-4 py-4 text-center dark:border-blue-400/30 dark:bg-blue-400/10"><span className="block text-[9px] font-black uppercase tracking-wider text-blue-500">Código de un solo uso</span><code className="mt-2 block break-all text-lg font-black tracking-[.12em] text-blue-800 dark:text-blue-200">{code}</code></div>
        </div>
        <div className="mt-5 flex gap-2"><button type="button" onClick={() => void copy()} className={`${softButton} flex-1`}><Copy size={15} /> Copiar ambos</button><button type="button" onClick={onClose} className="flex-1 rounded-xl bg-primary px-4 text-xs font-black text-white">Listo</button></div>
      </section>
    </div>
  );
};

const EmptyState = ({ onNew }: { onNew?: () => void }) => <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center dark:border-white/15"><WifiOff size={22} className="mx-auto text-slate-400" /><p className="mt-2 text-sm font-bold text-slate-600 dark:text-slate-300">No hay computadoras conectadas</p>{onNew && <button type="button" onClick={onNew} className="mt-3 text-xs font-black text-primary dark:text-sky-300">Registrar la primera</button>}</div>;

const SchemaSetupCard = ({ error, onRetry }: { error: string | null; onRetry: () => void }) => <section className={`${glassPanel} overflow-hidden p-5 sm:p-7`}><div className="flex flex-col gap-5 md:flex-row md:items-start"><div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300"><AlertTriangle size={24} /></div><div className="min-w-0 flex-1"><p className="text-[10px] font-black uppercase tracking-[.18em] text-amber-700 dark:text-amber-300">Configuración pendiente</p><h3 className="mt-1 font-serif text-2xl font-bold text-primary dark:text-white">Falta aplicar la integración de ProPresenter</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{error ?? 'El panel está listo, pero la base de datos todavía no tiene las tablas y funciones de entrega.'}</p><div className="mt-5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-4 dark:border-white/10 dark:bg-white/5"><p className="text-xs font-black text-slate-700 dark:text-slate-200">Migraciones requeridas, en este orden</p><ol className="mt-2 list-decimal space-y-1 pl-5 text-xs leading-5 text-slate-500 dark:text-slate-400"><li><code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/10">20260810210000_propresenter_control_center.sql</code></li><li><code className="rounded bg-slate-200 px-1.5 py-0.5 font-mono text-[11px] dark:bg-white/10">20260810221000_propresenter_delivery_hardening.sql</code></li><li>Despliega de nuevo la función <code className="font-mono">propresenter-device</code> y pulsa “Comprobar de nuevo”.</li></ol><p className="mt-3 text-[11px] text-slate-400">Nunca coloques la clave <code className="font-mono">service_role</code> en el navegador.</p></div><button type="button" onClick={onRetry} className={`${softButton} mt-5`}><RefreshCw size={15} /> Comprobar de nuevo</button></div></div></section>;

const CreateConnectionModal = ({ value, busy, onChange, onClose, onSubmit }: { value: { name: string; mode: ConnectionMode; description: string }; busy: boolean; onChange: (value: { name: string; mode: ConnectionMode; description: string }) => void; onClose: () => void; onSubmit: () => void }) => <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}><section className={`${glassPanel} w-full max-w-xl overflow-hidden bg-white/95 dark:bg-slate-950/95`} role="dialog" aria-modal="true" aria-labelledby="new-propresenter-title"><header className="flex items-start justify-between gap-4 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 px-5 py-5 text-white"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-sky-300">Nueva conexión</p><h2 id="new-propresenter-title" className="mt-1 font-serif text-2xl font-bold">Registrar computadora</h2></div><button type="button" onClick={onClose} className="rounded-xl p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Cerrar"><X size={18} /></button></header><div className="space-y-4 p-5"><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Nombre visible<input value={value.name} onChange={(event) => onChange({ ...value, name: event.target.value })} placeholder="PC Producción · Auditorio" className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-white" /></label><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Modo de salida<select value={value.mode} onChange={(event) => onChange({ ...value, mode: event.target.value as ConnectionMode })} className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-white">{(Object.keys(modeMeta) as ConnectionMode[]).map((mode) => <option key={mode} value={mode}>{modeMeta[mode].label} · {modeMeta[mode].description}</option>)}</select></label><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Descripción opcional<textarea value={value.description} onChange={(event) => onChange({ ...value, description: event.target.value })} rows={3} placeholder="Computadora principal del auditorio…" className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/5 dark:text-white" /></label><div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11px] leading-5 text-amber-800 dark:bg-amber-400/10 dark:text-amber-200"><KeyRound size={15} className="mt-0.5 shrink-0" />Al crearla se generará un código de emparejamiento de un solo uso. El conector local lo utilizará para vincular esta computadora.</div></div><footer className="flex justify-end gap-2 border-t border-slate-200/70 p-4 dark:border-white/10"><button type="button" onClick={onClose} className={softButton}>Cancelar</button><button type="button" disabled={busy || !value.name.trim()} onClick={onSubmit} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-white disabled:opacity-40">{busy && <Loader2 size={14} className="animate-spin" />} Crear conexión</button></footer></section></div>;

export default ProPresenterManager;
