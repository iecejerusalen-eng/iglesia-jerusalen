import React from 'react';
import { motion } from 'framer-motion';
import { type LucideIcon, Plus, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  actionUrl?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  secondaryActionLabel?: string;
  secondaryActionUrl?: string;
  onSecondaryAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionUrl,
  onAction,
  actionIcon: ActionIcon = Plus,
  secondaryActionLabel,
  secondaryActionUrl,
  onSecondaryAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-3xl border border-dashed border-slate-200/90 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/30 backdrop-blur-sm ${className}`}
    >
      <div className="relative mb-5 flex items-center justify-center">
        <div className="absolute -inset-2 rounded-full bg-primary/10 dark:bg-gold/10 blur-xl animate-pulse pointer-events-none" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-primary/15 via-blue-500/10 to-gold/15 text-primary dark:text-gold border border-primary/20 dark:border-gold/20 shadow-inner">
          <Icon size={32} strokeWidth={2} />
        </div>
      </div>

      <h4 className="font-serif text-lg sm:text-xl font-bold text-slate-900 dark:text-white max-w-sm">
        {title}
      </h4>
      <p className="mt-2 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">
        {description}
      </p>

      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-xs">
          {actionLabel && (
            actionUrl ? (
              <Link
                to={actionUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/25 transition-transform active:scale-95"
              >
                <ActionIcon size={16} />
                {actionLabel}
              </Link>
            ) : (
              <button
                type="button"
                onClick={onAction}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs sm:text-sm shadow-md shadow-primary/25 transition-transform active:scale-95 cursor-pointer"
              >
                <ActionIcon size={16} />
                {actionLabel}
              </button>
            )
          )}

          {secondaryActionLabel && (
            secondaryActionUrl ? (
              <Link
                to={secondaryActionUrl}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors"
              >
                {secondaryActionLabel}
                <ArrowRight size={14} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={onSecondaryAction}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-xs sm:text-sm transition-colors cursor-pointer"
              >
                {secondaryActionLabel}
                <ArrowRight size={14} />
              </button>
            )
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
