import { ChevronDown, ChevronUp, Sparkles, Trophy } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OnboardingPaso } from './OnboardingPaso';
import { OnboardingProgreso } from './OnboardingProgreso';
import type { OnboardingPasoData } from './useOnboarding';

export function OnboardingChecklist({ pasos, porcentaje, completados, puntos, onReopen }: { pasos: OnboardingPasoData[]; porcentaje: number; completados: number; puntos: number; onReopen: () => void }) {
  const [expanded, setExpanded] = useState(false); const navigate = useNavigate();
  if (!pasos.length) return null;
  return <aside className="fixed bottom-4 right-4 z-40 w-[min(23rem,calc(100vw-2rem))]" aria-label="Checklist de onboarding"><div className="overflow-hidden rounded-3xl border border-white/70 bg-white/95 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95"><button type="button" className="w-full p-4 text-left" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-2xl bg-primary text-white"><Sparkles size={19} /></span><div className="min-w-0 flex-1"><p className="text-sm font-black text-slate-900 dark:text-white">{completados}/{pasos.length} pasos completados</p><p className="mt-0.5 text-xs font-semibold text-slate-500">{porcentaje}% · {puntos} pts</p></div>{expanded ? <ChevronDown size={18} /> : <ChevronUp size={18} />}</div><div className="mt-3"><OnboardingProgreso porcentaje={porcentaje} /></div></button>{expanded && <div className="border-t border-slate-100 px-3 pb-3 pt-2 dark:border-white/10"><ul className="space-y-1">{pasos.map((paso) => <OnboardingPaso key={paso.id} paso={paso} onAction={(item) => navigate(item.accion_ruta)} />)}</ul><button type="button" onClick={onReopen} className="mt-2 w-full rounded-xl px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10">Ver introducción de nuevo</button>{porcentaje === 100 && <p className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"><Trophy size={15} /> ¡Onboarding completado! 🎉</p>}</div>}</div></aside>;
}
