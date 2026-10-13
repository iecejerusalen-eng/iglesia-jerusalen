import { useState } from 'react';
import type { LearningContent } from './learningDocument';

export default function LearningQuiz({ questions }: { questions: LearningContent['quiz'] }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  if (!questions.length) return null;
  const answered = questions.filter(q => checked[q.id]);
  const correct = answered.filter(q => answers[q.id] === q.correct);
  return <section aria-labelledby="quiz-heading" className="space-y-6 border-t border-slate-200 pt-8 dark:border-white/10"><h2 id="quiz-heading" className="font-serif text-2xl font-bold">Comprueba lo que aprendiste</h2><p className="leading-7 text-slate-600 dark:text-slate-300">Responde y revisa la explicación. Puedes intentarlo de nuevo; esta práctica no es una evaluación académica.</p>
    {questions.map(q => <form key={q.id} className="space-y-4 rounded-2xl border border-slate-200 p-5 dark:border-white/15" onSubmit={e => { e.preventDefault(); setChecked(current => ({ ...current, [q.id]: true })); }}><fieldset className="space-y-3"><legend className="mb-3 font-semibold">{q.prompt}</legend>{q.options.map((option, i) => <label key={i} className="flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 dark:border-white/10"><input required type="radio" name={q.id} checked={answers[q.id] === i} onChange={() => { setAnswers(current => ({ ...current, [q.id]: i })); setChecked(current => ({ ...current, [q.id]: false })); }} className="mt-1 accent-indigo-800" /><span>{option}</span></label>)}</fieldset><button className="min-h-11 rounded-lg bg-indigo-900 px-4 py-2 font-semibold text-white dark:bg-amber-300 dark:text-slate-950">Comprobar respuesta</button>{checked[q.id] && <p role="status" className="leading-7"><strong>{answers[q.id] === q.correct ? 'Correcto. ' : 'Revisa la lectura. '}</strong>{q.explanation}</p>}</form>)}
    {answered.length > 0 && <p aria-live="polite" className="text-sm font-semibold">{correct.length} respuestas correctas de {answered.length} comprobadas.</p>}
  </section>;
}
