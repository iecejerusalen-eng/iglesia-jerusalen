import { motion } from 'framer-motion';

export function OnboardingProgreso({ porcentaje }: { porcentaje: number }) {
  return <div aria-label={`${porcentaje}% completado`} className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700"><motion.div className="h-full rounded-full bg-gradient-to-r from-primary to-gold" initial={{ width: 0 }} animate={{ width: `${porcentaje}%` }} transition={{ duration: 0.55 }} /></div>;
}
