import { useCallback, useEffect, useState } from 'react';
import { Megaphone, RefreshCw } from 'lucide-react';
import { fetchPublicChurchAnnouncements } from '../../features/announcements/service';
import { AnnouncementCard } from '../../features/announcements/components/ChurchAnnouncementsSection';
import type { ChurchAnnouncement } from '../../features/announcements/types';

export default function ChurchAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<ChurchAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPublicChurchAnnouncements(12);
      setAnnouncements(data);
    } catch (loadError) {
      console.error('No se pudieron cargar los anuncios de la iglesia:', loadError);
      setError('No pudimos cargar los anuncios en este momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <main className="min-h-screen bg-slate-50 pb-24 text-slate-950 dark:bg-[#030817] dark:text-white">
      <section className="relative isolate overflow-hidden bg-[#07132f] px-4 pb-16 pt-20 text-white sm:px-6 lg:px-8">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" aria-hidden="true" />
        <div id="announcements_hero" className="relative mx-auto max-w-7xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-amber-200"><Megaphone size={14} /> Iglesia Jerusalén</span>
          <h1 className="mt-6 max-w-3xl font-serif text-4xl font-black leading-tight sm:text-6xl">Anuncios importantes</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Comunicados oficiales, actividades especiales y oportunidades para servir juntos como iglesia.</p>
        </div>
      </section>
      <section id="announcements_list" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        {error && <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200"><span>{error}</span><button type="button" onClick={() => { void load(); }} className="inline-flex items-center gap-2 rounded-xl bg-rose-700 px-3 py-2 text-xs font-bold text-white"><RefreshCw size={14} /> Reintentar</button></div>}
        {loading ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-[28rem] animate-pulse rounded-[1.6rem] bg-slate-200 dark:bg-white/5" />)}</div> : announcements.length > 0 ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{announcements.map((announcement) => <AnnouncementCard key={announcement.id} announcement={announcement} />)}</div> : <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/60 p-14 text-center text-slate-500 dark:border-white/15 dark:bg-white/5">Todavía no hay anuncios publicados.</div>}
      </section>
    </main>
  );
}
