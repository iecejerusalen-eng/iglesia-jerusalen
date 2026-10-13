import { useState } from 'react';
import { Play } from 'lucide-react';
import { youtubeId, type LearningContent } from './learningDocument';

export default function LearningMedia({ audio }: { audio: NonNullable<LearningContent['audio']> }) {
  const [enabled, setEnabled] = useState(false);
  const [error, setError] = useState(false);
  const id = audio.kind === 'youtube' ? youtubeId(audio.url) : null;
  return <section aria-labelledby="listen-heading" className="space-y-4 border-t border-slate-200 pt-8 dark:border-white/10"><h2 id="listen-heading" className="font-serif text-2xl font-bold">Escucha y aprende el himno</h2><p className="font-semibold">{audio.title}</p><p className="text-sm text-slate-600 dark:text-slate-300">{audio.credit}. La interpretación puede presentar variantes; la letra institucional de esta página proviene del reglamento ecuatoriano.</p>
    {audio.kind === 'youtube' && id ? enabled ? <div className="aspect-video overflow-hidden rounded-xl"><iframe src={`https://www.youtube-nocookie.com/embed/${id}?rel=0`} title={audio.title} allow="encrypted-media; picture-in-picture; fullscreen" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" className="h-full w-full border-0" /></div> : <div className="rounded-2xl bg-slate-100 p-6 dark:bg-white/5"><p className="mb-4 text-sm">Al cargar el reproductor te conectas con YouTube. También puedes abrir la grabación en su canal.</p><button type="button" onClick={() => setEnabled(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-900 px-5 py-3 font-semibold text-white dark:bg-amber-300 dark:text-slate-950"><Play size={18} /> Cargar reproductor</button></div> : <audio controls preload="none" src={audio.url} className="w-full" onError={() => setError(true)} aria-label={audio.title} />}
    {error && <p role="alert">No se pudo reproducir el audio. Abre el enlace de la fuente.</p>}<a href={audio.source} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center font-semibold text-blue-800 underline dark:text-amber-300">{audio.kind === 'youtube' ? 'Escuchar en YouTube' : 'Abrir grabación original'}</a>
  </section>;
}
