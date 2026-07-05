import { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { toast } from 'react-hot-toast';
import { Save, Loader2, Plus, Trash2, Layout, LayoutTemplate } from 'lucide-react';
import { AnimeFadeUp } from '../../components/animations/AnimeWrappers';

// Define the content interfaces
interface HeroContent {
  title: string;
  subtitle: string;
  description: string;
  image_url?: string;
}

interface FeatureItem {
  title: string;
  description: string;
  icon?: string;
}

interface FeaturesContent {
  items: FeatureItem[];
}

const LMSLandingEditor = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [heroContent, setHeroContent] = useState<HeroContent>({
    title: '',
    subtitle: '',
    description: ''
  });
  const [featuresContent, setFeaturesContent] = useState<FeaturesContent>({
    items: []
  });

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('lms_landing_content')
        .select('*');

      if (error) {
        if (error.code === '42P01') {
          // Table doesn't exist yet, ignore
          console.warn('Tabla lms_landing_content no existe todavía.');
        } else {
          throw error;
        }
      }

      if (data) {
        const hero = data.find((d: { section_key: string; content: unknown }) => d.section_key === 'hero');
        const features = data.find((d: { section_key: string; content: unknown }) => d.section_key === 'features');

        if (hero && hero.content) {
          setHeroContent(hero.content as HeroContent);
        }
        if (features && features.content) {
          setFeaturesContent(features.content as FeaturesContent);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar el contenido. ¿Corriste la migración SQL?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const handleSave = async (sectionKey: string, content: HeroContent | FeaturesContent) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('lms_landing_content')
        .upsert({
          section_key: sectionKey,
          content: content,
          is_active: true
        }, { onConflict: 'section_key' });

      if (error) throw error;
      toast.success(`Sección ${sectionKey} guardada exitosamente.`);
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar. Verifica consola.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAll = async () => {
    await handleSave('hero', heroContent);
    await handleSave('features', featuresContent);
  };

  const addFeature = () => {
    setFeaturesContent({
      items: [...featuresContent.items, { title: 'Nueva Característica', description: 'Descripción aquí' }]
    });
  };

  const removeFeature = (idx: number) => {
    setFeaturesContent({
      items: featuresContent.items.filter((_, i) => i !== idx)
    });
  };

  const updateFeature = (idx: number, key: keyof FeatureItem, value: string) => {
    const newItems = [...featuresContent.items];
    newItems[idx] = { ...newItems[idx], [key]: value };
    setFeaturesContent({ items: newItems });
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-gold" size={40} />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-8 bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif">Editor Visual Landing LMS</h1>
          <p className="text-sm text-gray-500 mt-1">Modifica los textos y secciones de la página de inicio del Aula Virtual.</p>
        </div>
        <button
          onClick={handleSaveAll}
          disabled={saving}
          className="px-6 py-2.5 bg-gold hover:bg-yellow-600 text-white font-bold rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          Guardar Todo
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* HERO SECTION EDITOR */}
        <AnimeFadeUp delay={100} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 border-b border-gray-200 dark:border-white/5 flex items-center gap-3">
            <LayoutTemplate className="text-indigo-500" />
            <h2 className="font-bold font-serif text-lg">Sección Principal (Hero)</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Subtítulo (Ej: Ecosistema Educativo)</label>
              <input
                type="text"
                value={heroContent.subtitle}
                onChange={(e) => setHeroContent({...heroContent, subtitle: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Título Principal</label>
              <input
                type="text"
                value={heroContent.title}
                onChange={(e) => setHeroContent({...heroContent, title: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-bold text-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Descripción</label>
              <textarea
                rows={4}
                value={heroContent.description}
                onChange={(e) => setHeroContent({...heroContent, description: e.target.value})}
                className="w-full px-4 py-2 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-white dark:bg-slate-950 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            
            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => handleSave('hero', heroContent)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Save size={14} /> Guardar Hero
              </button>
            </div>
          </div>
        </AnimeFadeUp>

        {/* FEATURES SECTION EDITOR */}
        <AnimeFadeUp delay={200} className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-slate-100 dark:bg-slate-800/50 p-4 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Layout className="text-emerald-500" />
              <h2 className="font-bold font-serif text-lg">Características</h2>
            </div>
            <button 
              onClick={addFeature}
              className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors cursor-pointer"
            >
              <Plus size={18} />
            </button>
          </div>
          
          <div className="p-6 space-y-6 max-h-[600px] overflow-y-auto">
            {featuresContent.items.length === 0 ? (
              <p className="text-center text-sm text-gray-500 italic py-10">No hay características añadidas.</p>
            ) : (
              featuresContent.items.map((item, idx) => (
                <div key={idx} className="p-4 border border-gray-200 dark:border-white/10 rounded-xl relative group">
                  <button 
                    onClick={() => removeFeature(idx)}
                    className="absolute -top-3 -right-3 p-1.5 bg-red-100 dark:bg-red-900/40 text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm cursor-pointer hover:bg-red-200"
                  >
                    <Trash2 size={14} />
                  </button>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Título</label>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-emerald-500 font-semibold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Descripción</label>
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                        className="w-full px-3 py-1.5 border border-gray-200 dark:border-white/10 rounded-lg text-sm bg-slate-50 dark:bg-slate-950 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
            
            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => handleSave('features', featuresContent)}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Save size={14} /> Guardar Características
              </button>
            </div>
          </div>
        </AnimeFadeUp>

      </div>
    </div>
  );
};

export default LMSLandingEditor;
