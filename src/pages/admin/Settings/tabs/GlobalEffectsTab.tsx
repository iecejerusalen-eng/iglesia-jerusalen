import { useThemeStore } from '../../../../store/useThemeStore';
import { Layers, Zap, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

const GlobalEffectsTab = () => {
  const { globalEffects, setGlobalEffects } = useThemeStore();

  const handleToggle = (key: keyof typeof globalEffects) => {
    if (typeof globalEffects[key] === 'boolean') {
      setGlobalEffects({ [key]: !globalEffects[key] });
    }
  };

  const handleSelect = (key: keyof typeof globalEffects, value: string) => {
    setGlobalEffects({ [key]: value });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-xl font-serif font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Layers className="text-primary dark:text-gold" size={24} />
          Efectos Globales (Morphism & UI)
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configura los efectos visuales, el comportamiento por defecto de las tablas y las animaciones de la interfaz en todo el panel de administración.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Glassmorphism */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-150 dark:border-white/5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Glassmorphism</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Habilita el efecto de cristal (fondo translúcido con desenfoque) en tarjetas, modales y tablas.
              </p>
            </div>
            <button
              onClick={() => handleToggle('glassmorphism')}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                globalEffects.glassmorphism ? 'bg-primary dark:bg-gold' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.div
                layout
                className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                initial={false}
                animate={{ left: globalEffects.glassmorphism ? 'calc(100% - 22px)' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          
          {globalEffects.glassmorphism && (
            <div className="pt-4 border-t border-gray-200 dark:border-white/10">
              <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 block mb-3">Intensidad del Desenfoque (Blur)</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => handleSelect('blurIntensity', level)}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      globalEffects.blurIntensity === level
                        ? 'bg-primary text-white shadow-md'
                        : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    {level === 'low' ? 'Bajo' : level === 'medium' ? 'Medio' : 'Alto'}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Animaciones */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-150 dark:border-white/5 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-gray-800 dark:text-gray-200">Animaciones Globales</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Habilita las animaciones y micro-interacciones en los componentes del sistema.
              </p>
            </div>
            <button
              onClick={() => handleToggle('animations')}
              className={`w-12 h-6 rounded-full transition-colors relative focus:outline-none ${
                globalEffects.animations ? 'bg-primary dark:bg-gold' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <motion.div
                layout
                className="w-5 h-5 bg-white rounded-full absolute top-0.5"
                initial={false}
                animate={{ left: globalEffects.animations ? 'calc(100% - 22px)' : '2px' }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
          </div>
          <div className="flex items-center justify-center p-6 mt-2 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-gray-200 dark:border-white/10 overflow-hidden relative">
            {globalEffects.animations ? (
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              >
                <Zap className="text-gold" size={32} />
              </motion.div>
            ) : (
              <Zap className="text-gray-400" size={32} />
            )}
            <span className="absolute bottom-2 text-[10px] text-gray-400 uppercase tracking-wider">Preview</span>
          </div>
        </div>

        {/* Vista por Defecto */}
        <div className="bg-gray-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-gray-150 dark:border-white/5 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="text-gray-500 dark:text-gray-400" size={20} />
            <h3 className="font-bold text-gray-800 dark:text-gray-200">Modo de Vista Predeterminado</h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Define cómo se presentarán los datos inicialmente en componentes como gestores (Ministerios, Usuarios, etc.) que soporten la conmutación de vistas.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            {(['table', 'grid', 'list'] as const).map((view) => (
              <button
                key={view}
                onClick={() => handleSelect('defaultTableView', view)}
                className={`flex-1 min-w-[120px] py-3 px-4 rounded-xl font-semibold transition-all flex flex-col items-center justify-center gap-2 border cursor-pointer ${
                  globalEffects.defaultTableView === view
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-primary dark:text-gold border-primary dark:border-gold shadow-sm'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-slate-600'
                }`}
              >
                {view === 'table' ? (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                    <span>Tabla Avanzada</span>
                  </>
                ) : view === 'grid' ? (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                    <span>Tarjetas (Grid)</span>
                  </>
                ) : (
                  <>
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
                    <span>Lista Simple</span>
                  </>
                )}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default GlobalEffectsTab;
