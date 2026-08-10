import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Building2,
  ChevronRight,
  FileText,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Users,
  Church,
  ExternalLink,
  Trash2,
  Edit3,
  X,
  Globe,
  Lock,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../config/supabase';
import type { EditorialSpace, EditorialOwnerType } from '../../features/editorial/types';
import { useConfirmStore } from '../../store/useConfirmStore';
import CreateEditorialSpaceModal from '../../components/admin/editorial/CreateEditorialSpaceModal';

type CategoryFilter = 'all' | EditorialOwnerType;

export default function EditorialManager() {
  const [spaces, setSpaces] = useState<EditorialSpace[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const confirmStore = useConfirmStore((state) => state.confirm);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('editorial_spaces')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('No se cargaron los espacios editoriales.', error);
        toast.error('No se pudieron cargar los espacios editoriales. Verifica la base de datos.');
        return;
      }
      setSpaces((data ?? []) as EditorialSpace[]);
    } catch (err) {
      console.error('Error al cargar espacios editoriales:', err);
      toast.error('Error de comunicación con Supabase');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visible = useMemo(() => {
    return spaces.filter((space) => {
      const matchesQuery =
        query.trim() === '' ||
        `${space.name} ${space.description} ${space.slug}`
          .toLowerCase()
          .includes(query.toLowerCase());

      const matchesCategory =
        categoryFilter === 'all' || space.owner_type === categoryFilter;

      return matchesQuery && matchesCategory;
    });
  }, [spaces, query, categoryFilter]);

  // Metrics
  const totalCount = spaces.length;
  const publicCount = spaces.filter((s) => s.is_published).length;
  const ministryCount = spaces.filter((s) => s.owner_type === 'ministry').length;
  const programCount = spaces.filter((s) => s.owner_type === 'study_program').length;

  const handleTogglePublish = async (space: EditorialSpace, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const newPublishedState = !space.is_published;

    // Optimistic state change
    setSpaces((prev) =>
      prev.map((item) =>
        item.id === space.id ? { ...item, is_published: newPublishedState } : item
      )
    );

    try {
      const { error } = await supabase
        .from('editorial_spaces')
        .update({ is_published: newPublishedState })
        .eq('id', space.id);

      if (error) {
        // Revert
        setSpaces((prev) =>
          prev.map((item) =>
            item.id === space.id ? { ...item, is_published: space.is_published } : item
          )
        );
        toast.error('No se pudo actualizar el estado de publicación.');
        return;
      }

      toast.success(
        newPublishedState
          ? `"${space.name}" ahora está publicado públicamente.`
          : `"${space.name}" ahora está en modo borrador.`
      );
    } catch (err) {
      console.error('Error al cambiar visibilidad:', err);
      toast.error('Error al intentar cambiar el estado.');
    }
  };

  const handleDeleteSpace = async (space: EditorialSpace, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    let confirmed = false;
    if (confirmStore) {
      confirmed = await confirmStore({
        title: '¿Eliminar Espacio Editorial?',
        message: `¿Estás seguro de que deseas eliminar permanentemente "${space.name}"? Esta acción removerá la página y sus referencias.`,
        confirmText: 'Eliminar Espacio',
        cancelText: 'Cancelar',
        variant: 'danger',
      });
    } else {
      confirmed = window.confirm(`¿Estás seguro de eliminar "${space.name}"?`);
    }

    if (!confirmed) return;

    try {
      const { error } = await supabase
        .from('editorial_spaces')
        .delete()
        .eq('id', space.id);

      if (error) {
        toast.error(`Error al eliminar: ${error.message}`);
        return;
      }

      setSpaces((prev) => prev.filter((item) => item.id !== space.id));
      toast.success(`Espacio "${space.name}" eliminado correctamente`);
    } catch (err: any) {
      console.error('Error al eliminar espacio editorial:', err);
      toast.error('Ocurrió un error al eliminar el espacio.');
    }
  };

  return (
    <div className="space-y-7">
      {/* Header Hero */}
      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#081630] p-7 text-white shadow-2xl sm:p-9">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />
        <div className="absolute -left-20 -bottom-24 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/30 bg-amber-400/10 px-3.5 py-1 text-xs font-black uppercase tracking-[.18em] text-amber-300 backdrop-blur-md">
              <Sparkles size={14} /> Centro Editorial
            </span>
            <h1 className="mt-3 font-serif text-3xl font-bold sm:text-4xl">
              Páginas, blogs y comunidades
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
              Un solo sistema para publicaciones de la iglesia, bitácoras internas de programas y blogs administrados por cada ministerio.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <Metric value={totalCount} label="Espacios" />
              <Metric value={publicCount} label="Públicos" />
              <Metric value={ministryCount} label="Ministerios" />
              <Metric value={programCount} label="Programas" />
            </div>

            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-3 text-sm font-extrabold text-slate-950 shadow-xl shadow-amber-500/20 transition hover:from-amber-300 hover:to-amber-400 active:scale-95 cursor-pointer shrink-0"
            >
              <Plus size={18} />
              <span>+ Crear Espacio Editorial</span>
            </button>
          </div>
        </div>
      </section>

      {/* Filter Bar */}
      <section className="rounded-[1.75rem] border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/60">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <label className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={19} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar espacio por nombre, slug o descripción..."
              className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-12 pr-10 text-sm outline-none transition focus:border-amber-400 dark:border-white/10 dark:bg-slate-950 dark:text-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-3.5 rounded-full p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Limpiar búsqueda"
              >
                <X size={16} />
              </button>
            )}
          </label>

          {/* Filter Pills & Refresh */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1 dark:border-white/10 dark:bg-slate-950">
              <FilterPill
                active={categoryFilter === 'all'}
                onClick={() => setCategoryFilter('all')}
                label="Todos"
              />
              <FilterPill
                active={categoryFilter === 'church'}
                onClick={() => setCategoryFilter('church')}
                label="Iglesia"
                icon={Church}
              />
              <FilterPill
                active={categoryFilter === 'ministry'}
                onClick={() => setCategoryFilter('ministry')}
                label="Ministerios"
                icon={Building2}
              />
              <FilterPill
                active={categoryFilter === 'study_program'}
                onClick={() => setCategoryFilter('study_program')}
                label="Programas"
                icon={BookOpen}
              />
            </div>

            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-bold transition hover:bg-slate-100 dark:border-white/10 dark:hover:bg-white/5 dark:text-white disabled:opacity-50 cursor-pointer"
              title="Refrescar lista"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>
      </section>

      {/* Grid of Editorial Spaces */}
      {loading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-3xl bg-slate-200 dark:bg-white/5"
            />
          ))}
        </div>
      ) : visible.length ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((space) => {
            const isMinistry = space.owner_type === 'ministry';
            const isProgram = space.owner_type === 'study_program';

            return (
              <div
                key={space.id}
                className="group relative flex flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white/80 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-white/10 dark:bg-white/5"
              >
                {/* Accent Top Bar */}
                <div
                  className="h-1.5 w-full"
                  style={{ backgroundColor: space.accent_color || '#2563eb' }}
                />

                {/* Header Cover Image */}
                <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950">
                  {space.cover_image_url ? (
                    <img
                      src={space.cover_image_url}
                      alt={space.name}
                      className="h-full w-full object-cover opacity-75 transition duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div
                      className="h-full w-full opacity-40"
                      style={{
                        background: `radial-gradient(circle at top right, ${space.accent_color || '#2563eb'} 0%, transparent 75%)`,
                      }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

                  {/* Owner Type Badge */}
                  <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-slate-950/60 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur-xl">
                    {isMinistry ? (
                      <Building2 size={13} className="text-blue-400" />
                    ) : isProgram ? (
                      <BookOpen size={13} className="text-purple-400" />
                    ) : (
                      <Church size={13} className="text-amber-400" />
                    )}
                    {isMinistry ? 'Ministerio' : isProgram ? 'Programa' : 'Iglesia'}
                  </span>

                  {/* Interactive Publish Toggle Switch */}
                  <div className="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-white/15 bg-slate-950/70 px-3 py-1 backdrop-blur-xl">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider ${
                        space.is_published ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {space.is_published ? 'Público' : 'Borrador'}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => void handleTogglePublish(space, e)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        space.is_published ? 'bg-emerald-500' : 'bg-slate-600'
                      }`}
                      title={
                        space.is_published
                          ? 'Despublicar (hacer borrador)'
                          : 'Publicar espacio'
                      }
                      aria-label="Alternar estado de publicación"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          space.is_published ? 'translate-x-4' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Space Title Overlay */}
                  <div className="absolute bottom-3 left-4 right-4">
                    <h2 className="font-serif text-lg font-bold text-white drop-shadow-md line-clamp-1">
                      {space.name}
                    </h2>
                    <span className="font-mono text-[11px] text-amber-300/90">
                      /{space.slug}
                    </span>
                  </div>
                </div>

                {/* Body Content */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <p className="line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                    {space.description || 'Sin descripción asignada para este espacio.'}
                  </p>

                  {/* Action Buttons */}
                  <div className="mt-5 border-t border-slate-100 pt-4 dark:border-white/10 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <Link
                        to={`/admin/publicaciones/${space.id}`}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-3.5 py-2.5 text-xs font-bold text-white shadow-md transition hover:bg-blue-700 dark:bg-amber-400 dark:text-slate-950 dark:hover:bg-amber-300"
                      >
                        <Edit3 size={14} />
                        <span>Abrir Editor</span>
                        <ChevronRight size={14} />
                      </Link>

                      <a
                        href={`/publicaciones/${space.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                        title="Ver Vista Pública"
                      >
                        <ExternalLink size={14} />
                        <span className="hidden sm:inline">Público</span>
                      </a>

                      <button
                        type="button"
                        onClick={(e) => void handleDeleteSpace(space, e)}
                        className="inline-flex items-center justify-center rounded-xl border border-red-200 bg-red-50 p-2.5 text-xs font-bold text-red-600 transition hover:bg-red-100 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20 cursor-pointer"
                        title="Eliminar Espacio"
                        aria-label="Eliminar espacio editorial"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/40 p-12 text-center dark:border-white/15 dark:bg-white/5">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-400/10 text-amber-500">
            <Layers size={32} />
          </div>
          <h2 className="mt-4 font-serif text-2xl font-bold dark:text-white">
            {query || categoryFilter !== 'all'
              ? 'No se encontraron espacios editoriales'
              : 'Todavía no hay espacios editoriales'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
            {query || categoryFilter !== 'all'
              ? 'Intenta cambiando el filtro o término de búsqueda para ver más resultados.'
              : 'Crea tu primer espacio para organizar devocionales, artículos oficiales de la iglesia o blogs de ministerios.'}
          </p>
          <div className="mt-6 flex items-center justify-center gap-3">
            {query || categoryFilter !== 'all' ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setCategoryFilter('all');
                }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold dark:border-white/10 dark:text-white"
              >
                Limpiar filtros
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 px-5 py-2.5 text-xs font-extrabold text-slate-950 shadow-md transition hover:from-amber-300 hover:to-amber-400 cursor-pointer"
            >
              <Plus size={16} />
              <span>+ Crear Primer Espacio</span>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Feature Badges */}
      <section className="grid gap-4 md:grid-cols-3">
        <Feature
          icon={FileText}
          title="Páginas y subpáginas"
          text="Estructura jerárquica, orden y publicación programada."
        />
        <Feature
          icon={Users}
          title="Varios editores"
          text="Propietarios, editores, autores y moderadores por espacio."
        />
        <Feature
          icon={BookOpen}
          title="Contenido por bloques"
          text="Texto, imágenes, preguntas, encuestas y dinámicas interactivas."
        />
      </section>

      {/* Modal Integration */}
      <CreateEditorialSpaceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={load}
      />
    </div>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return (
    <div className="min-w-16 sm:min-w-20 rounded-2xl border border-white/10 bg-white/10 px-3 py-3 backdrop-blur-xl">
      <strong className="block text-xl sm:text-2xl font-bold">{value}</strong>
      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-300">
        {label}
      </span>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: typeof FileText;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
        active
          ? 'bg-amber-400 text-slate-950 shadow-sm'
          : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
      }`}
    >
      {Icon && <Icon size={14} />}
      <span>{label}</span>
    </button>
  );
}

function Feature({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof FileText;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
      <Icon className="text-blue-700 dark:text-amber-300" size={22} />
      <strong className="mt-4 block text-sm dark:text-white">{title}</strong>
      <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">{text}</p>
    </div>
  );
}
