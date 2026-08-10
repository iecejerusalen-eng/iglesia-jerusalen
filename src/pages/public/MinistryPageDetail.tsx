import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import {
  AlertCircle,
  ArrowLeft,
  ChevronRight,
  FileText,
  GalleryHorizontalEnd,
  KeyRound,
  Loader2,
  LockKeyhole,
} from 'lucide-react';
import { supabase } from '../../config/supabase';
import BlockRenderer from '../../components/public/BlockRenderer';
import type { Ministry } from '../../types';
import type { MinistryGalleryItem, MinistryPage, MinistryPageContent } from '../../types/ministryPages';
import type { LessonBlock } from '../../components/admin/BlockEditor';

type PublicMinistry = Pick<Ministry, 'id' | 'name' | 'slug' | 'image_url' | 'theme_color'>;

const normalizeContent = (value: unknown): MinistryPageContent => {
  const row = value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
  return {
    content_blocks: Array.isArray(row.content_blocks) ? row.content_blocks as LessonBlock[] : [],
    gallery: Array.isArray(row.gallery) ? row.gallery as MinistryGalleryItem[] : [],
    updated_at: typeof row.updated_at === 'string' ? row.updated_at : null,
  };
};

export default function MinistryPageDetail() {
  const params = useParams();
  const ministrySlug = params.slug || '';
  const requestedPath = params['*'] || '';
  const segments = useMemo(() => requestedPath.split('/').map((part) => decodeURIComponent(part)).filter(Boolean), [requestedPath]);
  const [ministry, setMinistry] = useState<PublicMinistry | null>(null);
  const [pages, setPages] = useState<MinistryPage[]>([]);
  const [page, setPage] = useState<MinistryPage | null>(null);
  const [content, setContent] = useState<MinistryPageContent | null>(null);
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<MinistryGalleryItem | null>(null);

  const fetchContent = useCallback(async (pageId: string, suppliedPassword: string | null) => {
    const { data, error: contentError } = await supabase.rpc('get_ministry_page_content', {
      p_page_id: pageId,
      p_password: suppliedPassword,
    });
    if (contentError) throw contentError;
    setContent(normalizeContent(data));
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      setContent(null);
      setPassword('');
      setPasswordError(null);
      try {
        if (!ministrySlug || segments.length === 0 || segments.length > 4) throw new Error('Página no encontrada.');
        const { data: ministryData, error: ministryError } = await supabase
          .from('ministries')
          .select('id, name, slug, image_url, theme_color')
          .eq('slug', ministrySlug)
          .maybeSingle();
        if (ministryError) throw ministryError;
        if (!ministryData) throw new Error('Ministerio no encontrado.');

        const { data: pageRows, error: pagesError } = await supabase
          .from('ministry_pages')
          .select('*')
          .eq('ministry_id', ministryData.id)
          .eq('status', 'published')
          .order('sort_order', { ascending: true });
        if (pagesError) throw pagesError;

        const publicPages = (pageRows || []) as MinistryPage[];
        let parentId: string | null = null;
        let resolved: MinistryPage | undefined;
        for (const segment of segments) {
          resolved = publicPages.find((candidate) => candidate.parent_id === parentId && candidate.slug === segment);
          if (!resolved) break;
          parentId = resolved.id;
        }
        if (!resolved || resolved.slug !== segments.at(-1)) throw new Error('Página no encontrada.');
        if (cancelled) return;
        setMinistry(ministryData as PublicMinistry);
        setPages(publicPages);
        setPage(resolved);
        if (!resolved.is_password_protected) await fetchContent(resolved.id, null);
      } catch (caughtError: unknown) {
        if (cancelled) return;
        console.error('Error loading ministry subpage:', caughtError);
        setError(caughtError instanceof Error ? caughtError.message : 'No fue posible abrir esta página.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [fetchContent, ministrySlug, segments]);

  const breadcrumbs = useMemo(() => {
    if (!page) return [];
    const result: MinistryPage[] = [];
    let cursor: MinistryPage | undefined = page;
    while (cursor) {
      result.unshift(cursor);
      cursor = cursor.parent_id ? pages.find((candidate) => candidate.id === cursor?.parent_id) : undefined;
    }
    return result;
  }, [page, pages]);

  const children = useMemo(() => pages.filter((candidate) => candidate.parent_id === page?.id).sort((a, b) => a.sort_order - b.sort_order), [page?.id, pages]);
  const pagePath = (target: MinistryPage) => {
    const path: string[] = [];
    let cursor: MinistryPage | undefined = target;
    while (cursor) {
      path.unshift(cursor.slug);
      cursor = cursor.parent_id ? pages.find((candidate) => candidate.id === cursor?.parent_id) : undefined;
    }
    return `/ministerios/${ministrySlug}/${path.join('/')}`;
  };

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!page || password.length < 1) return;
    setUnlocking(true);
    setPasswordError(null);
    try {
      await fetchContent(page.id, password);
      setPassword('');
    } catch (caughtError: unknown) {
      console.error('Protected ministry page unlock failed:', caughtError);
      setPasswordError('La contraseña no es correcta. Inténtalo nuevamente.');
    } finally {
      setUnlocking(false);
    }
  };

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" size={34} /><span className="sr-only">Cargando página</span></div>;
  if (error || !ministry || !page) return <div className="mx-auto max-w-2xl px-4 py-24 text-center"><AlertCircle className="mx-auto text-red-500" size={42} /><h1 className="mt-4 font-serif text-3xl font-bold">Página no disponible</h1><p className="mt-2 text-sm text-slate-500">{error || 'El contenido solicitado no existe o aún no está publicado.'}</p><Link to={`/ministerios/${ministrySlug}`} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-bold text-white"><ArrowLeft size={15} /> Volver al ministerio</Link></div>;

  return (
    <article className="pb-20">
      <Helmet>
        <title>{page.seo_title || `${page.title} | ${ministry.name}`}</title>
        <meta name="description" content={page.seo_description || page.excerpt} />
      </Helmet>

      <header className="relative isolate overflow-hidden bg-slate-950 text-white">
        {(page.cover_image_url || ministry.image_url) && <img src={page.cover_image_url || ministry.image_url || ''} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/55" />
        <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
          <nav aria-label="Migas de navegación" className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-white/65">
            <Link to="/ministerios" className="hover:text-white">Ministerios</Link><ChevronRight size={13} />
            <Link to={`/ministerios/${ministry.slug}`} className="hover:text-white">{ministry.name}</Link>
            {breadcrumbs.map((crumb, index) => <span key={crumb.id} className="contents"><ChevronRight size={13} />{index === breadcrumbs.length - 1 ? <span className="text-white">{crumb.title}</span> : <Link to={pagePath(crumb)} className="hover:text-white">{crumb.title}</Link>}</span>)}
          </nav>
          <div className="mt-8 max-w-3xl">
            <div className="flex flex-wrap gap-2"><span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider">{ministry.name}</span>{page.is_password_protected && <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/25 bg-amber-400/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-amber-200"><LockKeyhole size={11} /> Contenido protegido</span>}</div>
            <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight md:text-6xl">{page.title}</h1>
            {page.excerpt && <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 md:text-lg">{page.excerpt}</p>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 md:px-8">
        {!content && page.is_password_protected ? (
          <section className="mx-auto max-w-xl rounded-[2rem] border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-7 text-center shadow-xl shadow-amber-900/5 dark:border-amber-500/20 dark:from-amber-950/20 dark:to-slate-950 md:p-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><KeyRound size={28} /></div>
            <h2 className="mt-5 font-serif text-2xl font-bold">Esta página es privada</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">Ingresa la contraseña compartida por el líder del ministerio para ver su contenido.</p>
            <form onSubmit={(event) => void unlock(event)} className="mx-auto mt-6 max-w-sm space-y-3">
              <label className="sr-only" htmlFor="ministry-page-password">Contraseña</label>
              <input id="ministry-page-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Contraseña de acceso" aria-invalid={Boolean(passwordError)} aria-describedby={passwordError ? 'password-error' : undefined} className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-center text-sm font-semibold outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 dark:border-amber-500/20 dark:bg-slate-950 dark:focus:ring-amber-500/10" />
              {passwordError && <p id="password-error" role="alert" className="text-xs font-semibold text-red-600 dark:text-red-400">{passwordError}</p>}
              <button type="submit" disabled={unlocking || !password} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-amber-700 disabled:opacity-50">{unlocking ? <Loader2 className="animate-spin" size={17} /> : <KeyRound size={17} />} Abrir contenido</button>
            </form>
          </section>
        ) : content ? (
          <div className="space-y-12">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-slate-900 md:p-10"><BlockRenderer blocks={content.content_blocks} />{content.content_blocks.length === 0 && <div className="py-12 text-center"><FileText className="mx-auto text-slate-300" size={36} /><p className="mt-3 text-sm text-slate-400">Esta página aún no tiene bloques de contenido.</p></div>}</section>
            {content.gallery.length > 0 && <section><div className="mb-5 flex items-center gap-2"><GalleryHorizontalEnd className="text-fuchsia-500" /><h2 className="font-serif text-2xl font-bold">Galería</h2><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500 dark:bg-white/10">{content.gallery.length}</span></div><div className="grid grid-cols-2 gap-3 md:grid-cols-3">{content.gallery.map((image) => <button key={image.id} type="button" onClick={() => setActiveImage(image)} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100 text-left md:aspect-[4/3]"><img src={image.url} alt={image.alt} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />{image.caption && <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-10 text-xs font-semibold text-white">{image.caption}</span>}</button>)}</div></section>}
          </div>
        ) : null}

        {children.length > 0 && <section className="mt-12 border-t border-slate-200 pt-10 dark:border-white/10"><h2 className="font-serif text-2xl font-bold">Continúa explorando</h2><div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children.map((child) => <Link key={child.id} to={pagePath(child)} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-slate-900"><div className="aspect-[16/8] overflow-hidden bg-slate-100 dark:bg-slate-800">{child.cover_image_url ? <img src={child.cover_image_url} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center"><FileText className="text-slate-300" /></div>}</div><div className="p-4"><div className="flex items-center justify-between gap-3"><h3 className="font-bold">{child.title}</h3>{child.is_password_protected && <LockKeyhole className="shrink-0 text-amber-500" size={14} />}</div>{child.excerpt && <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{child.excerpt}</p>}<span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-indigo-300">Abrir <ChevronRight size={13} /></span></div></Link>)}</div></section>}
      </div>

      {activeImage && <div role="dialog" aria-modal="true" aria-label="Vista ampliada de imagen" className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4" onClick={() => setActiveImage(null)}><button type="button" onClick={() => setActiveImage(null)} className="absolute right-5 top-5 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white">Cerrar</button><figure className="max-h-[90vh] max-w-6xl" onClick={(event) => event.stopPropagation()}><img src={activeImage.url} alt={activeImage.alt} className="max-h-[82vh] max-w-full rounded-2xl object-contain" />{activeImage.caption && <figcaption className="mt-3 text-center text-sm text-white/80">{activeImage.caption}</figcaption>}</figure></div>}
    </article>
  );
}
