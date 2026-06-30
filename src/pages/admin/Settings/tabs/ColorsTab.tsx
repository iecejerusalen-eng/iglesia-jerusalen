import { motion } from 'framer-motion';
import { Palette, CheckCircle2 } from 'lucide-react';
import { useThemeStore } from '../../../../store/useThemeStore';

const colorOptions = [
  { value: '#D97706', label: 'Dorado Jerusalén', desc: 'Clásico y elegante.' },
  { value: '#0EA5E9', label: 'Azul Cielo', desc: 'Frescura y claridad.' },
  { value: '#7C3AED', label: 'Púrpura Real', desc: 'Creativo y moderno.' },
  { value: '#10B981', label: 'Verde Esmeralda', desc: 'Naturaleza y calma.' },
  { value: '#EF4444', label: 'Rojo Carmesí', desc: 'Energía y pasión.' },
  { value: '#F43F5E', label: 'Rosa Vivo', desc: 'Vibrante y audaz.' },
];

const ColorsTab = () => {
  const { accentColor, setAccentColor } = useThemeStore();

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Palette size={20} className="text-gold" />
          Color de Acento
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Define el color principal que resaltará en botones, enlaces y elementos activos.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {colorOptions.map((color) => {
          const isActive = accentColor === color.value || (!accentColor && color.value === '#D97706');
          
          return (
            <button
              key={color.value}
              onClick={() => setAccentColor(color.value)}
              className={`relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                isActive 
                  ? 'border-gold bg-gold/5 shadow-md shadow-gold/10' 
                  : 'border-gray-200 dark:border-slate-800 hover:border-gold/30 bg-white dark:bg-slate-900 hover:shadow-lg'
              }`}
            >
              <div className="flex items-center gap-3 mb-2 w-full">
                <div 
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm shrink-0 transition-transform ${isActive ? 'scale-110' : ''}`}
                  style={{ backgroundColor: color.value }}
                >
                  {isActive && <CheckCircle2 size={20} className="text-white drop-shadow-md" />}
                </div>
                <div className="text-left">
                  <h3 className={`font-bold text-sm ${isActive ? 'text-gold' : 'text-gray-800 dark:text-white'}`}>{color.label}</h3>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-left mt-1">{color.desc}</p>
              
              {isActive && (
                <motion.div layoutId="active-color-outline" className="absolute inset-0 rounded-2xl border-2 border-gold pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
      
      {/* Mockup Preview */}
      <div className="mt-8 p-6 rounded-2xl bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Vista Previa</h3>
        <div className="flex gap-4 items-center flex-wrap">
          <button className="px-5 py-2.5 rounded-xl text-white font-semibold shadow-md transition-transform hover:-translate-y-1" style={{ backgroundColor: accentColor || '#D97706' }}>
            Botón Primario
          </button>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: `${accentColor || '#D97706'}15`, color: accentColor || '#D97706' }}>
            <Palette size={18} />
            <span className="font-bold text-sm">Elemento Activo</span>
          </div>
          <div className="h-2 flex-grow rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
            <div className="h-full w-2/3 rounded-full" style={{ backgroundColor: accentColor || '#D97706' }} />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ColorsTab;
