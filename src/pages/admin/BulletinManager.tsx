import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { CalendarDays, Check, Download, FileText, Image as ImageIcon, Loader2, Megaphone, RefreshCw, Save, Send, Sparkles } from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { supabase } from '../../config/supabase';
import { getDefaultBulletinDate, fetchBulletin, generateBulletin, saveBulletin, approveBulletin } from '../../features/bulletins/service';
import type { Bulletin, BulletinDraft } from '../../features/bulletins/types';

const churchAddress = 'Iglesia Jerusalén · Bogotá, Colombia';

const toDraft = (bulletin: Bulletin): BulletinDraft => ({
  fecha_culto: bulletin.fecha_culto,
  titulo_mensaje: bulletin.titulo_mensaje ?? '',
  expositor: bulletin.expositor ?? '',
  versiculo_texto: bulletin.versiculo_texto ?? '',
  versiculo_referencia: bulletin.versiculo_referencia ?? '',
  eventos: bulletin.eventos,
  anuncio_titulo: bulletin.anuncio_titulo ?? '',
  anuncio_descripcion: bulletin.anuncio_descripcion ?? '',
  cumpleaneros: bulletin.cumpleaneros,
  ofrendas_objetivo: bulletin.ofrendas_objetivo ?? '',
  mensaje_pastoral: bulletin.mensaje_pastoral ?? '',
  foto_pastor: bulletin.foto_pastor ?? '',
  estado: bulletin.estado
});

const dateLabel = (value: string) => {
  try { return format(parseISO(value), "EEEE d 'de' MMMM", { locale: es }); } catch { return value; }
};

function BulletinPreview({ draft, square = false, previewRef }: { draft: BulletinDraft; square?: boolean; previewRef?: React.RefObject<HTMLDivElement | null> }) {
  return <div ref={previewRef} className={`bulletin-preview ${square ? 'bulletin-preview--square' : ''}`}>
    <div className="bulletin-preview__topline" />
    <header className="bulletin-preview__header">
      <div className="bulletin-mark">J</div>
      <div><p className="bulletin-kicker">Iglesia Jerusalén</p><p className="bulletin-date">{dateLabel(draft.fecha_culto)}</p></div>
      <span className="bulletin-cross">✦</span>
    </header>
    <main className="bulletin-preview__body">
      {!square && <p className="bulletin-section-label">Mensaje dominical</p>}
      <h1>{draft.titulo_mensaje || 'El mensaje de este domingo'}</h1>
      <p className="bulletin-speaker">{draft.expositor ? `Por ${draft.expositor}` : 'Una palabra para nuestra familia'}</p>
      {draft.versiculo_texto && <blockquote><span>“</span><p>{draft.versiculo_texto}</p><cite>{draft.versiculo_referencia || 'Versículo de la semana'}</cite></blockquote>}
      {!square && draft.mensaje_pastoral && <p className="bulletin-pastoral">{draft.mensaje_pastoral}</p>}
      {draft.anuncio_titulo && <section className="bulletin-highlight"><Megaphone size={16} /><div><strong>{draft.anuncio_titulo}</strong><p>{draft.anuncio_descripcion}</p></div></section>}
      {draft.eventos.length > 0 && <section><p className="bulletin-section-label">Esta semana</p><div className="bulletin-events">{draft.eventos.slice(0, square ? 3 : 6).map((event) => <div className="bulletin-event" key={`${event.id ?? event.nombre}-${event.fecha}`}><span>{format(parseISO(event.fecha), 'EEE', { locale: es })}</span><div><strong>{event.nombre}</strong><small>{event.hora || 'Horario por confirmar'}{event.lugar ? ` · ${event.lugar}` : ''}</small></div></div>)}</div></section>}
      {draft.cumpleaneros.length > 0 && <section className="bulletin-birthdays"><p className="bulletin-section-label">Celebramos sus vidas</p><p>{draft.cumpleaneros.slice(0, square ? 4 : 12).map((birthday) => birthday.nombre).join(' · ')}</p></section>}
    </main>
    <footer className="bulletin-preview__footer"><strong>{churchAddress}</strong><span>iglesiajerusalen.co · @iglesiajerusalen</span></footer>
  </div>;
}

const fieldClass = 'mt-1.5 w-full rounded-2xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none transition focus:border-[#b88a3b] focus:ring-2 focus:ring-[#b88a3b]/15 dark:border-white/10 dark:bg-slate-950 dark:text-white';

export default function BulletinManager() {
  const [selectedDate, setSelectedDate] = useState(getDefaultBulletinDate());
  const [bulletin, setBulletin] = useState<Bulletin | null>(null);
  const [draft, setDraft] = useState<BulletinDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const squareRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const current = await fetchBulletin(date);
      setBulletin(current);
      setDraft(current ? toDraft(current) : null);
    } catch (error) {
      console.error('No se pudo cargar el boletín:', error);
      toast.error(error instanceof Error ? error.message : 'No se pudo cargar el boletín.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(selectedDate); }, 0);
    return () => window.clearTimeout(timer);
  }, [load, selectedDate]);

  useEffect(() => {
    const channel = supabase.channel('boletines-preview').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'boletines' }, (payload) => {
      const next = payload.new as unknown as Bulletin;
      if (next.fecha_culto === selectedDate) { setBulletin(next); setDraft(toDraft(next)); }
    }).subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [selectedDate]);

  const update = <K extends keyof BulletinDraft>(key: K, value: BulletinDraft[K]) => setDraft((current) => current ? { ...current, [key]: value } : current);

  const handleGenerate = async () => {
    setWorking(true);
    try { const generated = await generateBulletin(selectedDate); setBulletin(generated); setDraft(toDraft(generated)); toast.success('Boletín generado con datos actuales.'); }
    catch (error) { console.error('No se pudo generar el boletín:', error); toast.error(error instanceof Error ? error.message : 'No se pudo generar el boletín.'); }
    finally { setWorking(false); }
  };

  const handleSave = async () => {
    if (!bulletin || !draft) return;
    setWorking(true);
    try { const saved = await saveBulletin(bulletin.id, draft); setBulletin(saved); setDraft(toDraft(saved)); toast.success('Borrador guardado.'); }
    catch (error) { console.error('No se pudo guardar el boletín:', error); toast.error(error instanceof Error ? error.message : 'No se pudo guardar.'); }
    finally { setWorking(false); }
  };

  const renderCanvas = async (element: HTMLDivElement, widthScale: number) => html2canvas(element, { scale: widthScale, useCORS: true, backgroundColor: '#f8f4ec' });
  const downloadPdf = async () => { if (!previewRef.current) return; setWorking(true); try { const canvas = await renderCanvas(previewRef.current, 3); const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' }); const ratio = Math.min(138 / canvas.width, 200 / canvas.height); pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 5, 5, canvas.width * ratio, canvas.height * ratio); pdf.save(`boletin-${selectedDate}.pdf`); toast.success('PDF A5 descargado.'); } catch (error) { console.error('No se pudo exportar el PDF:', error); toast.error('No se pudo exportar el PDF.'); } finally { setWorking(false); } };
  const downloadImage = async () => { if (!squareRef.current) return; setWorking(true); try { const canvas = await renderCanvas(squareRef.current, 1); const link = document.createElement('a'); link.download = `boletin-whatsapp-${selectedDate}.png`; link.href = canvas.toDataURL('image/png'); link.click(); toast.success('Imagen para WhatsApp descargada.'); } catch (error) { console.error('No se pudo exportar la imagen:', error); toast.error('No se pudo exportar la imagen.'); } finally { setWorking(false); } };
  const shareWhatsApp = () => { const message = `Boletín dominical · ${dateLabel(selectedDate)}\n${draft?.titulo_mensaje || 'Acompáñanos este domingo'}\n${draft?.expositor ? `Mensaje: ${draft.expositor}\n` : ''}${draft?.versiculo_referencia ? `Versículo: ${draft.versiculo_referencia}\n` : ''}Iglesia Jerusalén`; window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer'); };

  const statusLabel = useMemo(() => bulletin?.estado === 'aprobado' ? 'Aprobado' : 'Borrador en revisión', [bulletin?.estado]);
  if (loading) return <div className="grid min-h-[32rem] place-items-center rounded-3xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900"><Loader2 className="animate-spin text-[#b88a3b]" /></div>;

  return <div className="space-y-6">
    <AdminHeader eyebrow="Comunicación dominical" title="Boletín semanal" description="Revisa, ajusta y aprueba el boletín generado automáticamente." action={<div className="flex flex-wrap items-center gap-2"><label className="sr-only" htmlFor="bulletin-date">Fecha del culto</label><div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-white/10 dark:bg-slate-900"><CalendarDays size={16} className="text-[#b88a3b]" /><input id="bulletin-date" type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="bg-transparent py-2 text-xs font-bold outline-none" /></div><button type="button" onClick={() => { void handleGenerate(); }} disabled={working} className="inline-flex items-center gap-2 rounded-xl bg-[#183b56] px-4 py-2.5 text-xs font-black text-white transition hover:bg-[#102c42] disabled:opacity-60"><RefreshCw size={15} className={working ? 'animate-spin' : ''} /> {bulletin ? 'Regenerar datos' : 'Generar boletín'}</button></div>} />
    {!draft ? <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-dashed border-[#b88a3b]/50 bg-[#fbf7ef] p-10 text-center dark:bg-[#b88a3b]/5"><Sparkles className="mx-auto text-[#b88a3b]" size={28} /><h2 className="mt-4 text-xl font-black text-slate-900 dark:text-white">Aún no hay boletín para esta fecha</h2><p className="mx-auto mt-2 max-w-md text-sm text-slate-500">Genera un borrador con la prédica, eventos, anuncios, cumpleaños y horarios disponibles.</p><button type="button" onClick={() => { void handleGenerate(); }} disabled={working} className="mt-6 rounded-xl bg-[#b88a3b] px-5 py-3 text-sm font-black text-white">Crear borrador automático</button></motion.section> : <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,520px)]">
      <section className="order-2 space-y-5 xl:order-1"><div className="flex items-center justify-between"><div><p className="text-xs font-black uppercase tracking-[0.18em] text-[#b88a3b]">Editor de revisión</p><h2 className="mt-1 text-xl font-black text-slate-900 dark:text-white">Contenido del domingo</h2></div><span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase ${bulletin?.estado === 'aprobado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{statusLabel}</span></div>
        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:grid-cols-2"><label className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">Título del mensaje<input className={fieldClass} value={draft.titulo_mensaje} onChange={(event) => update('titulo_mensaje', event.target.value)} maxLength={150} placeholder="Título de la prédica" /></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Expositor<input className={fieldClass} value={draft.expositor} onChange={(event) => update('expositor', event.target.value)} placeholder="Nombre del expositor" /></label><label className="text-xs font-bold text-slate-600 dark:text-slate-300">Referencia bíblica<input className={fieldClass} value={draft.versiculo_referencia} onChange={(event) => update('versiculo_referencia', event.target.value)} placeholder="Juan 3:16" /></label><label className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">Versículo de la semana<textarea className={fieldClass} rows={3} value={draft.versiculo_texto} onChange={(event) => update('versiculo_texto', event.target.value)} placeholder="Texto del versículo" /></label><label className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">Anuncio destacado<textarea className={fieldClass} rows={3} value={draft.anuncio_descripcion} onChange={(event) => update('anuncio_descripcion', event.target.value)} placeholder={draft.anuncio_titulo || 'No hay anuncio destacado'} /></label><label className="sm:col-span-2 text-xs font-bold text-slate-600 dark:text-slate-300">Mensaje pastoral / horarios<textarea className={fieldClass} rows={3} value={draft.mensaje_pastoral} onChange={(event) => update('mensaje_pastoral', event.target.value)} placeholder="Una bienvenida, horarios o nota pastoral" /></label></div>
        <div className="flex flex-wrap gap-3"><button type="button" onClick={() => { void handleSave(); }} disabled={working} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 transition hover:border-[#b88a3b] dark:border-white/10 dark:bg-slate-900 dark:text-white"><Save size={16} /> Guardar borrador</button><button type="button" onClick={() => { void downloadPdf(); }} disabled={working} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white"><Download size={16} /> Descargar PDF</button><button type="button" onClick={() => { void downloadImage(); }} disabled={working} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-700 dark:border-white/10 dark:bg-slate-900 dark:text-white"><ImageIcon size={16} /> Imagen WhatsApp</button><button type="button" onClick={shareWhatsApp} className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-black text-emerald-700"><Send size={16} /> Compartir enlace</button>{bulletin?.estado !== 'aprobado' && <button type="button" onClick={async () => { if (!bulletin) return; const bulletinId = bulletin.id; setWorking(true); try { const approved = await approveBulletin(bulletinId); setBulletin(approved); setDraft(toDraft(approved)); toast.success('Boletín aprobado.'); } catch (error) { console.error('No se pudo aprobar el boletín:', error); toast.error(error instanceof Error ? error.message : 'No se pudo aprobar.'); } finally { setWorking(false); } }} disabled={working} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-xs font-black text-white"><Check size={16} /> Aprobar boletín</button>}</div>
      </section>
      <section className="order-1 xl:order-2"><div className="sticky top-5 rounded-3xl border border-slate-200 bg-[#ede8de] p-4 shadow-sm dark:border-white/10 dark:bg-slate-800"><div className="mb-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"><span><FileText size={13} className="mr-1 inline" /> Preview A5</span><span>Listo para imprimir</span></div><div className="mx-auto max-w-[520px] overflow-auto rounded-xl shadow-2xl"><BulletinPreview draft={draft} previewRef={previewRef} /></div></div></section>
    </div>}
    {draft && <div ref={squareRef} className="bulletin-whatsapp-capture"><BulletinPreview draft={draft} square /></div>}
  </div>;
}
