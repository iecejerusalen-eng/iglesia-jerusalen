import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import { usePermissions } from '../../../hooks/usePermissions';
import { toast } from 'sonner';

import { followupLabels, type Followup } from '../followup';
export default function FollowupEditor({ request, onSaved }: { request: Followup; onSaved: () => void }) {
  const { hasPermission } = usePermissions(); const canEdit = hasPermission('chat', 'edit');
  const [owner, setOwner] = useState(request.assigned_to ?? ''); const [stage, setStage] = useState(request.followup_stage);
  const [due, setDue] = useState(request.followup_due_at ? new Date(Date.parse(request.followup_due_at) - new Date(request.followup_due_at).getTimezoneOffset() * 60000).toISOString().slice(0,16) : '');
  const [notes, setNotes] = useState(request.followup_notes); const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const owners = useQuery({ queryKey: ['contact-assignees'], queryFn: async () => { const r = await supabase.rpc('contact_followup_assignees'); if (r.error) throw r.error; return r.data as { id: string; label: string }[]; } });
  const history = useQuery({ queryKey: ['contact-followup-history', request.id, request.followup_revision], queryFn: async () => { const r = await supabase.from('contact_followup_history').select('id,stage,created_at').eq('contact_id',request.id).order('created_at',{ascending:false}).limit(10); if (r.error) throw r.error; return r.data; } });
  const save = async () => {
    if (!canEdit) return;
    setBusy(true); setError(null);
    try {
      const r = await supabase.from('contact_messages').update({ assigned_to: owner || null, followup_stage: stage, followup_due_at: due ? new Date(due).toISOString() : null, followup_notes: notes.trim() }).eq('id', request.id).eq('followup_revision',request.followup_revision).select('id').maybeSingle();
      if (r.error) throw r.error;
      if (!r.data) throw new Error('Otro responsable actualizó este seguimiento. Cierra y recarga antes de guardar.');
      toast.success('Seguimiento guardado.'); onSaved();
    } catch (e) { console.error('No se pudo guardar seguimiento',e); setError(e instanceof Error ? e.message : 'No se pudo guardar el seguimiento.'); } finally { setBusy(false); }
  };
  const input = '[color-scheme:light] dark:[color-scheme:dark] mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-white/15 dark:bg-slate-950';
  return <section className="mt-5 border-t border-slate-200 pt-4 dark:border-white/15"><h3 className="font-bold">Responsable y siguiente paso</h3><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Recordatorio interno en Inicio; no envía correos ni WhatsApp.</p>{error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}{owners.isError && <p role="alert" className="text-sm">No se pudo cargar la lista de responsables. <button onClick={() => void owners.refetch()} className="min-h-11 underline">Reintentar</button></p>}<fieldset disabled={!canEdit || busy} className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm">Responsable<select value={owner} onChange={e=>setOwner(e.target.value)} className={input}><option value="">Sin asignar</option>{owner && !owners.data?.some(item=>item.id===owner) && <option value={owner}>Responsable actual</option>}{owners.data?.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="text-sm">Etapa<select value={stage} onChange={e=>setStage(e.target.value)} className={input}>{Object.entries(followupLabels).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label><label className="text-sm sm:col-span-2">Recordar el<input type="datetime-local" value={due} onChange={e=>setDue(e.target.value)} className={input}/></label><details className="sm:col-span-2"><summary className="min-h-11 cursor-pointer text-sm font-semibold">Notas internas opcionales</summary><label className="block text-sm">Nota<textarea maxLength={2000} value={notes} onChange={e=>setNotes(e.target.value)} className={`${input} py-2`} rows={3}/></label></details></fieldset>{canEdit && <button disabled={busy} onClick={()=>void save()} className="mt-3 min-h-11 rounded-xl bg-blue-700 px-4 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar seguimiento'}</button>}<details className="mt-3"><summary className="min-h-11 cursor-pointer text-sm">Historial de seguimiento</summary>{history.isError ? <p role="alert">No se pudo cargar el historial.</p> : history.isPending ? <p>Cargando…</p> : <ul className="space-y-2 text-xs">{history.data?.map(item=><li key={item.id}>{new Date(item.created_at).toLocaleString('es-EC')} · {followupLabels[item.stage] ?? item.stage}</li>)}{history.data?.length===0 && <li>Aún no hay cambios registrados.</li>}</ul>}</details></section>;
}
