import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export type VolumetricIconTone =
  | 'amber' | 'blue' | 'cyan' | 'emerald' | 'green' | 'indigo' | 'orange'
  | 'pink' | 'purple' | 'red' | 'rose' | 'sky' | 'slate' | 'teal' | 'yellow';

interface ToneStyle {
  shell: string;
  depth: string;
  face: string;
}

const TONE_STYLES: Record<VolumetricIconTone, ToneStyle> = {
  amber: { shell: 'border-amber-200/90 bg-gradient-to-br from-white via-amber-50 to-amber-300 shadow-amber-600/20 dark:border-amber-200/10 dark:from-amber-950/70 dark:via-amber-900/60 dark:to-orange-900/70', depth: 'text-amber-950/45 dark:text-black/50', face: 'text-amber-600 dark:text-amber-200' },
  blue: { shell: 'border-blue-200/90 bg-gradient-to-br from-white via-blue-50 to-blue-300 shadow-blue-600/20 dark:border-blue-200/10 dark:from-blue-950/70 dark:via-blue-900/60 dark:to-indigo-900/70', depth: 'text-blue-950/45 dark:text-black/50', face: 'text-blue-600 dark:text-blue-200' },
  cyan: { shell: 'border-cyan-200/90 bg-gradient-to-br from-white via-cyan-50 to-cyan-300 shadow-cyan-600/20 dark:border-cyan-200/10 dark:from-cyan-950/70 dark:via-cyan-900/60 dark:to-sky-900/70', depth: 'text-cyan-950/45 dark:text-black/50', face: 'text-cyan-600 dark:text-cyan-200' },
  emerald: { shell: 'border-emerald-200/90 bg-gradient-to-br from-white via-emerald-50 to-emerald-300 shadow-emerald-600/20 dark:border-emerald-200/10 dark:from-emerald-950/70 dark:via-emerald-900/60 dark:to-green-900/70', depth: 'text-emerald-950/45 dark:text-black/50', face: 'text-emerald-600 dark:text-emerald-200' },
  green: { shell: 'border-green-200/90 bg-gradient-to-br from-white via-green-50 to-green-300 shadow-green-600/20 dark:border-green-200/10 dark:from-green-950/70 dark:via-green-900/60 dark:to-emerald-900/70', depth: 'text-green-950/45 dark:text-black/50', face: 'text-green-600 dark:text-green-200' },
  indigo: { shell: 'border-indigo-200/90 bg-gradient-to-br from-white via-indigo-50 to-indigo-300 shadow-indigo-600/20 dark:border-indigo-200/10 dark:from-indigo-950/70 dark:via-indigo-900/60 dark:to-blue-900/70', depth: 'text-indigo-950/45 dark:text-black/50', face: 'text-indigo-600 dark:text-indigo-200' },
  orange: { shell: 'border-orange-200/90 bg-gradient-to-br from-white via-orange-50 to-orange-300 shadow-orange-600/20 dark:border-orange-200/10 dark:from-orange-950/70 dark:via-orange-900/60 dark:to-red-900/70', depth: 'text-orange-950/45 dark:text-black/50', face: 'text-orange-600 dark:text-orange-200' },
  pink: { shell: 'border-pink-200/90 bg-gradient-to-br from-white via-pink-50 to-pink-300 shadow-pink-600/20 dark:border-pink-200/10 dark:from-pink-950/70 dark:via-pink-900/60 dark:to-rose-900/70', depth: 'text-pink-950/45 dark:text-black/50', face: 'text-pink-600 dark:text-pink-200' },
  purple: { shell: 'border-purple-200/90 bg-gradient-to-br from-white via-purple-50 to-purple-300 shadow-purple-600/20 dark:border-purple-200/10 dark:from-purple-950/70 dark:via-purple-900/60 dark:to-violet-900/70', depth: 'text-purple-950/45 dark:text-black/50', face: 'text-purple-600 dark:text-purple-200' },
  red: { shell: 'border-red-200/90 bg-gradient-to-br from-white via-red-50 to-red-300 shadow-red-600/20 dark:border-red-200/10 dark:from-red-950/70 dark:via-red-900/60 dark:to-rose-900/70', depth: 'text-red-950/45 dark:text-black/50', face: 'text-red-600 dark:text-red-200' },
  rose: { shell: 'border-rose-200/90 bg-gradient-to-br from-white via-rose-50 to-rose-300 shadow-rose-600/20 dark:border-rose-200/10 dark:from-rose-950/70 dark:via-rose-900/60 dark:to-red-900/70', depth: 'text-rose-950/45 dark:text-black/50', face: 'text-rose-600 dark:text-rose-200' },
  sky: { shell: 'border-sky-200/90 bg-gradient-to-br from-white via-sky-50 to-sky-300 shadow-sky-600/20 dark:border-sky-200/10 dark:from-sky-950/70 dark:via-sky-900/60 dark:to-cyan-900/70', depth: 'text-sky-950/45 dark:text-black/50', face: 'text-sky-600 dark:text-sky-200' },
  slate: { shell: 'border-slate-200/90 bg-gradient-to-br from-white via-slate-50 to-slate-300 shadow-slate-600/20 dark:border-slate-200/10 dark:from-slate-800/70 dark:via-slate-800/60 dark:to-slate-700/70', depth: 'text-slate-950/45 dark:text-black/50', face: 'text-slate-600 dark:text-slate-200' },
  teal: { shell: 'border-teal-200/90 bg-gradient-to-br from-white via-teal-50 to-teal-300 shadow-teal-600/20 dark:border-teal-200/10 dark:from-teal-950/70 dark:via-teal-900/60 dark:to-cyan-900/70', depth: 'text-teal-950/45 dark:text-black/50', face: 'text-teal-600 dark:text-teal-200' },
  yellow: { shell: 'border-yellow-200/90 bg-gradient-to-br from-white via-yellow-50 to-yellow-300 shadow-yellow-600/20 dark:border-yellow-200/10 dark:from-yellow-950/70 dark:via-yellow-900/60 dark:to-amber-900/70', depth: 'text-yellow-950/45 dark:text-black/50', face: 'text-yellow-700 dark:text-yellow-200' },
};

interface VolumetricIconProps {
  tone: VolumetricIconTone;
  icon?: LucideIcon;
  imageSrc?: string;
  children?: ReactNode;
  className?: string;
}

export default function VolumetricIcon({ tone, icon: Icon, imageSrc, children, className = '' }: VolumetricIconProps) {
  const palette = TONE_STYLES[tone];

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-[1.05rem] border shadow-[inset_0_1px_0_rgba(255,255,255,.95),inset_0_-3px_6px_rgba(15,23,42,.12),0_8px_14px_-9px_currentColor] ${palette.shell} ${className}`}
    >
      <span aria-hidden="true" className="absolute inset-[2px] rounded-[.92rem] border border-white/65 shadow-[inset_0_1px_2px_rgba(255,255,255,.72)] dark:border-white/10" />
      <span aria-hidden="true" className="absolute -left-1 -top-2 size-8 rounded-full bg-white/75 blur-md dark:bg-white/15" />
      {imageSrc ? (
        <img src={imageSrc} alt="" className="relative z-10 size-[2.15rem] object-contain drop-shadow-[0_3px_3px_rgba(15,23,42,.24)]" />
      ) : Icon ? (
        <>
          <Icon size={24} strokeWidth={3.2} className={`absolute translate-x-[1.4px] translate-y-[2px] ${palette.depth}`} />
          <Icon size={21} strokeWidth={2.3} className={`relative drop-shadow-[0_1px_0_rgba(255,255,255,.9)] drop-shadow-[0_2px_2px_rgba(15,23,42,.25)] dark:drop-shadow-[0_1px_0_rgba(255,255,255,.25)] dark:drop-shadow-[0_2px_2px_rgba(0,0,0,.4)] ${palette.face}`} />
        </>
      ) : (
        <span className="relative drop-shadow-[0_2px_2px_rgba(15,23,42,.32)]">{children}</span>
      )}
    </span>
  );
}
