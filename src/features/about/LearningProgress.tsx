import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { learningTopics, type LearningSlug } from './learningContent';
import { useLearningProgress } from './useLearningProgress';

export default function LearningProgress({ topic }: { topic?: LearningSlug }) {
  const { completed, error, toggle, reset } = useLearningProgress();
  const readings = learningTopics.filter(item => item.slug !== 'documentos');
  const next = readings.find(item => !completed.includes(item.slug));
  return <section aria-label="Tu recorrido de aprendizaje" className="my-8 rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/15 dark:bg-slate-900 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="font-serif text-xl font-bold">Tu recorrido de aprendizaje</h2><p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{completed.length} de {readings.length} lecturas marcadas. Se guarda en este dispositivo, sin iniciar sesión.</p></div>{topic && <button type="button" aria-pressed={completed.includes(topic)} disabled={!!error} onClick={() => toggle(topic)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-900 px-4 py-2 font-semibold text-white disabled:opacity-50 dark:bg-amber-300 dark:text-slate-950"><CheckCircle2 size={18} />{completed.includes(topic) ? 'Lectura completada · desmarcar' : 'Marcar como leído'}</button>}</div>
    <progress aria-label="Lecturas completadas" className="mt-4 h-2 w-full accent-amber-500" value={completed.length} max={readings.length} />
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">{!topic && next && <Link to={`/nosotros/${next.slug}`} className="inline-flex min-h-11 items-center font-semibold text-blue-800 underline dark:text-amber-300">Continuar con {next.title}</Link>}{(completed.length > 0 || error) && <button type="button" className="min-h-11 text-slate-600 underline dark:text-slate-300" onClick={() => { if (window.confirm('¿Borrar el progreso de estas lecturas en este dispositivo?')) reset(); }}>Reiniciar progreso</button>}</div>
    {error && <p role="alert" className="mt-3 text-sm text-red-700 dark:text-red-300">{error}</p>}
  </section>;
}
