import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, Send, CheckCircle2, ArrowLeft } from 'lucide-react';
import { competitiveService } from '../../features/competitive/services/competitiveService';
import type { DynamicForm } from '../../features/competitive/types';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

export const DynamicFormRenderer = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<DynamicForm | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitterName, setSubmitterName] = useState('');
  const [submitterEmail, setSubmitterEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadForm = async () => {
      const forms = await competitiveService.getDynamicForms();
      const target = forms.find(f => f.id === formId || f.slug === formId) || forms[0];
      if (isMounted && target) setForm(target);
    };
    void loadForm();
    return () => { isMounted = false; };
  }, [formId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;

    await competitiveService.submitForm(form.id, submitterName, submitterEmail, formData);
    setSubmitted(true);
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <p className="text-slate-400 text-sm">Cargando formulario...</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <AnimeFadeUp className="max-w-md w-full bg-slate-900 border border-white/10 rounded-2xl p-8 text-center space-y-4 shadow-2xl backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-white">¡Formulario Enviado Con Éxito!</h2>
          <p className="text-slate-400 text-xs leading-relaxed">
            Gracias por completar el formulario <strong className="text-amber-300">{form.title}</strong>. El equipo pastoral o administrativo se pondrá en contacto pronto.
          </p>
          <button
            onClick={() => navigate('/')}
            className="w-full py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs hover:scale-105 transition"
          >
            Volver al Inicio
          </button>
        </AnimeFadeUp>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-400 hover:text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>

        <AnimeFadeUp className="bg-slate-900/90 rounded-2xl border border-white/10 p-8 space-y-6 shadow-2xl backdrop-blur-md">
          
          <div className="space-y-2 border-b border-white/10 pb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[11px] font-semibold uppercase tracking-wider">
              <FileText className="w-3.5 h-3.5" /> Formulario Oficial
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">{form.title}</h1>
            {form.description && (
              <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">{form.description}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* SUBMITTER INFO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-xl border border-white/5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={submitterName}
                  onChange={e => setSubmitterName(e.target.value)}
                  placeholder="Tu nombre completo"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Correo Electrónico *</label>
                <input
                  type="email"
                  required
                  value={submitterEmail}
                  onChange={e => setSubmitterEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* DYNAMIC FIELDS */}
            {form.fields.map(field => (
              <div key={field.id} className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-200">
                  {field.label} {field.required && <span className="text-rose-400">*</span>}
                </label>

                {field.type === 'text' && (
                  <input
                    type="text"
                    required={field.required}
                    placeholder={field.placeholder || ''}
                    value={formData[field.id] || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                )}

                {field.type === 'textarea' && (
                  <textarea
                    rows={4}
                    required={field.required}
                    placeholder={field.placeholder || ''}
                    value={formData[field.id] || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400 resize-none"
                  />
                )}

                {field.type === 'select' && (
                  <select
                    required={field.required}
                    value={formData[field.id] || ''}
                    onChange={e => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="">-- Seleccionar --</option>
                    {(field.options || []).map((opt, i) => (
                      <option key={i} value={opt}>{opt}</option>
                    ))}
                  </select>
                )}
              </div>
            ))}

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:scale-[1.02] transition shadow-lg shadow-amber-500/20"
            >
              <Send className="w-4 h-4" /> Enviar Respuestas
            </button>
          </form>
        </AnimeFadeUp>
      </div>
    </div>
  );
};
export default DynamicFormRenderer;
