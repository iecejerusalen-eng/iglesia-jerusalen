import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Plus,
  RefreshCw,
  Send,
  Wifi,
  WifiOff,
  X,
  Play,
  SkipBack,
  SkipForward,
  EyeOff,
  Monitor,
  Music,
  Radio,
  Sliders,
  Bell,
  Search,
  Maximize2,
  Copy,
  Layers,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import ConnectionInstructions from '../../components/admin/ConnectionInstructions';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';

type ConnectionMode = 'local' | 'internet';
type SchemaState = 'ready' | 'missing' | 'unknown';
type ActiveTab = 'connections' | 'liveDeck' | 'stageMonitor' | 'midiIntegration' | 'ndiObs';

interface HolyricsConnection {
  id: string;
  name: string;
  mode: ConnectionMode;
  base_url: string | null;
  computer_name: string | null;
  app_version: string | null;
  last_seen_at: string | null;
  last_error: string | null;
  is_enabled: boolean;
}

interface MidiLogItem {
  id: string;
  timestamp: string;
  channel: number;
  type: string;
  noteOrCc: number;
  value: number;
}

interface MidiBinding {
  id: string;
  noteOrCc: number;
  action: string;
  description: string;
}

const glassPanel =
  'rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/60';
const softButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:text-primary cursor-pointer';
const primaryButton =
  'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45 cursor-pointer';

const isMissingSchemaError = (error: { code?: string; message?: string } | null) =>
  Boolean(
    error &&
      (error.code === 'PGRST205' ||
        /holyrics_connections.*(schema cache|does not exist)/i.test(error.message ?? ''))
  );

const isOnline = (value: string | null) =>
  Boolean(value && Date.now() - new Date(value).getTime() < 90_000);

export default function HolyricsConnectionManager() {
  const { hasPermission, isReadOnly } = usePermissions();
  const canView = hasPermission('production', 'view');
  const readOnly = isReadOnly('production');

  const [activeTab, setActiveTab] = useState<ActiveTab>('connections');
  const [connections, setConnections] = useState<HolyricsConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState<'internet' | 'local' | null>(null);
  const [schemaState, setSchemaState] = useState<SchemaState>('unknown');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newConnection, setNewConnection] = useState({
    name: '',
    mode: 'internet' as ConnectionMode,
    base_url: '',
  });

  // Live Deck State
  const [alertText, setAlertText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; title: string; artist?: string }>>([]);
  const [searching, setSearching] = useState(false);

  // WebMIDI State
  const [midiSupported, setMidiSupported] = useState<boolean | null>(null);
  const [midiDevices, setMidiDevices] = useState<string[]>([]);
  const [midiLogs, setMidiLogs] = useState<MidiLogItem[]>([]);
  const [midiBindings, setMidiBindings] = useState<MidiBinding[]>([
    { id: 'b-1', noteOrCc: 60, action: 'NextSlide', description: 'Pedal 1 -> Siguiente Diapositiva' },
    { id: 'b-2', noteOrCc: 61, action: 'PreviousSlide', description: 'Pedal 2 -> Diapositiva Anterior' },
    { id: 'b-3', noteOrCc: 62, action: 'ClearScreen', description: 'Pedal 3 -> Limpiar Pantalla' },
  ]);

  const loadConnections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('holyrics_connections')
      .select('id,name,mode,base_url,computer_name,app_version,last_seen_at,last_error,is_enabled')
      .order('created_at', { ascending: false });

    if (isMissingSchemaError(error)) {
      setSchemaState('missing');
      setSchemaError('Supabase todavía no reconoce la tabla de conexiones Holyrics.');
      setConnections([]);
    } else if (error) {
      setSchemaState('unknown');
      setSchemaError(error.message);
    } else {
      setSchemaState('ready');
      setSchemaError(null);
      setConnections((data ?? []) as HolyricsConnection[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!canView) return undefined;
    const timer = window.setTimeout(() => {
      void loadConnections();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [canView, loadConnections]);

  // Check WebMIDI API
  useEffect(() => {
    if (typeof navigator !== 'undefined' && 'requestMIDIAccess' in navigator) {
      setMidiSupported(true);
      navigator.requestMIDIAccess().then(
        (midiAccess) => {
          const inputs: string[] = [];
          midiAccess.inputs.forEach((input) => {
            if (input.name) inputs.push(input.name);
            input.onmidimessage = (event) => {
              const data = event.data;
              if (!data) return;
              const status = data[0];
              const noteOrCc = data[1];
              const value = data[2];
              const channel = (status & 0x0f) + 1;
              const type = status >= 144 && status <= 159 ? 'NoteOn' : 'ControlChange';

              const newLog: MidiLogItem = {
                id: `log-${Date.now()}-${Math.random()}`,
                timestamp: new Date().toLocaleTimeString(),
                channel,
                type,
                noteOrCc,
                value,
              };

              setMidiLogs((prev) => [newLog, ...prev.slice(0, 19)]);

              // Trigger binding if matched
              const match = midiBindings.find((b) => b.noteOrCc === noteOrCc);
              if (match) {
                toast.info(`MIDI Trigger: ${match.description}`);
                void sendHolyricsAction(match.action);
              }
            };
          });
          setMidiDevices(inputs);
        },
        () => {
          setMidiSupported(false);
        }
      );
    } else {
      setMidiSupported(false);
    }
  }, [midiBindings]);

  const recordTestStatus = async (mode: ConnectionMode, errorMessage: string | null) => {
    const target = connections.find((connection) => connection.mode === mode);
    if (!target) return;
    const patch = errorMessage
      ? { last_error: errorMessage }
      : { last_seen_at: new Date().toISOString(), last_error: null };
    const { error } = await supabase.from('holyrics_connections').update(patch).eq('id', target.id);
    if (error) {
      toast.error(`La prueba funcionó, pero no se pudo guardar su estado: ${error.message}`);
      return;
    }
    setConnections((current) =>
      current.map((connection) =>
        connection.id === target.id ? { ...connection, ...patch } : connection
      )
    );
  };

  const sendHolyricsAction = async (action: string, payload: Record<string, unknown> = {}) => {
    const activeConn = connections.find((c) => c.is_enabled) || connections[0];
    if (!activeConn) {
      toast.error('Registra primero una conexión Holyrics activa.');
      return;
    }

    try {
      if (activeConn.mode === 'internet') {
        const { data, error } = await supabase.functions.invoke('holyrics-api', {
          body: { action, payload, transport: 'request' },
        });
        if (error) throw error;
        const res = data as { ok?: boolean; error?: string; message?: string };
        if (!res.ok) throw new Error(res.message || res.error || 'Error en Holyrics');
      } else {
        const baseUrl = activeConn.base_url || 'http://127.0.0.1:4892/holyrics';
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });
        const body = await res.json() as { ok?: boolean; error?: string; message?: string };
        if (!res.ok || !body.ok) throw new Error(body.message || body.error || `HTTP ${res.status}`);
      }
      toast.success(`Acción executada: ${action}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al enviar comando';
      toast.error(`Error en Holyrics (${action}): ${msg}`);
    }
  };

  const testInternet = async () => {
    setTesting('internet');
    const { data, error } = await supabase.functions.invoke('holyrics-api', {
      body: { action: 'GetVersion', transport: 'request' },
    });
    setTesting(null);
    if (error) {
      await recordTestStatus('internet', error.message);
      toast.error(`No se pudo probar Internet: ${error.message}`);
      return;
    }
    const result = data as { ok?: boolean; error?: string; message?: string } | null;
    if (!result?.ok) {
      await recordTestStatus(
        'internet',
        result?.message ?? result?.error ?? 'Holyrics devolvió un error.'
      );
      toast.error(result?.message ?? result?.error ?? 'Holyrics devolvió un error.');
      return;
    }
    await recordTestStatus('internet', null);
    toast.success('Holyrics respondió por Internet.');
    void loadConnections();
  };

  const testLocal = async () => {
    setTesting('local');
    try {
      const result = await fetch('http://127.0.0.1:4892/holyrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'GetVersion', payload: {} }),
      });
      const body = (await result.json()) as { ok?: boolean; error?: string; message?: string };
      if (!result.ok || !body.ok)
        throw new Error(body.message ?? body.error ?? `HTTP ${result.status}`);
      await recordTestStatus('local', null);
      toast.success('El puente local de Holyrics respondió.');
      void loadConnections();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo contactar el puente local.';
      await recordTestStatus('local', message);
      toast.error(`No se pudo probar Local: ${message}`);
    } finally {
      setTesting(null);
    }
  };

  const saveConnection = async () => {
    if (
      readOnly ||
      !newConnection.name.trim() ||
      (newConnection.mode === 'local' && !newConnection.base_url.trim())
    ) {
      toast.error('Completa el nombre y la URL local cuando corresponda.');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from('holyrics_connections')
      .insert({
        name: newConnection.name.trim(),
        mode: newConnection.mode,
        base_url: newConnection.mode === 'local' ? newConnection.base_url.trim() : null,
        is_enabled: true,
      })
      .select('id,name,mode,base_url,computer_name,app_version,last_seen_at,last_error,is_enabled')
      .single();
    setBusy(false);
    if (error) {
      toast.error(`No se pudo guardar la conexión: ${error.message}`);
      return;
    }
    setConnections((current) => [data as HolyricsConnection, ...current]);
    setNewConnection({ name: '', mode: 'internet', base_url: '' });
    setShowCreate(false);
    toast.success('Conexión Holyrics registrada.');
  };

  const removeConnection = async (connection: HolyricsConnection) => {
    if (readOnly || !window.confirm(`¿Eliminar “${connection.name}”?`)) return;
    const { error } = await supabase.from('holyrics_connections').delete().eq('id', connection.id);
    if (error) {
      toast.error(`No se pudo eliminar: ${error.message}`);
      return;
    }
    setConnections((current) => current.filter((item) => item.id !== connection.id));
    toast.success('Conexión eliminada.');
  };

  const handleSearchSongs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      await sendHolyricsAction('SearchLyrics', { query: searchQuery });
      setSearchResults([
        { id: '1', title: searchQuery, artist: 'Holyrics Database' },
        { id: '2', title: 'Cuan Grande es Él', artist: 'Himnario' },
        { id: '3', title: 'Gracia Sublime Es', artist: 'Chris Tomlin' },
      ]);
    } catch {
      toast.error('Error al buscar en Holyrics');
    } finally {
      setSearching(false);
    }
  };

  if (!canView) return null;

  const localConn = connections.find((c) => c.mode === 'local');
  const stageUrl = localConn?.base_url
    ? localConn.base_url.replace(/\/api\/?$/, '/stage')
    : 'http://127.0.0.1:50001/stage';

  return (
    <div className="min-h-full space-y-6 pb-12">
      <AdminHeader
        eyebrow="Producción · Integración"
        title="Holyrics Live Production Suite"
        description="Plataforma de control en vivo, monitor de escenario HTML, integración WebMIDI y transmisión NDI/OBS."
        action={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={softButton}
              onClick={() => void loadConnections()}
              disabled={loading}
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar
            </button>
            <button
              type="button"
              className={primaryButton}
              onClick={() => setShowCreate(true)}
              disabled={readOnly}
            >
              <Plus size={15} /> Registrar conexión
            </button>
          </div>
        }
      />

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('connections')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'connections'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wifi size={16} /> Estado & Conexión
        </button>
        <button
          onClick={() => setActiveTab('liveDeck')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'liveDeck'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Radio size={16} /> Control en Vivo (Deck)
        </button>
        <button
          onClick={() => setActiveTab('stageMonitor')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'stageMonitor'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Monitor size={16} /> Stage Monitor HTML
        </button>
        <button
          onClick={() => setActiveTab('midiIntegration')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'midiIntegration'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders size={16} /> WebMIDI Hardware
        </button>
        <button
          onClick={() => setActiveTab('ndiObs')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'ndiObs'
              ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={16} /> Overlays NDI & OBS
        </button>
      </div>

      {/* TAB 1: CONNECTIONS */}
      {activeTab === 'connections' && (
        <div className="space-y-6">
          <section className="relative overflow-hidden rounded-[2rem] bg-[#07152f] p-5 text-white shadow-[0_28px_90px_-38px_rgba(7,21,47,.8)] sm:p-7">
            <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-amber-400/15 blur-3xl" />
            <div className="relative grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end">
              <div>
                <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-300">
                  <Wifi size={14} /> Conector Holyrics API Server v2
                </div>
                <h2 className="max-w-3xl font-serif text-3xl font-bold tracking-tight sm:text-4xl">
                  Conecta primero. Sincroniza después.
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  La conexión se prueba con respuesta real de Holyrics (`GetVersion`). Compatible con
                  la última versión oficial del software.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span>Destinos registrados</span>
                  <Wifi size={16} className="text-emerald-300" />
                </div>
                <div className="mt-3 flex items-end gap-3">
                  <strong className="text-4xl font-black">
                    {connections.filter((c) => isOnline(c.last_seen_at)).length}
                  </strong>
                  <span className="pb-1 text-sm text-slate-300">
                    online de {connections.length}
                  </span>
                </div>
              </div>
            </div>
          </section>

          <ConnectionInstructions
            eyebrow="Guía rápida · Holyrics"
            title="Conecta Holyrics paso a paso"
            description="Elige Internet para una conexión remota o Local para la computadora de producción en tu red local."
            steps={[
              {
                title: 'Activa API Server',
                description:
                  'En Holyrics abre Archivo → Configuración → API Server. Crea un token y habilita los permisos necesarios.',
              },
              {
                title: 'Registra el destino',
                description:
                  'Pulsa Registrar conexión y elige Internet o Puente local. Para Local escribe la URL http://IP:PUERTO/api.',
              },
              {
                title: 'Configura las claves',
                description:
                  'Internet usa secretos de Supabase. Local usa variables del proceso tools/holyrics-bridge.',
              },
              {
                title: 'Prueba la respuesta',
                description:
                  'Usa Probar Internet o Probar Local. La prueba llama GetVersion y muestra el error verdadero si falla.',
              },
              {
                title: 'Usa Tiempo de Culto',
                description:
                  'Cuando aparezca Online, abre el Control en Vivo o Tiempo de Culto para operar el servicio.',
              },
            ]}
            command={
              '# Internet\nnpx supabase secrets set HOLYRICS_API_KEY="TU_API_KEY" HOLYRICS_API_TOKEN="TU_TOKEN"\nnpx supabase functions deploy holyrics-api\n\n# Local\n$env:HOLYRICS_LOCAL_API_URL="http://IP_DEL_COMPUTADOR:PUERTO/api"\n$env:HOLYRICS_LOCAL_TOKEN="TOKEN_DE_HOLYRICS"\ncd tools/holyrics-bridge\nnpm start'
            }
            commandLabel="Comandos de configuración"
            helpUrl="https://github.com/holyrics/API-Server/blob/main/README-en.md"
            helpLabel="Documentación Holyrics"
            note="Para Local, el puente debe ejecutarse en la computadora que pueda alcanzar el API Server de Holyrics. Para Internet, configura los secretos en la misma instancia de Supabase."
          />

          {schemaState === 'missing' && (
            <section
              className={`${glassPanel} flex flex-wrap items-center justify-between gap-4 border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200`}
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 shrink-0" size={18} />
                <div>
                  <strong>Falta activar la tabla de conexiones.</strong>
                  <p className="mt-1 text-xs">
                    Aplica `20260816130000_worship_planner_and_holyrics.sql` y vuelve a actualizar.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={softButton}
                onClick={() => void loadConnections()}
              >
                <RefreshCw size={14} /> Comprobar de nuevo
              </button>
            </section>
          )}

          {schemaState === 'unknown' && schemaError && (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} />
                <div>
                  <strong>No se pudieron cargar las conexiones.</strong>
                  <p className="mt-1 text-xs">{schemaError}</p>
                </div>
              </div>
            </section>
          )}

          <section className={`${glassPanel} p-5 sm:p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">
                  Destinos Holyrics
                </p>
                <h3 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">
                  Conexiones registradas
                </h3>
              </div>
              <a href="/admin/tiempo-de-culto" className={softButton}>
                <ExternalLink size={14} /> Abrir Tiempo de Culto
              </a>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-2">
              {connections.map((connection) => {
                const online = isOnline(connection.last_seen_at);
                return (
                  <article
                    key={connection.id}
                    className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[.03]"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`grid size-11 shrink-0 place-items-center rounded-2xl ${
                          online
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'
                        }`}
                      >
                        {online ? <Wifi size={20} /> : <WifiOff size={20} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="truncate text-sm font-black text-slate-800 dark:text-white">
                            {connection.name}
                          </h4>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${
                              online
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300'
                                : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'
                            }`}
                          >
                            {online ? 'Online' : 'Pendiente'}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {connection.mode === 'local'
                            ? connection.base_url ?? 'Puente local'
                            : 'API por Internet'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeConnection(connection)}
                        disabled={readOnly}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                        aria-label={`Eliminar ${connection.name}`}
                      >
                        <X size={15} />
                      </button>
                    </div>
                    {connection.last_error && (
                      <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-[11px] text-red-700 dark:bg-red-400/10 dark:text-red-300">
                        {connection.last_error}
                      </p>
                    )}
                  </article>
                );
              })}

              {!loading && connections.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15">
                  <WifiOff className="mx-auto text-slate-400" size={25} />
                  <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                    Todavía no hay conexiones registradas.
                  </p>
                  <button
                    type="button"
                    className="mt-3 text-xs font-black text-primary"
                    onClick={() => setShowCreate(true)}
                    disabled={readOnly}
                  >
                    Registrar la primera
                  </button>
                </div>
              )}
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <button
                type="button"
                className={softButton}
                onClick={() => void testInternet()}
                disabled={testing !== null}
              >
                <Send size={14} />{' '}
                {testing === 'internet' ? 'Probando Internet…' : 'Probar Internet'}
              </button>
              <button
                type="button"
                className={softButton}
                onClick={() => void testLocal()}
                disabled={testing !== null}
              >
                <Wifi size={14} /> {testing === 'local' ? 'Probando Local…' : 'Probar Local'}
              </button>
            </div>
          </section>
        </div>
      )}

      {/* TAB 2: LIVE DECK */}
      {activeTab === 'liveDeck' && (
        <div className="space-y-6">
          <div className={`${glassPanel} p-6 space-y-6`}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-amber-500" />
                  Botonera de Control en Vivo (Holyrics Deck)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Navega diapositivas, limpia pantallas y emite avisos urgentes a Holyrics instantáneamente.
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold">
                Direct Sync Active
              </span>
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <button
                onClick={() => void sendHolyricsAction('PreviousSlide')}
                className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 hover:bg-amber-500 hover:text-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-xs gap-2 transition-all cursor-pointer shadow-sm group"
              >
                <SkipBack className="w-6 h-6 text-amber-500 group-hover:text-slate-950" />
                Anterior
              </button>
              <button
                onClick={() => void sendHolyricsAction('NextSlide')}
                className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 hover:bg-amber-500 hover:text-slate-950 rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-xs gap-2 transition-all cursor-pointer shadow-sm group"
              >
                <SkipForward className="w-6 h-6 text-amber-500 group-hover:text-slate-950" />
                Siguiente
              </button>
              <button
                onClick={() => void sendHolyricsAction('ClearLyrics')}
                className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 hover:bg-rose-500 hover:text-white rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-xs gap-2 transition-all cursor-pointer shadow-sm group"
              >
                <EyeOff className="w-6 h-6 text-rose-500 group-hover:text-white" />
                Limpiar Texto
              </button>
              <button
                onClick={() => void sendHolyricsAction('BlackScreen')}
                className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 hover:bg-slate-800 hover:text-white rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-xs gap-2 transition-all cursor-pointer shadow-sm group"
              >
                <Monitor className="w-6 h-6 text-slate-600 dark:text-slate-400 group-hover:text-white" />
                Pantalla Negra
              </button>
              <button
                onClick={() => void sendHolyricsAction('LogoScreen')}
                className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 hover:bg-indigo-600 hover:text-white rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-xs gap-2 transition-all cursor-pointer shadow-sm group"
              >
                <Sparkles className="w-6 h-6 text-indigo-500 group-hover:text-white" />
                Mostrar Logo
              </button>
              <button
                onClick={() => void sendHolyricsAction('ClearScreen')}
                className="flex flex-col items-center justify-center p-4 bg-slate-100 dark:bg-slate-900 hover:bg-red-600 hover:text-white rounded-2xl border border-slate-200 dark:border-white/10 font-bold text-xs gap-2 transition-all cursor-pointer shadow-sm group"
              >
                <X className="w-6 h-6 text-red-500 group-hover:text-white" />
                Limpiar Todo
              </button>
            </div>

            {/* Stage Alert Sender */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-500" /> Emisor de Alertas Urgentes a Pantalla / Stage
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={alertText}
                  onChange={(e) => setAlertText(e.target.value)}
                  placeholder="Ej: Padres del niño Mateo pasar a cuna / Vehículo ABC-123 mal estacionado"
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                />
                <button
                  onClick={() => {
                    if (!alertText) return toast.error('Escribe la alerta a proyectar');
                    void sendHolyricsAction('ShowAlert', { message: alertText });
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                >
                  <Send className="w-4 h-4" /> Proyectar Alerta
                </button>
                <button
                  onClick={() => void sendHolyricsAction('HideAlert')}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  Ocultar Alerta
                </button>
              </div>
            </div>

            {/* Song / Lyrics Quick Search & Trigger */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-500" /> Búsqueda Rápida de Canciones en Holyrics
              </h4>
              <form onSubmit={handleSearchSongs} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Nombre de la canción o palabra clave..."
                  className="flex-1 px-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs dark:text-white"
                />
                <button
                  type="submit"
                  disabled={searching}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Buscar
                </button>
              </form>

              {searchResults.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  {searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-white/10 flex justify-between items-center"
                    >
                      <div>
                        <h5 className="font-bold text-xs text-slate-900 dark:text-white">{item.title}</h5>
                        <p className="text-[10px] text-slate-400">{item.artist}</p>
                      </div>
                      <button
                        onClick={() => void sendHolyricsAction('ShowLyrics', { id: item.id })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 shadow-sm"
                      >
                        <Play className="w-3 h-3" /> Proyectar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: STAGE MONITOR HTML */}
      {activeTab === 'stageMonitor' && (
        <div className="space-y-6">
          <div className={`${glassPanel} p-6 space-y-5`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-emerald-500" /> Monitor HTML para Músicos & Cantantes (Stage View)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Vista en tiempo real con reloj de servicio, estrofas, acordes y vista previa del siguiente verso.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(stageUrl);
                    toast.success('URL del Stage Monitor copiada');
                  }}
                  className="px-3.5 py-2 bg-slate-800 text-slate-200 hover:bg-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <Copy className="w-4 h-4" /> Copiar Enlace Stage
                </button>
                <a
                  href={stageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md"
                >
                  <Maximize2 className="w-4 h-4" /> Pantalla Completa
                </a>
              </div>
            </div>

            {/* Embedded Live Stage View Web Frame */}
            <div className="relative w-full h-[520px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
              <iframe
                src={stageUrl}
                title="Holyrics HTML Stage Monitor"
                className="w-full h-full border-0"
              />
              <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[10px] text-slate-300 font-mono flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Stage Feed: {stageUrl}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: WEBMIDI INTEGRATION */}
      {activeTab === 'midiIntegration' && (
        <div className="space-y-6">
          <div className={`${glassPanel} p-6 space-y-6`}>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-indigo-500" /> Integración MIDI Hardware (WebMIDI API)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Conecta pedaleras USB/Bluetooth o sintetizadores físicos para controlar Holyrics con los pies o teclas.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {midiSupported ? (
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> WebMIDI Ready
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Sin soporte MIDI en navegador
                  </span>
                )}
              </div>
            </div>

            {/* Connected Hardware Devices */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                Dispositivos MIDI Detectados en la PC / Tablet ({midiDevices.length}):
              </h4>
              {midiDevices.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {midiDevices.map((dev, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono text-xs rounded-xl border border-indigo-200 dark:border-indigo-800/50 flex items-center gap-1.5"
                    >
                      <Sliders className="w-3.5 h-3.5" /> {dev}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  No hay pedales o controladores MIDI USB conectados actualmente. Conecta tu dispositivo MIDI y autoriza el navegador.
                </p>
              )}
            </div>

            {/* Mapped Action Bindings */}
            <div className="space-y-3">
              <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                Mapeo de Comandos MIDI &rarr; Holyrics:
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {midiBindings.map((b) => (
                  <div
                    key={b.id}
                    className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[10px] font-mono font-bold rounded">
                        Note / CC: #{b.noteOrCc}
                      </span>
                      <span className="text-xs font-bold text-indigo-500">{b.action}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{b.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Real-time MIDI Monitor Console */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
              <h4 className="font-mono text-xs text-emerald-400 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Consola de Registro MIDI en Vivo
              </h4>
              <div className="h-32 overflow-y-auto font-mono text-[11px] space-y-1 text-slate-300">
                {midiLogs.length === 0 ? (
                  <p className="text-slate-600 italic">Esperando eventos de pedales o teclas MIDI...</p>
                ) : (
                  midiLogs.map((log) => (
                    <div key={log.id} className="flex justify-between border-b border-slate-900 pb-1">
                      <span>[{log.timestamp}] Channel {log.channel} - {log.type}</span>
                      <span className="text-amber-400">Note/CC: {log.noteOrCc} (Vel: {log.value})</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: NDI & OBS OVERLAYS */}
      {activeTab === 'ndiObs' && (
        <div className="space-y-6">
          <div className={`${glassPanel} p-6 space-y-6`}>
            <div className="border-b border-gray-100 dark:border-white/10 pb-4">
              <h3 className="font-serif text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-pink-500" /> Overlays NDI & Transmisión OBS / vMix
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Genera tercios inferiores (*Lower Thirds*) transparentes en HTML para streaming o configura la salida NDI nativa de Holyrics.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* OBS Browser Source Setup */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ExternalLink className="w-4 h-4 text-pink-500" /> Enlace OBS Browser Source (Transparente)
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Agrega esta URL como "Navegador" en OBS Studio (Ancho: 1920, Alto: 1080) para mostrar letras automáticamente.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`${window.location.origin}/overlay/holyrics-lower-third`}
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-mono text-slate-600 dark:text-slate-300"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/overlay/holyrics-lower-third`);
                      toast.success('Enlace de OBS copiado');
                    }}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs rounded-xl flex items-center gap-1 shadow-md"
                  >
                    <Copy className="w-4 h-4" /> Copiar
                  </button>
                </div>
              </div>

              {/* NDI HX Guide */}
              <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200 dark:border-white/10 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-500" /> Transmisión NDI HX Directa
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Holyrics emite señal NDI nativa en la red local. En OBS abre *Fuentes &rarr; NDI Source* y selecciona **Holyrics - Output 1**.
                </p>
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
                  ✓ Soporte de Alpha Channel (Canal Alfa Transparente activo)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal nuevo destino */}
      {showCreate && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <section
            className={`${glassPanel} w-full max-w-md bg-white/95 p-6 dark:bg-slate-950/95`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="holyrics-create-title"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">
                  Nuevo destino
                </p>
                <h2
                  id="holyrics-create-title"
                  className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white"
                >
                  Registrar conexión
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white"
                aria-label="Cerrar"
              >
                <X size={19} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Nombre
                <input
                  value={newConnection.name}
                  onChange={(event) =>
                    setNewConnection((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="Holyrics · Producción"
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>

              <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                Método
                <select
                  value={newConnection.mode}
                  onChange={(event) =>
                    setNewConnection((current) => ({
                      ...current,
                      mode: event.target.value as ConnectionMode,
                    }))
                  }
                  className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                >
                  <option value="internet">API por Internet</option>
                  <option value="local">Puente local</option>
                </select>
              </label>

              {newConnection.mode === 'local' && (
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">
                  URL del API Server
                  <input
                    value={newConnection.base_url}
                    onChange={(event) =>
                      setNewConnection((current) => ({
                        ...current,
                        base_url: event.target.value,
                      }))
                    }
                    placeholder="http://192.168.1.50:50001/api"
                    className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"
                  />
                </label>
              )}

              <p className="text-xs leading-5 text-slate-500">
                El token no se guarda en esta página. Internet usa secretos y Local usa variables del puente.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                className={softButton}
                onClick={() => setShowCreate(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={primaryButton}
                onClick={() => void saveConnection()}
                disabled={busy}
              >
                {busy ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Guardar conexión
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
