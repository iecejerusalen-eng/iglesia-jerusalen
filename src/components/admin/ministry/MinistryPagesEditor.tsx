import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  ChevronRight,
  Copy,
  Eye,
  FilePlus2,
  FileText,
  GalleryHorizontalEnd,
  GripVertical,
  Image as ImageIcon,
  Link2,
  Loader2,
  LockKeyhole,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UnlockKeyhole,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../../config/supabase';
import BlockEditor, { type LessonBlock } from '../BlockEditor';
import MediaUploader from '../../common/MediaUploader';
import { useConfirmStore } from '../../../store/useConfirmStore';
import type { Ministry } from '../../../types';
import type { MinistryGalleryItem, MinistryPage, MinistryPageStatus, MinistryPageWithContent } from '../../../types/ministryPages';

interface MinistryPagesEditorProps {
  ministry: Ministry;
  canEdit: boolean;
}

interface PageDraft {
  id: string | null;
  parent_id: string | null;
  title: string;
  slug: string;
  excerpt: string;
  cover_image_url: string;
  status: MinistryPageStatus;
  seo_title: string;
  seo_description: string;
  content_blocks: LessonBlock[];
  gallery: MinistryGalleryItem[];
  is_password_protected: boolean;
  password: string;
}

const makeSlug = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

const emptyDraft = (parentId: string | null = null): PageDraft => ({
  id: null,
  parent_id: parentId,
  title: '',
  slug: '',
  excerpt: '',
  cover_image_url: '',
  status: 'draft',
  seo_title: '',
  seo_description: '',
  content_blocks: [],
  gallery: [],
  is_password_protected: false,
  password: '',
});

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;

const normalizePage = (value: unknown): MinistryPageWithContent | null => {
  const row = asRecord(value);
  if (!row || typeof row.id !== 'string' || typeof row.ministry_id !== 'string') return null;
  const joined = Array.isArray(row.ministry_page_contents)
    ? asRecord(row.ministry_page_contents[0])
    : asRecord(row.ministry_page_contents);
  return {
    id: row.id,
    ministry_id: row.ministry_id,
    parent_id: typeof row.parent_id === 'string' ? row.parent_id : null,
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    excerpt: String(row.excerpt ?? ''),
    cover_image_url: typeof row.cover_image_url === 'string' ? row.cover_image_url : null,
    icon: String(row.icon ?? 'file-text'),
    depth: Number(row.depth ?? 1),
    sort_order: Number(row.sort_order ?? 0),
    status: row.status === 'published' ? 'published' : 'draft',
    is_password_protected: row.is_password_protected === true,
    seo_title: typeof row.seo_title === 'string' ? row.seo_title : null,
    seo_description: typeof row.seo_description === 'string' ? row.seo_description : null,
    published_at: typeof row.published_at === 'string' ? row.published_at : null,
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    content: {
      content_blocks: Array.isArray(joined?.content_blocks) ? joined.content_blocks as LessonBlock[] : [],
      gallery: Array.isArray(joined?.gallery) ? joined.gallery as MinistryGalleryItem[] : [],
      updated_at: typeof joined?.updated_at === 'string' ? joined.updated_at : null,
    },
  };
};

const toDraft = (page: MinistryPageWithContent): PageDraft => ({
  id: page.id,
  parent_id: page.parent_id,
  title: page.title,
  slug: page.slug,
  excerpt: page.excerpt,
  cover_image_url: page.cover_image_url || '',
  status: page.status,
  seo_title: page.seo_title || '',
  seo_description: page.seo_description || '',
  content_blocks: page.content.content_blocks,
  gallery: page.content.gallery,
  is_password_protected: page.is_password_protected,
  password: '',
});

export default function MinistryPagesEditor({ ministry, canEdit }: MinistryPagesEditorProps) {
  const confirm = useConfirmStore((state) => state.confirm);
  const [pages, setPages] = useState<MinistryPageWithContent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<PageDraft>(() => emptyDraft());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedPage = pages.find((page) => page.id === selectedId) || null;
  const selectedPublicPath = useMemo(() => {
    if (!selectedPage) return '';
    const segments: string[] = [];
    let cursor: MinistryPageWithContent | undefined = selectedPage;
    while (cursor) {
      segments.unshift(cursor.slug);
      cursor = cursor.parent_id ? pages.find((page) => page.id === cursor?.parent_id) : undefined;
    }
    return `/ministerios/${ministry.slug}/${segments.join('/')}`;
  }, [ministry.slug, pages, selectedPage]);

  const orderedPages = useMemo(() => {
    const result: MinistryPageWithContent[] = [];
    const append = (parentId: string | null) => {
      pages
        .filter((page) => page.parent_id === parentId)
        .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, 'es'))
        .forEach((page) => {
          result.push(page);
          append(page.id);
        });
    };
    append(null);
    return result;
  }, [pages]);

  const loadPages = useCallback(async (preferredId?: string | null) => {
    setLoading(true);
    setLoadError(null);
    const { data, error } = await supabase
      .from('ministry_pages')
      .select('*, ministry_page_contents(content_blocks, gallery, updated_at)')
      .eq('ministry_id', ministry.id)
      .order('sort_order', { ascending: true });
    if (error) {
      console.error('Error loading ministry pages:', error);
      setLoadError(error.message);
      setLoading(false);
      return;
    }
    const normalized = (data || []).map(normalizePage).filter((page): page is MinistryPageWithContent => page !== null);
    setPages(normalized);
    const nextId = preferredId === undefined ? normalized[0]?.id ?? null : preferredId;
    const next = normalized.find((page) => page.id === nextId) || null;
    setSelectedId(next?.id || null);
    setDraft(next ? toDraft(next) : emptyDraft());
    setLoading(false);
  }, [ministry.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => { void loadPages(); }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPages]);

  const selectPage = (page: MinistryPageWithContent) => {
    setSelectedId(page.id);
    setDraft(toDraft(page));
  };

  const startNew = (parent: MinistryPage | null = null) => {
    if (parent && parent.depth >= 4) {
      toast.error('Ya alcanzaste el máximo de cuatro niveles.');
      return;
    }
    setSelectedId(null);
    setDraft(emptyDraft(parent?.id || null));
  };

  const save = async () => {
    if (!canEdit || saving) return;
    const title = draft.title.trim();
    const slug = makeSlug(draft.slug || title);
    if (title.length < 2 || !slug) {
      toast.error('Escribe un título y una dirección válida.');
      return;
    }
    if (draft.is_password_protected && !draft.id && draft.password.trim().length < 6) {
      toast.error('La contraseña inicial debe tener al menos 6 caracteres.');
      return;
    }

    setSaving(true);
    try {
      const siblings = pages.filter((page) => page.parent_id === draft.parent_id && page.id !== draft.id);
      const payload = {
        ministry_id: ministry.id,
        parent_id: draft.parent_id,
        title,
        slug,
        excerpt: draft.excerpt.trim(),
        cover_image_url: draft.cover_image_url || null,
        status: draft.status,
        seo_title: draft.seo_title.trim() || null,
        seo_description: draft.seo_description.trim() || null,
        sort_order: draft.id ? selectedPage?.sort_order ?? 0 : siblings.length,
      };

      let pageId = draft.id;
      if (pageId) {
        const { error } = await supabase.from('ministry_pages').update(payload).eq('id', pageId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('ministry_pages').insert(payload).select('id').single();
        if (error) throw error;
        pageId = data.id;
      }

      const { error: contentError } = await supabase.from('ministry_page_contents').upsert({
        page_id: pageId,
        content_blocks: draft.content_blocks,
        gallery: draft.gallery,
      }, { onConflict: 'page_id' });
      if (contentError) throw contentError;

      const protectionChanged = selectedPage?.is_password_protected !== draft.is_password_protected;
      if (draft.password.trim() || protectionChanged) {
        const password = draft.is_password_protected ? draft.password.trim() : null;
        if (draft.is_password_protected && !password) {
          throw new Error('Escribe la nueva contraseña para activar la protección.');
        }
        const { error: passwordError } = await supabase.rpc('set_ministry_page_password', {
          p_page_id: pageId,
          p_password: password,
        });
        if (passwordError) throw passwordError;
      }

      toast.success(draft.status === 'published' ? 'Página publicada.' : 'Borrador guardado.');
      await loadPages(pageId);
    } catch (caughtError: unknown) {
      console.error('Error saving ministry page:', caughtError);
      toast.error(caughtError instanceof Error ? caughtError.message : 'No se pudo guardar la página.');
    } finally {
      setSaving(false);
    }
  };

  const removePage = async () => {
    if (!draft.id || !canEdit) return;
    const childCount = pages.filter((page) => page.parent_id === draft.id).length;
    const approved = await confirm({
      title: 'Eliminar página',
      message: childCount > 0
        ? `También se eliminarán ${childCount} subpágina(s) dependientes y todo su contenido.`
        : `Se eliminará “${draft.title}” y todo su contenido.`,
      confirmText: 'Eliminar definitivamente',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!approved) return;
    const { error } = await supabase.from('ministry_pages').delete().eq('id', draft.id);
    if (error) {
      console.error('Error deleting ministry page:', error);
      toast.error(error.message);
      return;
    }
    toast.success('Página eliminada.');
    setSelectedId(null);
    await loadPages(null);
  };

  const movePage = async (direction: -1 | 1) => {
    if (!selectedPage || !canEdit) return;
    const siblings = pages
      .filter((page) => page.parent_id === selectedPage.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, 'es'));
    const index = siblings.findIndex((page) => page.id === selectedPage.id);
    const swap = siblings[index + direction];
    if (!swap) return;
    const [{ error: firstError }, { error: secondError }] = await Promise.all([
      supabase.from('ministry_pages').update({ sort_order: swap.sort_order }).eq('id', selectedPage.id),
      supabase.from('ministry_pages').update({ sort_order: selectedPage.sort_order }).eq('id', swap.id),
    ]);
    if (firstError || secondError) {
      const error = firstError || secondError;
      console.error('Error reordering ministry pages:', error);
      toast.error(error?.message || 'No se pudo cambiar el orden.');
      return;
    }
    await loadPages(selectedPage.id);
  };

  const updateGalleryItem = (id: string, field: 'alt' | 'caption', value: string) => {
    setDraft((current) => ({
      ...current,
      gallery: current.gallery.map((item) => item.id === id ? { ...item, [field]: value } : item),
    }));
  };

  if (loading) return <div className="flex min-h-80 items-center justify-center"><Loader2 className="animate-spin text-primary" size={30} /></div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-4 rounded-3xl border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-amber-50 p-5 dark:border-white/10 dark:from-indigo-950/30 dark:via-slate-950 dark:to-amber-950/20 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-300"><FileText size={15} /> Micrositio del ministerio</div>
          <h2 className="mt-2 font-serif text-2xl font-bold">Páginas y contenido</h2>
          <p className="mt-1 text-sm text-slate-500">Crea hasta cuatro niveles, publica cuando esté listo y protege contenido privado.</p>
        </div>
        {canEdit && <button type="button" onClick={() => startNew()} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/20"><FilePlus2 size={17} /> Nueva página</button>}
      </header>

      {loadError ? (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-950/20 dark:text-red-300">
          No fue posible cargar las páginas: {loadError}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">Estructura · {pages.length}</span>
              <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-bold text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">4 niveles</span>
            </div>
            <div className="mt-1 space-y-1">
              {orderedPages.length ? orderedPages.map((page) => (
                <button key={page.id} type="button" onClick={() => selectPage(page)} className={`group flex w-full items-center gap-2 rounded-2xl py-2.5 pr-2 text-left transition ${selectedId === page.id ? 'bg-primary text-white shadow-md' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'}`} style={{ paddingLeft: `${10 + (page.depth - 1) * 16}px` }}>
                  <GripVertical size={13} className="shrink-0 opacity-35" />
                  <span className="min-w-0 flex-1"><span className="block truncate text-xs font-bold">{page.title}</span><span className={`block truncate text-[9px] ${selectedId === page.id ? 'text-white/60' : 'text-slate-400'}`}>/{page.slug}</span></span>
                  {page.is_password_protected && <LockKeyhole size={12} />}
                  <span className={`h-2 w-2 shrink-0 rounded-full ${page.status === 'published' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                </button>
              )) : <div className="px-4 py-12 text-center"><FilePlus2 className="mx-auto text-slate-300" size={34} /><p className="mt-3 text-xs font-bold text-slate-500">Aún no hay subpáginas</p><p className="mt-1 text-[11px] text-slate-400">Crea la primera para ampliar este ministerio.</p></div>}
            </div>
          </aside>

          <section className="min-w-0 space-y-5 rounded-3xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70 md:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="text-[10px] font-black uppercase tracking-wider text-slate-400">{draft.id ? `Nivel ${selectedPage?.depth || 1}` : 'Nueva página'}</p><h3 className="mt-1 font-serif text-xl font-bold">{draft.title || 'Contenido sin título'}</h3></div>
              <div className="flex flex-wrap gap-2">
                {draft.id && <>
                  <button type="button" onClick={() => void movePage(-1)} disabled={!canEdit} aria-label="Mover página arriba" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 disabled:opacity-40 dark:border-white/10"><ArrowUp size={15} /></button>
                  <button type="button" onClick={() => void movePage(1)} disabled={!canEdit} aria-label="Mover página abajo" className="rounded-xl border border-slate-200 p-2.5 text-slate-500 disabled:opacity-40 dark:border-white/10"><ArrowDown size={15} /></button>
                  {selectedPage && selectedPage.depth < 4 && canEdit && <button type="button" onClick={() => startNew(selectedPage)} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold dark:border-white/10"><Plus size={14} /> Subpágina</button>}
                </>}
                {canEdit && <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-bold text-white disabled:opacity-60">{saving ? <Loader2 className="animate-spin" size={15} /> : <Save size={15} />} Guardar</button>}
              </div>
            </div>

            <fieldset disabled={!canEdit || saving} className="space-y-6 disabled:opacity-75">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-1.5 text-xs font-bold">Título visible<input value={draft.title} maxLength={120} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value, slug: current.id || current.slug ? current.slug : makeSlug(event.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950" /></label>
                <label className="space-y-1.5 text-xs font-bold">Dirección web<div className="flex rounded-xl border border-slate-200 bg-white focus-within:border-indigo-400 dark:border-white/10 dark:bg-slate-950"><span className="flex items-center px-3 text-slate-400"><Link2 size={14} /></span><input value={draft.slug} onChange={(event) => setDraft((current) => ({ ...current, slug: makeSlug(event.target.value) }))} className="min-w-0 flex-1 bg-transparent px-1 py-2.5 pr-3 text-sm font-medium outline-none" /></div></label>
              </div>
              <label className="space-y-1.5 text-xs font-bold">Resumen para tarjetas y buscadores<textarea value={draft.excerpt} maxLength={320} rows={3} onChange={(event) => setDraft((current) => ({ ...current, excerpt: event.target.value }))} className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium outline-none focus:border-indigo-400 dark:border-white/10 dark:bg-slate-950" /><span className="block text-right text-[10px] text-slate-400">{draft.excerpt.length}/320</span></label>

              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/[0.02] lg:grid-cols-2">
                <div><p className="text-xs font-black">Portada</p><div className="mt-3 flex min-h-32 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-white dark:border-white/15 dark:bg-slate-950">{draft.cover_image_url ? <img src={draft.cover_image_url} alt="Vista previa de portada" className="h-40 w-full object-cover" /> : <div className="text-center text-slate-400"><ImageIcon className="mx-auto" /><span className="mt-1 block text-[10px]">Sin imagen</span></div>}</div><MediaUploader folder={`ministerios/${ministry.slug}/paginas`} allowedFormats={['jpg', 'jpeg', 'png', 'webp', 'avif']} label="Subir portada" className="mt-3 w-full" onUploadSuccess={(url) => setDraft((current) => ({ ...current, cover_image_url: url }))} /></div>
                <div className="space-y-4"><div><p className="text-xs font-black">Estado</p><div className="mt-2 grid grid-cols-2 gap-2">{(['draft', 'published'] as const).map((status) => <button key={status} type="button" onClick={() => setDraft((current) => ({ ...current, status }))} className={`rounded-xl border px-3 py-3 text-xs font-bold ${draft.status === status ? 'border-primary bg-primary text-white' : 'border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-950'}`}>{status === 'draft' ? 'Borrador' : 'Publicado'}</button>)}</div></div><div><p className="text-xs font-black">Acceso</p><button type="button" onClick={() => setDraft((current) => ({ ...current, is_password_protected: !current.is_password_protected, password: '' }))} className={`mt-2 flex w-full items-center justify-between rounded-xl border p-3 text-left ${draft.is_password_protected ? 'border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/20 dark:text-amber-200' : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-200'}`}><span className="flex items-center gap-2 text-xs font-bold">{draft.is_password_protected ? <LockKeyhole size={16} /> : <UnlockKeyhole size={16} />}{draft.is_password_protected ? 'Con contraseña' : 'Acceso libre'}</span><ChevronRight size={15} /></button>{draft.is_password_protected && <label className="mt-2 block text-[10px] font-bold text-slate-500">{selectedPage?.is_password_protected ? 'Nueva contraseña (vacío = conservar)' : 'Contraseña inicial'}<input type="password" autoComplete="new-password" minLength={6} value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} placeholder="Mínimo 6 caracteres" className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none dark:border-white/10 dark:bg-slate-950" /></label>}</div></div>
              </div>

              <div><div className="mb-3 flex items-center gap-2"><Copy size={16} className="text-indigo-500" /><div><h4 className="text-sm font-black">Editor por bloques</h4><p className="text-[11px] text-slate-400">Texto enriquecido, imágenes, secciones, preguntas y actividades interactivas.</p></div></div><BlockEditor content={JSON.stringify(draft.content_blocks)} onChange={(value) => { try { const parsed: unknown = JSON.parse(value); if (Array.isArray(parsed)) setDraft((current) => ({ ...current, content_blocks: parsed as LessonBlock[] })); } catch (error) { console.error('Invalid block editor payload:', error); } }} disabled={!canEdit} /></div>

              <div className="space-y-3 rounded-2xl border border-slate-200 p-4 dark:border-white/10"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2"><GalleryHorizontalEnd size={18} className="text-fuchsia-500" /><div><h4 className="text-sm font-black">Galería</h4><p className="text-[11px] text-slate-400">Colección visual con textos alternativos accesibles.</p></div></div><MediaUploader folder={`ministerios/${ministry.slug}/galerias`} multiple allowedFormats={['jpg', 'jpeg', 'png', 'webp', 'avif']} label="Añadir imágenes" onUploadSuccess={(url) => setDraft((current) => ({ ...current, gallery: [...current.gallery, { id: crypto.randomUUID(), url, alt: '', caption: '' }] }))} /></div>{draft.gallery.length ? <div className="grid gap-3 sm:grid-cols-2">{draft.gallery.map((item) => <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10"><img src={item.url} alt={item.alt || ''} className="h-40 w-full object-cover" /><div className="space-y-2 p-3"><input value={item.alt} onChange={(event) => updateGalleryItem(item.id, 'alt', event.target.value)} placeholder="Texto alternativo" className="w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-xs outline-none dark:border-white/10" /><input value={item.caption} onChange={(event) => updateGalleryItem(item.id, 'caption', event.target.value)} placeholder="Pie de foto (opcional)" className="w-full rounded-lg border border-slate-200 bg-transparent px-2.5 py-2 text-xs outline-none dark:border-white/10" /><button type="button" onClick={() => setDraft((current) => ({ ...current, gallery: current.gallery.filter((galleryItem) => galleryItem.id !== item.id) }))} className="inline-flex items-center gap-1 text-[10px] font-bold text-red-500"><Trash2 size={12} /> Quitar</button></div></div>)}</div> : <div className="rounded-xl border border-dashed border-slate-300 py-8 text-center text-xs text-slate-400 dark:border-white/15">Las imágenes que agregues aparecerán aquí.</div>}</div>

              <details className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><summary className="cursor-pointer text-xs font-black">Opciones para buscadores</summary><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="space-y-1 text-xs font-bold">Título SEO<input value={draft.seo_title} maxLength={70} onChange={(event) => setDraft((current) => ({ ...current, seo_title: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-sm outline-none dark:border-white/10" /></label><label className="space-y-1 text-xs font-bold">Descripción SEO<textarea value={draft.seo_description} maxLength={170} rows={2} onChange={(event) => setDraft((current) => ({ ...current, seo_description: event.target.value }))} className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-sm outline-none dark:border-white/10" /></label></div></details>
            </fieldset>

            {draft.id && <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between"><a href={selectedPublicPath} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-300"><Eye size={15} /> Abrir vista pública</a>{canEdit && <button type="button" onClick={() => void removePage()} className="inline-flex items-center gap-2 text-xs font-bold text-red-500"><Trash2 size={15} /> Eliminar página</button>}</div>}
          </section>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3"><div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><ShieldCheck className="text-emerald-500" size={19} /><p className="mt-2 text-xs font-black">Protección real</p><p className="mt-1 text-[11px] text-slate-400">Las contraseñas nunca se guardan ni se entregan al navegador.</p></div><div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><GalleryHorizontalEnd className="text-fuchsia-500" size={19} /><p className="mt-2 text-xs font-black">Galerías independientes</p><p className="mt-1 text-[11px] text-slate-400">Cada página conserva su propia colección visual.</p></div><div className="rounded-2xl border border-slate-200 p-4 dark:border-white/10"><FileText className="text-indigo-500" size={19} /><p className="mt-2 text-xs font-black">Borrador y publicación</p><p className="mt-1 text-[11px] text-slate-400">Trabaja en privado y publica cuando el contenido esté listo.</p></div></div>
    </div>
  );
}
