import React, { useState, useEffect } from 'react';
import { supabase } from '../../config/supabase';
import { 
  Sparkles, ToggleLeft, ToggleRight, Settings, 
  Trash2, PlusCircle, CheckCircle, X, Save 
} from 'lucide-react';
import { AnimeStaggerGrid } from '../../components/animations/AnimeWrappers';
import { toast } from 'sonner';
import { logAuditEvent } from '../../utils/auditLogger';

interface PluginItem {
  id: string;
  name: string;
  description: string;
  type: 'activity' | 'block' | 'theme' | 'filter';
  status: 'active' | 'inactive';
  settings: Record<string, any>;
  version: string;
  created_at?: string;
  updated_at?: string;
}

export default function PluginManager() {
  const [plugins, setPlugins] = useState<PluginItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'activity' | 'block' | 'theme' | 'filter'>('all');
  
  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedPlugin, setSelectedPlugin] = useState<PluginItem | null>(null);
  const [customSettings, setCustomSettings] = useState<string>('');
  
  const [isInstallOpen, setIsInstallOpen] = useState(false);
  const [newPluginName, setNewPluginName] = useState('');
  const [newPluginType, setNewPluginType] = useState<'activity' | 'block' | 'theme' | 'filter'>('activity');
  const [newPluginDesc, setNewPluginDesc] = useState('');

  useEffect(() => {
    fetchPlugins();
  }, []);

  const fetchPlugins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_plugins')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setPlugins(data || []);
    } catch (err) {
      console.error('Error fetching plugins:', err);
      toast.error('Error al cargar la lista de extensiones');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (plugin: PluginItem) => {
    const nextStatus = plugin.status === 'active' ? 'inactive' : 'active';
    try {
      const { error } = await supabase
        .from('system_plugins')
        .update({ 
          status: nextStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', plugin.id);

      if (error) throw error;
      
      await logAuditEvent('PLUGIN_TOGGLE', 'system_plugins', plugin.id, {
        name: plugin.name,
        status: nextStatus
      });
      
      setPlugins(prev => prev.map(p => p.id === plugin.id ? { ...p, status: nextStatus } : p));
      toast.success(`Extensión "${plugin.name}" ${nextStatus === 'active' ? 'activada' : 'desactivada'} con éxito`);
    } catch (err) {
      console.error(err);
      toast.error('No se pudo cambiar el estado del plugin');
    }
  };

  const handleOpenSettings = (plugin: PluginItem) => {
    setSelectedPlugin(plugin);
    setCustomSettings(JSON.stringify(plugin.settings, null, 2));
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = async () => {
    if (!selectedPlugin) return;
    try {
      const parsedSettings = JSON.parse(customSettings);
      const { error } = await supabase
        .from('system_plugins')
        .update({ 
          settings: parsedSettings,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPlugin.id);

      if (error) throw error;
      
      await logAuditEvent('UPDATE', 'system_plugins', selectedPlugin.id, {
        name: selectedPlugin.name,
        action_detail: 'save_settings',
        settings: parsedSettings
      });
      
      setPlugins(prev => prev.map(p => p.id === selectedPlugin.id ? { ...p, settings: parsedSettings } : p));
      toast.success('Configuración de extensión guardada');
      setIsSettingsOpen(false);
    } catch (err) {
      toast.error('Formato JSON inválido. Revisa la sintaxis.');
    }
  };

  const handleUninstall = async (pluginId: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente la extensión "${name}"?`)) return;
    try {
      const { error } = await supabase
        .from('system_plugins')
        .delete()
        .eq('id', pluginId);

      if (error) throw error;
      
      await logAuditEvent('DELETE', 'system_plugins', pluginId, {
        name
      });
      
      setPlugins(prev => prev.filter(p => p.id !== pluginId));
      toast.success(`Extensión "${name}" desinstalada correctamente`);
    } catch (err) {
      console.error(err);
      toast.error('Error al desinstalar el plugin');
    }
  };

  const handleInstallPlugin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPluginName) return;

    try {
      const newPlugin = {
        name: newPluginName,
        description: newPluginDesc,
        type: newPluginType,
        status: 'inactive' as const,
        version: '1.0.0',
        settings: { enabled: true, debug: false }
      };

      const { data, error } = await supabase
        .from('system_plugins')
        .insert([newPlugin])
        .select();

      if (error) throw error;
      
      if (data && data.length > 0) {
        await logAuditEvent('CREATE', 'system_plugins', data[0].id, {
          name: newPluginName,
          type: newPluginType
        });
      }
      
      if (data) {
        setPlugins(prev => [...prev, data[0]].sort((a, b) => a.name.localeCompare(b.name)));
      }
      
      toast.success(`Extensión "${newPluginName}" instalada en estado inactivo`);
      setIsInstallOpen(false);
      setNewPluginName('');
      setNewPluginDesc('');
    } catch (err) {
      console.error(err);
      toast.error('Error al instalar la extensión. Verifica si ya existe.');
    }
  };

  const filteredPlugins = plugins.filter(
    p => activeTab === 'all' || p.type === activeTab
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-3">
            <Sparkles className="text-gold animate-pulse" size={32} />
            Gestor de Extensiones (Plugins)
          </h1>
          <p className="text-slate-600 dark:text-gray-400 mt-1">
            Instala, actualiza, configura o elimina módulos de actividades, bloques laterales, temas visuales y filtros de contenido.
          </p>
        </div>
        <button
          onClick={() => setIsInstallOpen(true)}
          className="bg-gold hover:bg-yellow-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md hover:-translate-y-0.5"
        >
          <PlusCircle size={20} />
          Subir Extensión (.zip / manifest)
        </button>
      </div>

      {/* Tabs Menu */}
      <div className="flex border-b border-gray-200 dark:border-white/10 overflow-x-auto pb-px gap-2">
        {(['all', 'activity', 'block', 'theme', 'filter'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 font-serif font-bold text-xs uppercase tracking-wider border-b-2 transition-all shrink-0 cursor-pointer ${
              activeTab === tab 
                ? 'border-gold text-gold font-extrabold' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab === 'all' ? 'Todos' : tab === 'activity' ? 'Módulos Actividad' : tab === 'block' ? 'Bloques' : tab === 'theme' ? 'Temas Visuales' : 'Filtros'}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-24">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold"></div>
        </div>
      ) : filteredPlugins.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-white/10">
          <Sparkles className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No hay extensiones en esta categoría</h3>
          <p className="text-gray-500 dark:text-gray-400">
            Intenta subir un nuevo módulo o habilitar las actividades por defecto.
          </p>
        </div>
      ) : (
        <AnimeStaggerGrid className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" staggerDelay={50} duration={600}>
          {filteredPlugins.map(plugin => (
            <div
              key={plugin.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between hover:shadow-lg transition-all duration-300 group relative overflow-hidden ${
                plugin.status === 'active' 
                  ? 'border-gold/30 dark:border-gold/20' 
                  : 'border-gray-200 dark:border-white/5 opacity-80'
              }`}
            >
              {/* Active accent background glow */}
              {plugin.status === 'active' && (
                <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
              )}

              <div className="space-y-4 text-left">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                      plugin.type === 'activity' ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400' :
                      plugin.type === 'block' ? 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400' :
                      plugin.type === 'theme' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' :
                      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    }`}>
                      {plugin.type}
                    </span>
                    <h3 className="font-serif font-bold text-sm text-gray-800 dark:text-gray-100 mt-1 line-clamp-1">{plugin.name}</h3>
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono font-bold">v{plugin.version}</span>
                </div>

                {/* Description */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed min-h-12 line-clamp-3">
                  {plugin.description || 'Sin descripción disponible.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-4 mt-5">
                <button
                  onClick={() => handleToggleStatus(plugin)}
                  className={`flex items-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                    plugin.status === 'active' 
                      ? 'text-gold' 
                      : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  }`}
                >
                  {plugin.status === 'active' ? (
                    <>
                      <ToggleRight size={22} className="text-gold" />
                      Activo
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={22} className="text-gray-400" />
                      Inactivo
                    </>
                  )}
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenSettings(plugin)}
                    className="p-2 text-gray-400 hover:text-gold hover:bg-gold/10 rounded-xl transition-all cursor-pointer"
                    title="Configuración"
                  >
                    <Settings size={16} />
                  </button>
                  <button
                    onClick={() => handleUninstall(plugin.id, plugin.name)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                    title="Desinstalar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </AnimeStaggerGrid>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && selectedPlugin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <Settings size={20} className="text-gold" />
                Configurar: {selectedPlugin.name}
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-450 dark:text-gray-400 uppercase tracking-wider mb-2">Parámetros JSON de la extensión</label>
                <textarea
                  rows={8}
                  value={customSettings}
                  onChange={(e) => setCustomSettings(e.target.value)}
                  className="w-full p-4 font-mono text-xs bg-slate-950 text-emerald-400 rounded-xl border border-gray-300 dark:border-white/10 outline-none focus:border-gold"
                  placeholder='{ "param": true }'
                />
              </div>
              <p className="text-[10px] text-gray-400 leading-normal">
                Modifica los parámetros de inicialización del plugin en formato JSON válido. Un JSON incorrecto puede deshabilitar las cargas del módulo.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSettings}
                className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Save size={16} />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Install Modal */}
      {isInstallOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <form onSubmit={handleInstallPlugin} className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b border-gray-150 dark:border-white/10">
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <PlusCircle size={20} className="text-gold" />
                Subir Extensión
              </h2>
              <button 
                type="button"
                onClick={() => setIsInstallOpen(false)}
                className="text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 rounded-full transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Nombre de la Extensión *</label>
                <input
                  type="text"
                  required
                  value={newPluginName}
                  onChange={(e) => setNewPluginName(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-gold focus:border-gold text-xs"
                  placeholder="Ej. Chat de Asistencia Virtual"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Tipo de Extensión</label>
                <select
                  value={newPluginType}
                  onChange={(e) => setNewPluginType(e.target.value as any)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-gold focus:border-gold text-xs"
                >
                  <option value="activity">Módulo de Actividad</option>
                  <option value="block">Bloque Lateral</option>
                  <option value="theme">Tema Visual</option>
                  <option value="filter">Filtro de Contenido</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">Descripción</label>
                <textarea
                  rows={3}
                  value={newPluginDesc}
                  onChange={(e) => setNewPluginDesc(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-55 dark:bg-slate-800 border border-gray-300 dark:border-white/10 rounded-lg outline-none focus:ring-1 focus:ring-gold focus:border-gold text-xs"
                  placeholder="Explica qué hace este plugin..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-150 dark:border-white/10 bg-gray-50 dark:bg-slate-950/20">
              <button
                type="button"
                onClick={() => setIsInstallOpen(false)}
                className="px-5 py-2 border border-gray-350 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 transition-all font-medium text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-gold hover:bg-yellow-600 text-white rounded-lg transition-all font-medium text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle size={16} />
                Instalar Módulo
              </button>
            </div>
          </form>
        </div>
      )}
      
    </div>
  );
}
