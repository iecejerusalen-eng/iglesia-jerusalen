import { useState } from 'react';
import { X } from 'lucide-react';
import type { LMSCourse } from '../../../types';
import { useCourses } from '../hooks/useCourses';

interface CourseFormProps {
  editingCourse: Partial<LMSCourse> & { category_id?: string } | null;
  categories: { id: string; name: string }[];
  onClose: () => void;
}

export function CourseForm({ editingCourse: initialCourse, categories, onClose }: CourseFormProps) {
  const { createCourse, updateCourse } = useCourses();
  
  const [editingCourse, setEditingCourse] = useState<Partial<LMSCourse> & { category_id?: string }>(
    initialCourse || {
      title: '',
      description: '',
      format: 'weekly',
      grading_scale: '10/10',
      is_published: false,
      cover_image_url: '',
      category_id: '',
      capacity: 0,
      start_date: '',
      duration: '',
      schedule: ''
    }
  );

  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse?.title) return;
    
    const payload = {
      title: editingCourse.title,
      description: editingCourse.description,
      format: editingCourse.format,
      grading_scale: editingCourse.grading_scale,
      is_published: editingCourse.is_published,
      cover_image_url: editingCourse.cover_image_url,
      category_id: editingCourse.category_id || undefined,
      capacity: editingCourse.capacity || 0,
      start_date: editingCourse.start_date || undefined,
      duration: editingCourse.duration || undefined,
      schedule: editingCourse.schedule || undefined,
      updated_at: new Date().toISOString()
    };

    if (editingCourse.id) {
      await updateCourse.mutateAsync({ id: editingCourse.id, payload });
    } else {
      await createCourse.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl text-left">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/10 sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-2xl font-bold font-serif text-slate-900 dark:text-white">
            {editingCourse.id ? 'Editar Curso' : 'Nuevo Curso'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSaveCourse} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título del Curso *</label>
              <input
                type="text"
                required
                value={editingCourse.title || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="Ej. Escuela Dominical: El Libro de Juan"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
              <textarea
                rows={3}
                value={editingCourse.description || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="Describe brevemente de qué trata este curso..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Formato</label>
              <select
                value={editingCourse.format || 'weekly'}
                onChange={(e) => setEditingCourse({ ...editingCourse, format: e.target.value as 'weekly' | 'topics' })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
              >
                <option value="weekly">Semanal (Por Fechas)</option>
                <option value="topics">Por Temas (Unidades)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría del Curso</label>
              <select
                value={editingCourse.category_id || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, category_id: e.target.value })}
                className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
              >
                <option value="">Sin Categoría</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha de Inicio</label>
              <input
                type="date"
                value={editingCourse.start_date || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duración (semanas, meses, etc.)</label>
              <input
                type="text"
                value={editingCourse.duration || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, duration: e.target.value })}
                className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="Ej. 8 Semanas"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Horario</label>
              <input
                type="text"
                value={editingCourse.schedule || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, schedule: e.target.value })}
                className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="Ej. Sábados 19:00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cupo Máximo (0 para libre)</label>
              <input
                type="number"
                value={editingCourse.capacity || 0}
                onChange={(e) => setEditingCourse({ ...editingCourse, capacity: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">URL Imagen de Portada</label>
              <input
                type="text"
                value={editingCourse.cover_image_url || ''}
                onChange={(e) => setEditingCourse({ ...editingCourse, cover_image_url: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-2 focus:ring-gold focus:border-gold"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div className="md:col-span-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingCourse.is_published || false}
                  onChange={(e) => setEditingCourse({ ...editingCourse, is_published: e.target.checked })}
                  className="w-4 h-4 text-gold bg-gray-50 dark:bg-slate-800 border-gray-300 rounded focus:ring-gold"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Publicar Curso (Visible para alumnos)</span>
              </label>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 dark:border-white/10 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createCourse.isPending || updateCourse.isPending}
              className="bg-gold hover:bg-yellow-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
            >
              {editingCourse.id ? 'Guardar Cambios' : 'Crear Curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
