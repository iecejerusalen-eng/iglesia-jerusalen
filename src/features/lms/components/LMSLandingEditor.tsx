import React, { useState } from 'react';
import { Save, Image as ImageIcon, LayoutTemplate, Type, Settings } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { toast } from 'sonner';

export function LMSLandingEditor() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    heroTitle: 'Aula Virtual Instituto Bíblico Jerusalén',
    heroSubtitle: 'Equipando a los santos para la obra del ministerio. Accede a cursos, recursos y herramientas para tu crecimiento espiritual.',
    heroImageUrl: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80',
    primaryColor: '#c39d67',
    showTestimonials: true,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    // En una implementación real, esto se guardaría en una tabla lms_settings
    setTimeout(() => {
      setLoading(false);
      toast.success('Configuración de la página de inicio guardada correctamente.');
    }, 1000);
  };

  return (
    <AnimeFadeUp className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-gray-150 dark:border-white/10 shadow-sm text-left">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-gold/10 rounded-2xl flex items-center justify-center text-gold">
          <LayoutTemplate size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Editor Visual (Landing)</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Personaliza la página de inicio pública del Aula Virtual.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-gray-200">
              <Type size={18} className="text-gray-400" />
              Contenido Principal
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título Principal (Hero)</label>
              <input
                type="text"
                name="heroTitle"
                value={formData.heroTitle}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gold dark:text-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtítulo (Hero)</label>
              <textarea
                name="heroSubtitle"
                rows={3}
                value={formData.heroSubtitle}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gold dark:text-white transition-colors resize-none"
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-gray-200">
              <ImageIcon size={18} className="text-gray-400" />
              Recursos Visuales
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">URL de Imagen de Fondo</label>
              <input
                type="text"
                name="heroImageUrl"
                value={formData.heroImageUrl}
                onChange={handleChange}
                className="w-full bg-slate-50 dark:bg-slate-800/50 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 outline-none focus:border-gold dark:text-white transition-colors"
              />
            </div>
          </div>
          
          <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-white/10">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-800 dark:text-gray-200">
              <Settings size={18} className="text-gray-400" />
              Configuraciones Adicionales
            </h3>
            
            <label className="flex items-center gap-3 p-4 border border-gray-150 dark:border-white/10 rounded-xl bg-slate-50 dark:bg-slate-800/50 cursor-pointer">
              <input 
                type="checkbox"
                name="showTestimonials"
                checked={formData.showTestimonials}
                onChange={handleChange}
                className="w-5 h-5 accent-gold"
              />
              <span className="text-sm font-medium dark:text-white">Mostrar sección de testimonios estudiantiles</span>
            </label>
          </div>

          <div className="pt-4">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-gold text-white font-bold py-3 rounded-xl hover:bg-yellow-600 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Save size={20} />
              )}
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </button>
          </div>
        </div>

        {/* Live Preview */}
        <div className="bg-slate-100 dark:bg-slate-950 rounded-2xl p-4 border border-gray-200 dark:border-white/10 flex flex-col h-full">
          <h3 className="text-sm font-bold text-slate-500 mb-4 uppercase tracking-wider">Vista Previa</h3>
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-gray-200 dark:border-white/5 relative">
            <div 
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${formData.heroImageUrl})` }}
            >
              <div className="absolute inset-0 bg-black/60" />
            </div>
            <div className="relative z-10 p-6 flex flex-col justify-center h-full text-center text-white">
              <h1 className="text-2xl font-black mb-2">{formData.heroTitle}</h1>
              <p className="text-xs text-white/80 leading-relaxed max-w-sm mx-auto">{formData.heroSubtitle}</p>
              <div className="mt-4 inline-block mx-auto bg-gold text-white text-xs font-bold px-4 py-2 rounded-full">
                Explorar Cursos
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimeFadeUp>
  );
}
