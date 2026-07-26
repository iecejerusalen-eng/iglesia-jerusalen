import type { ReactNode } from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '../../../lib/utils';

interface ShinyButtonProps extends HTMLMotionProps<'button'> {
  children: ReactNode;
  className?: string;
  shinyColor?: string;
  onClick?: () => void;
}

export function ShinyButton({
  children,
  className,
  shinyColor = '#ffffff',
  onClick,
  ...props
}: ShinyButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={cn(
        'relative radial-gradient overflow-hidden rounded-xl bg-indigo-600 dark:bg-indigo-700 px-6 py-3 font-bold text-white text-xs uppercase tracking-wider shadow-lg hover:shadow-indigo-500/30 dark:hover:shadow-indigo-900/50 transition-all duration-300 cursor-pointer',
        className
      )}
      {...props}
    >
      <span
        className="absolute inset-0 block h-full w-full pointer-events-none"
        style={{
          background: `linear-gradient(120deg, transparent 0%, transparent 40%, ${shinyColor}40 50%, transparent 60%, transparent 100%)`,
          backgroundSize: '200% 100%',
          animation: 'shiny-shimmer 3s infinite linear',
        }}
      />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </motion.button>
  );
}
