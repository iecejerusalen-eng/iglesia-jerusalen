import { Save, Loader2, Layout, Eye, Info } from 'lucide-react';
import BlockBuilder from '../../../components/admin/BlockBuilder';
import type { ContentBlock } from '../../../components/admin/BlockBuilder';
import type { DBPageSection, GallerySlide } from '../types';
import { HeroCoverEditor } from './HeroCoverEditor';
import { GalleryEditor } from './GalleryEditor';

interface SectionEditorProps {
  section: DBPageSection;
  selectedPage: string;
  isSaving: boolean;
  onUpdateField: <K extends keyof DBPageSection>(key: K, value: DBPageSection[K] | ((prev: DBPageSection[K]) => DBPageSection[K])) => void;
  onSave: () => void;
  onSearchMedia: (target: 'hero' | 'add_slide' | { type: 'edit_slide'; index: number }) => void;
}

export const SectionEditor = ({
  section,
  selectedPage,
  isSaving,
  onUpdateField,
  onSave,
  onSearchMedia
}: SectionEditorProps) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-white/5 pb-4 flex justify-between items-start gap-4">
        <div>
          <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-lg flex items-center gap-2">
            <Layout size={18} className="text-gold" />
            Configuración de Sección: {section.name}
          </h3>
          <p className="text-slate-450 text-xs mt-1">
            Tipo de Módulo: <span className="font-bold text-slate-600 dark:text-gray-400 capitalize">{section.section_type === 'custom' ? 'Bloques Personalizados' : 'Elemento Especial del Sistema'}</span>
          </p>
        </div>

        <a 
          href={selectedPage === 'home' ? '/' : '/nosotros'} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-primary dark:text-church-gold-bright hover:text-blue-900 dark:hover:text-white border border-slate-200 dark:border-white/10 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
        >
          <Eye size={12} />
          Ver Cambios
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-gray-500 dark:text-gray-450 uppercase tracking-wider mb-1">
            Nombre del Módulo
          </label>
          <input
            type="text"
            value={section.name || ''}
            onChange={(e) => onUpdateField('name', e.target.value)}
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
            value={section.title || ''}
            onChange={(e) => onUpdateField('title', e.target.value)}
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
            value={section.subtitle || ''}
            onChange={(e) => onUpdateField('subtitle', e.target.value)}
            className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20 focus:outline-none"
            placeholder="Ej. Conoce nuestras actividades"
          />
        </div>
      </div>

      {section.id.includes('hero') && (
        <HeroCoverEditor 
          coverUrl={section.cover_image_url} 
          onUpdate={(url) => onUpdateField('cover_image_url', url)}
          onSearchMedia={() => onSearchMedia('hero')}
        />
      )}

      {section.section_type === 'custom' ? (
        <div className="border-t border-slate-100 dark:border-white/5 pt-6">
          <BlockBuilder 
            blocks={(section.content_blocks || []) as unknown as ContentBlock[]} 
            onChange={(updatedBlocks: ContentBlock[]) => {
              onUpdateField('content_blocks', updatedBlocks as unknown as Record<string, unknown>[]);
            }} 
          />
        </div>
      ) : section.section_type === 'system_gallery' ? (
        <GalleryEditor
          slides={(section.content_blocks || []) as unknown as GallerySlide[]}
          onUpdateSlides={(slides) => onUpdateField('content_blocks', slides as unknown as Record<string, unknown>[])}
          onSearchMedia={onSearchMedia}
        />
      ) : (
        <div className="flex gap-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl text-xs text-slate-600 dark:text-gray-400 leading-relaxed items-start">
          <Info className="text-primary dark:text-church-gold-bright mt-0.5 flex-shrink-0" size={16} />
          <div>
            <span className="font-bold text-primary dark:text-church-gold-bright block mb-0.5">Sección de Sistema Activa</span>
            Esta sección renderiza dinámicamente un módulo preestablecido de la aplicación (como la cuadrícula de eventos, horarios, cumpleaños o prédicas) utilizando las configuraciones guardadas en sus respectivos gestores. Puedes reordenar y nombrar este módulo, pero no requiere bloques de texto manuales.
          </div>
        </div>
      )}

      <div className="flex justify-end pt-6 border-t border-slate-100 dark:border-white/5">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="bg-primary hover:bg-blue-900 disabled:bg-gray-200 text-white px-8 py-3.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer"
        >
          {isSaving ? (
            <Loader2 className="animate-spin" size={18} />
          ) : (
            <Save size={18} />
          )}
          {isSaving ? 'Guardando...' : 'Guardar Sección'}
        </button>
      </div>
    </div>
  );
};
