import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { BookOpen, ChevronRight, FileText, LockKeyhole, MessageCircle, Sparkles } from 'lucide-react';
import { fetchEditorialSpace, isEditorialSchemaMissing } from '../../features/editorial/service';
import type { EditorialSpaceFeed } from '../../features/editorial/types';

export default function EditorialSpacePage() {
  const { spaceSlug = '' } = useParams<{ spaceSlug: string }>();
  const [feed, setFeed] = useState<EditorialSpaceFeed | null>(null);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => { fetchEditorialSpace(spaceSlug).then((result) => { if (active) setFeed(result); }).catch((error: unknown) => {
      console.error('No se pudo cargar el espacio editorial.', error);
      if (active) setUnavailable(isEditorialSchemaMissing(error as { code?: string; message?: string }));
    }).finally(() => { if (active) setLoading(false); }); }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [spaceSlug]);

  const categories = useMemo(() => new Map(feed?.categories.map((category) => [category.id, category]) ?? []), [feed]);
  if (loading) return <main className="mx-auto min-h-[65vh] max-w-7xl px-4 py-20"><div className="h-80 animate-pulse rounded-[2.5rem] bg-slate-200 dark:bg-white/5" /></main>;
  if (!feed) return <main className="mx-auto min-h-[65vh] max-w-3xl px-4 py-24 text-center"><BookOpen className="mx-auto text-amber-400" size={42} /><h1 className="mt-5 font-serif text-3xl font-bold">{unavailable ? 'La bitácora está preparada' : 'Espacio no encontrado'}</h1><p className="mt-3 text-slate-500">{unavailable ? 'El diseño ya está integrado; falta aplicar la nueva estructura editorial en la base de datos.' : 'Este espacio todavía no está publicado.'}</p></main>;

  return <main className="min-h-screen bg-slate-50 text-slate-950 dark:bg-[#030817] dark:text-white">
    <section className="relative isolate overflow-hidden border-b border-white/10 bg-[#07132f] text-white">
      {feed.space.cover_image_url && <img src={feed.space.cover_image_url} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#030817] via-[#07132f]/95 to-[#07132f]/40" />
      <div className="mx-auto flex min-h-[31rem] max-w-7xl items-end px-4 py-14 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-4 py-2 text-xs font-black uppercase tracking-[.2em] text-amber-200"><Sparkles size={14} /> Espacio editorial</span>
          <h1 className="mt-6 font-serif text-4xl font-bold leading-tight sm:text-6xl">{feed.space.name}</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">{feed.space.description}</p>
          <div className="mt-7 flex flex-wrap gap-3 text-xs text-slate-300"><span className="rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl">{feed.documents.length} publicaciones</span>{feed.space.allow_comments && <span className="flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-xl"><MessageCircle size={14} /> Conversación habilitada</span>}</div>
        </div>
      </div>
    </section>

    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><span className="text-xs font-black uppercase tracking-[.18em] text-blue-700 dark:text-amber-300">Páginas y bitácora</span><h2 className="mt-2 font-serif text-3xl font-bold">Contenido para acompañar el camino</h2></div><span className="text-sm text-slate-500">Público e interno, según cada publicación</span></div>
      {feed.documents.length === 0 ? <div className="rounded-3xl border border-dashed border-slate-300 p-14 text-center text-slate-500 dark:border-white/15">Todavía no hay publicaciones disponibles.</div> : <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">{feed.documents.map((document) => {
        const category = document.category_id ? categories.get(document.category_id) : null;
        return <Link key={document.id} to={`/publicaciones/${feed.space.slug}/${document.id}`} className="group overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-xl transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5">
          <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-blue-950 to-indigo-900">{document.cover_image_url ? <img src={document.cover_image_url} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><FileText size={42} className="text-white/35" /></div>}<div className="absolute inset-0 bg-gradient-to-t from-slate-950/75 via-transparent to-transparent" />{document.is_locked && <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full border border-white/15 bg-slate-950/60 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-xl"><LockKeyhole size={12} /> {document.visibility === 'members' ? 'Integrantes' : document.visibility === 'editors' ? 'Equipo' : 'Protegido'}</span>}</div>
          <div className="p-5">{category && <span className="text-[10px] font-black uppercase tracking-[.16em]" style={{ color: category.color }}>{category.name}</span>}<h3 className="mt-2 font-serif text-xl font-bold group-hover:text-blue-700 dark:group-hover:text-amber-300">{document.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">{document.excerpt}</p><span className="mt-5 flex items-center gap-1 text-xs font-black text-blue-700 dark:text-amber-300">Abrir <ChevronRight size={14} /></span></div>
        </Link>;
      })}</div>}
    </section>
  </main>;
}
