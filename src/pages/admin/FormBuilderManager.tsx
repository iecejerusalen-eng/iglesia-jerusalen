import React, { useState, useEffect } from 'react';
import {
  FileText, Plus, Trash2, ExternalLink, Copy, X
} from 'lucide-react';
import AdminHeader from '../../components/admin/AdminHeader';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { DynamicForm, DynamicFormField } from '../../features/competitive/types';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export const FormBuilderManager = () => {
  const navigate = useNavigate();
  const [forms, setForms] = useState<DynamicForm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [fields, setFields] = useState<DynamicFormField[]>([
    { id: 'f-1', label: 'Nombre Completo', type: 'text', required: true }
  ]);
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<'text' | 'textarea' | 'select'>('text');

  useEffect(() => {
    let isMounted = true;
    const fetchForms = async () => {
      const data = await competitiveService.getDynamicForms();
      if (isMounted) setForms(data);
    };
    void fetchForms();
    return () => { isMounted = false; };
  }, []);

  const handleAddField = () => {
    if (!newFieldLabel.trim()) return;
    const newField: DynamicFormField = {
      id: `field-${Date.now()}`,
      label: newFieldLabel,
      type: newFieldType,
      required: true,
      options: newFieldType === 'select' ? ['Opción 1', 'Opción 2'] : undefined,
    };
    setFields([...fields, newField]);
    setNewFieldLabel('');
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const created = await competitiveService.createDynamicForm({
      title,
      description,
      slug,
      fields,
      is_published: true,
    });

    setForms([created, ...forms]);
    setTitle('');
    setDescription('');
    setShowModal(false);
    toast.success('Formulario Dinámico publicado correctamente');
  };

  const handleCopyLink = (slug: string) => {
    const url = `${window.location.origin}/formularios/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Enlace copiado al portapapeles');
  };

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Constructor de Formularios Dinámicos (Form Builder)"
        description="Diseña formularios personalizados para retiros, solicitudes de bautismo, encuestas y voluntarios"
      />

      {/* ACTION BAR */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-white/10 backdrop-blur-md">
        <p className="text-xs text-slate-400">
          Formularios activos en producción: <strong className="text-amber-300">{forms.length}</strong>
        </p>

        <button
          onClick={() => setShowModal(true)}
          className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 hover:scale-105 transition shadow-lg shadow-amber-500/20"
        >
          <Plus className="w-4 h-4" />
          Crear Nuevo Formulario
        </button>
      </div>

      {/* FORMS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {forms.map(form => (
          <div
            key={form.id}
            className="bg-slate-900/80 rounded-2xl border border-white/10 p-6 space-y-4 shadow-xl backdrop-blur-md hover:border-amber-500/30 transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{form.title}</h3>
                  <span className="text-[11px] text-slate-400 font-mono">/formularios/{form.slug}</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[11px] font-medium">
                ● Publicado
              </span>
            </div>

            {form.description && (
              <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{form.description}</p>
            )}

            <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
              <span className="text-slate-400">{form.fields.length} campos configurados</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyLink(form.slug)}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Enlace
                </button>
                <button
                  onClick={() => navigate(`/formularios/${form.slug}`)}
                  className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Ver Formulario
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" /> Crear Formulario Dinámico
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Título del Formulario *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Ej. Registro de Campamento de Jóvenes 2026"
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Descripción o Instrucciones</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Instrucciones para los hermanos que completan el formulario..."
                  className="w-full px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                />
              </div>

              {/* FIELD BUILDER */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <h4 className="text-xs font-bold text-amber-300">Campos del Formulario ({fields.length})</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {fields.map((f, i) => (
                    <div key={f.id} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-white/5 text-xs text-slate-300">
                      <span>{i + 1}. <strong>{f.label}</strong> ({f.type})</span>
                      <button type="button" onClick={() => handleRemoveField(f.id)} className="text-rose-400 hover:text-rose-300"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={newFieldLabel}
                    onChange={e => setNewFieldLabel(e.target.value)}
                    placeholder="Nombre del nuevo campo..."
                    className="flex-1 px-3 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                  <select
                    value={newFieldType}
                    onChange={e => setNewFieldType(e.target.value as 'text' | 'textarea' | 'select')}
                    className="px-2 py-2 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="text">Texto Corto</option>
                    <option value="textarea">Texto Largo</option>
                    <option value="select">Desplegable</option>
                  </select>
                  <button
                    type="button"
                    onClick={handleAddField}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold rounded-xl text-xs"
                  >
                    + Agregar
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs">Publicar Formulario</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FormBuilderManager;
