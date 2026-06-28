import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import { useConfirmStore } from '../../store/useConfirmStore';
import AdminHeader from '../../components/admin/AdminHeader';
import MediaSearchModal from '../../components/admin/MediaSearchModal';

import { usePageEditor } from '../../features/page-editor/hooks/usePageEditor';
import { usePageMutations } from '../../features/page-editor/hooks/usePageMutations';
import { PageTabs } from '../../features/page-editor/components/PageTabs';
import { SectionSidebar } from '../../features/page-editor/components/SectionSidebar';
import { SectionEditor } from '../../features/page-editor/components/SectionEditor';
import { AddSectionModal } from '../../features/page-editor/components/AddSectionModal';

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

  return (
    <div className="space-y-6 max-w-6xl animate-fadeUp">
      <div className="flex justify-between items-center">
        <AdminHeader 
          title="Gestor Dinámico de Páginas" 
          description="Personaliza y estructura visualmente las secciones del Inicio y Nosotros. Puedes añadir, eliminar y reordenar."
        />
        
        <button
          type="button"
          onClick={() => refetch()}
          className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-55 text-slate-500 dark:text-gray-450 hover:text-slate-700 transition-colors cursor-pointer"
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

        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xs space-y-6">
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
