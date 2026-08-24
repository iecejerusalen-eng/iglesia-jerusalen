import React, { useState } from 'react';
import { Mail, Send, Eye, Code, Layers } from 'lucide-react';
import { toast } from 'sonner';

export const EmailTemplateBuilder: React.FC = () => {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState('newsletter');
  const [htmlContent, setHtmlContent] = useState(
    '<div style="font-family: sans-serif; padding: 20px;"><h2>¡Hola {{first_name}}!</h2><p>Te invitamos a nuestro próximo evento dominical.</p></div>'
  );
  const [previewMode, setPreviewMode] = useState(false);

  const handleSave = () => {
    if (!name || !subject) {
      toast.error('Completa el nombre y el asunto del correo');
      return;
    }
    toast.success('Plantilla de email guardada correctamente');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            Diseñador de Plantillas de Email
          </h3>
          <p className="text-xs text-slate-500">
            Crea comunicados atractivos para enviar a la congregación
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-semibold"
          >
            {previewMode ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {previewMode ? 'Ver Código HTML' : 'Vista Previa'}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold"
          >
            <Send className="w-4 h-4" />
            Guardar Plantilla
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Nombre Interno
          </label>
          <input
            type="text"
            placeholder="Ej. Newsletter Mensual"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Asunto del Email
          </label>
          <input
            type="text"
            placeholder="Ej. ¡Este domingo tenemos una gran celebración!"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
            Categoría
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm"
          >
            <option value="newsletter">Boletín / Newsletter</option>
            <option value="welcome">Bienvenida</option>
            <option value="announcement">Anuncio Oficial</option>
            <option value="event">Invitación a Evento</option>
          </select>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Contenido HTML
          </label>
          <span className="text-[11px] text-slate-400">
            Variables soportadas: {'{{first_name}}'}, {'{{last_name}}'}, {'{{church_name}}'}
          </span>
        </div>

        {previewMode ? (
          <div
            className="w-full min-h-[300px] p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl overflow-auto"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        ) : (
          <textarea
            value={htmlContent}
            onChange={(e) => setHtmlContent(e.target.value)}
            className="w-full min-h-[300px] p-4 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl border border-slate-800 focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>
    </div>
  );
};
