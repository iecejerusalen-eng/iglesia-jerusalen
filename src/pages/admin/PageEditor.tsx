import { useState } from 'react';
import { Eye, FileText, Layers3, Loader2, Plus, RefreshCw, Sparkles, WandSparkles } from 'lucide-react';
import { useConfirmStore } from '../../store/useConfirmStore';
import AdminHeader from '../../components/admin/AdminHeader';
import MediaSearchModal from '../../components/admin/MediaSearchModal';

import { usePageEditor } from '../../features/page-editor/hooks/usePageEditor';
import { usePageMutations } from '../../features/page-editor/hooks/usePageMutations';
import { PageTabs } from '../../features/page-editor/components/PageTabs';
import { SectionSidebar } from '../../features/page-editor/components/SectionSidebar';
import { SectionEditor } from '../../features/page-editor/components/SectionEditor';
import { AddSectionModal } from '../../features/page-editor/components/AddSectionModal';
import { PAGES_METADATA } from '../../features/page-editor/constants';

const PageEditor = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  
  const {
    selectedPage,
    setSelectedPage,
    selectedSection,
    setSelectedSection,
    sections,
    setSections,
    activeSec,
    loading,
    refetch,
    handleUpdateField
  } = usePageEditor();

  const {
    saveSectionMutation,
    reorderSectionsMutation,
    deleteSectionMutation,
    addSectionMutation
  } = usePageMutations();

  const [showAddModal, setShowAddModal] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState<'hero' | 'add_slide' | { type: 'edit_slide'; index: number } | null>(null);

  const handleMediaModalSelect = (url: string) => {
    if (mediaModalTarget === 'hero') {
      handleUpdateField('cover_image_url', url);
    } else if (mediaModalTarget === 'add_slide') {
      const newSlide = {
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        url,
        caption: '',
        category: 'General'
      };
      handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => [...prev, newSlide]);
    } else if (typeof mediaModalTarget === 'object' && mediaModalTarget?.type === 'edit_slide') {
      const idx = mediaModalTarget.index;
      handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], url };
        return updated;
      });
    }
    setIsMediaModalOpen(false);
    setMediaModalTarget(null);
  };

  const handleMoveSection = (id: string, direction: 'up' | 'down') => {
    const index = sections.findIndex(s => s.id === id);
    if (index === -1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= sections.length) return;

    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    const reordered = updated.map((sec, idx) => ({
      ...sec,
      order_index: (idx + 1) * 10
    }));

    setSections(reordered);
    reorderSectionsMutation.mutate(reordered);
  };

  const handleDeleteSection = async (id: string) => {
    const sec = sections.find(s => s.id === id);
    if (!sec) return;
    const confirmed = await confirm({
      title: 'Eliminar sección',
      message: `¿Estás seguro de eliminar la sección "${sec.name}" de esta página?`,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (!confirmed) return;

    const remaining = sections.filter(s => s.id !== id).map((s, idx) => ({
      ...s,
      order_index: (idx + 1) * 10
    }));

    setSections(remaining);
    deleteSectionMutation.mutate({ id, remaining }, {
      onSuccess: () => {
        if (selectedSection === id) {
          setSelectedSection(remaining.length > 0 ? remaining[0].id : '');
        }
      }
    });
  };

  const systemSections = sections.filter((section) => section.section_type !== 'custom').length;
  const customSections = sections.length - systemSections;
  const pageMeta = PAGES_METADATA[selectedPage];

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-fadeUp">
      <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 p-6 text-white shadow-xl sm:p-8">
        <div className="absolute -right-16 -top-20 size-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-blue-200"><WandSparkles size={13} /> Editor visual del sitio</span>
            <h1 className="mt-4 font-serif text-3xl font-bold tracking-tight sm:text-4xl">Páginas públicas, ordenadas y listas para publicar</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">Construye la estructura de Inicio y Nosotros con secciones, bloques y módulos conectados a los datos reales de la iglesia.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={selectedPage === 'home' ? '/' : '/nosotros'} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 text-sm font-bold transition hover:bg-white/15"><Eye size={16} /> Ver página</a>
            <button type="button" onClick={() => setShowAddModal(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-400 px-4 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-300"><Plus size={17} /> Añadir sección</button>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen del editor">
        {[
          { label: 'Página activa', value: pageMeta.name.replace('Página ', ''), icon: FileText, tone: 'text-blue-700 dark:text-blue-300' },
          { label: 'Secciones', value: sections.length, icon: Layers3, tone: 'text-slate-900 dark:text-white' },
          { label: 'Módulos conectados', value: systemSections, icon: Sparkles, tone: 'text-emerald-700 dark:text-emerald-300' },
          { label: 'Bloques editables', value: customSections, icon: WandSparkles, tone: 'text-amber-700 dark:text-amber-300' },
        ].map(({ label, value, icon: Icon, tone }) => (
          <div key={label} className="rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-slate-900/70">
            <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-wider text-slate-400">{label}</span><Icon size={17} className={tone} /></div>
            <p className={`mt-2 truncate text-xl font-black ${tone}`}>{value}</p>
          </div>
        ))}
      </section>

      <div className="flex justify-between items-center">
        <AdminHeader 
          eyebrow="Arquitectura pública"
          title="Estructura de páginas"
          description="Selecciona una página, ordena sus secciones y edita el contenido sin perder la conexión con los módulos del sistema."
        />
        
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer"
          title="Recargar"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      <PageTabs 
        selectedPage={selectedPage} 
        onSelectPage={setSelectedPage} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <SectionSidebar
          sections={sections}
          selectedSection={selectedSection}
          onSelectSection={setSelectedSection}
          onAddSection={() => setShowAddModal(true)}
          onMoveSection={handleMoveSection}
          onDeleteSection={handleDeleteSection}
        />

        <div className="lg:col-span-3 min-w-0 rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-white/10 dark:bg-slate-900 sm:p-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin text-primary mr-2" size={24} />
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                Cargando contenido...
              </span>
            </div>
          ) : activeSec ? (
            <SectionEditor
              section={activeSec}
              selectedPage={selectedPage}
              isSaving={saveSectionMutation.isPending}
              onUpdateField={handleUpdateField}
              onSave={() => saveSectionMutation.mutate(activeSec)}
              onSearchMedia={(target) => {
                setMediaModalTarget(target);
                setIsMediaModalOpen(true);
              }}
            />
          ) : (
            <div className="text-center py-16 text-slate-400 italic text-xs">
              No has seleccionado ninguna sección para editar. Elige una del listado en el menú izquierdo.
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddSectionModal
          sections={sections}
          selectedPage={selectedPage}
          onClose={() => setShowAddModal(false)}
          onAdd={(newSection) => {
            setSections([...sections, newSection]);
            setSelectedSection(newSection.id);
            addSectionMutation.mutate(newSection);
            setShowAddModal(false);
          }}
        />
      )}

      <MediaSearchModal
        isOpen={isMediaModalOpen}
        onClose={() => {
          setIsMediaModalOpen(false);
          setMediaModalTarget(null);
        }}
        onSelect={handleMediaModalSelect}
        allowedTypes={['image']}
        title="Asistente de Búsqueda de Stock"
      />
    </div>
  );
};

export default PageEditor;
