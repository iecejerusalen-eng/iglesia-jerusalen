import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { learningSlugSchema } from '../../features/about/learningDocument';
import { defaultLearningDocuments } from '../../features/about/defaultLearningDocuments';
import { fetchPublishedLearning } from '../../features/about/learningService';
import LearningDocumentView from '../../features/about/LearningDocumentView';

export default function AboutLearning() {
  const slug = learningSlugSchema.parse(useLocation().pathname.split('/')[2]);
  const available = defaultLearningDocuments.find(d => d.slug === slug)!;
  const query = useQuery({ queryKey: ['about-learning', slug], queryFn: () => fetchPublishedLearning(slug), staleTime: 60_000 });
  return <>
    {query.isError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 bg-amber-50 px-6 py-4 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100"><p>No pudimos consultar la edición actualizada. Estás leyendo el texto disponible en el sitio.</p><button type="button" disabled={query.isFetching} onClick={() => void query.refetch()} className="min-h-11 px-4 font-semibold underline">Reintentar</button></div>}
    {query.isPending && <p role="status" className="bg-slate-50 px-6 py-3 text-sm dark:bg-slate-950">Consultando la edición publicada…</p>}
    <LearningDocumentView document={query.data ?? available} published={query.data} />
  </>;
}
