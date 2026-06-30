import { useState } from 'react';
import { Settings, X } from 'lucide-react';
import type { DBPageSection } from '../types';
import { SYSTEM_SECTION_OPTIONS } from '../constants';
import { toast } from 'sonner';

interface AddSectionModalProps {
  onClose: () => void;
  onAdd: (section: DBPageSection) => void;
  sections: DBPageSection[];
  selectedPage: string;
}

export const AddSectionModal = ({ onClose, onAdd, sections, selectedPage }: AddSectionModalProps) => {
  const [newSecName, setNewSecName] = useState('');
  const [newSecType, setNewSecType] = useState('custom');

  const availableSystemTypes = SYSTEM_SECTION_OPTIONS.filter(opt => {
    if (opt.value === 'custom') return true;
    return !sections.some(s => s.section_type === opt.value);
  });

  const handleSubmit = (e: React.FormEvent) => {
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

    onAdd(newSection);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl border border-slate-100 dark:border-white/5 overflow-hidden animate-scale-in">
        <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 py-3.5 px-6 flex justify-between items-center">
          <h3 className="font-serif font-bold text-gray-800 dark:text-gray-100 text-base flex items-center gap-1.5">
            <Settings size={16} className="text-gold" />
            Añadir Nueva Sección
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              onClick={onClose}
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
  );
};
