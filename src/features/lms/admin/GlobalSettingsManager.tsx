import { useState, useEffect } from 'react';
import { supabase } from '../../../config/supabase';
import { Settings, Save, AlertTriangle } from 'lucide-react';
import { AnimeFadeUp } from '../../../components/animations/AnimeWrappers';
import { toast } from 'sonner';

interface GlobalSettings {
  id: string;
  school_id: string;
  forums_graded: boolean;
  weeks_per_course: number;
}

interface School {
  id: string;
  name: string;
}

export function GlobalSettingsManager() {
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [settings, setSettings] = useState<GlobalSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSchools = async () => {
      const { data } = await supabase.from('lms_schools').select('id, name').order('name');
      if (data && data.length > 0) {
        setSchools(data);
        setSelectedSchool(data[0].id);
      }
      setLoading(false);
    };
    fetchSchools();
  }, []);

  useEffect(() => {
    if (!selectedSchool) return;
    
    const fetchSettings = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('lms_global_settings')
        .select('*')
        .eq('school_id', selectedSchool)
        .single();
        
      if (error && error.code !== 'PGRST116') {
        toast.error('Error cargando configuración');
      }
      
      if (data) {
        setSettings(data);
      } else {
        // Defaults if not exists
        setSettings({
          id: '',
          school_id: selectedSchool,
          forums_graded: true,
          weeks_per_course: 16
        });
      }
      setLoading(false);
    };
    
    fetchSettings();
  }, [selectedSchool]);

  const handleSave = async () => {
    if (!settings || !selectedSchool) return;
    setSaving(true);
    try {
      const payload = {
        school_id: selectedSchool,
        forums_graded: settings.forums_graded,
        weeks_per_course: settings.weeks_per_course
      };
      
      if (settings.id) {
        await supabase.from('lms_global_settings').update(payload).eq('id', settings.id);
      } else {
        const { data } = await supabase.from('lms_global_settings').insert([payload]).select().single();
        if (data) setSettings(data);
      }
      toast.success('Configuración guardada correctamente');
    } catch (err: any) {
      toast.error('Error guardando configuración: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && schools.length === 0) return <div className="p-8 text-center text-gray-500">Cargando...</div>;

  return (
    <AnimeFadeUp className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 rounded-xl">
            <Settings size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-800 dark:text-white">Configuración Global</h2>
            <p className="text-sm text-gray-500">Ajustes que afectan a toda la escuela seleccionada.</p>
          </div>
        </div>
        
        <select 
          value={selectedSchool}
          onChange={(e) => setSelectedSchool(e.target.value)}
          className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
        >
          {schools.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>

      {settings && !loading && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Forums Setting */}
            <div className="space-y-3">
              <label className="flex items-center justify-between font-bold text-slate-800 dark:text-white">
                <span>Foros Calificados Automáticamente</span>
                <div className="relative inline-block w-12 h-6 rounded-full cursor-pointer transition-colors"
                  style={{ backgroundColor: settings.forums_graded ? '#10B981' : '#E5E7EB' }}
                  onClick={() => setSettings({...settings, forums_graded: !settings.forums_graded})}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${settings.forums_graded ? 'translate-x-7' : 'translate-x-1'}`} />
                </div>
              </label>
              <p className="text-sm text-gray-500">
                Si está activado, la participación en los foros se ponderará y contará para la calificación final del módulo según la rúbrica global.
              </p>
            </div>

            {/* Weeks per course */}
            <div className="space-y-3">
              <label className="block font-bold text-slate-800 dark:text-white">Semanas por Curso (Default)</label>
              <input 
                type="number" 
                min={1} 
                max={52}
                value={settings.weeks_per_course}
                onChange={(e) => setSettings({...settings, weeks_per_course: parseInt(e.target.value) || 16})}
                className="w-full bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2.5 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <p className="text-sm text-gray-500">
                Determina la estructura de tiempo sugerida para los nuevos cursos.
              </p>
            </div>
            
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex gap-3 text-amber-800 dark:text-amber-400">
            <AlertTriangle className="shrink-0" size={20} />
            <p className="text-sm">
              <strong>Atención:</strong> Modificar estos valores afectará cómo se calculan las notas y la progresión en todos los cursos activos de esta escuela.
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-white/10">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-3 rounded-xl font-black transition-transform hover:scale-105 disabled:opacity-50"
            >
              {saving ? 'Guardando...' : <><Save size={18} /> Guardar Configuración</>}
            </button>
          </div>
        </div>
      )}
    </AnimeFadeUp>
  );
}
