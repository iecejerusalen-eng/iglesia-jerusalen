import { useEffect, useState } from 'react';
import { Check, Image, Monitor, Moon, Palette, Save, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useThemeStore, type Theme } from '../../../../store/useThemeStore';
import { supabase } from '../../../../config/supabase';

type AppearanceConfig = {
  site_name: string; tagline: string; primary_color: string; accent_color: string;
  hero_media_type: 'image' | 'video'; hero_media_url: string; show_live_badge: boolean;
};
const initialConfig: AppearanceConfig = { site_name: 'Iglesia Jerusalén', tagline: 'Una familia de fe', primary_color: '#172554', accent_color: '#D97706', hero_media_type: 'image', hero_media_url: '', show_live_badge: true };

export default function AppearanceTab() {
  const { theme, setTheme } = useThemeStore();
  const [config, setConfig] = useState<AppearanceConfig>(initialConfig);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    void supabase.from('church_settings').select('appearance_config').limit(1).maybeSingle().then(({ data, error }) => {
      if (error) console.error('No se pudo cargar la apariencia:', error);
      if (data?.appearance_config && typeof data.appearance_config === 'object') setConfig({ ...initialConfig, ...(data.appearance_config as Partial<AppearanceConfig>) });
      setLoading(false);
    });
  }, []);
  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('church_settings').update({ appearance_config: config });
    setSaving(false);
    if (error) { console.error('No se pudo guardar la apariencia:', error); toast.error('No se pudo guardar la apariencia.'); return; }
    toast.success('Apariencia pública guardada.');
  };
  const set = <K extends keyof AppearanceConfig>(key: K, value: AppearanceConfig[K]) => setConfig((current) => ({ ...current, [key]: value }));
  const themes: Array<{ value: Theme; label: string; icon: typeof Sun; desc: string }> = [{ value: 'light', label: 'Modo claro', icon: Sun, desc: 'Brillante y limpio' }, { value: 'dark', label: 'Modo oscuro', icon: Moon, desc: 'Cómodo para poca luz' }, { value: 'system', label: 'Sistema', icon: Monitor, desc: 'Según el dispositivo' }];
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-7">
    <div><h2 className="flex items-center gap-2 text-xl font-black text-gray-900 dark:text-white"><Palette size={20} className="text-gold" /> Identidad y apariencia</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Edita la identidad que verá la congregación y conserva el tema del panel por separado.</p></div>
    <section className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
      <div className="space-y-5 rounded-2xl border border-gray-200 bg-white p-5 dark:border-white/10 dark:bg-slate-950">
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-500">Nombre del sitio<input value={config.site_name} onChange={(e) => set('site_name', e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label><label className="text-xs font-bold uppercase tracking-wider text-gray-500">Frase institucional<input value={config.tagline} onChange={(e) => set('tagline', e.target.value)} className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold normal-case tracking-normal dark:border-white/10 dark:bg-slate-900 dark:text-white" /></label></div>
        <div className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold uppercase tracking-wider text-gray-500">Color principal<input type="color" value={config.primary_color} onChange={(e) => set('primary_color', e.target.value)} className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900" /></label><label className="text-xs font-bold uppercase tracking-wider text-gray-500">Color de acento<input type="color" value={config.accent_color} onChange={(e) => set('accent_color', e.target.value)} className="mt-2 h-11 w-full cursor-pointer rounded-xl border border-gray-200 bg-white p-1 dark:border-white/10 dark:bg-slate-900" /></label></div>
        <div><p className="text-xs font-bold uppercase tracking-wider text-gray-500">Portada pública</p><div className="mt-2 flex gap-2"><button onClick={() => set('hero_media_type', 'image')} className={`rounded-xl border px-4 py-2 text-sm font-bold ${config.hero_media_type === 'image' ? 'border-gold bg-gold/10 text-gold' : 'border-gray-200 text-gray-500 dark:border-white/10'}`}><Image size={15} className="mr-1 inline" /> Imagen</button><button onClick={() => set('hero_media_type', 'video')} className={`rounded-xl border px-4 py-2 text-sm font-bold ${config.hero_media_type === 'video' ? 'border-gold bg-gold/10 text-gold' : 'border-gray-200 text-gray-500 dark:border-white/10'}`}>Vídeo</button></div><input value={config.hero_media_url} onChange={(e) => set('hero_media_url', e.target.value)} placeholder={config.hero_media_type === 'image' ? 'URL de imagen de portada' : 'URL de vídeo de portada'} className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm dark:border-white/10 dark:bg-slate-900 dark:text-white" /></div>
        <label className="flex items-center gap-3 text-sm font-semibold text-gray-600 dark:text-gray-300"><input type="checkbox" checked={config.show_live_badge} onChange={(e) => set('show_live_badge', e.target.checked)} /> Mostrar indicador “En vivo” cuando exista una transmisión</label>
        <button onClick={() => void save()} disabled={saving || loading} className="flex items-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white disabled:opacity-50 dark:bg-white dark:text-slate-950"><Save size={16} />{saving ? 'Guardando…' : 'Guardar apariencia'}</button>
      </div>
      <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-white/10 dark:bg-slate-900/60"><p className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Vista previa</p><div className="overflow-hidden rounded-2xl shadow-xl" style={{ backgroundColor: config.primary_color }}><div className="flex items-center justify-between p-4 text-white"><strong className="font-serif">{config.site_name || 'Nombre de la iglesia'}</strong>{config.show_live_badge && <span className="rounded-full bg-rose-500 px-2 py-1 text-[10px] font-black">● EN VIVO</span>}</div><div className="relative flex min-h-52 items-end overflow-hidden p-5 text-white" style={{ backgroundImage: config.hero_media_type === 'image' && config.hero_media_url ? `linear-gradient(0deg, ${config.primary_color}, transparent), url(${config.hero_media_url})` : `linear-gradient(135deg, ${config.primary_color}, ${config.accent_color})`, backgroundSize: 'cover', backgroundPosition: 'center' }}><div><p className="text-xs uppercase tracking-[0.2em] text-white/70">Comunidad</p><h3 className="mt-1 font-serif text-2xl font-black">{config.tagline || 'Una familia de fe'}</h3><button className="mt-4 rounded-xl px-3 py-2 text-xs font-black text-white" style={{ backgroundColor: config.accent_color }}>Conocer más</button></div></div></div></div>
    </section>
    <section><div className="mb-4"><h3 className="text-base font-black text-gray-900 dark:text-white">Tema del panel administrativo</h3><p className="text-sm text-gray-500">Este ajuste solo afecta tu vista de administración.</p></div><div className="grid gap-3 sm:grid-cols-3">{themes.map(({ value, label, icon: Icon, desc }) => <button key={value} onClick={() => setTheme(value)} className={`rounded-2xl border-2 p-4 text-left transition ${theme === value ? 'border-gold bg-gold/5' : 'border-gray-200 dark:border-white/10'}`}><div className="flex items-center justify-between"><Icon size={20} className={theme === value ? 'text-gold' : 'text-gray-500'} />{theme === value && <Check size={18} className="text-gold" />}</div><strong className="mt-3 block text-sm text-gray-900 dark:text-white">{label}</strong><span className="text-xs text-gray-500">{desc}</span></button>)}</div></section>
  </motion.div>;
}
