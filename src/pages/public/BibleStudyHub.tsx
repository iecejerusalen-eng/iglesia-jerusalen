import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDownRight, ArrowRight, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Compass, Map, MapPin,
  Play, ScrollText, Search, Sparkles, UsersRound, Waves,
} from 'lucide-react';
import { BibleVerseLink } from '../../components/ui/BibleVerseLink';
import QuadrangularSymbol from '../../components/public/QuadrangularSymbol';
import { bibleStudyAtlasMapEntries, bibleStudyEventEntries, bibleStudyMapLocationEntries, bibleStudyPatriarchLocationEntries, bibleStudyPeopleEntries, bibleStudyPlaceEntries, bibleStudyQuadrangularCoreValues, bibleStudyQuadrangularEntries, type BibleStudyAtlasMapEntry, type BibleStudyPlaceEntry } from '../../data/bibleStudyEncyclopedia';
import { bibleStudySources } from '../../data/bibleStudySources';
import { bibleOverviewTimeline, exodusTimeline, jesusTimeline, patriarchsTimeline } from '../../data/bibleStudyTimeline';
import BibleBookCatalog from '../../components/public/bible/BibleBookCatalog';
import { BIBLE_BOOKS } from '../../config/bibleBooks';
import { parseBibleReferences } from '../../utils/bibleParser';

type StudySection = 'books' | 'atlas' | 'encyclopedia' | 'chronology';
type EncyclopediaKind = 'places' | 'people' | 'events' | 'faith';
type ChronologyScope = 'overview' | 'acts' | 'patriarchs' | 'jesus' | 'exodus';

type SavedStudy = {
  version: 1;
  section: StudySection;
  atlasMapId: string;
  gospelLocationId: string;
  patriarchLocationId: string;
  routeStopId: string;
  encyclopediaKind: EncyclopediaKind;
  encyclopediaEntryId: string;
  chronologyScope: ChronologyScope;
  milestoneId: string;
};

const savedStudyKey = 'iecejerusalen:bible-study:last-session:v1';

function readSavedStudy(): SavedStudy | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved: unknown = JSON.parse(window.localStorage.getItem(savedStudyKey) ?? 'null');
    if (typeof saved !== 'object' || saved === null) return null;
    const value = saved as Record<string, unknown>;
    const validSection = value.section === 'books' || value.section === 'atlas' || value.section === 'encyclopedia' || value.section === 'chronology';
    const validKind = value.encyclopediaKind === 'places' || value.encyclopediaKind === 'people' || value.encyclopediaKind === 'events' || value.encyclopediaKind === 'faith';
    const validScope = value.chronologyScope === 'overview' || value.chronologyScope === 'acts' || value.chronologyScope === 'patriarchs' || value.chronologyScope === 'jesus' || value.chronologyScope === 'exodus';
    const validEntry = validKind && (value.encyclopediaKind === 'places' ? bibleStudyPlaceEntries : value.encyclopediaKind === 'people' ? bibleStudyPeopleEntries : value.encyclopediaKind === 'events' ? bibleStudyEventEntries : bibleStudyQuadrangularEntries).some((entry) => entry.id === value.encyclopediaEntryId);
    const validMilestone = bibleStudyEventEntries.some((entry) => entry.id === value.milestoneId) || jesusTimeline.some((entry) => entry.id === value.milestoneId) || patriarchsTimeline.some((entry) => entry.id === value.milestoneId) || exodusTimeline.some((entry) => entry.id === value.milestoneId);
    const patriarchLocationId = typeof value.patriarchLocationId === 'string' ? value.patriarchLocationId : 'haran';
    if (value.version !== 1 || !validSection || !validKind || !validScope || !validEntry || !validMilestone || typeof value.atlasMapId !== 'string' || !bibleStudyAtlasMapEntries.some((entry) => entry.id === value.atlasMapId) || typeof value.gospelLocationId !== 'string' || !bibleStudyMapLocationEntries.some((entry) => entry.id === value.gospelLocationId) || !bibleStudyPatriarchLocationEntries.some((entry) => entry.id === patriarchLocationId) || typeof value.routeStopId !== 'string' || !stops.some((entry) => entry.id === value.routeStopId)) return null;
    return { ...value, patriarchLocationId } as SavedStudy;
  } catch {
    return null;
  }
}

function savedStudyTitle(saved: SavedStudy): string {
  if (saved.section === 'books') return 'Catálogo bíblico';
  if (saved.section === 'atlas') {
    if (saved.atlasMapId === 'paul-journeys') return stops.find((entry) => entry.id === saved.routeStopId)?.name ?? 'Viaje a Roma';
    if (saved.atlasMapId === 'palestine-new-testament') return bibleStudyMapLocationEntries.find((entry) => entry.id === saved.gospelLocationId)?.title ?? 'Palestina';
    if (saved.atlasMapId === 'patriarchs') return bibleStudyPatriarchLocationEntries.find((entry) => entry.id === saved.patriarchLocationId)?.title ?? 'El mundo de los patriarcas';
    return bibleStudyAtlasMapEntries.find((entry) => entry.id === saved.atlasMapId)?.title ?? 'Atlas bíblico';
  }
  if (saved.section === 'encyclopedia') {
    const entries = saved.encyclopediaKind === 'places' ? bibleStudyPlaceEntries : saved.encyclopediaKind === 'people' ? bibleStudyPeopleEntries : saved.encyclopediaKind === 'events' ? bibleStudyEventEntries : bibleStudyQuadrangularEntries;
    return entries.find((entry) => entry.id === saved.encyclopediaEntryId)?.title ?? 'Enciclopedia';
  }
  if (saved.chronologyScope === 'acts') return bibleStudyEventEntries.find((entry) => entry.id === saved.milestoneId)?.title ?? 'Viaje de Pablo';
  if (saved.chronologyScope === 'jesus') return 'Vida de Jesús';
  if (saved.chronologyScope === 'patriarchs') return 'Historia patriarcal';
  if (saved.chronologyScope === 'exodus') return exodusTimeline.find((entry) => entry.id === saved.milestoneId)?.title ?? 'Éxodo y Canaán';
  return 'Panorama bíblico';
}

const stops = [
  { id: 'caesarea', name: 'Cesarea', region: 'Judea', x: 1179, y: 642, references: ['Hechos 27:1-2'], note: 'Pablo embarca bajo custodia rumbo a Roma.', people: ['paul', 'julius', 'aristarchus'] },
  { id: 'sidon', name: 'Sidón', region: 'Fenicia', x: 1182, y: 575, references: ['Hechos 27:3'], note: 'Julio permite a Pablo visitar a sus amigos.', people: ['paul', 'julius'] },
  { id: 'myra', name: 'Mira', region: 'Licia', x: 904, y: 444, references: ['Hechos 27:5-6'], note: 'El grupo cambia de nave y continúa hacia el oeste.', people: ['paul', 'aristarchus'] },
  { id: 'cnidus', name: 'Cnido', region: 'Caria', x: 773, y: 438, references: ['Hechos 27:7'], note: 'El viento contrario hace lento el avance hacia Creta.', people: ['paul', 'aristarchus'] },
  { id: 'fair-havens', name: 'Buenos Puertos', region: 'Creta', x: 616, y: 530, references: ['Hechos 27:8-12'], note: 'La nave llega a un refugio en Creta; la tripulación debate si pasar allí el invierno.', people: ['paul'] },
  { id: 'malta', name: 'Malta', region: 'Mediterráneo central', x: 141, y: 478, references: ['Hechos 27:39-44', 'Hechos 28:1-10'], note: 'Tras la tormenta, todos llegan a tierra; la narración identifica la isla como Malta.', people: ['paul', 'publius'] },
  { id: 'syracuse', name: 'Siracusa', region: 'Sicilia', x: 164, y: 410, references: ['Hechos 28:11-12'], note: 'La nave hace escala durante tres días en Sicilia.', people: ['paul'] },
  { id: 'rhegium', name: 'Regio', region: 'Sur de Italia', x: 201, y: 341, references: ['Hechos 28:13'], note: 'Al día siguiente, la nave llega a Regio.', people: ['paul'] },
  { id: 'puteoli', name: 'Puteoli', region: 'Campania', x: 132, y: 194, references: ['Hechos 28:13-14'], note: 'Pablo encuentra allí hermanos y permanece con ellos siete días.', people: ['paul'] },
  { id: 'rome', name: 'Roma', region: 'Italia', x: 82, y: 91, references: ['Hechos 28:15-16'], note: 'Los hermanos salen a recibir a Pablo y el viaje concluye en Roma.', people: ['paul'] },
];

const milestones = bibleStudyEventEntries;

function ReferenceLinks({ references, className = '' }: { references: string[]; className?: string }) {
  return <span className="inline-flex flex-wrap items-center gap-x-2 gap-y-1">{references.map((reference, index) => <span key={reference} className="inline-flex items-center gap-2">{index > 0 && <span aria-hidden="true" className="text-slate-400">·</span>}<BibleVerseLink reference={reference} className={className} /></span>)}</span>;
}

function previousVerseHref(reference: string) {
  const parsed = parseBibleReferences(reference).find((item) => item.bookId && item.chapter);
  const currentVerse = Number(parsed?.verses.match(/\d+/)?.[0]);
  if (!parsed || !Number.isInteger(currentVerse) || currentVerse <= 1) return null;

  const params = new URLSearchParams({ libro: parsed.bookId, capitulo: parsed.chapter, versiculo: String(currentVerse - 1) });
  return `/recursos/biblia?${params.toString()}`;
}

function nextChapterHref(reference: string) {
  const parsed = parseBibleReferences(reference).find((item) => item.bookId && item.chapter);
  if (!parsed) return null;
  const book = BIBLE_BOOKS.find((item) => item.id === parsed.bookId);
  const chapter = Number(parsed.chapter);
  if (!book || !Number.isInteger(chapter) || chapter >= book.chapters) return null;

  const params = new URLSearchParams({ libro: parsed.bookId, capitulo: String(chapter + 1) });
  return `/recursos/biblia?${params.toString()}`;
}

function PlaceSourceNote({ entry }: { entry: BibleStudyPlaceEntry | undefined }) {
  if (!entry) return null;
  return <div className="mt-6 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400">{entry.dictionaryEntry ? <><strong className="text-slate-700 dark:text-slate-200">Procedencia:</strong> traducción y síntesis de “{entry.dictionaryEntry}”, <a href="https://tyndaleopenresources.com/" target="_blank" rel="noreferrer" className="font-semibold underline decoration-amber-500/50 underline-offset-2">Tyndale Open Bible Dictionary 1.6</a>, Tyndale House Publishers. Se resumió, tradujo y reorganizó el contenido; esta adaptación se comparte bajo <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="font-semibold underline decoration-amber-500/50 underline-offset-2">CC BY-SA 4.0</a>.</> : <><strong className="text-slate-700 dark:text-slate-200">Base de esta ficha:</strong> síntesis editorial de los pasajes bíblicos enlazados arriba. No se añade una identificación arqueológica ni una fecha que el texto no establezca.</>}</div>;
}

function StaticAtlasMap({ map }: { map: BibleStudyAtlasMapEntry }) {
  return <article className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_65px_-45px_rgba(21,31,47,.5)] dark:border-white/10 dark:bg-slate-950">
    <div className="border-b border-slate-200 bg-[#fbfaf6] px-4 py-3 dark:border-white/10 dark:bg-slate-900/80 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">{map.period}</p><h3 className="mt-1 font-serif text-xl">{map.title}</h3></div>
    <div className="grid min-h-64 place-items-center bg-slate-100 p-2 dark:bg-slate-950 sm:p-4"><a href={map.imagePath} target="_blank" rel="noreferrer" aria-label={`Abrir mapa en tamaño completo: ${map.title}`} className="block max-w-full rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"><img src={map.imagePath} alt={map.imageAlt} loading="lazy" decoding="async" className="w-full object-contain" style={{ maxHeight: '72svh' }} /></a></div>
    <div className="space-y-3 border-t border-slate-200 bg-[#fbfaf6] p-4 dark:border-white/10 dark:bg-slate-900/80 sm:p-5"><p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{map.summary}</p><div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs"><span className="font-bold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">Lee el pasaje</span><ReferenceLinks references={map.references} className="font-bold text-blue-800 dark:text-amber-200" /></div><p className="text-xs leading-5 text-slate-500 dark:text-slate-400">{map.note}</p><p className="border-t border-slate-200 pt-3 text-[11px] text-slate-500 dark:border-white/10 dark:text-slate-400">Mapa: ChurchMaps · {map.sourceVersion} · dominio público · <a href="https://churchmaps.info/index.html" target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline decoration-amber-500/60 underline-offset-2 dark:text-amber-200">fuente y versiones</a></p></div>
  </article>;
}

function ExodusAtlasMap({ map, selectedSceneId, onSelectScene, onOpenScene }: {
  map: BibleStudyAtlasMapEntry;
  selectedSceneId: string;
  onSelectScene: (sceneId: string) => void;
  onOpenScene: (sceneId: string) => void;
}) {
  const selectedScene = exodusTimeline.find((scene) => scene.id === selectedSceneId) ?? exodusTimeline[0];
  const selectedIndex = exodusTimeline.findIndex((scene) => scene.id === selectedScene.id);

  return <article className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_65px_-45px_rgba(21,31,47,.5)] dark:border-white/10 dark:bg-slate-950">
    <div className="border-b border-slate-200 bg-[#fbfaf6] px-4 py-3 dark:border-white/10 dark:bg-slate-900/80 sm:px-5"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">{map.period}</p><h3 className="mt-1 font-serif text-xl">El trayecto en su contexto</h3></div>
    <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.85fr)]">
      <div className="min-w-0">
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 dark:border-white/10 dark:bg-slate-900">
          <div className="relative mx-auto w-full overflow-hidden rounded-lg" style={{ aspectRatio: '2600 / 1945' }}>
            <img src={map.imagePath} alt={map.imageAlt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
          </div>
          <figcaption className="px-2 pb-1 pt-3 text-xs leading-5 text-slate-600 dark:text-slate-300">Las flechas muestran un recorrido tradicional propuesto por la fuente; varios topónimos llevan «?» por ser discutidos. Contrasta el mapa con el relato.</figcaption>
        </figure>
        <a href={map.imagePath} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-xs font-semibold text-blue-800 underline decoration-amber-500/60 underline-offset-2 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200 dark:hover:text-white">Abrir mapa completo <ArrowRight size={12} /></a>
      </div>
      <div className="min-w-0 rounded-2xl border border-slate-200 bg-[#fbfaf6] p-3 dark:border-white/10 dark:bg-slate-900/70 sm:p-4">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-amber-800 dark:text-amber-200">Cronología conectada</p><h4 className="mt-1 font-serif text-lg">Hitos del relato</h4></div><span className="shrink-0 rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">{selectedIndex + 1} / {exodusTimeline.length}</span></div>
        <div role="group" aria-label="Seleccionar un hito del Éxodo" className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2 lg:grid-cols-1" style={{ maxHeight: '16rem', overflowY: 'auto' }}>
          {exodusTimeline.map((scene, index) => <button key={scene.id} type="button" aria-pressed={scene.id === selectedScene.id} onClick={() => onSelectScene(scene.id)} className={`flex min-h-11 items-center gap-2 rounded-xl border px-2.5 py-2 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${scene.id === selectedScene.id ? 'border-amber-500/50 bg-amber-100/80 text-amber-950 dark:border-amber-200/30 dark:bg-amber-200/10 dark:text-amber-100' : 'border-transparent bg-white/75 text-slate-700 hover:border-slate-200 hover:bg-white dark:bg-white/[.03] dark:text-slate-200 dark:hover:border-white/10 dark:hover:bg-white/[.06]'}`}>
            <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${scene.id === selectedScene.id ? 'bg-amber-500 text-white dark:bg-amber-200 dark:text-slate-950' : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300'}`}>{String(index + 1).padStart(2, '0')}</span><span className="line-clamp-2 text-xs font-semibold leading-4">{scene.title}</span>
          </button>)}
        </div>
        <section aria-live="polite" className="mt-3 rounded-xl border border-amber-800/15 bg-white p-3 dark:border-amber-200/10 dark:bg-slate-950">
          <p className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-800 dark:text-amber-200">{selectedScene.era}</p><h5 className="mt-1 font-serif text-lg leading-snug">{selectedScene.title}</h5><p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">{selectedScene.summary}</p>
          <div className="mt-2 text-xs"><ReferenceLinks references={selectedScene.references} className="font-bold text-blue-800 dark:text-amber-200" /></div>
          <button type="button" onClick={() => onOpenScene(selectedScene.id)} className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#13213a] px-4 py-2 text-xs font-bold text-white transition hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-200 dark:text-slate-950 dark:hover:bg-white/10"><BookOpen size={14} /> Abrir hito y reflexión <ArrowRight size={13} /></button>
        </section>
      </div>
    </div>
    <p className="border-t border-slate-200 bg-[#fbfaf6] px-4 py-3 text-[11px] text-slate-500 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">Mapa: ChurchMaps · {map.sourceVersion} · dominio público · <a href="https://churchmaps.info/index.html" target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline decoration-amber-500/60 underline-offset-2 dark:text-amber-200">fuente y versiones</a></p>
  </article>;
}

function PalestineAtlasMap({ selectedLocationId, onSelectLocation, onOpenScene, onOpenPerson }: {
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  onOpenScene: (id: string) => void;
  onOpenPerson: (id: string) => void;
}) {
  const map = bibleStudyAtlasMapEntries.find((entry) => entry.id === 'palestine-new-testament')!;
  const location = bibleStudyMapLocationEntries.find((entry) => entry.id === selectedLocationId) ?? bibleStudyMapLocationEntries[0];
  const scenes = location.sceneIds.map((id) => jesusTimeline.find((scene) => scene.id === id)).filter((scene) => scene !== undefined);
  return <article className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_65px_-45px_rgba(21,31,47,.5)] dark:border-white/10 dark:bg-slate-950">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-[#fbfaf6] px-4 py-3 dark:border-white/10 dark:bg-slate-900/80 sm:px-5"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">{map.period}</p><h3 className="mt-1 font-serif text-xl">Explora Galilea y Judea</h3></div><span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">{bibleStudyMapLocationEntries.length} lugares</span></div>
    <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.85fr)]">
      <div className="min-w-0">
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 dark:border-white/10 dark:bg-slate-900">
          <div className="relative mx-auto" style={{ width: 'min(100%, calc(72svh * 0.683846))', aspectRatio: '1778 / 2600' }}>
            <img src={map.imagePath} alt={map.imageAlt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
            {bibleStudyMapLocationEntries.map((point, index) => <button key={point.id} type="button" onClick={() => onSelectLocation(point.id)} aria-label={`Ubicar ${point.title}, ${point.region}`} aria-pressed={location.id === point.id} title={point.title} style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} className={`absolute z-10 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-black shadow-lg transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${location.id === point.id ? 'bg-amber-300 text-slate-950' : 'bg-[#13213a] text-white'}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></button>)}
          </div>
          <figcaption className="px-2 pb-1 pt-3 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Puntos orientativos para acompañar la lectura; no son coordenadas arqueológicas. <a href={map.imagePath} target="_blank" rel="noreferrer" className="font-bold text-blue-800 underline decoration-amber-500/50 underline-offset-2 dark:text-amber-200">Abrir mapa completo</a></figcaption>
        </figure>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Lugares de los Evangelios">
          {bibleStudyMapLocationEntries.map((point, index) => <button key={point.id} type="button" onClick={() => onSelectLocation(point.id)} aria-pressed={location.id === point.id} className={`min-w-0 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${location.id === point.id ? 'border-[#13213a] bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-amber-600/50 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200'}`}><span className="mr-1.5 text-amber-700 dark:text-amber-200">{String(index + 1).padStart(2, '0')}</span>{point.title}</button>)}
        </div>
      </div>
      <section aria-live="polite" aria-label={`Lectura bíblica de ${location.title}`} className="flex min-w-0 flex-col rounded-2xl border border-amber-900/10 bg-[#fbfaf6] p-4 dark:border-amber-200/10 dark:bg-slate-900/80 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">{location.region}</p><h4 className="mt-2 font-serif text-2xl">{location.title}</h4><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{location.summary}</p>
        <div className="mt-4 border-t border-slate-200 pt-4 text-sm dark:border-white/10"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Lee en la Biblia</p><ReferenceLinks references={location.references} className="font-bold text-blue-800 dark:text-amber-200" /></div>
        {location.identificationSource && <div className="mt-4 rounded-xl border border-amber-700/15 bg-amber-50/70 p-3 dark:border-amber-200/10 dark:bg-amber-200/5" aria-label={`Identificaciones geográficas propuestas para ${location.title}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-amber-900 dark:text-amber-100">Posibles ubicaciones modernas</p><a href={location.identificationSource.url} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-800 underline decoration-amber-500/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200">Fuente · OpenBible.info</a></div><ul className="mt-2 space-y-1.5">{location.identificationSource.candidates.map((candidate, index) => <li key={candidate.name} className="flex flex-wrap items-baseline justify-between gap-x-3 text-xs"><span className="font-semibold text-slate-800 dark:text-slate-100">{candidate.name}{index === 0 && <span className="ml-1.5 text-[10px] font-normal text-slate-500 dark:text-slate-400">· identificación principal en esta ficha</span>}</span><span className="shrink-0 text-[10px] text-slate-600 dark:text-slate-300">{candidate.confidence}</span></li>)}</ul><p className="mt-2 text-[10px] leading-4 text-slate-600 dark:text-slate-300">Las estimaciones y etiquetas de confianza resumen las fuentes consultadas por OpenBible.info; no son probabilidades absolutas ni una revisión exhaustiva. El pin del mapa es solo orientativo.</p></div>}
        {location.image && <figure className="mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-white/10 dark:bg-slate-950"><div style={{ aspectRatio: `${location.image.width} / ${location.image.height}` }}><img src={location.image.src} alt={location.image.alt} width={location.image.width} height={location.image.height} loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div><figcaption className="px-3 py-2 text-[10px] leading-4 text-slate-600 dark:text-slate-300"><span className="block">{location.image.caption}</span><span className="mt-1 block">Foto: {location.image.author} · <a href={location.image.sourceUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline decoration-amber-500/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200">ver fuente</a> · {location.image.licenseUrl ? <a href={location.image.licenseUrl} target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline decoration-amber-500/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200">{location.image.license}</a> : <span>{location.image.license}</span>}</span></figcaption></figure>}
        {location.people.length > 0 && <div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Personas del relato</p><div className="flex flex-wrap gap-2">{location.people.map((personId) => bibleStudyPeopleEntries.find((person) => person.id === personId)).filter((person) => person !== undefined).map((person) => <button key={person.id} type="button" onClick={() => onOpenPerson(person.id)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><UsersRound size={11} className="text-amber-700 dark:text-amber-200" />{person.title}</button>)}</div></div>}
        {scenes.length > 0 && <div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Escenas relacionadas</p><div className="flex flex-col gap-1.5">{scenes.map((scene) => <button key={scene.id} type="button" onClick={() => onOpenScene(scene.id)} className="flex items-center justify-between gap-3 rounded-xl border border-amber-700/15 bg-amber-50/70 px-3 py-2 text-left text-xs font-bold text-amber-950 transition hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-amber-100"><span>{scene.title}</span><ArrowRight size={13} className="shrink-0" /></button>)}</div></div>}
      </section>
    </div>
    <div className="border-t border-slate-200 bg-[#fbfaf6] px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">ChurchMaps · {map.sourceVersion} · dominio público declarado por su fuente · <a href="https://churchmaps.info/index.html" target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline decoration-amber-500/50 underline-offset-2 dark:text-amber-200">procedencia y versiones</a></div>
  </article>;
}

function PatriarchAtlasMap({ selectedLocationId, onSelectLocation, onOpenScene, onOpenPerson, onOpenPlace }: {
  selectedLocationId: string;
  onSelectLocation: (id: string) => void;
  onOpenScene: (id: string) => void;
  onOpenPerson: (id: string) => void;
  onOpenPlace: (id: string) => void;
}) {
  const map = bibleStudyAtlasMapEntries.find((entry) => entry.id === 'patriarchs')!;
  const location = bibleStudyPatriarchLocationEntries.find((entry) => entry.id === selectedLocationId) ?? bibleStudyPatriarchLocationEntries[0];
  const scenes = location.sceneIds.map((id) => patriarchsTimeline.find((scene) => scene.id === id)).filter((scene) => scene !== undefined);
  return <article className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_65px_-45px_rgba(21,31,47,.5)] dark:border-white/10 dark:bg-slate-950">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 bg-[#fbfaf6] px-4 py-3 dark:border-white/10 dark:bg-slate-900/80 sm:px-5"><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">{map.period}</p><h3 className="mt-1 font-serif text-xl">Sigue los lugares de Génesis</h3></div><span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">{bibleStudyPatriarchLocationEntries.length} lugares</span></div>
    <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.85fr)]">
      <div className="min-w-0">
        <figure className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 p-2 dark:border-white/10 dark:bg-slate-900">
          <div className="relative mx-auto" style={{ width: 'min(100%, calc(72svh * 1.3933516))', aspectRatio: '2600 / 1866' }}>
            <img src={map.imagePath} alt={map.imageAlt} loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-contain" />
            {bibleStudyPatriarchLocationEntries.map((point, index) => <button key={point.id} type="button" onClick={() => onSelectLocation(point.id)} aria-label={`Ubicar ${point.title}, ${point.region}`} aria-pressed={location.id === point.id} title={point.title} style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }} className={`absolute z-10 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-[10px] font-black shadow-lg transition hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${location.id === point.id ? 'bg-amber-300 text-slate-950' : 'bg-[#13213a] text-white'}`}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></button>)}
          </div>
          <figcaption className="px-2 pb-1 pt-3 text-[10px] leading-4 text-slate-500 dark:text-slate-400">Cada número corresponde a un lugar de la lista. Los pines son orientativos: no son coordenadas arqueológicas ni trazan una ruta exacta. <a href={map.imagePath} target="_blank" rel="noreferrer" className="font-bold text-blue-800 underline decoration-amber-500/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200">Abrir mapa completo</a></figcaption>
        </figure>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label="Lugares de Génesis">
          {bibleStudyPatriarchLocationEntries.map((point, index) => <button key={point.id} type="button" onClick={() => onSelectLocation(point.id)} aria-pressed={location.id === point.id} className={`min-w-0 rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${location.id === point.id ? 'border-[#13213a] bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-amber-600/50 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200'}`}><span className="mr-1.5 text-amber-700 dark:text-amber-200">{String(index + 1).padStart(2, '0')}</span>{point.title}</button>)}
        </div>
      </div>
      <section aria-live="polite" aria-label={`Lectura bíblica de ${location.title}`} className="flex min-w-0 flex-col rounded-2xl border border-amber-900/10 bg-[#fbfaf6] p-4 dark:border-amber-200/10 dark:bg-slate-900/80 sm:p-5">
        <p className="text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">{location.region}</p><h4 className="mt-2 font-serif text-2xl">{location.title}</h4><p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{location.summary}</p>
        <button type="button" onClick={() => onOpenPlace(location.id)} className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-amber-700/15 bg-amber-50/70 px-3 py-2 text-left text-xs font-bold text-amber-950 transition hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-amber-100"><BookOpen size={13} /> Abrir ficha en la Enciclopedia</button>
        <div className="mt-4 border-t border-slate-200 pt-4 text-sm dark:border-white/10"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Lee en la Biblia</p><ReferenceLinks references={location.references} className="font-bold text-blue-800 dark:text-amber-200" /></div>
        {location.people.length > 0 && <div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Personas del relato</p><div className="flex flex-wrap gap-2">{location.people.map((personId) => bibleStudyPeopleEntries.find((person) => person.id === personId)).filter((person) => person !== undefined).map((person) => <button key={person.id} type="button" onClick={() => onOpenPerson(person.id)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><UsersRound size={11} className="text-amber-700 dark:text-amber-200" />{person.title}</button>)}</div></div>}
        {scenes.length > 0 && <div className="mt-4"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Escenas de Génesis</p><div className="flex flex-col gap-1.5">{scenes.map((scene) => <button key={scene.id} type="button" onClick={() => onOpenScene(scene.id)} className="flex items-center justify-between gap-3 rounded-xl border border-amber-700/15 bg-amber-50/70 px-3 py-2 text-left text-xs font-bold text-amber-950 transition hover:border-amber-500/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-amber-100"><span>{scene.title}</span><ArrowRight size={13} className="shrink-0" /></button>)}</div></div>}
      </section>
    </div>
    <div className="border-t border-slate-200 bg-[#fbfaf6] px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-400">ChurchMaps · {map.sourceVersion} · dominio público declarado por su fuente · <a href="https://churchmaps.info/index.html" target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline decoration-amber-500/50 underline-offset-2 dark:text-amber-200">procedencia y versiones</a></div>
  </article>;
}

const heroBySection: Record<StudySection, { lead: string; accent: string; description: string }> = {
  books: { lead: 'Abre la Escritura,', accent: 'libro por libro.', description: 'Explora los 66 libros y sus capítulos por secciones. Empieza con la introducción a Génesis, conoce el Pentateuco y conecta cada pasaje con el lector bíblico compartido.' },
  atlas: { lead: 'Explora el mundo bíblico,', accent: 'mapa a mapa.', description: 'Ubica los lugares, sigue las rutas y conecta cada mapa con el relato bíblico, su contexto y el lector compartido.' },
  encyclopedia: { lead: 'Entra en el relato,', accent: 'con más contexto.', description: 'Consulta lugares, personas, acontecimientos y los cuatro énfasis del Evangelio Cuadrangular, unidos a sus pasajes bíblicos.' },
  chronology: { lead: 'Sigue la historia bíblica,', accent: 'paso a paso.', description: 'Recorre el panorama de la Escritura o explora con más detalle un episodio y su lugar en el relato.' },
};

const actsVideoUrl = 'https://stream.mux.com/MCPI1zGzBZhfuZz4Fa01QcB5Ium501WQ8xGr6sWD21BeA/high.mp4';
const actsVideoPoster = 'https://ik.imagekit.io/bpweb1/web/media/video-images/luke-acts/bound-for-rome/tr:q-90,w-600/bound-for-rome_16.9.jpg';
const actsVideoPage = 'https://bibleproject.com/es/videos/evangelio-hechos-4/';

function MediterraneanRoute({ selectedStop, onSelect }: { selectedStop: string; onSelect: (id: string) => void }) {
  const mapViewportRef = useRef<HTMLDivElement>(null);
  const activePlace = stops.find((place) => place.id === selectedStop);

  useEffect(() => {
    const viewport = mapViewportRef.current;
    if (!viewport || !activePlace || viewport.scrollWidth <= viewport.clientWidth) return;

    const markerX = (activePlace.x / 1400) * viewport.scrollWidth;
    const targetLeft = Math.max(0, Math.min(
      markerX - viewport.clientWidth / 2,
      viewport.scrollWidth - viewport.clientWidth,
    ));
    viewport.scrollTo({
      left: targetLeft,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    });
  }, [activePlace]);

  return (
    <div className="overflow-hidden rounded-[1.7rem] border border-slate-200 bg-white shadow-[0_24px_65px_-45px_rgba(21,31,47,.5)] dark:border-white/10 dark:bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-[#fbfaf6] px-4 py-3 dark:border-white/10 dark:bg-slate-900/80 sm:px-5">
        <div className="rounded-full border border-amber-700/15 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-700 shadow-sm dark:border-amber-200/15 dark:bg-slate-950 dark:text-slate-200">Ruta narrada en Hechos 27–28</div>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-300"><Compass size={13} className="text-amber-700 dark:text-amber-200" /> Oriente · Mediterráneo · Roma</span>
      </div>
      <div
        ref={mapViewportRef}
        role="region"
        aria-label="Mapa desplazable del viaje de Pablo"
        tabIndex={0}
        className="relative overflow-x-auto overscroll-x-contain bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 dark:bg-slate-950"
      >
        <p className="border-b border-slate-200 bg-[#fbfaf6] px-4 py-2 text-[11px] leading-5 text-slate-600 dark:border-white/10 dark:bg-slate-900 dark:text-slate-300 md:hidden">
          Desliza el mapa para recorrerlo; al elegir una parada abajo, la verás centrada aquí.
        </p>
        <div className="relative min-w-[760px] lg:min-w-0">
          <img src="/images/bible-study/paul-journey-map.webp" alt="Mapa cartográfico de los viajes del apóstol Pablo por el Mediterráneo" className="block h-auto w-full" />
          <svg viewBox="0 0 1400 965" preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="group" aria-label="Paradas interactivas del viaje narrado en Hechos 27 y 28">
          <defs><filter id="atlas-marker-glow" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
          {stops.map((place, index) => {
            const active = selectedStop === place.id;
            return <g key={place.id} onClick={() => onSelect(place.id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelect(place.id); } }} role="button" tabIndex={0} aria-label={`${place.name}, ${place.region}. ${place.references.join('; ')}`} aria-pressed={active} className="cursor-pointer outline-none">
              <circle cx={place.x} cy={place.y} r={active ? 25 : 20} fill="#bd8427" fillOpacity=".38" filter={active ? 'url(#atlas-marker-glow)' : undefined} />
              <circle cx={place.x} cy={place.y} r={active ? 13 : 10} fill={active ? '#11213a' : '#fffaf0'} stroke="#a66d17" strokeWidth="4" />
              <text x={place.x} y={place.y + 4.5} textAnchor="middle" fontSize="12" fontWeight="800" fill={active ? '#fff4d0' : '#70470f'} paintOrder="stroke" stroke="#fff9e9" strokeWidth="2">{index + 1}</text>
            </g>;
          })}
          </svg>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-[#fbfaf6] px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300 sm:px-5">
        <span>La línea discontinua marca el tramo menos definido de la travesía.</span>
        <a href="https://churchmaps.info/index.html" target="_blank" rel="noreferrer" className="font-semibold text-blue-800 underline decoration-amber-500/60 underline-offset-2 hover:text-amber-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200">Mapa: ChurchMaps · v1.5 (2020) · dominio público</a>
      </div>
      <nav aria-label="Escalas del viaje de Pablo" className="flex gap-2 overflow-x-auto border-t border-slate-200 p-3 dark:border-white/10 sm:flex-wrap sm:overflow-visible sm:p-4">
        {stops.map((place, index) => <button key={place.id} type="button" onClick={() => onSelect(place.id)} aria-pressed={selectedStop === place.id} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${selectedStop === place.id ? 'border-amber-700 bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 hover:border-amber-600/50 hover:text-amber-800 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-amber-200'}`}><span className="mr-1.5 text-amber-700 dark:text-amber-200">{String(index + 1).padStart(2, '0')}</span>{place.name}</button>)}
      </nav>
    </div>
  );
}

export default function BibleStudyHub() {
  const [section, setSection] = useState<StudySection>('books');
  const [selectedAtlasMapId, setSelectedAtlasMapId] = useState('paul-journeys');
  const [selectedGospelLocationId, setSelectedGospelLocationId] = useState('jerusalem');
  const [selectedPatriarchLocationId, setSelectedPatriarchLocationId] = useState('haran');
  const [selectedStop, setSelectedStop] = useState('malta');
  const [encyclopediaEntryId, setEncyclopediaEntryId] = useState('malta');
  const [encyclopediaQuery, setEncyclopediaQuery] = useState('');
  const [encyclopediaKind, setEncyclopediaKind] = useState<EncyclopediaKind>('places');
  const [selectedMilestoneId, setSelectedMilestoneId] = useState('shipwreck');
  const [chronologyScope, setChronologyScope] = useState<ChronologyScope>('overview');
  const [savedStudy] = useState<SavedStudy | null>(readSavedStudy);
  const [hasInteracted, setHasInteracted] = useState(false);
  const pendingMilestoneScrollRef = useRef<string | null>(null);
  const heroContent = heroBySection[section];
  const wideStudyView = section === 'books' || section === 'chronology' || section === 'encyclopedia';
  const selectedAtlasMap = bibleStudyAtlasMapEntries.find((map) => map.id === selectedAtlasMapId) ?? bibleStudyAtlasMapEntries[0];
  const stop = useMemo(() => stops.find((item) => item.id === selectedStop) ?? stops[0], [selectedStop]);
  const atlasReference = selectedAtlasMap.id === 'paul-journeys'
    ? stop.references[0]
    : selectedAtlasMap.id === 'palestine-new-testament'
      ? bibleStudyMapLocationEntries.find((item) => item.id === selectedGospelLocationId)?.references[0] ?? selectedAtlasMap.references[0]
      : selectedAtlasMap.id === 'patriarchs'
        ? bibleStudyPatriarchLocationEntries.find((item) => item.id === selectedPatriarchLocationId)?.references[0] ?? selectedAtlasMap.references[0]
        : selectedAtlasMap.references[0];
  const previousVerse = previousVerseHref(atlasReference);
  const nextChapter = nextChapterHref(atlasReference);
  const relatedPeople = stop.people.map((personId) => bibleStudyPeopleEntries.find((person) => person.id === personId)).filter((person) => person !== undefined);
  const relatedEvents = bibleStudyEventEntries.filter((event) => event.placeIds.includes(stop.id));
  const selectedStudyEvent = relatedEvents.find((event) => event.id === selectedMilestoneId) ?? relatedEvents[0] ?? bibleStudyEventEntries[0];
  const filteredEncyclopediaEntries = useMemo(() => {
    const entries = encyclopediaKind === 'places' ? bibleStudyPlaceEntries : encyclopediaKind === 'people' ? bibleStudyPeopleEntries : encyclopediaKind === 'events' ? bibleStudyEventEntries : bibleStudyQuadrangularEntries;
    const query = encyclopediaQuery.trim().toLocaleLowerCase('es');
    if (!query) return entries;
    return entries.filter((entry) => `${entry.title} ${entry.region} ${entry.summary} ${entry.context}`.toLocaleLowerCase('es').includes(query));
  }, [encyclopediaKind, encyclopediaQuery]);
  const encyclopediaEntry = filteredEncyclopediaEntries.find((entry) => entry.id === encyclopediaEntryId) ?? filteredEncyclopediaEntries[0];

  useEffect(() => {
    if (!hasInteracted) return;
    const snapshot: SavedStudy = { version: 1, section, atlasMapId: selectedAtlasMapId, gospelLocationId: selectedGospelLocationId, patriarchLocationId: selectedPatriarchLocationId, routeStopId: selectedStop, encyclopediaKind, encyclopediaEntryId, chronologyScope, milestoneId: selectedMilestoneId };
    try {
      window.localStorage.setItem(savedStudyKey, JSON.stringify(snapshot));
    } catch {
      // El estudio funciona normalmente aunque el navegador no permita guardar el avance local.
    }
  }, [hasInteracted, section, selectedAtlasMapId, selectedGospelLocationId, selectedPatriarchLocationId, selectedStop, encyclopediaKind, encyclopediaEntryId, chronologyScope, selectedMilestoneId]);

  useEffect(() => {
    const milestoneId = pendingMilestoneScrollRef.current;
    if (section !== 'chronology' || !milestoneId || (chronologyScope === 'acts' && milestoneId !== selectedMilestoneId)) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`milestone-${milestoneId}`)?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
        block: 'center',
      });
      pendingMilestoneScrollRef.current = null;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [section, selectedMilestoneId, chronologyScope]);

  const openChronologyAt = (milestoneId: string) => {
    pendingMilestoneScrollRef.current = milestoneId;
    setSelectedMilestoneId(milestoneId);
    setChronologyScope('acts');
    setSection('chronology');
  };

  const openJesusTimelineAt = (sceneId: string) => {
    pendingMilestoneScrollRef.current = sceneId;
    setSelectedMilestoneId(sceneId);
    setChronologyScope('jesus');
    setSection('chronology');
  };

  const openPatriarchTimelineAt = (sceneId: string, locationId?: string) => {
    const scene = patriarchsTimeline.find((item) => item.id === sceneId);
    const relatedLocationId = locationId ?? scene?.locationIds?.[0];
    if (relatedLocationId) setSelectedPatriarchLocationId(relatedLocationId);
    pendingMilestoneScrollRef.current = sceneId;
    setSelectedMilestoneId(sceneId);
    setChronologyScope('patriarchs');
    setSection('chronology');
  };

  const openExodusTimelineAt = (sceneId: string) => {
    pendingMilestoneScrollRef.current = sceneId;
    setSelectedMilestoneId(sceneId);
    setChronologyScope('exodus');
    setSection('chronology');
  };

  const openPatriarchAtlasAt = (locationId?: string) => {
    if (locationId) setSelectedPatriarchLocationId(locationId);
    setSelectedAtlasMapId('patriarchs');
    setSection('atlas');
  };

  const openEncyclopediaPerson = (personId: string) => {
    setEncyclopediaKind('people');
    setEncyclopediaEntryId(personId);
    setEncyclopediaQuery('');
    setSection('encyclopedia');
  };

  const openEncyclopediaPlace = (placeId: string) => {
    setEncyclopediaKind('places');
    setEncyclopediaEntryId(`genesis-${placeId}`);
    setEncyclopediaQuery('');
    setSection('encyclopedia');
  };

  const openPlaceInAtlas = (entry: BibleStudyPlaceEntry) => {
    if (entry.atlasMapId === 'patriarchs') {
      setSelectedAtlasMapId('patriarchs');
      if (entry.atlasLocationId) setSelectedPatriarchLocationId(entry.atlasLocationId);
    } else if (entry.placeId && stops.some((place) => place.id === entry.placeId)) {
      setSelectedAtlasMapId('paul-journeys');
      setSelectedStop(entry.placeId);
    }
    setSection('atlas');
  };

  const currentStudy: SavedStudy = { version: 1, section, atlasMapId: selectedAtlasMapId, gospelLocationId: selectedGospelLocationId, patriarchLocationId: selectedPatriarchLocationId, routeStopId: selectedStop, encyclopediaKind, encyclopediaEntryId, chronologyScope, milestoneId: selectedMilestoneId };
  const studyToResume = hasInteracted ? currentStudy : savedStudy;

  const resumeSavedStudy = (study: SavedStudy | null) => {
    if (!study) return;
    pendingMilestoneScrollRef.current = study.section === 'chronology' ? study.milestoneId : null;
    setSection(study.section);
    setSelectedAtlasMapId(study.atlasMapId);
    setSelectedGospelLocationId(study.gospelLocationId);
    setSelectedPatriarchLocationId(study.patriarchLocationId);
    setSelectedStop(study.routeStopId);
    setEncyclopediaKind(study.encyclopediaKind);
    setEncyclopediaEntryId(study.encyclopediaEntryId);
    setEncyclopediaQuery('');
    setChronologyScope(study.chronologyScope);
    setSelectedMilestoneId(study.milestoneId);
  };

  return (
    <main onClickCapture={() => setHasInteracted(true)} className="min-h-screen overflow-hidden bg-[#f7f6f1] text-[#111a2d] dark:bg-[#070d1b] dark:text-[#f5f3ec]">
      <section className="relative isolate px-4 pb-16 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(circle_at_14%_13%,rgba(197,151,60,.18),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(34,76,140,.13),transparent_38%)] dark:bg-[radial-gradient(circle_at_14%_13%,rgba(232,190,94,.13),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(38,86,155,.2),transparent_38%)]" />
        <div className="mx-auto max-w-7xl">
          <Link to="/programas" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-300 dark:hover:text-amber-200">← Volver a programas y estudios</Link>
          <div className="mt-8 grid items-end gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-100/70 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.19em] text-amber-900 dark:border-amber-300/20 dark:bg-amber-200/10 dark:text-amber-200"><Sparkles size={13} /> Lectura bíblica · catálogo por secciones</div>
              <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">{heroContent.lead}<br /><span className="bg-gradient-to-r from-[#9a6517] via-[#d5a943] to-[#9a6517] bg-clip-text text-transparent dark:from-[#f0d899] dark:via-[#f8e9bd] dark:to-[#c89d42]">{heroContent.accent}</span></h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">{heroContent.description}</p>
            </div>
            {section !== 'books' && <button type="button" onClick={() => setSection('books')} className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:border-amber-600/40 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.04] dark:text-slate-100 dark:hover:text-amber-100"><BookOpen size={17} /> Volver al catálogo <ArrowRight size={16} /></button>}
          </div>

          <div className={`mt-10 grid gap-5 ${wideStudyView ? 'lg:grid-cols-1' : 'lg:grid-cols-[minmax(0,1.55fr)_minmax(20rem,.85fr)]'}`}>
            <div className="min-w-0">
              {studyToResume && !(studyToResume.section === 'books' && section === 'books') && <div className="mb-4 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white/60 px-5 py-4 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-400 sm:flex-row sm:items-center"><p><span className="font-bold text-amber-900 dark:text-amber-100">{hasInteracted ? 'Selección actual:' : 'Tu último estudio:'}</span> {savedStudyTitle(studyToResume)} <span className="text-slate-500 dark:text-slate-400">· {hasInteracted ? 'puedes retomarlo' : 'guardado en este dispositivo'}</span></p><button type="button" onClick={() => resumeSavedStudy(studyToResume)} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#101d37] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-slate-950/15 transition hover:-translate-y-0.5 hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:bg-amber-300 dark:text-slate-950 dark:hover:bg-amber-200"><BookOpen size={14} aria-hidden="true" /> Retomar <ArrowRight size={13} aria-hidden="true" /></button></div>}
              {section !== 'books' && <div className="mb-4"><button type="button" onClick={() => setSection('books')} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-300 bg-white/75 px-4 text-sm font-bold text-slate-700 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-amber-100"><ArrowRight className="rotate-180" size={15} />Volver al catálogo</button></div>}

              <details className="mb-5 overflow-hidden rounded-2xl border border-amber-700/15 bg-white/70 dark:border-amber-200/10 dark:bg-white/[.03]">
                <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-slate-100 sm:px-5">
                  <span>Fuentes, permisos y criterio de lectura</span>
                  <span className="text-[10px] font-bold uppercase tracking-[.12em] text-amber-800 dark:text-amber-200">{bibleStudySources.length} recursos revisados</span>
                </summary>
                <div className="border-t border-slate-200 px-4 py-4 dark:border-white/10 sm:px-5">
                  <p className="max-w-4xl text-xs leading-5 text-slate-600 dark:text-slate-300">Acceso gratuito y permiso para reutilizar no significan lo mismo. Aquí distinguimos fuentes en uso, referencias doctrinales y candidatos; las licencias y condiciones se comprueban por recurso. Los pasajes se abren en el <Link to="/recursos/biblia" className="font-bold text-blue-800 underline decoration-amber-500/50 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200">lector bíblico compartido</Link>, que conserva la Biblia como una herramienta propia.</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    {bibleStudySources.map((source) => <article key={source.id} className="min-w-0 rounded-xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/60">
                      <div className="flex flex-wrap items-start justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-amber-800 dark:text-amber-200">{source.kind}</p><h3 className="mt-1 font-semibold leading-5"><a href={source.url} target="_blank" rel="noreferrer" className="underline decoration-amber-500/40 underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500">{source.title}</a></h3></div><span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-bold text-amber-950 dark:bg-amber-200/10 dark:text-amber-100">{source.status}</span></div>
                      <p className="mt-2 text-[10px] font-semibold text-slate-700 dark:text-slate-200">{source.license}</p><p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">{source.use}</p>
                    </article>)}
                  </div>
                  <p className="mt-4 border-t border-slate-200 pt-3 text-[10px] leading-5 text-slate-500 dark:border-white/10 dark:text-slate-400">Criterio doctrinal: la declaración Cuadrangular guía nuestras síntesis institucionales; una fuente evangélica comparativa no se presenta como doctrina local. Una fuente abierta tampoco reemplaza la lectura del pasaje ni convierte una hipótesis histórica en un hecho.</p>
                </div>
              </details>

              {section === 'books' && <BibleBookCatalog onOpenPatriarchsAtlas={() => { setSelectedAtlasMapId('patriarchs'); setSelectedPatriarchLocationId('haran'); setSection('atlas'); }} />}
              {section === 'atlas' && <section aria-label="Atlas bíblico" className="space-y-4">
                <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-800 dark:text-amber-200">Mapas para recorrer la Biblia</p><h2 className="mt-1 font-serif text-2xl sm:text-3xl">Elige una época o un viaje</h2></div><span className="rounded-full border border-amber-700/15 bg-amber-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-amber-950 dark:border-amber-200/15 dark:bg-amber-200/10 dark:text-amber-100">{bibleStudyAtlasMapEntries.length} mapas</span></div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Seleccionar mapa bíblico">
                  {bibleStudyAtlasMapEntries.map((map, index) => <button key={map.id} type="button" onClick={() => setSelectedAtlasMapId(map.id)} aria-pressed={selectedAtlasMap.id === map.id} className={`min-w-0 rounded-2xl border px-3 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${selectedAtlasMap.id === map.id ? 'border-[#13213a] bg-[#13213a] text-white shadow-md dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-amber-600/50 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200'}`}><span className={`block text-[10px] font-black uppercase tracking-[.15em] ${selectedAtlasMap.id === map.id ? 'text-amber-200 dark:text-amber-900' : 'text-amber-800 dark:text-amber-200'}`}>0{index + 1} · {map.period}</span><span className="mt-1 block font-semibold leading-5">{map.title}</span></button>)}
                </div>
                {selectedAtlasMap.id === 'paul-journeys' ? <MediterraneanRoute selectedStop={selectedStop} onSelect={setSelectedStop} /> : selectedAtlasMap.id === 'palestine-new-testament' ? <PalestineAtlasMap selectedLocationId={selectedGospelLocationId} onSelectLocation={setSelectedGospelLocationId} onOpenScene={openJesusTimelineAt} onOpenPerson={openEncyclopediaPerson} /> : selectedAtlasMap.id === 'patriarchs' ? <PatriarchAtlasMap selectedLocationId={selectedPatriarchLocationId} onSelectLocation={setSelectedPatriarchLocationId} onOpenScene={openPatriarchTimelineAt} onOpenPerson={openEncyclopediaPerson} onOpenPlace={openEncyclopediaPlace} /> : selectedAtlasMap.id === 'exodus-canaan' ? <ExodusAtlasMap map={selectedAtlasMap} selectedSceneId={selectedMilestoneId} onSelectScene={setSelectedMilestoneId} onOpenScene={openExodusTimelineAt} /> : <StaticAtlasMap map={selectedAtlasMap} />}
              </section>}
              {section === 'encyclopedia' && <article className="rounded-[1.7rem] border border-amber-900/10 bg-white/85 p-5 shadow-[0_24px_65px_-45px_rgba(21,31,47,.48)] dark:border-amber-200/10 dark:bg-slate-900/80 sm:p-8">
                <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-800 dark:text-amber-200">{encyclopediaKind === 'faith' ? 'Guía doctrinal · Iglesia Cuadrangular' : encyclopediaKind === 'people' ? 'Personas bíblicas · Génesis, Éxodo, Evangelios y Hechos' : encyclopediaKind === 'places' ? 'Geografía bíblica · Atlas y relatos' : 'Enciclopedia bíblica · Hechos 27–28'}</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">{encyclopediaKind === 'faith' ? 'Cuatro énfasis del Evangelio' : encyclopediaKind === 'people' ? 'Personas que marcan el relato' : encyclopediaKind === 'places' ? 'Lugares del mundo bíblico' : 'El viaje, contado desde dentro'}</h2></div><span className="rounded-full bg-amber-100 px-3 py-1.5 text-xs font-semibold text-amber-900 dark:bg-amber-200/10 dark:text-amber-100">{filteredEncyclopediaEntries.length} {encyclopediaKind === 'places' ? 'lugares' : encyclopediaKind === 'people' ? 'personas' : encyclopediaKind === 'events' ? 'hitos' : 'énfasis'}</span></div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">{encyclopediaKind === 'faith' ? 'Una guía de lectura desde la Declaración de Fe Cuadrangular: cada énfasis conecta la confesión de la iglesia con los pasajes bíblicos que la sustentan.' : encyclopediaKind === 'people' ? 'Conoce personajes de Génesis, Éxodo, los Evangelios y Hechos, vinculados con escenas, pasajes y mapas.' : encyclopediaKind === 'places' ? 'Explora lugares de Génesis y Hechos. Cada ficha enlaza sus pasajes, el mapa que le corresponde y el contexto narrativo.' : 'Explora los acontecimientos de Hechos 27–28 y sigue sus conexiones con el Atlas y la cronología.'}</p>
                <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Tipo de ficha">
                  <button type="button" onClick={() => { setEncyclopediaKind('places'); setEncyclopediaEntryId('malta'); setEncyclopediaQuery(''); }} aria-pressed={encyclopediaKind === 'places'} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${encyclopediaKind === 'places' ? 'border-[#13213a] bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}><MapPin size={14} /> Lugares <span className="opacity-70">{bibleStudyPlaceEntries.length}</span></button>
                  <button type="button" onClick={() => { setEncyclopediaKind('people'); setEncyclopediaEntryId('paul'); setEncyclopediaQuery(''); }} aria-pressed={encyclopediaKind === 'people'} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${encyclopediaKind === 'people' ? 'border-[#13213a] bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}><UsersRound size={14} /> Personas <span className="opacity-70">{bibleStudyPeopleEntries.length}</span></button>
                  <button type="button" onClick={() => { setEncyclopediaKind('events'); setEncyclopediaEntryId('departure'); setEncyclopediaQuery(''); }} aria-pressed={encyclopediaKind === 'events'} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${encyclopediaKind === 'events' ? 'border-[#13213a] bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}><CalendarDays size={14} /> Acontecimientos <span className="opacity-70">{bibleStudyEventEntries.length}</span></button>
                  <button type="button" onClick={() => { setEncyclopediaKind('faith'); setEncyclopediaEntryId('jesus-savior'); setEncyclopediaQuery(''); }} aria-pressed={encyclopediaKind === 'faith'} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${encyclopediaKind === 'faith' ? 'border-[#13213a] bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}`}><BookOpen size={14} /> Fe Cuadrangular <span className="opacity-70">{bibleStudyQuadrangularEntries.length}</span></button>
                </div>
                <label className="mt-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm shadow-sm focus-within:border-amber-600 dark:border-white/10 dark:bg-slate-950"><Search size={16} className="shrink-0 text-amber-700 dark:text-amber-200" /><span className="sr-only">Buscar {encyclopediaKind === 'places' ? 'lugares' : encyclopediaKind === 'people' ? 'personas' : encyclopediaKind === 'events' ? 'acontecimientos' : 'énfasis Cuadrangulares'}</span><input value={encyclopediaQuery} onChange={(event) => setEncyclopediaQuery(event.target.value)} placeholder={encyclopediaKind === 'places' ? 'Buscar ciudad, región o detalle…' : encyclopediaKind === 'people' ? 'Buscar persona, función o detalle…' : encyclopediaKind === 'events' ? 'Buscar acontecimiento, etapa o pasaje…' : 'Buscar Salvador, Espíritu Santo, sanidad…'} className="min-w-0 flex-1 bg-transparent text-slate-800 outline-none placeholder:text-slate-400 dark:text-white" /></label>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" role="group" aria-label={encyclopediaKind === 'places' ? 'Lugares bíblicos' : encyclopediaKind === 'people' ? 'Personas de Génesis, Evangelios y Hechos' : encyclopediaKind === 'events' ? 'Acontecimientos de Hechos 27 y 28' : 'Énfasis del Evangelio Cuadrangular'}>
                  {filteredEncyclopediaEntries.map((entry) => <button key={entry.id} type="button" onClick={() => { setEncyclopediaEntryId(entry.id); if (entry.placeId && stops.some((place) => place.id === entry.placeId)) setSelectedStop(entry.placeId); if (encyclopediaKind === 'events') setSelectedMilestoneId(entry.id); }} aria-pressed={encyclopediaEntry?.id === entry.id} className={`min-w-0 rounded-xl border px-3 py-2.5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${encyclopediaEntry?.id === entry.id ? 'border-amber-700 bg-[#13213a] text-white dark:border-amber-200 dark:bg-amber-200 dark:text-slate-950' : 'border-slate-200 bg-white/80 text-slate-700 hover:border-amber-600/50 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200'}`}><span className="flex min-w-0 items-center gap-2">{'symbol' in entry && <span style={{ backgroundColor: entry.symbol === 'cross' ? '#b91c1c' : entry.symbol === 'dove' ? '#f59e0b' : entry.symbol === 'cup' ? '#1d4ed8' : '#a21caf' }} className="grid size-8 shrink-0 place-items-center rounded-lg p-1.5 text-white shadow-sm"><QuadrangularSymbol symbol={entry.symbol} className="size-full" /></span>}<span className="min-w-0"><span className="block truncate text-sm font-bold">{entry.title}</span><span className={`mt-1 block truncate text-[10px] ${encyclopediaEntry?.id === entry.id ? 'text-amber-100 dark:text-slate-700' : 'text-slate-500 dark:text-slate-400'}`}>{entry.region}</span></span></span></button>)}
                </div>
                {!encyclopediaEntry && <p className="mt-5 rounded-xl bg-slate-100 p-4 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">No encontré coincidencias. Prueba con otro nombre o una referencia del relato.</p>}
                {encyclopediaEntry && <div className="mt-5 border-t border-slate-200 pt-5 dark:border-white/10">
                  <div className="flex flex-wrap items-start justify-between gap-4"><div className="flex min-w-0 items-start gap-3">{encyclopediaKind === 'faith' && 'symbol' in encyclopediaEntry && <span style={{ backgroundColor: encyclopediaEntry.symbol === 'cross' ? '#b91c1c' : encyclopediaEntry.symbol === 'dove' ? '#f59e0b' : encyclopediaEntry.symbol === 'cup' ? '#1d4ed8' : '#a21caf' }} className="mt-1 grid size-12 shrink-0 place-items-center rounded-2xl p-2.5 text-white shadow-md"><QuadrangularSymbol symbol={encyclopediaEntry.symbol} className="size-full" /></span>}<div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-800 dark:text-amber-200">{encyclopediaEntry.region}</p><h3 className="mt-2 font-serif text-3xl sm:text-4xl">{encyclopediaEntry.title}</h3></div></div>{encyclopediaKind === 'events' ? <div className="flex flex-wrap gap-2"><button type="button" onClick={() => openChronologyAt(encyclopediaEntry.id)} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-700/25 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100 dark:hover:bg-amber-200/20"><CalendarDays size={14} /> Ver en la cronología</button><button type="button" onClick={() => { if ('placeId' in encyclopediaEntry && encyclopediaEntry.placeId) { setSelectedAtlasMapId('paul-journeys'); setSelectedStop(encyclopediaEntry.placeId); } setSection('atlas'); }} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-amber-100"><MapPin size={14} /> Ver en el atlas</button></div> : encyclopediaKind === 'faith' ? <div className="flex flex-wrap gap-2"><Link to="/nosotros/doctrina" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-700/25 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100 dark:hover:bg-amber-200/20"><BookOpen size={14} /> Ver los 22 principios</Link><Link to="/nosotros/documentos/reglamento-interno" className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:text-amber-100">Leer el reglamento</Link></div> : encyclopediaKind === 'people' && 'mapId' in encyclopediaEntry && encyclopediaEntry.mapId ? <button type="button" onClick={() => { setSelectedAtlasMapId(encyclopediaEntry.mapId!); setSection('atlas'); }} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-700/25 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100"><MapPin size={14} /> {encyclopediaEntry.mapId === 'patriarchs' ? 'Ver mundo de los patriarcas' : 'Ver mapa de Palestina'}</button> : <button type="button" onClick={() => { if (encyclopediaKind === 'places') openPlaceInAtlas(encyclopediaEntry as BibleStudyPlaceEntry); else if ('placeId' in encyclopediaEntry && encyclopediaEntry.placeId) { setSelectedAtlasMapId('paul-journeys'); setSelectedStop(encyclopediaEntry.placeId); setSection('atlas'); } }} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-700/25 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100 dark:hover:bg-amber-200/20"><MapPin size={14} /> {encyclopediaKind === 'places' ? 'Ubicar en el atlas' : 'Ver lugar vinculado'}</button>}</div>
                  <p className="mt-5 text-base leading-7 text-slate-700 dark:text-slate-200">{encyclopediaEntry.summary}</p>
                  <h4 className="mt-6 font-serif text-xl">{encyclopediaKind === 'faith' ? 'Lectura desde la fe Cuadrangular' : 'En el relato'}</h4><p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{encyclopediaEntry.context}</p>
                  <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-sm dark:border-amber-100/10 dark:bg-amber-200/5"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.14em] text-amber-900 dark:text-amber-100">Pasajes relacionados</p><ReferenceLinks references={encyclopediaEntry.references} className="font-bold text-blue-800 dark:text-amber-200" /></div>
                  {encyclopediaKind === 'faith' && <details className="mt-5 rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><summary className="cursor-pointer font-serif text-xl">Doce valores centrales de la iglesia en Ecuador</summary><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">El artículo 3 del Reglamento Interno los presenta como valores para la vida cristiana. Esta lista es distinta de los 22 principios de fe; consulta ambos junto con los pasajes bíblicos.</p><div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">{bibleStudyQuadrangularCoreValues.map((value) => <div key={value.id} className="rounded-xl border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-100/10 dark:bg-amber-200/5"><p className="font-semibold text-slate-800 dark:text-slate-100">{value.title}</p><div className="mt-1 text-xs"><ReferenceLinks references={value.references} className="font-bold text-blue-800 dark:text-amber-200" /></div></div>)}</div><Link to="/nosotros/documentos/reglamento-interno" className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-blue-800 underline decoration-amber-500/50 underline-offset-2 dark:text-amber-200">Fuente · Reglamento Interno, artículo 3</Link></details>}
                  {encyclopediaKind === 'places' && (encyclopediaEntry as BibleStudyPlaceEntry).atlasMapId === 'patriarchs' && (encyclopediaEntry as BibleStudyPlaceEntry).sceneIds?.[0] && <button type="button" onClick={() => openPatriarchTimelineAt((encyclopediaEntry as BibleStudyPlaceEntry).sceneIds![0], (encyclopediaEntry as BibleStudyPlaceEntry).atlasLocationId)} className="mt-3 inline-flex shrink-0 items-center gap-2 rounded-full border border-amber-700/25 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-950 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-amber-200/10 dark:text-amber-100 dark:hover:bg-amber-200/20"><CalendarDays size={14} /> Ver escena relacionada en la cronología</button>}
                </div>}
                {encyclopediaKind === 'places' ? <PlaceSourceNote entry={encyclopediaEntry as BibleStudyPlaceEntry} /> : <div className="mt-6 border-t border-slate-200 pt-4 text-xs leading-6 text-slate-500 dark:border-white/10 dark:text-slate-400">{encyclopediaKind === 'people' && encyclopediaEntry && 'dictionaryEntry' in encyclopediaEntry && encyclopediaEntry.dictionaryEntry ? <><strong className="text-slate-700 dark:text-slate-200">Procedencia:</strong> traducción y síntesis de “{encyclopediaEntry.dictionaryEntry}”, <a href="https://tyndaleopenresources.com/" target="_blank" rel="noreferrer" className="font-semibold underline decoration-amber-500/50 underline-offset-2">Tyndale Open Bible Dictionary 1.6</a>, Tyndale House Publishers. Se resumió, tradujo y reorganizó el contenido; esta adaptación se comparte bajo <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="font-semibold underline decoration-amber-500/50 underline-offset-2">CC BY-SA 4.0</a>.</> : encyclopediaKind === 'people' ? <><strong className="text-slate-700 dark:text-slate-200">Base de estas fichas:</strong> síntesis editorial basada en las referencias indicadas. Distingue los datos narrados de las interpretaciones y no añade biografías que los pasajes no ofrecen.</> : encyclopediaKind === 'events' ? <><strong className="text-slate-700 dark:text-slate-200">Base de estas fichas:</strong> síntesis narrativa de Hechos 27–28. Los hitos comparten datos con la cronología y el Atlas; no se asignan fechas de calendario que el texto no da.</> : <><strong className="text-slate-700 dark:text-slate-200">Base doctrinal:</strong> síntesis editorial de la misión y los símbolos del Reglamento Interno de la Iglesia del Evangelio Cuadrangular del Ecuador; la página oficial de <a href="https://www.foursquare.org/about/beliefs/" target="_blank" rel="noreferrer" className="font-semibold underline decoration-amber-500/50 underline-offset-2">la Iglesia Cuadrangular Internacional</a> identifica los cuatro roles de Jesús. Se presentan como marco doctrinal de la iglesia, con pasajes que puedes consultar directamente en la Biblia.</>}</div>}
              </article>}
              {section === 'chronology' && <div className="rounded-[1.7rem] border border-slate-200 bg-white/80 p-5 shadow-[0_24px_65px_-45px_rgba(21,31,47,.48)] dark:border-white/10 dark:bg-slate-900/75 sm:p-8">
                <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
                  <div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-amber-800 dark:text-amber-200">Cronología bíblica · orden narrativo</p><h2 className="mt-2 font-serif text-3xl">Una historia, muchos caminos</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">Recorre el panorama de la Biblia, la historia patriarcal, el Éxodo y Canaán, la vida de Jesús o los viajes de Pablo en Hechos. Las secuencias siguen los relatos y no asignan fechas históricas cuando el texto no las ofrece.</p></div>
                  <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-slate-950" role="group" aria-label="Alcance de la cronología">
                    {([{ id: 'overview', label: 'Panorama' }, { id: 'patriarchs', label: 'Historia patriarcal' }, { id: 'exodus', label: 'Éxodo y Canaán' }, { id: 'jesus', label: 'Vida de Jesús' }, { id: 'acts', label: 'Hechos 27–28' }] as const).map((option) => <button key={option.id} type="button" onClick={() => setChronologyScope(option.id)} aria-pressed={chronologyScope === option.id} className={`rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${chronologyScope === option.id ? 'bg-[#13213a] text-white dark:bg-amber-200 dark:text-slate-950' : 'text-slate-600 dark:text-slate-300'}`}>{option.label}</button>)}
                  </div>
                </div>
                {chronologyScope === 'overview' ? <ol className="space-y-0">{bibleOverviewTimeline.map((item, index) => <li key={item.id} className="relative grid grid-cols-[2.25rem_1fr] gap-4 rounded-2xl pb-7 last:pb-0">
                  {index < bibleOverviewTimeline.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[1.05rem] top-8 w-px bg-gradient-to-b from-amber-500/70 to-slate-200 dark:to-white/10" />}
                  <span className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/50 bg-amber-50 text-xs font-black text-amber-900 dark:border-amber-300/40 dark:bg-amber-200/10 dark:text-amber-200">{String(index + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-amber-800 dark:text-amber-200">{item.era}</p><h3 className="mt-1 font-serif text-xl">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p><div className="mt-2 text-xs"><ReferenceLinks references={item.references} className="font-bold text-blue-800 dark:text-amber-200" /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-200">Para reflexionar:</span> {item.studyPrompt}</p><span className="flex flex-wrap gap-2">{(item.id === 'exodus' || item.id === 'land') && <button type="button" onClick={() => openExodusTimelineAt(exodusTimeline[0].id)} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-700/15 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 transition hover:border-amber-500/50 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-white/5 dark:text-amber-100 dark:hover:bg-white/10"><ScrollText size={13} /> Recorrer esta historia</button>}{item.mapId && <button type="button" onClick={() => { setSelectedAtlasMapId(item.mapId!); setSection('atlas'); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-700/15 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 transition hover:border-amber-500/50 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-white/5 dark:text-amber-100 dark:hover:bg-white/10"><Map size={13} /> Ver mapa</button>}</span></div></div>
                </li>)}</ol> : chronologyScope === 'acts' ? <><p className="mb-5 rounded-xl border border-amber-800/15 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-slate-700 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-slate-300">Este recorrido más detallado está basado en Hechos 27–28 y enlaza sus escalas con el Atlas y la Enciclopedia.</p><ol className="space-y-0">{milestones.map((item, index) => <li key={item.id} id={`milestone-${item.id}`} aria-current={selectedMilestoneId === item.id ? 'step' : undefined} className={`relative grid grid-cols-[2.25rem_1fr] gap-4 rounded-2xl pb-7 last:pb-0 ${selectedMilestoneId === item.id ? 'bg-amber-50 p-3 dark:bg-amber-200/5' : ''}`}>
                  {index < milestones.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[1.05rem] top-8 w-px bg-gradient-to-b from-amber-500/70 to-slate-200 dark:to-white/10" />}
                  <span className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/50 bg-amber-50 text-xs font-black text-amber-900 dark:border-amber-300/40 dark:bg-amber-200/10 dark:text-amber-200">0{index + 1}</span>
                  <div><button type="button" onClick={() => { setSelectedMilestoneId(item.id); setSelectedStop(item.placeId); setSection('atlas'); }} aria-label={item.atlasAction ?? `Ver ${item.places} en el atlas`} className="inline-flex items-center gap-1.5 text-left text-[10px] font-bold uppercase tracking-[.14em] text-amber-800 transition hover:text-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:text-amber-200 dark:hover:text-white">{item.date} · {item.places}<ArrowRight size={12} /></button><h3 className="mt-1 font-serif text-xl">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p><div className="mt-2 text-xs"><ReferenceLinks references={item.references} className="font-bold text-blue-800 dark:text-amber-200" /></div><div className="mt-3 flex flex-wrap gap-2">{item.people.map((personId) => bibleStudyPeopleEntries.find((person) => person.id === personId)).filter((person) => person !== undefined).map((person) => <button key={person.id} type="button" onClick={() => { setEncyclopediaKind('people'); setEncyclopediaEntryId(person.id); setEncyclopediaQuery(''); setSection('encyclopedia'); }} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><UsersRound size={11} className="text-amber-700 dark:text-amber-200" />{person.title}</button>)}</div></div>
                </li>)}</ol></> : chronologyScope === 'exodus' ? <><p className="mb-5 rounded-xl border border-amber-800/15 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-slate-700 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-slate-300">Sigue {exodusTimeline.length} escenas desde Egipto hasta la renovación del pacto en Siquem. El mapa de ChurchMaps distingue una ruta tradicional y marca lugares discutidos con «?»; úsalo como orientación y compara sus propuestas con el relato, no como una reconstrucción definitiva.</p><ol className="space-y-0">{exodusTimeline.map((item, index) => <li key={item.id} id={`milestone-${item.id}`} aria-current={selectedMilestoneId === item.id ? 'step' : undefined} className={`relative grid grid-cols-[2.25rem_1fr] gap-4 pb-7 last:pb-0 ${selectedMilestoneId === item.id ? 'rounded-2xl bg-amber-50 p-3 dark:bg-amber-200/5' : ''}`}>
                  {index < exodusTimeline.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[1.05rem] top-8 w-px bg-gradient-to-b from-amber-500/70 to-slate-200 dark:to-white/10" />}
                  <span className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/50 bg-amber-50 text-xs font-black text-amber-900 dark:border-amber-300/40 dark:bg-amber-200/10 dark:text-amber-200">{String(index + 1).padStart(2, '0')}</span>
                  <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-amber-800 dark:text-amber-200">{item.era} · escena {String(index + 1).padStart(2, '0')}</p><h3 className="mt-1 font-serif text-xl">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p><div className="mt-2 text-xs"><ReferenceLinks references={item.references} className="font-bold text-blue-800 dark:text-amber-200" /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-200">Para reflexionar:</span> {item.studyPrompt}</p><button type="button" onClick={() => { pendingMilestoneScrollRef.current = item.id; setSelectedMilestoneId(item.id); setSelectedAtlasMapId(item.mapId ?? 'exodus-canaan'); setSection('atlas'); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-700/15 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 transition hover:border-amber-500/50 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-white/5 dark:text-amber-100 dark:hover:bg-white/10"><Map size={13} /> Ver mapa</button></div>{(item.people?.length ?? 0) > 0 && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">Personas:</span>{item.people?.map((personId) => bibleStudyPeopleEntries.find((person) => person.id === personId)).filter((person) => person !== undefined).map((person) => <button key={person.id} type="button" onClick={() => openEncyclopediaPerson(person.id)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><UsersRound size={11} className="text-amber-700 dark:text-amber-200" />{person.title}</button>)}</div>}</article>
                </li>)}</ol></> : chronologyScope === 'jesus' ? <><p className="mb-5 rounded-xl border border-amber-800/15 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-slate-700 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-slate-300">Un recorrido por los Evangelios y el inicio del testimonio de la Iglesia. Los hitos siguen el orden de lectura de los pasajes; los Evangelios presentan algunos episodios y detalles con énfasis propios, por eso esta secuencia no intenta fijar fechas exactas ni armonizar cada diferencia.</p><ol className="space-y-0">{jesusTimeline.map((item, index) => <li key={item.id} id={`milestone-${item.id}`} className="relative grid grid-cols-[2.25rem_1fr] gap-4 pb-7 last:pb-0">
                  {index < jesusTimeline.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[1.05rem] top-8 w-px bg-gradient-to-b from-amber-500/70 to-slate-200 dark:to-white/10" />}
                  <span className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/50 bg-amber-50 text-xs font-black text-amber-900 dark:border-amber-300/40 dark:bg-amber-200/10 dark:text-amber-200">{String(index + 1).padStart(2, '0')}</span>
                  <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-amber-800 dark:text-amber-200">Evangelios · escena {String(index + 1).padStart(2, '0')}</p><h3 className="mt-1 font-serif text-xl">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p><div className="mt-2 text-xs"><ReferenceLinks references={item.references} className="font-bold text-blue-800 dark:text-amber-200" /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-200">Para reflexionar:</span> {item.studyPrompt}</p><button type="button" onClick={() => { setSelectedAtlasMapId('palestine-new-testament'); if (item.locationIds?.[0]) setSelectedGospelLocationId(item.locationIds[0]); setSection('atlas'); }} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-700/15 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 transition hover:border-amber-500/50 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-white/5 dark:text-amber-100 dark:hover:bg-white/10"><Map size={13} /> Ver mapa</button></div><div className="mt-3 flex flex-wrap gap-2">{item.people.map((personId) => bibleStudyPeopleEntries.find((person) => person.id === personId)).filter((person) => person !== undefined).map((person) => <button key={person.id} type="button" onClick={() => openEncyclopediaPerson(person.id)} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><UsersRound size={11} className="text-amber-700 dark:text-amber-200" />{person.title}</button>)}{item.quadrangularId && <button type="button" onClick={() => { setEncyclopediaKind('faith'); setEncyclopediaEntryId(item.quadrangularId!); setEncyclopediaQuery(''); setSection('encyclopedia'); }} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><BookOpen size={11} className="text-amber-700 dark:text-amber-200" /> Enfoque Cuadrangular</button>}</div>{(item.locationIds?.length ?? 0) > 0 && <div className="mt-3 flex flex-wrap items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-500 dark:text-slate-400">En el mapa:</span>{item.locationIds?.map((locationId) => bibleStudyMapLocationEntries.find((entry) => entry.id === locationId)).filter((entry) => entry !== undefined).map((entry) => <button key={entry.id} type="button" onClick={() => { setSelectedAtlasMapId('palestine-new-testament'); setSelectedGospelLocationId(entry.id); setSection('atlas'); }} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><MapPin size={11} className="text-amber-700 dark:text-amber-200" />{entry.title}</button>)}</div>}</article>
                </li>)}</ol></> : <><p className="mb-5 rounded-xl border border-amber-800/15 bg-amber-50/70 px-4 py-3 text-xs leading-5 text-slate-700 dark:border-amber-200/10 dark:bg-amber-200/5 dark:text-slate-300">Sigue {patriarchsTimeline.length} escenas de la historia patriarcal en Génesis. La secuencia es narrativa: conecta personajes y pasajes, pero no pretende resolver fechas ni reconstruir itinerarios antiguos con exactitud.</p><ol className="space-y-0">{patriarchsTimeline.map((item, index) => <li key={item.id} id={`milestone-${item.id}`} aria-current={selectedMilestoneId === item.id ? 'step' : undefined} className={`relative grid grid-cols-[2.25rem_1fr] gap-4 pb-7 last:pb-0 ${selectedMilestoneId === item.id ? 'rounded-2xl bg-amber-50 p-3 dark:bg-amber-200/5' : ''}`}>
                  {index < patriarchsTimeline.length - 1 && <span aria-hidden="true" className="absolute bottom-0 left-[1.05rem] top-8 w-px bg-gradient-to-b from-amber-500/70 to-slate-200 dark:to-white/10" />}
                  <span className="relative z-10 mt-1 flex h-9 w-9 items-center justify-center rounded-full border border-amber-500/50 bg-amber-50 text-xs font-black text-amber-900 dark:border-amber-300/40 dark:bg-amber-200/10 dark:text-amber-200">{String(index + 1).padStart(2, '0')}</span>
                  <article className="min-w-0 rounded-xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-slate-950"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-amber-800 dark:text-amber-200">Génesis · escena {String(index + 1).padStart(2, '0')}</p><h3 className="mt-1 font-serif text-xl">{item.title}</h3><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{item.summary}</p><div className="mt-2 text-xs"><ReferenceLinks references={item.references} className="font-bold text-blue-800 dark:text-amber-200" /></div><div className="mt-3 flex flex-wrap items-center justify-between gap-3"><p className="max-w-xl text-xs leading-5 text-slate-500 dark:text-slate-400"><span className="font-bold text-slate-700 dark:text-slate-200">Para reflexionar:</span> {item.studyPrompt}</p><button type="button" onClick={() => openPatriarchAtlasAt(item.locationIds?.[0])} className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-amber-700/15 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-950 transition hover:border-amber-500/50 hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/20 dark:bg-white/5 dark:text-amber-100 dark:hover:bg-white/10"><Map size={13} /> {item.locationIds?.[0] ? `Ver ${bibleStudyPatriarchLocationEntries.find((entry) => entry.id === item.locationIds?.[0])?.title ?? 'el lugar'} en el Atlas` : 'Abrir Atlas'}</button></div><div className="mt-3 flex flex-wrap gap-2">{item.people.map((personId) => bibleStudyPeopleEntries.find((person) => person.id === personId)).filter((person) => person !== undefined).map((person) => <button key={person.id} type="button" onClick={() => { setEncyclopediaKind('people'); setEncyclopediaEntryId(person.id); setEncyclopediaQuery(''); setSection('encyclopedia'); }} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-2.5 py-1.5 text-[10px] font-semibold text-slate-600 transition hover:border-amber-500/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-300 dark:hover:text-amber-100"><UsersRound size={11} className="text-amber-700 dark:text-amber-200" />{person.title}</button>)}</div></article>
                </li>)}</ol></>}
              </div>}
            </div>

            <aside className={`${wideStudyView ? 'hidden' : 'flex'} flex-col gap-4`}>
              {selectedAtlasMap.id === 'paul-journeys' ? <>
              <section className="rounded-[1.7rem] border border-amber-900/10 bg-white/90 p-5 shadow-[0_22px_55px_-42px_rgba(21,31,47,.55)] dark:border-amber-200/10 dark:bg-slate-900/85 sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-amber-800 dark:text-amber-200">Estación seleccionada</p><h2 className="mt-2 font-serif text-3xl">{stop.name}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{stop.region}</p></div><span className="rounded-2xl bg-amber-100 p-3 text-amber-900 dark:bg-amber-200/10 dark:text-amber-200"><MapPin size={20} /></span></div>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{stop.note}</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  {previousVerse ? <Link to={previousVerse} aria-label={`Leer el versículo anterior a ${atlasReference}`} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-500/50 hover:bg-amber-50 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200 dark:hover:bg-amber-200/10 dark:hover:text-amber-100 sm:gap-2 sm:px-3 sm:text-sm"><ChevronLeft size={15} aria-hidden="true" />Anterior versículo</Link> : <button type="button" disabled className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-400 dark:border-white/10 dark:bg-white/[.02] dark:text-slate-500 sm:gap-2 sm:px-3 sm:text-sm"><ChevronLeft size={15} aria-hidden="true" />Anterior versículo</button>}
                  {nextChapter ? <Link to={nextChapter} aria-label={`Leer el siguiente capítulo después de ${atlasReference}`} className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2 text-xs font-bold text-slate-700 transition hover:border-amber-500/50 hover:bg-amber-50 hover:text-amber-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200 dark:hover:bg-amber-200/10 dark:hover:text-amber-100 sm:gap-2 sm:px-3 sm:text-sm">Siguiente capítulo<ChevronRight size={15} aria-hidden="true" /></Link> : <button type="button" disabled className="inline-flex min-h-11 cursor-not-allowed items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-xs font-semibold text-slate-400 dark:border-white/10 dark:bg-white/[.02] dark:text-slate-500 sm:gap-2 sm:px-3 sm:text-sm">Siguiente capítulo<ChevronRight size={15} aria-hidden="true" /></button>}
                </div>
                <div className="mt-3 text-sm"><ReferenceLinks references={stop.references} className="font-bold text-blue-800 dark:text-amber-200" /></div>
                <div className="mt-5 border-t border-slate-200 pt-4 dark:border-white/10"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.15em] text-slate-500 dark:text-slate-400">Personas vinculadas</p><div className="flex flex-wrap gap-2">{relatedPeople.map((person) => <button key={person.id} type="button" onClick={() => { setEncyclopediaKind('people'); setEncyclopediaEntryId(person.id); setEncyclopediaQuery(''); setSection('encyclopedia'); }} className="inline-flex items-center gap-1.5 rounded-full border border-amber-800/15 bg-amber-50/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-600/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-amber-200/15 dark:bg-amber-200/5 dark:text-slate-200 dark:hover:text-amber-100"><UsersRound size={12} className="text-amber-700 dark:text-amber-200" />{person.title}</button>)}</div>{relatedEvents.length > 0 && <><p className="mb-2 mt-4 text-[10px] font-bold uppercase tracking-[.15em] text-slate-500 dark:text-slate-400">Acontecimientos cercanos</p><div className="flex flex-wrap gap-2">{relatedEvents.map((event) => <button key={event.id} type="button" onClick={() => { setEncyclopediaKind('events'); setEncyclopediaEntryId(event.id); setEncyclopediaQuery(''); setSelectedMilestoneId(event.id); setSection('encyclopedia'); }} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-amber-600/50 hover:text-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-200 dark:hover:text-amber-100"><CalendarDays size={12} className="text-amber-700 dark:text-amber-200" />{event.title}</button>)}</div></>}</div>
              </section>

              <section className="rounded-[1.7rem] bg-[#10203a] p-5 text-white shadow-xl shadow-slate-900/15 dark:bg-gradient-to-br dark:from-[#152746] dark:to-[#0d1425] sm:p-6">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.17em] text-amber-200"><Waves size={14} /> Pausa para estudiar · {selectedStudyEvent.date}</div>
                <h2 className="mt-3 font-serif text-2xl leading-snug">{selectedStudyEvent.title}</h2>
                <p className="mt-2 text-sm leading-6 text-blue-100/85">{selectedStudyEvent.studyPrompt}</p>
                <div className="mt-4 text-xs"><ReferenceLinks references={selectedStudyEvent.references} className="font-bold text-amber-200 hover:text-amber-100" /></div>
                <button type="button" onClick={() => openChronologyAt(selectedStudyEvent.id)} className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-2 text-xs font-bold text-white transition hover:border-amber-200/60 hover:text-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300">Abrir este hito en la cronología <ArrowRight size={13} /></button>
              </section>

              <details className="group overflow-hidden rounded-[1.7rem] border border-amber-800/15 bg-white/90 shadow-[0_22px_55px_-42px_rgba(21,31,47,.55)] dark:border-amber-200/15 dark:bg-slate-900/85">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500 sm:p-5">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-amber-100 text-amber-900 dark:bg-amber-200/10 dark:text-amber-200"><Play size={18} fill="currentColor" aria-hidden="true" /></span>
                    <span className="min-w-0"><span className="block text-[10px] font-bold uppercase tracking-[.16em] text-amber-800 dark:text-amber-200">Recurso audiovisual · 4:50</span><span className="mt-1 block font-serif text-xl text-slate-950 dark:text-white">Rumbo a Roma</span><span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">Hechos 21–28 · Proyecto Biblia</span></span>
                  </span>
                  <span className="shrink-0 text-xs font-bold text-blue-800 group-open:text-amber-800 dark:text-amber-200 dark:group-open:text-white">{/* Native disclosure label for assistive technology */}<span className="sr-only">Reproductor de video</span><ArrowRight size={16} className="transition-transform group-open:rotate-90" aria-hidden="true" /></span>
                </summary>
                <div className="border-t border-slate-200 p-3 dark:border-white/10 sm:p-4">
                  <video controls preload="none" playsInline poster={actsVideoPoster} aria-label="Rumbo a Roma: Hechos 21–28, por Proyecto Biblia" className="aspect-video w-full rounded-xl bg-slate-950 object-cover">
                    <source src={actsVideoUrl} type="video/mp4" />
                    Tu navegador no puede reproducir este video. <a href={actsVideoPage} target="_blank" rel="noreferrer" className="font-semibold underline">Abrir en Proyecto Biblia</a>.
                  </video>
                  <p className="mt-3 text-xs leading-5 text-slate-600 dark:text-slate-300"><a href={actsVideoPage} target="_blank" rel="noreferrer" className="font-bold text-blue-800 underline decoration-amber-500/60 underline-offset-2 dark:text-amber-200">Proyecto Biblia es el autor y propietario de este video.</a> Se reproduce desde su flujo oficial; no se aloja ni modifica una copia. <a href="https://bibleproject.com/terms/" target="_blank" rel="noreferrer" className="font-semibold underline decoration-amber-500/50 underline-offset-2">Condiciones de uso</a>.</p>
                </div>
              </details>

              <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-4 text-xs leading-5 text-slate-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-400"><div className="flex gap-2"><ArrowDownRight className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-200" size={15} /><p><strong className="text-slate-700 dark:text-slate-200">Cómo leer este atlas:</strong> las paradas siguen la secuencia de Hechos. La línea no pretende reconstruir cada maniobra ni la deriva exacta de la nave.</p></div></div>
              </> : <section className="rounded-[1.7rem] border border-amber-900/10 bg-white/90 p-5 shadow-[0_22px_55px_-42px_rgba(21,31,47,.55)] dark:border-amber-200/10 dark:bg-slate-900/85 sm:p-6">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-amber-800 dark:text-amber-200">Contexto del mapa</p><h2 className="mt-2 font-serif text-2xl">{selectedAtlasMap.title}</h2><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{selectedAtlasMap.period}</p></div><span className="rounded-2xl bg-amber-100 p-3 text-amber-900 dark:bg-amber-200/10 dark:text-amber-200"><Map size={20} /></span></div>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{selectedAtlasMap.summary}</p>
                <div className="mt-4 rounded-xl bg-slate-100/80 p-3 dark:bg-white/5"><p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Pregunta para observar</p><p className="mt-2 text-sm font-medium leading-6 text-slate-700 dark:text-slate-200">{selectedAtlasMap.studyPrompt}</p></div>
                <div className="mt-4 border-t border-slate-200 pt-4 text-sm dark:border-white/10"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-500 dark:text-slate-400">Pasajes para explorar</p><ReferenceLinks references={selectedAtlasMap.references} className="font-bold text-blue-800 dark:text-amber-200" /></div>
                <p className="mt-4 text-xs leading-5 text-slate-500 dark:text-slate-400">{selectedAtlasMap.note}</p>
                <a href="https://churchmaps.info/index.html" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-blue-800 underline decoration-amber-500/60 underline-offset-2 dark:text-amber-200">ChurchMaps · {selectedAtlasMap.sourceVersion} · dominio público <ArrowRight size={13} /></a>
              </section>}
            </aside>
          </div>

          {section === 'atlas' && <div className="mt-8 flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white/60 px-5 py-4 text-xs text-slate-500 dark:border-white/10 dark:bg-white/[.03] dark:text-slate-400 sm:flex-row sm:items-center">
            <span>{selectedAtlasMap.id === 'paul-journeys' ? 'Estudio basado en Hechos 27–28 · ' : `${selectedAtlasMap.title} · `}Cartografía de ChurchMaps, declarada de dominio público por su fuente.</span>
            {selectedAtlasMap.id === 'paul-journeys' ? <Link to="/recursos/biblia?libro=hechos&capitulo=28" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-bold text-blue-800 hover:text-amber-800 dark:text-amber-200">Continuar leyendo Hechos 28 <ArrowRight size={14} /></Link> : <span className="text-slate-600 dark:text-slate-300"><ReferenceLinks references={selectedAtlasMap.references.slice(0, 2)} className="font-bold text-blue-800 dark:text-amber-200" /></span>}
          </div>}
        </div>
      </section>
    </main>
  );
}
