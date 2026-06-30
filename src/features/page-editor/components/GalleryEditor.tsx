import { useState } from 'react';
import { Search, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { toast } from 'sonner';
import { useConfirmStore } from '../../../store/useConfirmStore';
import MediaUploader from '../../../components/common/MediaUploader';
import type { GallerySlide } from '../types';

interface GalleryEditorProps {
  slides: GallerySlide[];
  onUpdateSlides: (slides: GallerySlide[]) => void;
  onSearchMedia: (target: 'add_slide' | { type: 'edit_slide'; index: number }) => void;
}

export const GalleryEditor = ({ slides, onUpdateSlides, onSearchMedia }: GalleryEditorProps) => {
  const confirm = useConfirmStore((state: any) => state.confirm);
  const [gallerySubTab, setGallerySubTab] = useState<'photos' | 'categories'>('photos');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [galleryFilterCategory, setGalleryFilterCategory] = useState('Todos');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [emptyCategories, setEmptyCategories] = useState<string[]>([]);

  const categoriesFromSlides = Array.from(new Set(slides.map(s => s.category?.trim() || 'General')));
  const allCategories = Array.from(new Set(['General', ...categoriesFromSlides, ...emptyCategories]));

  const filteredSlides = slides.filter(slide => {
    const matchesSearch = !gallerySearchQuery.trim() || 
      (slide.caption || '').toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
      (slide.url || '').toLowerCase().includes(gallerySearchQuery.toLowerCase());
      
    const slideCat = slide.category?.trim() || 'General';
    const matchesCategory = galleryFilterCategory === 'Todos' || slideCat === galleryFilterCategory;
    
    return matchesSearch && matchesCategory;
  });

  const handleAddCategory = () => {
    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      toast.error('El nombre de la categoría no puede estar vacío');
      return;
    }
    
    const existingInSlides = slides.some(s => (s.category?.trim() || 'General').toLowerCase() === cleanName.toLowerCase());
    const existingInEmpty = emptyCategories.some(c => c.toLowerCase() === cleanName.toLowerCase());
    const isGeneral = cleanName.toLowerCase() === 'general' || cleanName.toLowerCase() === 'todos';

    if (existingInSlides || existingInEmpty || isGeneral) {
      toast.error('Esta categoría ya existe.');
      return;
    }

    setEmptyCategories(prev => [...prev, cleanName]);
    setNewCategoryName('');
    setGalleryFilterCategory(cleanName);
    toast.success(`Categoría "${cleanName}" creada.`);
  };

  const handleRenameCategory = async (oldName: string, newName: string) => {
    const cleanOld = oldName.trim();
    const cleanNew = newName.trim();
    if (!cleanNew) {
      toast.error('El nuevo nombre no puede estar vacío');
      return;
    }
    if (cleanOld === cleanNew) return;

    const existingInSlides = slides.some(s => (s.category?.trim() || 'General').toLowerCase() === cleanNew.toLowerCase() && (s.category?.trim() || 'General') !== cleanOld);
    const existingInEmpty = emptyCategories.some(c => c.toLowerCase() === cleanNew.toLowerCase() && c !== cleanOld);
    
    if (existingInSlides || existingInEmpty) {
      toast.error('Ya existe una categoría con ese nombre.');
      return;
    }

    const confirmed = await confirm({
      title: 'Renombrar categoría',
      message: `¿Estás seguro de renombrar la categoría "${cleanOld}" a "${cleanNew}"? Esto actualizará todas las fotos asociadas.`,
      confirmText: 'Renombrar',
      cancelText: 'Cancelar',
      variant: 'warning'
    });

    if (!confirmed) return;

    const updatedSlides = slides.map(s => {
      const cat = s.category?.trim() || 'General';
      if (cat === cleanOld) {
        return { ...s, category: cleanNew };
      }
      return s;
    });

    setEmptyCategories(prev => prev.map(c => c === cleanOld ? cleanNew : c));

    if (galleryFilterCategory === cleanOld) {
      setGalleryFilterCategory(cleanNew);
    }

    onUpdateSlides(updatedSlides);
    toast.success(`Categoría renombrada a "${cleanNew}"`);
  };

  const handleDeleteCategory = async (catName: string) => {
    const cleanCat = catName.trim();
    const matchingSlides = slides.filter(s => (s.category?.trim() || 'General') === cleanCat);

    const message = matchingSlides.length > 0 
      ? `¿Estás seguro de eliminar la categoría "${cleanCat}" y sus ${matchingSlides.length} fotos asociadas? Esta acción no se puede deshacer.`
      : `¿Estás seguro de eliminar la categoría vacía "${cleanCat}"?`;

    const confirmed = await confirm({
      title: 'Eliminar categoría',
      message,
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'danger'
    });

    if (!confirmed) return;

    const remainingSlides = slides.filter(s => (s.category?.trim() || 'General') !== cleanCat);

    setEmptyCategories(prev => prev.filter(c => c !== cleanCat));

    if (galleryFilterCategory === cleanCat) {
      setGalleryFilterCategory('Todos');
    }

    onUpdateSlides(remainingSlides);
    toast.success(`Categoría "${cleanCat}" eliminada.`);
  };

  return (
    <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
        <div>
          <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base">Editor de Galería Interactiva</h4>
          <p className="text-slate-455 text-xs">Administra las categorías y fotos de tu galería con diseño glassmorphic.</p>
        </div>
        
        <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl">
          <button
            type="button"
            onClick={() => setGallerySubTab('photos')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gallerySubTab === 'photos'
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xxs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Fotos ({slides.length})
          </button>
          <button
            type="button"
            onClick={() => setGallerySubTab('categories')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              gallerySubTab === 'categories'
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xxs'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Secciones ({allCategories.length})
          </button>
        </div>
      </div>

      {gallerySubTab === 'categories' ? (
        <div className="space-y-6">
          <div className="bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-white/10 p-5 rounded-2xl space-y-3">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Crear Nueva Sección de Galería</span>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ej. Escuela Dominical, Jóvenes, Damas..."
                className="flex-grow px-4 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="px-5 py-2 bg-primary hover:bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} />
                Crear Sección
              </button>
            </div>
            <span className="text-[10px] text-slate-400">Nota: Al crear una sección, puedes usar el selector en tus fotos para moverlas allí.</span>
          </div>

          <div className="space-y-3">
            <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Secciones Existentes</span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {allCategories.map(cat => {
                const matchingPhotosCount = slides.filter(s => (s.category?.trim() || 'General') === cat).length;
                const isGeneral = cat === 'General';
                return (
                  <div
                    key={cat}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-2xl flex flex-col justify-between gap-3 shadow-xxs hover:border-slate-300 dark:hover:border-white/15 transition-all"
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="min-w-0">
                        <span className="text-[9px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-church-gold-bright border border-amber-200/50 dark:border-amber-700/20 px-2.5 py-1 rounded-md uppercase tracking-wider">
                          {matchingPhotosCount} {matchingPhotosCount === 1 ? 'Foto' : 'Fotos'}
                        </span>
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="text"
                            defaultValue={cat}
                            disabled={isGeneral}
                            onBlur={(e) => handleRenameCategory(cat, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.currentTarget.blur();
                              }
                            }}
                            className={`font-serif font-bold text-sm bg-transparent border-b border-transparent focus:border-primary focus:outline-none w-full ${
                              isGeneral ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed font-sans' : 'text-gray-800 dark:text-gray-150 cursor-text'
                            }`}
                            title={isGeneral ? 'General es la sección por defecto y no se puede renombrar.' : 'Haz doble clic para renombrar esta sección.'}
                          />
                        </div>
                      </div>
                      
                      {!isGeneral && (
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer"
                          title="Eliminar sección y todas sus fotos"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    {!isGeneral && (
                      <span className="text-[9px] text-slate-400 italic">Haz clic en el texto para renombrar. Presiona Enter para confirmar.</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-white/10 p-4 rounded-2xl justify-between items-center">
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="space-y-0.5">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Filtrar por Sección</label>
                <select
                  value={galleryFilterCategory}
                  onChange={(e) => setGalleryFilterCategory(e.target.value)}
                  className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-semibold focus:outline-none cursor-pointer"
                >
                  <option value="Todos">Todas las Secciones ({slides.length})</option>
                  {allCategories.map(c => {
                    const count = slides.filter(s => (s.category?.trim() || 'General') === c).length;
                    return (
                      <option key={c} value={c}>{c === 'General' ? 'General' : c} ({count})</option>
                    );
                  })}
                </select>
              </div>

              <div className="space-y-0.5 flex-grow">
                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Buscar por Leyenda o Enlace</label>
                <div className="relative">
                  <input
                    type="text"
                    value={gallerySearchQuery}
                    onChange={(e) => setGallerySearchQuery(e.target.value)}
                    placeholder="Buscar fotos..."
                    className="w-full pl-8 pr-4 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 focus:outline-none"
                  />
                  <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
              <MediaUploader
                folder="galeria"
                allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                label="Subir Foto"
                multiple={true}
                onUploadSuccess={(url: string) => {
                  const newSlide = {
                    id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                    url,
                    caption: '',
                    category: galleryFilterCategory !== 'Todos' ? galleryFilterCategory : 'General'
                  };
                  onUpdateSlides([...slides, newSlide]);
                  toast.success('Imagen añadida a la galería');
                }}
              />
              <button
                type="button"
                onClick={() => onSearchMedia('add_slide')}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-xxs"
              >
                <Search size={14} />
                Buscar Stock
              </button>
            </div>
          </div>

          <datalist id="gallery-categories-list">
            <option value="General" />
            {allCategories.filter(c => c !== 'General' && c !== 'Todos').map(c => (
              <option key={c} value={c} />
            ))}
          </datalist>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSlides.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-xs font-medium">
                {gallerySearchQuery || galleryFilterCategory !== 'Todos' 
                  ? 'No se encontraron fotos con los filtros activos.' 
                  : 'La galería está vacía. Sube imágenes con el botón superior.'}
              </div>
            ) : (
              filteredSlides.map((slide) => {
                const rawIdx = slides.findIndex(s => s.id === slide.id);
                if (rawIdx === -1) return null;

                return (
                  <div 
                    key={slide.id || rawIdx}
                    className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex gap-4 relative group/slide hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all duration-300 shadow-xxs"
                  >
                    <div className="w-24 h-24 rounded-xl border border-slate-250 dark:border-white/5 overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0 relative group/preview">
                      <img loading="lazy" 
                        src={slide.url} 
                        alt="Slide" 
                        className="w-full h-full object-cover select-none pointer-events-none"
                      />
                      <button
                        type="button"
                        onClick={() => onSearchMedia({ type: 'edit_slide', index: rawIdx })}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center text-white text-[10px] font-bold gap-1 transition-opacity cursor-pointer"
                      >
                        <Search size={12} />
                        Cambiar
                      </button>
                    </div>

                    <div className="flex-grow space-y-2 min-w-0">
                      <div className="space-y-0.5">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Leyenda / Descripción
                        </label>
                        <input
                          type="text"
                          value={slide.caption || ''}
                          onChange={(e) => {
                            const updated = [...slides];
                            updated[rawIdx] = { ...updated[rawIdx], caption: e.target.value };
                            onUpdateSlides(updated);
                          }}
                          placeholder="Describa esta foto..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                      </div>

                      <div className="space-y-0.5">
                        <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          Sección (Autocompletado)
                        </label>
                        <input
                          list="gallery-categories-list"
                          type="text"
                          value={slide.category || 'General'}
                          onChange={(e) => {
                            const updated = [...slides];
                            updated[rawIdx] = { ...updated[rawIdx], category: e.target.value };
                            onUpdateSlides(updated);
                          }}
                          placeholder="General, Jóvenes, Escuela Dominical..."
                          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1 opacity-0 group-hover/slide:opacity-100 focus-within:opacity-100 transition-opacity justify-center pr-1 flex-shrink-0">
                      <button
                        type="button"
                        disabled={rawIdx === 0}
                        onClick={() => {
                          const updated = [...slides];
                          const temp = updated[rawIdx];
                          updated[rawIdx] = updated[rawIdx - 1];
                          updated[rawIdx - 1] = temp;
                          onUpdateSlides(updated);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-gray-450 disabled:opacity-20 cursor-pointer"
                        title="Subir foto en el orden"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        type="button"
                        disabled={rawIdx === (slides.length - 1)}
                        onClick={() => {
                          const updated = [...slides];
                          const temp = updated[rawIdx];
                          updated[rawIdx] = updated[rawIdx + 1];
                          updated[rawIdx + 1] = temp;
                          onUpdateSlides(updated);
                        }}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-gray-450 disabled:opacity-20 cursor-pointer"
                        title="Bajar foto en el orden"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const remaining = slides.filter((_, idx) => idx !== rawIdx);
                          onUpdateSlides(remaining);
                          toast.success('Imagen eliminada de la galería.');
                        }}
                        className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 rounded text-red-500 cursor-pointer"
                        title="Eliminar foto"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
