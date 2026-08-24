import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Church, FileText, Heart, Layers3, RefreshCw, Search, Sparkles, X } from 'lucide-react';
import { AnimeFadeUp, AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { supabase } from '../../config/supabase';
import { ChurchAnnouncementsSection } from '../../features/announcements/components/ChurchAnnouncementsSection';
import { fetchPublicChurchAnnouncements } from '../../features/announcements/service';
import type { ChurchAnnouncement } from '../../features/announcements/types';

type OwnerType = 'church' | 'ministry' | 'study_program';
interface PublicSpace { id: string; name: string; slug: string; description: string; owner_type: OwnerType; accent_color: string; cover_image_url: string | null; allow_comments: boolean; document_count: number; }
interface PublicDocument { id: string; space_id: string; title: string; slug: string; excerpt: string; cover_image_url: string | null; published_at: string | null; is_featured: boolean; space: { name: string; slug: string; owner_type: OwnerType; accent_color: string }; }
interface PublicIndex { spaces: PublicSpace[]; recent_documents: PublicDocument[]; }

const ownerMeta: Record<OwnerType, { label: string; icon: typeof Church; color: string }> = {
  church: { label: 'Iglesia general', icon: Church, color: '#C99A49' },
  ministry: { label: 'Ministerio / departamento', icon: Heart, color: '#3B82F6' },
  study_program: { label: 'Programa / formación', icon: BookOpen, color: '#A855F7' },
};
const formatDate = (value: string | null) => value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(new Date(value)) : 'Publicado recientemente';

export default function PublicationsHub() {
  const [index, setIndex] = useState<PublicIndex>({ spaces: [], recent_documents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [owner, setOwner] = useState<'all' | OwnerType>('all');
  const [announcements, setAnnouncements] = useState<ChurchAnnouncement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementsError, setAnnouncementsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_public_editorial_index', { p_limit: 18 });
      if (rpcError) throw rpcError;
      const parsed = data as unknown as Partial<PublicIndex> | null;
      setIndex({ spaces: Array.isArray(parsed?.spaces) ? parsed.spaces as PublicSpace[] : [], recent_documents: Array.isArray(parsed?.recent_documents) ? parsed.recent_documents as PublicDocument[] : [] });
    } catch (loadError: unknown) {
      setError('No pudimos cargar las publicaciones en este momento.');
      console.error('Public editorial index failed', loadError);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, [load]);

  const loadAnnouncements = useCallback(async () => {
    setAnnouncementsLoading(true);
    setAnnouncementsError(null);
    try {
      setAnnouncements(await fetchPublicChurchAnnouncements(6));
    } catch (loadError) {
      console.error('No se pudieron cargar los anuncios desde publicaciones:', loadError);
      setAnnouncementsError('Los anuncios no están disponibles temporalmente.');
    } finally {
      setAnnouncementsLoading(false);
    }
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => { void loadAnnouncements(); }, 0); return () => window.clearTimeout(timer); }, [loadAnnouncements]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSpaces = useMemo(() => index.spaces.filter((space) => {
    const matchesOwner = owner === 'all' || space.owner_type === owner;
    const matchesSearch = !normalizedQuery || `${space.name} ${space.description}`.toLowerCase().includes(normalizedQuery);
    return matchesOwner && matchesSearch;
  }), [index.spaces, normalizedQuery, owner]);
  const filteredDocuments = useMemo(() => index.recent_documents.filter((document) => {
    const matchesOwner = owner === 'all' || document.space.owner_type === owner;
    const matchesSearch = !normalizedQuery || `${document.title} ${document.excerpt} ${document.space.name}`.toLowerCase().includes(normalizedQuery);
    return matchesOwner && matchesSearch;
  }), [index.recent_documents, normalizedQuery, owner]);
  const totalDocuments = index.spaces.reduce((sum, space) => sum + space.document_count, 0);

  return <main className="min-h-screen bg-slate-50 pb-24 text-slate-950 dark:bg-[#030817] dark:text-white">
    <section className="relative isolate overflow-hidden bg-[#07132f] px-4 pb-16 pt-20 text-white sm:px-6 lg:px-8"><div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-amber-400/15 blur-3xl" /><div className="absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" /><div className="relative mx-auto max-w-7xl"><AnimeFadeUp><div className="max-w-3xl"><span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-amber-200 backdrop-blur-xl"><Sparkles size={14} /> Centro editorial</span><h1 className="mt-6 font-serif text-4xl font-black leading-tight sm:text-6xl">Historias que acompañan el camino</h1><p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">Devocionales, guías, noticias y bitácoras creadas por la Iglesia Jerusalén y sus ministerios.</p></div></AnimeFadeUp><div className="mt-10 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"><Metric label="Espacios" value={index.spaces.length} /><Metric label="Publicaciones" value={totalDocuments} /><Metric label="Ministerios" value={index.spaces.filter((space) => space.owner_type === 'ministry').length} /><Metric label="Actualizado" value="Vivo" /></div></div></section>
    <section className="relative z-10 mx-auto -mt-7 max-w-5xl px-4 sm:px-6"><div className="rounded-3xl border border-white/70 bg-white/80 p-3 shadow-xl backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80"><div className="relative"><Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar espacios, artículos o devocionales…" className="h-14 w-full rounded-2xl border border-slate-200 bg-white/80 pl-11 pr-11 text-sm outline-none focus:border-amber-400 dark:border-white/10 dark:bg-white/5 dark:text-white" />{query && <button type="button" onClick={() => setQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" aria-label="Limpiar búsqueda"><X size={17} /></button>}</div><div className="mt-3 flex flex-wrap gap-2">{([['all', 'Todo'], ['church', 'Iglesia general'], ['ministry', 'Ministerios / departamentos'], ['study_program', 'Programas / formación']] as Array<['all' | OwnerType, string]>).map(([key, label]) => <button key={key} type="button" onClick={() => setOwner(key)} className={`rounded-full px-4 py-2 text-xs font-black transition ${owner === key ? 'bg-[#0b2a68] text-white shadow-lg dark:bg-amber-300 dark:text-slate-950' : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}>{label}</button>)}<button type="button" onClick={() => void load()} className="ml-auto inline-flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 dark:border-white/10 dark:text-slate-300"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Actualizar</button></div></div></section>
    <div className="mx-auto max-w-7xl space-y-16 px-4 pt-16 sm:px-6 lg:px-8">{error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">{error}</div>}{announcementsError ? <div role="status" className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-100">{announcementsError}</div> : <ChurchAnnouncementsSection announcements={announcements} loading={announcementsLoading} limit={3} />}
      <section><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-700 dark:text-amber-300">Explora por comunidad</p><h2 className="mt-2 font-serif text-3xl font-black">Espacios editoriales</h2></div><span className="text-sm text-slate-500">{filteredSpaces.length} disponibles</span></div>{loading ? <SkeletonGrid /> : filteredSpaces.length ? <AnimeStaggerGrid className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredSpaces.map((space) => <SpaceCard key={space.id} space={space} />)}</AnimeStaggerGrid> : <EmptyState label="No encontramos espacios con esos filtros." />}</section>
      <section><div className="mb-7 flex items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-[.18em] text-blue-700 dark:text-amber-300">Lo más reciente</p><h2 className="mt-2 font-serif text-3xl font-black">Publicaciones destacadas</h2></div><FileText className="text-amber-500" /></div>{loading ? <SkeletonGrid /> : filteredDocuments.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredDocuments.map((document) => <DocumentCard key={document.id} document={document} />)}</div> : <EmptyState label="Aún no hay publicaciones públicas para mostrar." />}</section>
    </div>
  </main>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-xl"><span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><strong className="mt-1 block text-lg text-white">{value}</strong></div>; }
function SpaceCard({ space }: { space: PublicSpace }) { const meta = ownerMeta[space.owner_type]; const Icon = meta.icon; return <Link to={`/publicaciones/${space.slug}`} className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5"><div className="relative aspect-[16/8] overflow-hidden bg-[#0b2a68]" style={{ backgroundColor: space.accent_color || meta.color }}>{space.cover_image_url ? <img src={space.cover_image_url} alt={space.name} className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><Icon size={48} className="text-white/40" /> </div>}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" /><span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-slate-950/50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-xl"><Icon size={13} /> {meta.label}</span></div><div className="p-5"><h3 className="font-serif text-xl font-black text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-amber-300">{space.name}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{space.description || 'Un espacio para compartir el camino.'}</p><div className="mt-5 flex items-center justify-between text-xs font-bold text-blue-700 dark:text-amber-300"><span>{space.document_count} publicaciones</span><ArrowRight size={15} className="transition group-hover:translate-x-1" /></div></div></Link>; }
function DocumentCard({ document }: { document: PublicDocument }) { const meta = ownerMeta[document.space.owner_type]; return <Link to={`/publicaciones/${document.space.slug}/${document.id}`} className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5"><div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-blue-950 to-indigo-900">{document.cover_image_url ? <img src={document.cover_image_url} alt={document.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="grid h-full place-items-center"><BookOpen size={42} className="text-white/30" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />{document.is_featured && <span className="absolute right-4 top-4 rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-slate-950">Destacada</span>}</div><div className="p-5"><span className="text-[10px] font-black uppercase tracking-[.16em]" style={{ color: document.space.accent_color || meta.color }}>{document.space.name}</span><h3 className="mt-2 line-clamp-2 font-serif text-xl font-black text-slate-900 group-hover:text-blue-700 dark:text-white dark:group-hover:text-amber-300">{document.title}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{document.excerpt || 'Abre esta publicación para conocer todos los detalles.'}</p><div className="mt-5 flex items-center justify-between text-xs font-bold text-slate-400"><span>{formatDate(document.published_at)}</span><ArrowRight size={15} className="text-blue-700 transition group-hover:translate-x-1 dark:text-amber-300" /></div></div></Link>; }
function SkeletonGrid() { return <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3].map((item) => <div key={item} className="h-72 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5" />)}</div>; }
function EmptyState({ label }: { label: string }) { return <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/50 p-12 text-center text-sm text-slate-500 dark:border-white/15 dark:bg-white/5"><Layers3 className="mx-auto text-slate-300" size={38} /><p className="mt-4">{label}</p></div>; }
