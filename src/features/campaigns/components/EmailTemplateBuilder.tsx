import React, { useEffect, useState } from 'react';
import {
  Mail,
  Send,
  Eye,
  Code,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Copy,
  Sparkles,
  RefreshCw,
  Smartphone,
  Monitor,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { EmailTemplate } from '../types';
import { PRESET_TEMPLATES } from '../templates/defaultTemplates';
import {
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate
} from '../services/emailTemplateService';

export const EmailTemplateBuilder: React.FC = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('Boletín Dominical Jerusalén');
  const [subject, setSubject] = useState('¡Este domingo te esperamos en casa! 🏛️');
  const [category, setCategory] = useState('newsletter');
  const [htmlContent, setHtmlContent] = useState(PRESET_TEMPLATES[0].body_html);

  // UI Modes
  const [previewMode, setPreviewMode] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [activeTab, setActiveTab] = useState<'editor' | 'list'>('editor');
  const [saving, setSaving] = useState(false);

  // Load templates on mount
  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Error cargando plantillas:', err);
      toast.error('No se pudieron cargar las plantillas de email.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadTemplates();
  }, []);

  const handleSave = async () => {
    if (!name.trim() || !subject.trim()) {
      toast.error('Por favor ingresa un nombre interno y un asunto para el correo.');
      return;
    }

    if (!htmlContent.trim()) {
      toast.error('El contenido HTML de la plantilla no puede estar vacío.');
      return;
    }

    setSaving(true);
    try {
      if (editingId && !editingId.startsWith('preset-')) {
        const updated = await updateTemplate(editingId, {
          name,
          subject,
          category,
          body_html: htmlContent
        });
        toast.success(`Plantilla "${updated.name}" actualizada con éxito.`);
      } else {
        const created = await createTemplate({
          name,
          subject,
          category,
          body_html: htmlContent
        });
        setEditingId(created.id);
        toast.success(`Plantilla "${created.name}" guardada correctamente.`);
      }
      await loadTemplates();
    } catch (err) {
      console.error('Error guardando plantilla:', err);
      toast.error('No se pudo guardar la plantilla en el servidor.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNew = () => {
    setEditingId(null);
    setName('Nueva Plantilla de Email');
    setSubject('Asunto del correo');
    setCategory('newsletter');
    setHtmlContent(PRESET_TEMPLATES[0].body_html);
    setActiveTab('editor');
    toast.info('Modo de creación iniciado. Modifica y guarda tu nueva plantilla.');
  };

  const handleSelectTemplate = (template: EmailTemplate) => {
    setEditingId(template.id);
    setName(template.name);
    setSubject(template.subject);
    setCategory(template.category || 'general');
    setHtmlContent(template.body_html);
    setActiveTab('editor');
    toast.success(`Cargada plantilla: "${template.name}"`);
  };

  const handleInjectPreset = (presetId: string) => {
    const preset = PRESET_TEMPLATES.find((p) => p.id === presetId);
    if (preset) {
      setName(preset.name);
      setSubject(preset.subject);
      setCategory(preset.category);
      setHtmlContent(preset.body_html);
      toast.success(`Plantilla prediseñada "${preset.name}" cargada en el editor.`);
    }
  };

  const handleDelete = async (id: string, nameToDelete: string) => {
    if (id.startsWith('preset-')) {
      toast.warning('Las plantillas predeterminadas del sistema no se pueden eliminar.');
      return;
    }

    if (!confirm(`¿Estás seguro de que deseas eliminar la plantilla "${nameToDelete}"?`)) {
      return;
    }

    try {
      await deleteTemplate(id);
      toast.success(`Plantilla "${nameToDelete}" eliminada correctamente.`);
      if (editingId === id) {
        handleCreateNew();
      }
      await loadTemplates();
    } catch (err) {
      console.error('Error al eliminar plantilla:', err);
      toast.error('No se pudo eliminar la plantilla.');
    }
  };

  const handleCopyHTML = () => {
    navigator.clipboard.writeText(htmlContent);
    toast.success('Código HTML copiado al portapapeles');
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'newsletter':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">Boletín</span>;
      case 'welcome':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">Bienvenida</span>;
      case 'event':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">Evento</span>;
      case 'announcement':
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">Anuncio Pastoral</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 border border-slate-500/20">General</span>;
    }
  };

  return (
    <div className="relative space-y-6">
      {/* Background ambient radial glow */}
      <div className="pointer-events-none absolute inset-x-0 -top-20 -z-10 h-96 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.12),transparent_38%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.10),transparent_35%)]" />

      {/* Main Glassmorphic Container Header */}
      <div className="rounded-3xl border border-white/70 bg-white/80 p-6 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/25">
            <Mail size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Diseñador & Catálogo de Plantillas
              </h2>
              {editingId ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                  <Edit3 size={11} /> Editando
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  <Sparkles size={11} /> Nueva
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Diseña, edita y administra plantillas HTML profesionales con variables personalizadas para la congregación.
            </p>
          </div>
        </div>

        {/* Navigation Tabs between Editor and Template List */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('editor')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'editor'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Code size={15} />
            Editor HTML
          </button>

          <button
            onClick={() => setActiveTab('list')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers size={15} />
            Lista de Plantillas ({templates.length})
          </button>

          <button
            onClick={handleCreateNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            <Plus size={15} />
            Añadir Plantilla
          </button>
        </div>
      </div>

      {/* TAB 1: HTML EDITOR & PREVIEW */}
      {activeTab === 'editor' && (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-slate-950/60 space-y-6">
          
          {/* Preset Selector Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Plantillas Prediseñadas:
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleInjectPreset(preset.id)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm cursor-pointer"
                >
                  ⚡ {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-1.5">
                Nombre Interno
              </label>
              <input
                type="text"
                placeholder="Ej. Boletín Mensual de Septiembre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-1.5">
                Asunto del Email
              </label>
              <input
                type="text"
                placeholder="Ej. ¡Este domingo tenemos una gran celebración!"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 mb-1.5">
                Categoría
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 dark:border-white/10 dark:bg-slate-900 dark:text-white"
              >
                <option value="newsletter">Boletín / Newsletter</option>
                <option value="welcome">Bienvenida a Nuevos</option>
                <option value="event">Invitación a Evento</option>
                <option value="announcement">Anuncio Pastoral</option>
                <option value="general">General</option>
              </select>
            </div>
          </div>

          {/* HTML Editor Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-500" />
                Contenido HTML de la Plantilla
              </label>
              <span className="text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full font-mono">
                Variables: {'{{first_name}}'}, {'{{last_name}}'}, {'{{church_name}}'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {previewMode && (
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('desktop')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      previewDevice === 'desktop'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Vista previa Desktop"
                  >
                    <Monitor size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewDevice('mobile')}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                      previewDevice === 'mobile'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                    title="Vista previa Móvil"
                  >
                    <Smartphone size={15} />
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={handleCopyHTML}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Copy size={14} />
                Copiar HTML
              </button>

              <button
                type="button"
                onClick={() => setPreviewMode(!previewMode)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                {previewMode ? <Code size={14} /> : <Eye size={14} />}
                {previewMode ? 'Ver Código Fuente' : 'Vista Previa'}
              </button>

              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
              >
                <Send size={14} />
                {saving ? 'Guardando…' : editingId ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
              </button>
            </div>
          </div>

          {/* HTML Editor Textarea vs Visual Render */}
          {previewMode ? (
            <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-auto min-h-[500px]">
              <div
                className={`transition-all duration-300 ${
                  previewDevice === 'mobile'
                    ? 'w-[375px] border-[8px] border-slate-800 rounded-[32px] shadow-2xl bg-white overflow-hidden'
                    : 'w-full max-w-[700px] bg-white rounded-2xl shadow-xl overflow-hidden'
                }`}
                dangerouslySetInnerHTML={{
                  __html: htmlContent
                    .replace(/\{\{first_name\}\}/g, 'Esteban')
                    .replace(/\{\{last_name\}\}/g, 'Nicola')
                    .replace(/\{\{church_name\}\}/g, 'Iglesia Jerusalén')
                }}
              />
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                placeholder="Escribe o pega aquí el código HTML de tu plantilla de email..."
                className="w-full min-h-[480px] p-5 bg-slate-950 text-emerald-400 font-mono text-xs rounded-2xl border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/40 leading-relaxed"
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TEMPLATE LIST & MANAGEMENT */}
      {activeTab === 'list' && (
        <div className="rounded-3xl border border-white/70 bg-white/70 p-6 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-slate-950/60 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Catálogo de Plantillas Guardadas
              </h3>
              <p className="text-xs text-slate-500">
                Selecciona una plantilla para editarla en el diseñador o eliminar las que ya no necesites.
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadTemplates()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {loading ? (
            <div className="py-16 text-center text-sm text-slate-500">
              Cargando plantillas de correo…
            </div>
          ) : templates.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <AlertCircle size={40} className="mx-auto text-slate-400" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                No hay plantillas personalizadas guardadas.
              </p>
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                Crear Mi Primera Plantilla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className={`group relative rounded-2xl border bg-white dark:bg-slate-900 p-5 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between ${
                    editingId === tpl.id
                      ? 'border-blue-500 ring-2 ring-blue-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-blue-300'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      {getCategoryBadge(tpl.category)}
                      {editingId === tpl.id && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                          <CheckCircle2 size={11} /> Activa
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 dark:text-white text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                      {tpl.name}
                    </h4>

                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-2">
                      <span className="font-bold text-slate-600 dark:text-slate-300">Asunto:</span> {tpl.subject}
                    </p>

                    {/* Preview Box Thumbnail */}
                    <div className="mt-4 h-32 rounded-xl bg-slate-950 border border-slate-800 p-3 overflow-hidden opacity-90 group-hover:opacity-100 transition-opacity">
                      <pre className="text-[9px] text-emerald-400 font-mono whitespace-pre-wrap break-all line-clamp-5 select-none">
                        {tpl.body_html}
                      </pre>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectTemplate(tpl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer"
                    >
                      <Edit3 size={13} />
                      Editar
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectTemplate(tpl);
                          setPreviewMode(true);
                        }}
                        className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                        title="Ver Vista Previa"
                      >
                        <Eye size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(tpl.id, tpl.name)}
                        className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 transition-all cursor-pointer"
                        title="Eliminar Plantilla"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
