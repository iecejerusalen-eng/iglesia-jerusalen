import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import AdminHeader from '../../components/admin/AdminHeader';
import BlockBuilder from '../../components/admin/BlockBuilder';
import type { ContentBlock } from '../../components/admin/BlockBuilder';
import MediaUploader from '../../components/common/MediaUploader';
import { 
  Save, Loader2, RefreshCw, Layout, Eye, 
  ArrowUp, ArrowDown, Trash2, Plus, X, Settings, Info,
  Image as ImageIcon, Search
} from 'lucide-react';
import MediaSearchModal from '../../components/admin/MediaSearchModal';

interface DBPageSection {
  id: string;
  page: string;
  section: string;
  name: string;
  title: string;
  subtitle: string;
  content_blocks: Record<string, unknown>[];
  order_index: number;
  section_type: string;
  cover_image_url?: string;
}

interface GallerySlide {
  id: string;
  url: string;
  caption?: string;
  category?: string;
  [key: string]: unknown;
}

interface PageSectionMetadata {
  id: string;
  name: string;
  defaultTitle: string;
  defaultSubtitle: string;
  description: string;
}

const PAGES_METADATA = {
  home: {
    name: 'Página de Inicio',
    sections: [
      { 
        id: 'home_hero', 
        name: 'Sección Principal (Héroe)', 
        defaultTitle: 'Bienvenido a la Iglesia Jerusalén',
        defaultSubtitle: 'Una Casa de Restauración y Bendición',
        description: 'Personaliza el mensaje principal de bienvenida, fondo y botones CTA.'
      },
      {
        id: 'home_gallery',
        name: 'Galería de Imágenes',
        defaultTitle: 'Nuestra Comunidad en Imágenes',
        defaultSubtitle: 'Momentos especiales de adoración, comunión y servicio en la Iglesia Jerusalén.',
        description: 'Un carrusel interactivo que muestra fotografías de las actividades de la iglesia.'
      },
      { 
        id: 'home_welcome', 
        name: 'Nuestra Doctrina (4 Pilares)', 
        defaultTitle: 'Nuestra Doctrina',
        defaultSubtitle: 'Como Iglesia del Evangelio Cuadrangular, fundamentamos nuestra fe en cuatro grandes verdades bíblicas.',
        description: 'Edita el texto introductorio de los cuatro pilares doctrinales.' 
      },
      { 
        id: 'home_schedules', 
        name: 'Horarios de Reunión', 
        defaultTitle: 'Horarios de Reunión',
        defaultSubtitle: 'Te invitamos a acompañarnos en nuestras diversas actividades de la semana. ¡Nuestras puertas están abiertas!',
        description: 'Lista dinámica de horarios de servicio registrados en la iglesia.' 
      },
      { 
        id: 'home_events', 
        name: 'Próximos Eventos', 
        defaultTitle: 'Próximos Eventos',
        defaultSubtitle: 'Entérate de las próximas actividades especiales, conferencias y reuniones planificadas en nuestra iglesia.',
        description: 'Visualizador de los eventos más cercanos del calendario de la iglesia.' 
      },
      { 
        id: 'home_sermons', 
        name: 'Últimas Prédicas', 
        defaultTitle: 'Últimas Prédicas',
        defaultSubtitle: 'Escucha y comparte los últimos mensajes y sermones dominicales de nuestros pastores.',
        description: 'Listado de últimas prédicas grabadas en audio o video.' 
      },
      { 
        id: 'home_birthdays', 
        name: 'Cumpleaños de la Semana', 
        defaultTitle: 'Cumpleaños de la Semana',
        defaultSubtitle: 'Celebramos la vida de nuestros hermanos que cumplen años en esta semana. ¡Que Dios les bendiga!',
        description: 'Tarjetas dinámicas de los miembros que cumplen años en la semana.' 
      },
      { 
        id: 'home_donations', 
        name: 'Llamado a Ofrendas / Donativos', 
        defaultTitle: 'Apoya la Obra de Dios',
        defaultSubtitle: 'Tus diezmos, ofrendas y donaciones hacen posible que sigamos proclamando el evangelio.',
        description: 'Personaliza la pancarta de invitación para diezmos y ofrendas.' 
      }
    ] as PageSectionMetadata[]
  },
  about: {
    name: 'Página "Nosotros"',
    sections: [
      { 
        id: 'about_hero', 
        name: 'Héroe Principal', 
        defaultTitle: 'Quiénes Somos',
        defaultSubtitle: 'Conoce la historia, misión y liderazgo de la Iglesia Jerusalén.',
        description: 'Configura la cabecera e introducción de la página de identidad.'
      },
      { 
        id: 'about_vision_mission', 
        name: 'Misión y Visión', 
        defaultTitle: 'Misión & Visión',
        defaultSubtitle: 'Nuestra guía en la expansión del evangelio.',
        description: 'Define de forma interactiva la declaración de propósito.'
      },
      { 
        id: 'about_history', 
        name: 'Nuestra Historia', 
        defaultTitle: 'Nuestra Historia',
        defaultSubtitle: 'La trayectoria y cimientos de la congregación.',
        description: 'Escribe y diseña la narrativa de la fundación de la iglesia.'
      },
      { 
        id: 'about_pillars', 
        name: 'Los 4 Pilares Cuadrangulares', 
        defaultTitle: 'Los 4 Pilares Cuadrangulares',
        defaultSubtitle: 'Fundamentados firmemente en el mensaje bíblico de la verdad eterna.',
        description: 'Visualizador interactivo de los principios de fe de la Iglesia Cuadrangular.' 
      },
      { 
        id: 'about_pastoral', 
        name: 'Liderazgo Pastoral', 
        defaultTitle: 'Liderazgo Pastoral',
        defaultSubtitle: 'Nuestros pastores principales llamados a guiar y cuidar espiritualmente a la congregación.',
        description: 'Personaliza las biografías e imágenes de los pastores.'
      }
    ] as PageSectionMetadata[]
  }
};

const SYSTEM_SECTION_OPTIONS = [
  { value: 'custom', label: 'Bloques de Contenido (Personalizada)' },
  { value: 'system_schedules', label: 'Especial: Horarios de Reunión' },
  { value: 'system_events', label: 'Especial: Próximos Eventos' },
  { value: 'system_sermons', label: 'Especial: Últimas Prédicas' },
  { value: 'system_birthdays', label: 'Especial: Cumpleaños de la Semana' },
  { value: 'system_gallery', label: 'Especial: Galería de Diapositivas' },
  { value: 'system_about_pillars', label: 'Especial: Los 4 Pilares Cuadrangulares' }
];

const PageEditor = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  const [selectedPage, setSelectedPage] = useState<'home' | 'about'>('home');
  const [selectedSection, setSelectedSection] = useState<string>('');
  const [sections, setSections] = useState<DBPageSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaModalTarget, setMediaModalTarget] = useState<'hero' | 'add_slide' | { type: 'edit_slide'; index: number } | null>(null);

  // Form properties for new section
  const [newSecName, setNewSecName] = useState('');
  const [newSecType, setNewSecType] = useState('custom');

  // Gallery editor custom states
  const [gallerySubTab, setGallerySubTab] = useState<'photos' | 'categories'>('photos');
  const [gallerySearchQuery, setGallerySearchQuery] = useState('');
  const [galleryFilterCategory, setGalleryFilterCategory] = useState('Todos');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [emptyCategories, setEmptyCategories] = useState<string[]>([]);

  const fetchPageSections = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('page_contents')
        .select('*')
        .eq('page', selectedPage)
        .order('order_index', { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setSections(data);
        setSelectedSection(current => {
          if (!current || !data.some(s => s.id === current)) {
            return data[0].id;
          }
          return current;
        });
      } else {
        // Fallback to metadata seed defaults
        const defaults: DBPageSection[] = PAGES_METADATA[selectedPage].sections.map((sec, idx) => ({
          id: sec.id,
          page: selectedPage,
          section: sec.id.replace(`${selectedPage}_`, ''),
          name: sec.name,
          title: sec.defaultTitle,
          subtitle: sec.defaultSubtitle,
          content_blocks: [],
          order_index: (idx + 1) * 10,
          section_type: sec.id.includes('schedules') ? 'system_schedules' :
                        sec.id.includes('events') ? 'system_events' :
                        sec.id.includes('sermons') ? 'system_sermons' :
                        sec.id.includes('birthdays') ? 'system_birthdays' :
                        sec.id.includes('gallery') ? 'system_gallery' :
                        sec.id.includes('pillars') ? 'system_about_pillars' : 'custom'
        }));
        setSections(defaults);
        setSelectedSection(defaults[0].id);
      }
    } catch (err: unknown) {
      console.error('Error fetching sections:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error('No se pudieron cargar las secciones: ' + errMsg);
    } finally {
      setLoading(false);
    }
  }, [selectedPage]);

  useEffect(() => {
    fetchPageSections();
  }, [fetchPageSections]);

  const handleUpdateField = useCallback(<K extends keyof DBPageSection>(
    key: K, 
    value: DBPageSection[K] | ((prev: DBPageSection[K]) => DBPageSection[K])
  ) => {
    setSections(prev => prev.map(s => {
      if (s.id !== selectedSection) return s;
      const updatedValue = typeof value === 'function' 
        ? (value as Function)(s[key]) 
        : value;
      return { ...s, [key]: updatedValue };
    }));
  }, [selectedSection]);

  const handleMediaModalSelect = (url: string) => {
    if (mediaModalTarget === 'hero') {
      handleUpdateField('cover_image_url', url);
    } else if (mediaModalTarget === 'add_slide') {
      const newSlide = {
        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        url,
        caption: '',
        category: galleryFilterCategory !== 'Todos' ? galleryFilterCategory : 'General'
      };
      handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => [...prev, newSlide]);
      toast.success('Imagen añadida a la galería');
    } else if (typeof mediaModalTarget === 'object' && mediaModalTarget?.type === 'edit_slide') {
      const idx = mediaModalTarget.index;
      handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], url };
        return updated;
      });
      toast.success('Imagen de la diapositiva actualizada');
    }
    setIsMediaModalOpen(false);
    setMediaModalTarget(null);
  };

  const handleSaveActiveSection = async () => {
    const active = sections.find(s => s.id === selectedSection);
    if (!active) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('page_contents')
        .upsert({
          id: active.id,
          page: active.page,
          section: active.section,
          name: active.name,
          title: active.title?.trim() || '',
          subtitle: active.subtitle?.trim() || '',
          content_blocks: active.content_blocks || [],
          order_index: active.order_index,
          section_type: active.section_type,
          cover_image_url: active.cover_image_url || null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success('Sección guardada correctamente.');
    } catch (err: unknown) {
      console.error('Error saving section:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error('No se pudo guardar la sección: ' + errMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleMoveSection = async (id: string, direction: 'up' | 'down') => {
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

    try {
      const { error } = await supabase
        .from('page_contents')
        .upsert(reordered.map(s => ({
          id: s.id,
          page: s.page,
          section: s.section,
          name: s.name,
          title: s.title,
          subtitle: s.subtitle,
          content_blocks: s.content_blocks,
          order_index: s.order_index,
          section_type: s.section_type,
          cover_image_url: s.cover_image_url || null,
          updated_at: new Date().toISOString()
        })));
      if (error) throw error;
      toast.success('Orden de secciones guardado.');
    } catch (err: unknown) {
      console.error('Error saving new section order:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error('No se pudo persistir el orden en la base de datos: ' + errMsg);
    }
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

    try {
      const { error } = await supabase
        .from('page_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;

      const remaining = sections.filter(s => s.id !== id).map((s, idx) => ({
        ...s,
        order_index: (idx + 1) * 10
      }));

      setSections(remaining);

      if (remaining.length > 0) {
        // Update remaining indices
        const { error: orderError } = await supabase
          .from('page_contents')
          .upsert(remaining.map(s => ({
            id: s.id,
            page: s.page,
            section: s.section,
            name: s.name,
            title: s.title,
            subtitle: s.subtitle,
            content_blocks: s.content_blocks,
            order_index: s.order_index,
            section_type: s.section_type,
            cover_image_url: s.cover_image_url || null,
            updated_at: new Date().toISOString()
          })));
        if (orderError) throw orderError;
      }

      toast.success('Sección eliminada.');
      if (selectedSection === id) {
        setSelectedSection(remaining.length > 0 ? remaining[0].id : '');
      }
    } catch (err: unknown) {
      console.error('Error deleting section:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error('Error al eliminar la sección: ' + errMsg);
    }
  };

  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName.trim()) {
      toast.error('Ingresa un nombre para la sección.');
      return;
    }

    let cleanSection: string;
    let newId = '';

    if (newSecType === 'custom') {
      const slug = newSecName.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '');
      cleanSection = `custom_${slug}_${Date.now()}`;
      newId = `${selectedPage}_${cleanSection}`;
    } else {
      cleanSection = newSecType.replace('system_', '');
      newId = `${selectedPage}_${cleanSection}`;
    }

    if (sections.some(s => s.id === newId)) {
      toast.error('Esta sección ya está agregada en esta página.');
      return;
    }

    const newSection: DBPageSection = {
      id: newId,
      page: selectedPage,
      section: cleanSection,
      name: newSecName.trim(),
      title: newSecName.trim(),
      subtitle: '',
      content_blocks: [],
      order_index: (sections.length + 1) * 10,
      section_type: newSecType,
      cover_image_url: ''
    };

    try {
      const { error } = await supabase
        .from('page_contents')
        .upsert({
          id: newSection.id,
          page: newSection.page,
          section: newSection.section,
          name: newSection.name,
          title: newSection.title,
          subtitle: newSection.subtitle,
          content_blocks: newSection.content_blocks,
          order_index: newSection.order_index,
          section_type: newSection.section_type,
          cover_image_url: null,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSections([...sections, newSection]);
      setSelectedSection(newSection.id);
      setShowAddModal(false);
      setNewSecName('');
      setNewSecType('custom');
      toast.success('Sección agregada con éxito.');
    } catch (err: unknown) {
      console.error('Error adding new section:', err);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error('No se pudo crear la sección: ' + errMsg);
    }
  };

  const activeSec = sections.find(s => s.id === selectedSection);

  // Category management helper functions for the system_gallery section
  const handleAddCategory = () => {
    const cleanName = newCategoryName.trim();
    if (!cleanName) {
      toast.error('El nombre de la categoría no puede estar vacío');
      return;
    }
    
    // Check if category already exists in slides or in emptyCategories
    const currentSlides = (activeSec?.content_blocks || []) as unknown as GallerySlide[];
    const existingInSlides = currentSlides.some(s => (s.category?.trim() || 'General').toLowerCase() === cleanName.toLowerCase());
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

    // Check if new category already exists
    const currentSlides = (activeSec?.content_blocks || []) as unknown as GallerySlide[];
    const existingInSlides = currentSlides.some(s => (s.category?.trim() || 'General').toLowerCase() === cleanNew.toLowerCase() && (s.category?.trim() || 'General') !== cleanOld);
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

    // Update slides
    const updatedSlides = currentSlides.map(s => {
      const cat = s.category?.trim() || 'General';
      if (cat === cleanOld) {
        return { ...s, category: cleanNew };
      }
      return s;
    });

    // Update emptyCategories
    setEmptyCategories(prev => prev.map(c => c === cleanOld ? cleanNew : c));

    // Update current active filter if it matched oldName
    if (galleryFilterCategory === cleanOld) {
      setGalleryFilterCategory(cleanNew);
    }

    handleUpdateField('content_blocks', updatedSlides);
    toast.success(`Categoría renombrada a "${cleanNew}"`);
  };

  const handleDeleteCategory = async (catName: string) => {
    const cleanCat = catName.trim();
    const currentSlides = (activeSec?.content_blocks || []) as unknown as GallerySlide[];
    const matchingSlides = currentSlides.filter(s => (s.category?.trim() || 'General') === cleanCat);

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

    // Filter out slides
    const remainingSlides = currentSlides.filter(s => (s.category?.trim() || 'General') !== cleanCat);

    // Remove from empty categories
    setEmptyCategories(prev => prev.filter(c => c !== cleanCat));

    // Update filter if needed
    if (galleryFilterCategory === cleanCat) {
      setGalleryFilterCategory('Todos');
    }

    handleUpdateField('content_blocks', remainingSlides);
    toast.success(`Categoría "${cleanCat}" eliminada.`);
  };

  const availableSystemTypes = SYSTEM_SECTION_OPTIONS.filter(opt => {
    if (opt.value === 'custom') return true;
    // Hide special sections already present in page
    return !sections.some(s => s.section_type === opt.value);
  });

  return (
    <div className="space-y-6 max-w-6xl animate-fadeUp">
      <div className="flex justify-between items-center">
        <AdminHeader 
          title="Gestor Dinámico de Páginas" 
          description="Personaliza y estructura visualmente las secciones del Inicio y Nosotros. Puedes añadir, eliminar y reordenar."
        />
        
        <button
          type="button"
          onClick={fetchPageSections}
          className="p-2 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-slate-55 text-slate-500 dark:text-gray-450 hover:text-slate-700 transition-colors cursor-pointer"
          title="Recargar"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Selector de Páginas (Tabs) */}
      <div className="flex gap-4 p-1.5 bg-slate-100 dark:bg-slate-950 rounded-2xl w-fit border border-slate-200 dark:border-white/10">
        {(Object.keys(PAGES_METADATA) as Array<'home' | 'about'>).map((pageKey) => (
          <button
            key={pageKey}
            type="button"
            onClick={() => setSelectedPage(pageKey)}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              selectedPage === pageKey
                ? 'bg-white dark:bg-slate-900 text-primary dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-450 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {PAGES_METADATA[pageKey].name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Selector de Secciones con controles de orden y borrado (Sidebar) */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-4 rounded-2xl shadow-2xs flex flex-col space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] text-slate-450 font-bold uppercase tracking-wider">
              Estructura de Secciones
            </span>
            <button
              onClick={() => setShowAddModal(true)}
              className="text-primary hover:bg-blue-50/50 p-1 rounded-lg transition-colors cursor-pointer flex items-center gap-0.5 text-[10px] font-bold uppercase"
              title="Añadir Sección"
            >
              <Plus size={12} />
              Añadir
            </button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
            {sections.length === 0 ? (
              <p className="text-[10px] text-slate-400 italic text-center py-4">No hay secciones registradas.</p>
            ) : (
              sections.map((sec, idx) => {
                const isActive = selectedSection === sec.id;
                const isSystemComponent = sec.section_type !== 'custom';
                return (
                  <div 
                    key={sec.id}
                    className={`group/item flex items-center justify-between p-1.5 rounded-xl border transition-all ${
                      isActive 
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-primary/30 dark:border-blue-500/40 text-primary dark:text-blue-400 shadow-2xs' 
                        : 'bg-white dark:bg-slate-900 border-transparent dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-200/50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedSection(sec.id)}
                      className="flex-grow text-left px-2.5 py-1.5 text-xs font-bold flex flex-col gap-0.5 min-w-0"
                    >
                      <span className="truncate">{sec.name}</span>
                      <span className="text-[9px] font-normal text-slate-400 dark:text-gray-500">
                        {isSystemComponent ? 'Módulo Especial' : 'Contenido por Bloques'}
                      </span>
                    </button>
                    
                    {/* Action buttons visible on hover or if active */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover/item:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        disabled={idx === 0}
                        onClick={(e) => { e.stopPropagation(); handleMoveSection(sec.id, 'up'); }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-250 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Subir Sección"
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        disabled={idx === sections.length - 1}
                        onClick={(e) => { e.stopPropagation(); handleMoveSection(sec.id, 'down'); }}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-gray-250 hover:bg-slate-200/50 dark:hover:bg-slate-800 rounded disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                        title="Bajar Sección"
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(sec.id); }}
                        className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded transition-colors"
                        title="Eliminar Sección"
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

        {/* Panel Editor de Contenido (Lado derecho) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 p-6 rounded-2xl shadow-2xs space-y-6">
          {loading ? (
            <div className="flex justify-center items-center py-24">
              <Loader2 className="animate-spin text-primary mr-2" size={24} />
              <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">
                Cargando contenido...
              </span>
            </div>
          ) : activeSec ? (
            <div className="space-y-6">
              {/* Header de Sección */}
              <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex justify-between items-start gap-4">
                <div>
                  <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-lg flex items-center gap-2">
                    <Layout size={18} className="text-gold" />
                    Configuración de Sección: {activeSec.name}
                  </h3>
                  <p className="text-slate-450 text-xs mt-1">
                    Tipo de Módulo: <span className="font-bold text-slate-600 dark:text-gray-400 capitalize">{activeSec.section_type === 'custom' ? 'Bloques Personalizados' : 'Elemento Especial del Sistema'}</span>
                  </p>
                </div>

                <a 
                  href={selectedPage === 'home' ? '/' : '/nosotros'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:text-blue-900 border border-slate-200 dark:border-white/10 hover:border-slate-300 bg-slate-50/50 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                >
                  <Eye size={12} />
                  Ver Cambios
                </a>
              </div>

              {/* Parámetros Básicos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">
                    Nombre del Módulo
                  </label>
                  <input
                    type="text"
                    value={activeSec.name || ''}
                    onChange={(e) => handleUpdateField('name', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Bienvenidos"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">
                    Título de Sección
                  </label>
                  <input
                    type="text"
                    value={activeSec.title || ''}
                    onChange={(e) => handleUpdateField('title', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Bienvenido a nuestra iglesia"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">
                    Subtítulo / Introducción
                  </label>
                  <input
                    type="text"
                    value={activeSec.subtitle || ''}
                    onChange={(e) => handleUpdateField('subtitle', e.target.value)}
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                    placeholder="Ej. Conoce nuestras actividades"
                  />
                </div>
              </div>

              {/* Imagen de Portada (Solo para Héroes) */}
              {activeSec.id.includes('hero') && (
                <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 p-5 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300">
                    <ImageIcon size={18} className="text-gold" />
                    <span>Imagen de Portada de Sección Héroe</span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-5 items-center">
                    <div className="w-full md:w-48 h-28 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-100 relative group/cover">
                      {activeSec.cover_image_url ? (
                        <>
                          <img 
                            src={activeSec.cover_image_url} 
                            alt="Portada Preview" 
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateField('cover_image_url', '')}
                            className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover/cover:opacity-100 transition-opacity cursor-pointer"
                            title="Eliminar imagen"
                          >
                            <X size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1 font-semibold">
                          <ImageIcon size={24} className="opacity-40" />
                          <span>Sin imagen cargada</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow space-y-3 w-full">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center mb-1">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            URL Directa de la Imagen
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setMediaModalTarget('hero');
                              setIsMediaModalOpen(true);
                            }}
                            className="text-[10px] text-primary hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <Search size={12} />
                            Buscar en Internet
                          </button>
                        </div>
                        <input
                          type="text"
                          value={activeSec.cover_image_url || ''}
                          onChange={(e) => handleUpdateField('cover_image_url', e.target.value)}
                          placeholder="https://images.unsplash.com/... o sube una a la derecha"
                          className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <MediaUploader
                          folder="portadas"
                          allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                          label="Subir Portada"
                          onUploadSuccess={(url) => {
                            handleUpdateField('cover_image_url', url);
                          }}
                        />
                        <span className="text-[10px] text-slate-400">Recomendado: 1920x1080px (Formatos: JPG, PNG, WEBP)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Editor de Bloques o Mensaje de Tipo Especial */}
              {activeSec.section_type === 'custom' ? (
                <div className="border-t border-slate-100 dark:border-white/5 pt-6">
                  <BlockBuilder 
                    blocks={(activeSec.content_blocks || []) as unknown as ContentBlock[]} 
                    onChange={(updatedBlocks) => {
                      handleUpdateField('content_blocks', updatedBlocks as unknown as Record<string, unknown>[]);
                    }} 
                  />
                </div>
              ) : activeSec.section_type === 'system_gallery' ? (() => {
                const currentSlides = (activeSec.content_blocks || []) as unknown as GallerySlide[];
                
                // Derived categories
                const categoriesFromSlides = Array.from(new Set(currentSlides.map(s => s.category?.trim() || 'General')));
                const allCategories = Array.from(new Set(['General', ...categoriesFromSlides, ...emptyCategories]));

                // Filtered slides
                const filteredSlides = currentSlides.filter(slide => {
                  const matchesSearch = !gallerySearchQuery.trim() || 
                    (slide.caption || '').toLowerCase().includes(gallerySearchQuery.toLowerCase()) ||
                    (slide.url || '').toLowerCase().includes(gallerySearchQuery.toLowerCase());
                    
                  const slideCat = slide.category?.trim() || 'General';
                  const matchesCategory = galleryFilterCategory === 'Todos' || slideCat === galleryFilterCategory;
                  
                  return matchesSearch && matchesCategory;
                });

                return (
                  <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-6">
                    {/* Header and SubTabs */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100 dark:border-white/5">
                      <div>
                        <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base">Editor de Galería Interactiva</h4>
                        <p className="text-slate-455 text-xs">Administra las categorías y fotos de tu galería con diseño glassmorphic.</p>
                      </div>
                      
                      {/* SubTab Selector */}
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
                          Fotos ({currentSlides.length})
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
                      /* CATEGORIES MANAGEMENT TAB */
                      <div className="space-y-6">
                        {/* Add New Category form */}
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

                        {/* Categories List */}
                        <div className="space-y-3">
                          <span className="text-[10px] font-bold text-slate-455 uppercase tracking-wider block">Secciones Existentes</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {allCategories.map(cat => {
                              const matchingPhotosCount = currentSlides.filter(s => (s.category?.trim() || 'General') === cat).length;
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
                                      {/* Inline edit container or name display */}
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
                      /* PHOTOS MANAGEMENT TAB */
                      <div className="space-y-6">
                        {/* Filters and Search Bar */}
                        <div className="flex flex-col md:flex-row gap-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-white/10 p-4 rounded-2xl justify-between items-center">
                          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            {/* Category Filter Dropdown */}
                            <div className="space-y-0.5">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Filtrar por Sección</label>
                              <select
                                value={galleryFilterCategory}
                                onChange={(e) => setGalleryFilterCategory(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-850 border border-slate-200 dark:border-white/10 rounded-xl text-xs text-gray-800 dark:text-gray-100 font-semibold focus:outline-none cursor-pointer"
                              >
                                <option value="Todos">Todas las Secciones ({currentSlides.length})</option>
                                {allCategories.map(c => {
                                  const count = currentSlides.filter(s => (s.category?.trim() || 'General') === c).length;
                                  return (
                                    <option key={c} value={c}>{c === 'General' ? 'General' : c} ({count})</option>
                                  );
                                })}
                              </select>
                            </div>

                            {/* Search bar input */}
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

                          {/* Quick upload options */}
                          <div className="flex gap-2 flex-shrink-0 w-full sm:w-auto justify-end">
                            <MediaUploader
                              folder="galeria"
                              allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                              label="Subir Foto"
                              multiple={true}
                              onUploadSuccess={(url) => {
                                const newSlide = {
                                  id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                                  url,
                                  caption: '',
                                  category: galleryFilterCategory !== 'Todos' ? galleryFilterCategory : 'General'
                                };
                                handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => [...prev, newSlide]);
                                toast.success('Imagen añadida a la galería');
                              }}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                setMediaModalTarget('add_slide');
                                setIsMediaModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-4 py-2.5 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-xxs"
                            >
                              <Search size={14} />
                              Buscar Stock
                            </button>
                          </div>
                        </div>

                        {/* Datalist for autocomplete inside photos */}
                        <datalist id="gallery-categories-list">
                          <option value="General" />
                          {allCategories.filter(c => c !== 'General' && c !== 'Todos').map(c => (
                            <option key={c} value={c} />
                          ))}
                        </datalist>

                        {/* Grid of Photos */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredSlides.length === 0 ? (
                            <div className="col-span-full text-center py-16 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-xs font-medium">
                              {gallerySearchQuery || galleryFilterCategory !== 'Todos' 
                                ? 'No se encontraron fotos con los filtros activos.' 
                                : 'La galería está vacía. Sube imágenes con el botón superior.'}
                            </div>
                          ) : (
                            filteredSlides.map((slide) => {
                              // Find actual slide index in raw array for editing/deleting/moving
                              const rawIdx = currentSlides.findIndex(s => s.id === slide.id);
                              if (rawIdx === -1) return null;

                              return (
                                <div 
                                  key={slide.id || rawIdx}
                                  className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex gap-4 relative group/slide hover:border-amber-500/30 dark:hover:border-amber-500/20 transition-all duration-300 shadow-xxs"
                                >
                                  {/* Photo Preview Column */}
                                  <div className="w-24 h-24 rounded-xl border border-slate-250 dark:border-white/5 overflow-hidden bg-slate-100 dark:bg-slate-900 flex-shrink-0 relative group/preview">
                                    <img 
                                      src={slide.url} 
                                      alt="Slide" 
                                      className="w-full h-full object-cover select-none pointer-events-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setMediaModalTarget({ type: 'edit_slide', index: rawIdx });
                                        setIsMediaModalOpen(true);
                                      }}
                                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center text-white text-[10px] font-bold gap-1 transition-opacity cursor-pointer"
                                    >
                                      <Search size={12} />
                                      Cambiar
                                    </button>
                                  </div>

                                  {/* Details/Form Inputs Column */}
                                  <div className="flex-grow space-y-2 min-w-0">
                                    {/* Text/Caption */}
                                    <div className="space-y-0.5">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        Leyenda / Descripción
                                      </label>
                                      <input
                                        type="text"
                                        value={slide.caption || ''}
                                        onChange={(e) => {
                                          handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => {
                                            const updated = [...prev];
                                            updated[rawIdx] = { ...updated[rawIdx], caption: e.target.value };
                                            return updated;
                                          });
                                        }}
                                        placeholder="Describa esta foto..."
                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                                      />
                                    </div>

                                    {/* Category / Section Select Autocomplete Input */}
                                    <div className="space-y-0.5">
                                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                        Sección (Autocompletado)
                                      </label>
                                      <input
                                        list="gallery-categories-list"
                                        type="text"
                                        value={slide.category || 'General'}
                                        onChange={(e) => {
                                          handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => {
                                            const updated = [...prev];
                                            updated[rawIdx] = { ...updated[rawIdx], category: e.target.value };
                                            return updated;
                                          });
                                        }}
                                        placeholder="General, Jóvenes, Escuela Dominical..."
                                        className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary font-semibold"
                                      />
                                    </div>
                                  </div>

                                  {/* Right side controls (Reorder / Delete) */}
                                  <div className="flex flex-col gap-1 opacity-0 group-hover/slide:opacity-100 focus-within:opacity-100 transition-opacity justify-center pr-1 flex-shrink-0">
                                    <button
                                      type="button"
                                      disabled={rawIdx === 0}
                                      onClick={() => {
                                        handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => {
                                          const updated = [...prev];
                                          const temp = updated[rawIdx];
                                          updated[rawIdx] = updated[rawIdx - 1];
                                          updated[rawIdx - 1] = temp;
                                          return updated;
                                        });
                                      }}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-gray-450 disabled:opacity-20 cursor-pointer"
                                      title="Subir foto en el orden"
                                    >
                                      <ArrowUp size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={rawIdx === (currentSlides.length - 1)}
                                      onClick={() => {
                                        handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => {
                                          const updated = [...prev];
                                          const temp = updated[rawIdx];
                                          updated[rawIdx] = updated[rawIdx + 1];
                                          updated[rawIdx + 1] = temp;
                                          return updated;
                                        });
                                      }}
                                      className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500 dark:text-gray-450 disabled:opacity-20 cursor-pointer"
                                      title="Bajar foto en el orden"
                                    >
                                      <ArrowDown size={12} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleUpdateField('content_blocks', (prev: Record<string, unknown>[]) => {
                                          return prev.filter((_, idx) => idx !== rawIdx);
                                        });
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
              })() : (
                <div className="flex gap-3 bg-blue-50/40 border border-blue-100 p-5 rounded-2xl text-xs text-slate-600 dark:text-gray-400 leading-relaxed items-start">
                  <Info className="text-primary mt-0.5 flex-shrink-0" size={16} />
                  <div>
                    <span className="font-bold text-primary block mb-0.5">Sección de Sistema Activa</span>
                    Esta sección renderiza dinámicamente un módulo preestablecido de la aplicación (como la cuadrícula de eventos, horarios, cumpleaños o prédicas) utilizando las configuraciones guardadas en sus respectivos gestores. Puedes reordenar y nombrar este módulo, pero no requiere bloques de texto manuales.
                  </div>
                </div>
              )}

              {/* Guardar */}
              <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={handleSaveActiveSection}
                  disabled={saving}
                  className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <Save size={18} />
                  )}
                  {saving ? 'Guardando...' : 'Guardar Sección'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400 italic text-xs">
              No has seleccionado ninguna sección para editar. Elige una del listado en el menú izquierdo.
            </div>
          )}
        </div>
      </div>

      {/* Modal para Añadir Sección */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden animate-scale-in">
            <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 py-3.5 px-6 flex justify-between items-center">
              <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-1.5">
                <Settings size={16} className="text-gold" />
                Añadir Nueva Sección
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSectionSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-450 uppercase tracking-wider mb-1">
                  Nombre de la Sección
                </label>
                <input
                  type="text"
                  required
                  value={newSecName}
                  onChange={(e) => setNewSecName(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-850 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
                  placeholder="Ej. Pilares de Adoración"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-500 dark:text-gray-450 uppercase tracking-wider mb-1">
                  Tipo de Sección
                </label>
                <select
                  value={newSecType}
                  onChange={(e) => setNewSecType(e.target.value)}
                  className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-850 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none font-semibold"
                >
                  {availableSystemTypes.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-250 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-primary hover:bg-blue-900 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Añadir Sección
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Media Search Modal */}
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
