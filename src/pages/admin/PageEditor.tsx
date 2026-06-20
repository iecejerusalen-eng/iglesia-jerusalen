import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import { useConfirmStore } from '../../store/useConfirmStore';
import AdminHeader from '../../components/admin/AdminHeader';
import BlockBuilder from '../../components/admin/BlockBuilder';
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
  content_blocks: any[];
  order_index: number;
  section_type: string;
  cover_image_url?: string;
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

  useEffect(() => {
    fetchPageSections();
  }, [selectedPage]);

  const fetchPageSections = async () => {
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
        if (!selectedSection || !data.some(s => s.id === selectedSection)) {
          setSelectedSection(data[0].id);
        }
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
    } catch (err: any) {
      console.error('Error fetching sections:', err);
      toast.error('No se pudieron cargar las secciones: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateField = (key: keyof DBPageSection, value: any) => {
    setSections(prev => prev.map(s => s.id === selectedSection ? { ...s, [key]: value } : s));
  };

  const handleMediaModalSelect = (url: string) => {
    if (mediaModalTarget === 'hero') {
      handleUpdateField('cover_image_url', url);
    } else if (mediaModalTarget === 'add_slide') {
      const newSlide = {
        id: `slide-${Date.now()}`,
        url,
        caption: ''
      };
      const currentSlides = (activeSec?.content_blocks || []) as any[];
      handleUpdateField('content_blocks', [...currentSlides, newSlide]);
      toast.success('Imagen añadida a la galería');
    } else if (typeof mediaModalTarget === 'object' && mediaModalTarget?.type === 'edit_slide') {
      const idx = mediaModalTarget.index;
      const updated = [...(activeSec?.content_blocks || [])];
      updated[idx] = { ...updated[idx], url };
      handleUpdateField('content_blocks', updated);
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
    } catch (err: any) {
      console.error('Error saving section:', err);
      toast.error('No se pudo guardar la sección: ' + err.message);
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
    } catch (err: any) {
      console.error('Error saving new section order:', err);
      toast.error('No se pudo persistir el orden en la base de datos: ' + err.message);
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
    } catch (err: any) {
      console.error('Error deleting section:', err);
      toast.error('Error al eliminar la sección: ' + err.message);
    }
  };

  const handleAddSectionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSecName.trim()) {
      toast.error('Ingresa un nombre para la sección.');
      return;
    }

    let cleanSection = '';
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
    } catch (err: any) {
      console.error('Error adding new section:', err);
      toast.error('No se pudo crear la sección: ' + err.message);
    }
  };

  const activeSec = sections.find(s => s.id === selectedSection);
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
                    blocks={activeSec.content_blocks || []} 
                    onChange={(updatedBlocks) => {
                      handleUpdateField('content_blocks', updatedBlocks);
                    }} 
                  />
                </div>
              ) : activeSec.section_type === 'system_gallery' ? (
                <div className="border-t border-slate-100 dark:border-white/5 pt-6 space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base">Diapositivas de la Galería</h4>
                      <p className="text-slate-450 text-xs">Administra las imágenes que se mostrarán en el carrusel animado de la página.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MediaUploader
                        folder="galeria"
                        allowedFormats={['jpg', 'jpeg', 'png', 'webp']}
                        label="Añadir Imagen"
                        multiple={true}
                        onUploadSuccess={(url) => {
                          const newSlide = {
                            id: `slide-${Date.now()}`,
                            url,
                            caption: ''
                          };
                          const currentSlides = (activeSec.content_blocks || []) as any[];
                          handleUpdateField('content_blocks', [...currentSlides, newSlide]);
                          toast.success('Imagen añadida a la galería');
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setMediaModalTarget('add_slide');
                          setIsMediaModalOpen(true);
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-gray-300 rounded-xl transition-all cursor-pointer text-xs font-semibold shadow-xxs"
                      >
                        <Search size={14} />
                        Buscar en Internet
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(!activeSec.content_blocks || activeSec.content_blocks.length === 0) ? (
                      <div className="col-span-full text-center py-12 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 text-slate-400 text-xs font-medium">
                        La galería está vacía. Sube imágenes utilizando el botón de arriba.
                      </div>
                    ) : (
                      (activeSec.content_blocks as any[]).map((slide, sIdx) => (
                        <div 
                          key={slide.id || sIdx}
                          className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-4 flex gap-4 relative group/slide"
                        >
                          <div className="w-24 h-24 rounded-xl border border-slate-250 overflow-hidden bg-slate-100 flex-shrink-0">
                            <img 
                              src={slide.url} 
                              alt="Slide" 
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-grow space-y-2 min-w-0">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center">
                                <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                  Enlace / URL de Imagen
                                </label>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMediaModalTarget({ type: 'edit_slide', index: sIdx });
                                    setIsMediaModalOpen(true);
                                  }}
                                  className="text-[9px] text-primary hover:text-blue-900 font-bold flex items-center gap-0.5 cursor-pointer"
                                >
                                  <Search size={10} />
                                  Buscar
                                </button>
                              </div>
                              <input
                                type="text"
                                value={slide.url || ''}
                                onChange={(e) => {
                                  const updated = [...(activeSec.content_blocks || [])];
                                  updated[sIdx] = { ...updated[sIdx], url: e.target.value };
                                  handleUpdateField('content_blocks', updated);
                                }}
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                Leyenda / Descripción
                              </label>
                              <input
                                type="text"
                                value={slide.caption || ''}
                                onChange={(e) => {
                                  const updated = [...(activeSec.content_blocks || [])];
                                  updated[sIdx] = { ...updated[sIdx], caption: e.target.value };
                                  handleUpdateField('content_blocks', updated);
                                }}
                                placeholder="Describa esta foto..."
                                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-xs text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 opacity-0 group-hover/slide:opacity-100 transition-opacity justify-center pr-1">
                            <button
                              type="button"
                              disabled={sIdx === 0}
                              onClick={() => {
                                const updated = [...(activeSec.content_blocks || [])];
                                const temp = updated[sIdx];
                                updated[sIdx] = updated[sIdx - 1];
                                updated[sIdx - 1] = temp;
                                handleUpdateField('content_blocks', updated);
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 dark:text-gray-450 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp size={12} />
                            </button>
                            <button
                              type="button"
                              disabled={sIdx === (activeSec.content_blocks.length - 1)}
                              onClick={() => {
                                const updated = [...(activeSec.content_blocks || [])];
                                const temp = updated[sIdx];
                                updated[sIdx] = updated[sIdx + 1];
                                updated[sIdx + 1] = temp;
                                handleUpdateField('content_blocks', updated);
                              }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500 dark:text-gray-450 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const updated = (activeSec.content_blocks || []).filter((_: any, idx: number) => idx !== sIdx);
                                handleUpdateField('content_blocks', updated);
                                toast.success('Imagen eliminada de la galería.');
                              }}
                              className="p-1 hover:bg-red-50 rounded text-red-500 cursor-pointer"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ) : (
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
