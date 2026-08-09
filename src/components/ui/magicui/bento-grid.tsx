import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BentoItemProps {
  name: string;
  className?: string;
  background?: ReactNode;
  Icon?: React.ElementType;
  description: string;
  href?: string;
  cta?: string;
  badge?: string;
  badgeColor?: string;
  onClick?: () => void;
  children?: ReactNode;
}

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'grid w-full auto-rows-[22rem] grid-cols-1 md:grid-cols-3 gap-4',
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta = 'Explorar',
  badge,
  badgeColor = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  onClick,
  children,
}: BentoItemProps) {
  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'group relative col-span-1 flex flex-col justify-between overflow-hidden rounded-3xl',
        'bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-white/10 shadow-lg hover:shadow-2xl transition-all duration-300',
        className
      )}
    >
      {/* Background layer */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {background}
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent z-10" />
      </div>

      {/* Header Badge & Icon */}
      <div className="relative z-20 flex items-start justify-between p-4 sm:p-6">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200/60 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shadow-xs group-hover:scale-110 transition-transform duration-300">
            <Icon size={24} />
          </div>
        )}
        {badge && (
          <span className={cn('text-[10px] font-extrabold uppercase tracking-wider px-3 py-1 rounded-full border leading-none backdrop-blur-xs', badgeColor)}>
            {badge}
          </span>
        )}
      </div>

      {/* Content Body */}
      <div className="relative z-20 flex flex-col justify-end gap-2 p-4 pt-2 sm:p-6 sm:pt-3">
        <h3 className="text-lg font-bold tracking-tight text-slate-900 transition-colors group-hover:text-indigo-600 dark:text-white dark:group-hover:text-indigo-400 sm:text-xl">
          {name}
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-normal">
          {description}
        </p>

        {/* CTA Button */}
        {href ? (
          <Link
            to={href}
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform duration-200 cursor-pointer"
          >
            <span>{cta}</span>
            <ArrowRight size={14} />
          </Link>
        ) : onClick ? (
          <button
            type="button"
            onClick={onClick}
            className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform duration-200 cursor-pointer bg-transparent border-none p-0"
          >
            <span>{cta}</span>
            <ArrowRight size={14} />
          </button>
        ) : null}

        {children && (
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 flex flex-col">
            {children}
          </div>
        )}
      </div>
    </motion.div>
  );
}
