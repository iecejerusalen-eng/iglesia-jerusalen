import { motion } from 'framer-motion';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type Theme } from '../../../../store/useThemeStore';

const AppearanceTab = () => {
  const { theme, setTheme } = useThemeStore();

  const themeOptions: { value: Theme; label: string; icon: React.ElementType, desc: string }[] = [
    { value: 'light', label: 'Modo Claro', icon: Sun, desc: 'Interfaz brillante para entornos iluminados.' },
    { value: 'dark', label: 'Modo Oscuro', icon: Moon, desc: 'Colores oscuros para reducir la fatiga visual.' },
    { value: 'system', label: 'Sistema', icon: Monitor, desc: 'Se adapta automáticamente a la configuración del SO.' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Sun size={20} className="text-gold" />
          Tema Visual
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Elige cómo quieres que se vea la plataforma en tu dispositivo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {themeOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className={`relative flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center group overflow-hidden ${
                isActive 
                  ? 'border-gold bg-gold/5 shadow-md shadow-gold/10' 
                  : 'border-gray-200 dark:border-slate-800 hover:border-gold/50 bg-white dark:bg-slate-900 hover:shadow-lg'
              }`}
            >
              <div className={`p-4 rounded-full mb-3 transition-colors ${
                isActive ? 'bg-gold text-white' : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 group-hover:bg-gold/20 group-hover:text-gold'
              }`}>
                <Icon size={28} />
              </div>
              <h3 className={`font-bold text-base mb-1 ${isActive ? 'text-gold' : 'text-gray-800 dark:text-white'}`}>{opt.label}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              
              {isActive && (
                <motion.div layoutId="active-theme-outline" className="absolute inset-0 rounded-2xl border-2 border-gold pointer-events-none" />
              )}
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default AppearanceTab;
