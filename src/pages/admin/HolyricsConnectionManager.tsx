import { useCallback, useEffect, useState } from 'react';
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
} from 'lucide-react';
import { toast } from 'sonner';
import AdminHeader from '../../components/admin/AdminHeader';
import ConnectionInstructions from '../../components/admin/ConnectionInstructions';
import { supabase } from '../../config/supabase';
import { usePermissions } from '../../hooks/usePermissions';

type ConnectionMode = 'local' | 'internet';
type SchemaState = 'ready' | 'missing' | 'unknown';

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

const glassPanel = 'rounded-[1.75rem] border border-white/70 bg-white/80 shadow-[0_24px_80px_-42px_rgba(15,23,42,0.42)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/60';
const softButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white/80 px-3.5 text-xs font-bold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:border-primary/50 dark:hover:text-primary';
const primaryButton = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-xs font-black text-white shadow-lg shadow-primary/20 transition hover:-translate-y-0.5 hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-45';

const isMissingSchemaError = (error: { code?: string; message?: string } | null) => Boolean(
  error && (error.code === 'PGRST205' || /holyrics_connections.*(schema cache|does not exist)/i.test(error.message ?? '')),
);

const isOnline = (value: string | null) => Boolean(value && Date.now() - new Date(value).getTime() < 90_000);

const HolyricsConnectionManager = () => {
  const { hasPermission, isReadOnly } = usePermissions();
  const canView = hasPermission('production', 'view');
  const readOnly = isReadOnly('production');
  const [connections, setConnections] = useState<HolyricsConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState<'internet' | 'local' | null>(null);
  const [schemaState, setSchemaState] = useState<SchemaState>('unknown');
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newConnection, setNewConnection] = useState({ name: '', mode: 'internet' as ConnectionMode, base_url: '' });

  const loadConnections = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('holyrics_connections').select('id,name,mode,base_url,computer_name,app_version,last_seen_at,last_error,is_enabled').order('created_at', { ascending: false });
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
    const timer = window.setTimeout(() => { void loadConnections(); }, 0);
    return () => window.clearTimeout(timer);
  }, [canView, loadConnections]);

  const recordTestStatus = async (mode: ConnectionMode, errorMessage: string | null) => {
    const target = connections.find((connection) => connection.mode === mode);
    if (!target) return;
    const patch = errorMessage ? { last_error: errorMessage } : { last_seen_at: new Date().toISOString(), last_error: null };
    const { error } = await supabase.from('holyrics_connections').update(patch).eq('id', target.id);
    if (error) {
      toast.error(`La prueba funcionó, pero no se pudo guardar su estado: ${error.message}`);
      return;
    }
    setConnections((current) => current.map((connection) => connection.id === target.id ? { ...connection, ...patch } : connection));
  };

  const testInternet = async () => {
    setTesting('internet');
    const { data, error } = await supabase.functions.invoke('holyrics-api', { body: { action: 'GetVersion', transport: 'request' } });
    setTesting(null);
    if (error) {
      await recordTestStatus('internet', error.message);
      toast.error(`No se pudo probar Internet: ${error.message}`);
      return;
    }
    const result = data as { ok?: boolean; error?: string; message?: string } | null;
    if (!result?.ok) {
      await recordTestStatus('internet', result?.message ?? result?.error ?? 'Holyrics devolvió un error.');
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
      const body = await result.json() as { ok?: boolean; error?: string; message?: string };
      if (!result.ok || !body.ok) throw new Error(body.message ?? body.error ?? `HTTP ${result.status}`);
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
    }).select('id,name,mode,base_url,computer_name,app_version,last_seen_at,last_error,is_enabled').single();
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

  if (!canView) return null;

  return (
    <div className="min-h-full space-y-5 pb-10">
      <AdminHeader
        eyebrow="Producción · Integración"
        title="Conexión Holyrics"
        description="Configura, prueba y administra la computadora Holyrics que recibirá letras, textos, cultos y anuncios."
        action={<div className="flex flex-wrap gap-2"><button type="button" className={softButton} onClick={() => void loadConnections()} disabled={loading}><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar</button><button type="button" className={primaryButton} onClick={() => setShowCreate(true)} disabled={readOnly}><Plus size={15} /> Registrar conexión</button></div>}
      />

      <section className="relative overflow-hidden rounded-[2rem] bg-[#07152f] p-5 text-white shadow-[0_28px_90px_-38px_rgba(7,21,47,.8)] sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-24 size-80 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="relative grid gap-6 lg:grid-cols-[1.3fr_.7fr] lg:items-end"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[.2em] text-amber-300"><Wifi size={14} /> Conector Holyrics</div><h2 className="max-w-3xl font-serif text-3xl font-bold tracking-tight sm:text-4xl">Conecta primero. Sincroniza después.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">La conexión se prueba con una respuesta real de Holyrics. Las claves permanecen en el servidor o en el puente local.</p></div><div className="rounded-3xl border border-white/10 bg-white/5 p-4"><div className="flex items-center justify-between text-xs text-slate-300"><span>Destinos registrados</span><Wifi size={16} className="text-emerald-300" /></div><div className="mt-3 flex items-end gap-3"><strong className="text-4xl font-black">{connections.filter((connection) => isOnline(connection.last_seen_at)).length}</strong><span className="pb-1 text-sm text-slate-300">online de {connections.length}</span></div></div></div>
      </section>

      <ConnectionInstructions
        eyebrow="Guía rápida · Holyrics"
        title="Conecta Holyrics paso a paso"
        description="Elige Internet para una conexión remota o Local para la computadora de producción en tu red. No copies tokens dentro del código del navegador."
        steps={[
          { title: 'Activa API Server', description: 'En Holyrics abre Archivo → Configuración → API Server. Crea un token y habilita los permisos necesarios.' },
          { title: 'Registra el destino', description: 'Pulsa Registrar conexión y elige Internet o Puente local. Para Local escribe la URL http://IP:PUERTO/api.' },
          { title: 'Configura las claves', description: 'Internet usa secretos de Supabase. Local usa variables del proceso tools/holyrics-bridge.' },
          { title: 'Prueba la respuesta', description: 'Usa Probar Internet o Probar Local. La prueba llama GetVersion y muestra el error verdadero si falla.' },
          { title: 'Usa Tiempo de Culto', description: 'Cuando aparezca Online, abre Tiempo de Culto para preparar letras, eventos, anuncios y orden del servicio.' },
        ]}
        command={'# Internet\nnpx supabase secrets set HOLYRICS_API_KEY="TU_API_KEY" HOLYRICS_API_TOKEN="TU_TOKEN"\nnpx supabase functions deploy holyrics-api\n\n# Local\n$env:HOLYRICS_LOCAL_API_URL="http://IP_DEL_COMPUTADOR:PUERTO/api"\n$env:HOLYRICS_LOCAL_TOKEN="TOKEN_DE_HOLYRICS"\ncd tools/holyrics-bridge\nnpm start'}
        commandLabel="Comandos de configuración"
        helpUrl="https://github.com/holyrics/API-Server/blob/main/README-en.md"
        helpLabel="Documentación Holyrics"
        note="Para Local, el puente debe ejecutarse en la computadora que pueda alcanzar el API Server de Holyrics. Para Internet, configura los secretos en la misma instancia de Supabase donde está desplegada holyrics-api."
      />

      {schemaState === 'missing' && <section className={`${glassPanel} flex flex-wrap items-center justify-between gap-4 border-amber-200 bg-amber-50 p-5 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200`}><div className="flex items-start gap-3"><AlertTriangle className="mt-0.5 shrink-0" size={18} /><div><strong>Falta activar la tabla de conexiones.</strong><p className="mt-1 text-xs">Aplica `20260816130000_worship_planner_and_holyrics.sql` y vuelve a actualizar.</p></div></div><button type="button" className={softButton} onClick={() => void loadConnections()}><RefreshCw size={14} /> Comprobar de nuevo</button></section>}
      {schemaState === 'unknown' && schemaError && <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-500/30 dark:bg-red-950/20 dark:text-red-200"><div className="flex items-start gap-3"><AlertTriangle size={18} /><div><strong>No se pudieron cargar las conexiones.</strong><p className="mt-1 text-xs">{schemaError}</p></div></div></section>}

      <section className={`${glassPanel} p-5 sm:p-6`}><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Destinos Holyrics</p><h3 className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Conexiones registradas</h3></div><a href="/admin/tiempo-de-culto" className={softButton}><ExternalLink size={14} /> Abrir Tiempo de Culto</a></div><div className="mt-5 grid gap-3 lg:grid-cols-2">{connections.map((connection) => { const online = isOnline(connection.last_seen_at); return <article key={connection.id} className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 dark:border-white/10 dark:bg-white/[.03]"><div className="flex items-start gap-3"><span className={`grid size-11 shrink-0 place-items-center rounded-2xl ${online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300'}`}>{online ? <Wifi size={20} /> : <WifiOff size={20} />}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="truncate text-sm font-black text-slate-800 dark:text-white">{connection.name}</h4><span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase ${online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-400'}`}>{online ? 'Online' : 'Pendiente'}</span></div><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{connection.mode === 'local' ? connection.base_url ?? 'Puente local' : 'API por Internet'}</p></div><button type="button" onClick={() => void removeConnection(connection)} disabled={readOnly} className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-30" aria-label={`Eliminar ${connection.name}`}><X size={15} /></button></div>{connection.last_error && <p className="mt-3 rounded-xl bg-red-50 p-2.5 text-[11px] text-red-700 dark:bg-red-400/10 dark:text-red-300">{connection.last_error}</p>}</article>; })}{!loading && connections.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-white/15"><WifiOff className="mx-auto text-slate-400" size={25} /><p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-200">Todavía no hay conexiones registradas.</p><button type="button" className="mt-3 text-xs font-black text-primary" onClick={() => setShowCreate(true)} disabled={readOnly}>Registrar la primera</button></div>}</div><div className="mt-5 flex flex-wrap gap-2"><button type="button" className={softButton} onClick={() => void testInternet()} disabled={testing !== null}><Send size={14} /> {testing === 'internet' ? 'Probando Internet…' : 'Probar Internet'}</button><button type="button" className={softButton} onClick={() => void testLocal()} disabled={testing !== null}><Wifi size={14} /> {testing === 'local' ? 'Probando Local…' : 'Probar Local'}</button></div></section>

      {showCreate && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4 backdrop-blur-sm"><section className={`${glassPanel} w-full max-w-md bg-white/95 p-6 dark:bg-slate-950/95`} role="dialog" aria-modal="true" aria-labelledby="holyrics-create-title"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Nuevo destino</p><h2 id="holyrics-create-title" className="mt-1 font-serif text-2xl font-bold text-slate-900 dark:text-white">Registrar conexión</h2></div><button type="button" onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-700 dark:hover:text-white" aria-label="Cerrar"><X size={19} /></button></div><div className="mt-5 space-y-4"><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Nombre<input value={newConnection.name} onChange={(event) => setNewConnection((current) => ({ ...current, name: event.target.value }))} placeholder="Holyrics · Producción" className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" /></label><label className="block text-xs font-bold text-slate-600 dark:text-slate-300">Método<select value={newConnection.mode} onChange={(event) => setNewConnection((current) => ({ ...current, mode: event.target.value as ConnectionMode }))} className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white"><option value="internet">API por Internet</option><option value="local">Puente local</option></select></label>{newConnection.mode === 'local' && <label className="block text-xs font-bold text-slate-600 dark:text-slate-300">URL del API Server<input value={newConnection.base_url} onChange={(event) => setNewConnection((current) => ({ ...current, base_url: event.target.value }))} placeholder="http://192.168.1.50:50001/api" className="mt-2 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-primary dark:border-white/10 dark:bg-white/5 dark:text-white" /></label>}<p className="text-xs leading-5 text-slate-500">El token no se guarda en esta página. Internet usa secretos y Local usa variables del puente.</p></div><div className="mt-6 flex justify-end gap-2"><button type="button" className={softButton} onClick={() => setShowCreate(false)}>Cancelar</button><button type="button" className={primaryButton} onClick={() => void saveConnection()} disabled={busy}>{busy ? <Loader2 className="animate-spin" size={15} /> : <CheckCircle2 size={15} />} Guardar conexión</button></div></section></div>}
    </div>
  );
};

export default HolyricsConnectionManager;
