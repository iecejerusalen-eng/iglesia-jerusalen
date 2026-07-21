import { AnimeFadeUp, AnimeStaggerGrid } from '../../../components/animations/AnimeWrappers';
import { Award, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import DOMPurify from 'dompurify';

interface Badge {
  id: string;
  badge_name: string;
  badge_svg: string;
  awarded_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function StudentBadges({ badges, onSelectBadge }: { badges: Badge[], onSelectBadge?: (badge: any) => void }) {
  if (!badges || badges.length === 0) {
    return (
      <AnimeFadeUp delay={100} className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-gray-150 dark:border-white/10 shadow-sm">
        <div className="w-24 h-24 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Award size={40} className="text-gray-300 dark:text-gray-600" />
        </div>
        <h3 className="text-xl font-bold font-serif mb-2">Aún no tienes insignias</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Completa tus cursos al 100% para obtener medallas y diplomas que certifiquen tu aprendizaje.
        </p>
      </AnimeFadeUp>
    );
  }

  return (
    <AnimeStaggerGrid staggerDelay={100} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {badges.map((badge) => (
        <motion.div 
          key={badge.id}
          className="group perspective-1000"
          onClick={() => onSelectBadge && onSelectBadge({
            id: badge.id,
            name: badge.badge_name,
            description: 'Insignia obtenida por tu desempeño',
            icon_url: badge.badge_svg,
            unlocked_at: badge.awarded_at
          })}
          whileHover={{ y: -5 }}
        >
          <div className="relative transform-style-3d transition-transform duration-500 group-hover:rotate-y-12">
            <div className={`bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-150 dark:border-white/10 shadow-sm flex flex-col items-center text-center group ${onSelectBadge ? 'cursor-pointer hover:border-gold/50' : ''} transition-shadow relative overflow-hidden`}>
              
              {/* Glassmorphism shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/40 to-white/0 dark:from-white/0 dark:via-white/5 dark:to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {/* Badge SVG Render */}
              <div 
                className="w-24 h-24 flex items-center justify-center drop-shadow-xl"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(badge.badge_svg) }}
              />
              
              <div className="space-y-1 z-10">
                <h4 className="font-bold font-serif text-sm text-slate-800 dark:text-white leading-tight">
                  {badge.badge_name}
                </h4>
                <p className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-center gap-1">
                  <ShieldCheck size={12} className="text-emerald-500" />
                  {new Date(badge.awarded_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </AnimeStaggerGrid>
  );
}
