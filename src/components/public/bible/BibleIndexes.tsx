import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { BookOpen, CalendarDays, ChevronRight, History, Info, MapPin, MapPinned, Search, Users, X } from 'lucide-react';
import { bibleBookIntroductions, bibleBooks, bibleCharacters, biblePlaces } from '../../../config/bibleIndexesData';
import type { BibleBookInfo, BibleCharacter, BiblePlace } from '../../../config/bibleIndexesData';

type TabType = 'books' | 'characters' | 'locations';
type BibleIndexItem = Partial<BibleCharacter> & Partial<BiblePlace> & Partial<BibleBookInfo> & { id: string; name: string; description?: string };

interface BibleIndexesProps {
  onClose: () => void;
  onNavigateToBible: (bookId: string, chapter: number) => void;
}

const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'books', label: 'Libros', icon: <BookOpen size={17} aria-hidden="true" /> },
  { id: 'characters', label: 'Personajes', icon: <Users size={17} aria-hidden="true" /> },
  { id: 'locations', label: 'Lugares', icon: <MapPinned size={17} aria-hidden="true" /> },
];

const tabCopy: Record<TabType, { eyebrow: string; title: string; description: string }> = {
  books: { eyebrow: 'La Escritura', title: 'Libros de la Biblia', description: 'Explora su historia, temas y contexto.' },
  characters: { eyebrow: 'Personas', title: 'Personajes bíblicos', description: 'Conoce las historias y el legado de quienes aparecen en la Biblia.' },
  locations: { eyebrow: 'Geografía', title: 'Lugares bíblicos', description: 'Recorre los escenarios que dieron forma a la historia bíblica.' },
};

function itemDescription(item: BibleIndexItem) {
  return ('historicalContext' in item && item.historicalContext) || ('significance' in item && item.significance) || ('description' in item && item.description) || '';
}

function itemSubtitle(item: BibleIndexItem, tab: TabType) {
  if (tab === 'characters' && 'meaning' in item) return item.meaning;
  if (tab === 'locations' && 'location' in item) return item.location;
  if (tab === 'books' && 'group' in item) return item.group;
  return '';
}

function itemReference(item: BibleIndexItem) {
  return 'firstMention' in item ? item.firstMention : '';
}

function itemEvents(item: BibleIndexItem): string[] {
  return item.keyEvents ?? [];
}

export default function BibleIndexes({ onClose, onNavigateToBible }: BibleIndexesProps) {
  const [activeTab, setActiveTab] = useState<TabType>('books');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<BibleIndexItem | null>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedItem) setSelectedItem(null);
      else onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedItem]);

  const data: BibleIndexItem[] = activeTab === 'books' ? bibleBooks : activeTab === 'characters' ? bibleCharacters : biblePlaces;
  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase('es');
    if (!term) return data;
    return data.filter((item) => {
      const fields = [item.name, itemDescription(item), itemSubtitle(item, activeTab), activeTab === 'books' ? bibleBookIntroductions[item.id] : '', itemReference(item), ...itemEvents(item)].filter((field): field is string => Boolean(field));
      return fields.some((field) => field.toLocaleLowerCase('es').includes(term));
    });
  }, [activeTab, data, searchTerm]);

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setSelectedItem(null);
    setSearchTerm('');
  };

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduceMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-4 lg:p-6"
      role="dialog" aria-modal="true" aria-labelledby="bible-index-title"
    >
      <button aria-label="Cerrar enciclopedia" className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-md" onClick={onClose} />

      <motion.section
        initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.99 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reduceMotion ? undefined : { opacity: 0, y: 8, scale: 0.99 }}
        transition={{ duration: reduceMotion ? 0 : 0.25, ease: [0.2, 0.75, 0.25, 1] }}
        className="relative z-10 flex h-[100dvh] w-full max-w-[1480px] flex-col overflow-hidden bg-[#f7f8fa] text-slate-900 shadow-2xl sm:h-[min(92dvh,980px)] sm:rounded-[28px] sm:border sm:border-white/70"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/90 px-5 py-4 sm:px-8 sm:py-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-[#b47b20]">Biblioteca de fe</p>
            <h2 id="bible-index-title" className="mt-1 font-serif text-2xl font-semibold tracking-tight text-slate-950 sm:text-[28px]">Enciclopedia bíblica</h2>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700">
            <X size={19} />
          </button>
        </header>

        <div className="z-10 flex shrink-0 flex-col gap-4 border-b border-slate-200/80 bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <nav aria-label="Secciones de la enciclopedia" className="flex w-full items-center gap-1 overflow-x-auto rounded-full bg-slate-100 p-1 sm:w-auto">
            {tabs.map((tab) => (
              <button key={tab.id} type="button" onClick={() => switchTab(tab.id)} aria-pressed={activeTab === tab.id}
                className={`inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 ${activeTab === tab.id ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200/70' : 'text-slate-500 hover:text-slate-900'}`}>
                {tab.icon}{tab.label}
              </button>
            ))}
          </nav>
          <label className="relative block w-full sm:max-w-[320px]">
            <Search size={17} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} type="search" placeholder={`Buscar ${activeTab === 'books' ? 'libros' : activeTab === 'characters' ? 'personajes' : 'lugares'}`} aria-label="Buscar en la enciclopedia"
              className="h-11 w-full rounded-full border border-slate-200 bg-[#f8f9fb] pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-900/5 placeholder:text-slate-400" />
          </label>
        </div>

        <main className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 px-5 pb-4 pt-6 sm:px-8 sm:pt-7">
            <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">{tabCopy[activeTab].eyebrow}</p>
            <div className="mt-1 flex items-end justify-between gap-4">
              <div>
                <h3 className="font-serif text-[26px] font-semibold leading-tight tracking-tight text-slate-950 sm:text-3xl">{tabCopy[activeTab].title}</h3>
                <p className="mt-1.5 max-w-2xl text-sm text-slate-500">{tabCopy[activeTab].description}</p>
              </div>
              <span className="hidden shrink-0 pb-1 text-xs tabular-nums text-slate-400 sm:block">{filteredData.length} {filteredData.length === 1 ? 'resultado' : 'resultados'}</span>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-8 sm:px-8" aria-live="polite">
            {filteredData.length === 0 ? (
              <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-slate-200 bg-white/60 px-6 text-center">
                <div><Search size={25} className="mx-auto mb-3 text-slate-300" /><p className="font-medium text-slate-700">No encontramos resultados</p><p className="mt-1 text-sm text-slate-500">Prueba con otro nombre o término.</p></div>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <AnimatePresence mode="popLayout">
                  {filteredData.map((item, index) => (
                    <motion.button key={item.id} type="button" layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.18, delay: Math.min(index * 0.012, 0.12) }}
                      onClick={() => setSelectedItem(item)} aria-label={`Explorar ${item.name}`}
                      className="group flex min-h-[230px] flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white text-left shadow-[0_4px_20px_rgba(15,23,42,.035)] transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_32px_rgba(15,23,42,.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2">
                      {activeTab !== 'books' && (
                        <div className="relative h-44 w-full shrink-0 overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-[#f8f3e8] sm:h-48">
                          {item.imageUrl ? <>
                            <img src={item.imageUrl} alt="" aria-hidden="true" width={1200} height={900} loading="lazy" decoding="async" className="absolute inset-0 size-full scale-110 object-cover opacity-35 blur-xl" />
                            <img src={item.imageUrl} alt={item.name} width={1200} height={900} sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw" loading="lazy" decoding="async" className="relative size-full object-contain" />
                          </> : (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,255,255,.95),transparent_65%),linear-gradient(135deg,#eef2f8,#f6f4ef)]">
                              <span className="font-serif text-5xl font-medium tracking-tight text-slate-300">{item.name.trim().charAt(0)}</span>
                              <span className="mt-2 text-[9px] font-semibold uppercase tracking-[.2em] text-slate-400">{activeTab === 'characters' ? 'Personaje bíblico' : 'Atlas bíblico'}</span>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/70 to-transparent" />
                          <span className="absolute bottom-3 left-4 right-4 line-clamp-1 font-serif text-xl font-semibold text-white drop-shadow">{item.name}</span>
                        </div>
                      )}
                      <div className="flex flex-1 flex-col p-5">
                        {activeTab === 'books' && <div className="mb-3 flex items-start justify-between gap-3"><div><span className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#a87520]">{item.group}</span><h4 className="mt-1 font-serif text-[22px] font-semibold leading-tight text-slate-950">{item.name}</h4></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">{item.testament === 'Antiguo Testamento' ? 'AT' : 'NT'}</span></div>}
                        {activeTab !== 'books' && <p className="mb-2 truncate text-xs font-medium text-slate-500">{itemSubtitle(item, activeTab)}</p>}
                        <p className="line-clamp-2 text-[13px] leading-[1.65] text-slate-600">{itemDescription(item)}</p>
                        <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                          {itemReference(item) ? <span className="text-[11px] font-medium text-slate-400">Primera mención · {itemReference(item)}</span> : <span />}
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-800 transition-colors group-hover:text-blue-600">Explorar <ChevronRight size={14} className="transition-transform group-hover:translate-x-0.5" /></span>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>

          <AnimatePresence>
            {selectedItem && (
              <>
                <motion.button aria-label="Cerrar detalle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="absolute inset-0 z-20 cursor-default bg-slate-950/35 backdrop-blur-[2px]" />
                <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 32, stiffness: 300 }} aria-label={`Detalle de ${selectedItem.name}`}
                  className="absolute inset-y-0 right-0 z-30 flex w-full flex-col overflow-hidden border-l border-slate-200 bg-white shadow-2xl sm:w-[min(520px,90%)]">
                  <div className="relative h-52 shrink-0 overflow-hidden bg-gradient-to-br from-slate-200 via-slate-100 to-[#f8f3e8] sm:h-60">
                    {selectedItem.imageUrl ? <>
                      <img src={selectedItem.imageUrl} alt="" aria-hidden="true" width={1200} height={900} decoding="async" className="absolute inset-0 size-full scale-110 object-cover opacity-35 blur-xl" />
                      <img src={selectedItem.imageUrl} alt={selectedItem.name} width={1200} height={900} decoding="async" className="relative size-full object-contain" />
                    </> : <div className="grid size-full place-items-center"><span className="font-serif text-8xl text-slate-300">{selectedItem.name.charAt(0)}</span></div>}
                    <button type="button" onClick={() => setSelectedItem(null)} aria-label="Cerrar detalle" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full border border-white/60 bg-white/90 text-slate-800 shadow-sm backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700"><X size={18} /></button>
                  </div>
                  <div className="shrink-0 border-b border-slate-100 px-6 pb-5 pt-4 sm:px-8">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[.18em] text-slate-400">{tabCopy[activeTab].eyebrow}</p>
                    <h3 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-slate-950">{selectedItem.name}</h3>
                    <p className="mt-1 text-sm text-slate-500">{itemSubtitle(selectedItem, activeTab)}</p>
                  </div>
                  <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6 sm:px-8">
                    {activeTab === 'books' ? (
                      <>
                        <section>
                          <div className="mb-2 flex items-center gap-2 text-slate-400"><Info size={15} /><h4 className="text-[10px] font-semibold uppercase tracking-[.17em]">Panorama del libro</h4></div>
                          {'chapters' in selectedItem && <p className="text-sm leading-7 text-slate-700">{bibleBookIntroductions[selectedItem.id]}</p>}
                        </section>
                        <section>
                          <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[.17em] text-slate-400">Información del libro</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {'author' in selectedItem && <div className="min-w-0 rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400"><Users size={13} />Autoría</p><p className="mt-2 text-sm font-medium leading-5 text-slate-800">{selectedItem.author === 'Desconocido' ? 'Autoría desconocida' : `Atribuido tradicionalmente a ${selectedItem.author}`}</p></div>}
                            {'dateWritten' in selectedItem && <div className="min-w-0 rounded-2xl bg-slate-50 p-4"><p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400"><CalendarDays size={13} />Composición estimada</p><p className="mt-2 text-sm font-medium leading-5 text-slate-800">{selectedItem.dateWritten}</p></div>}
                            {'testament' in selectedItem && <div className="min-w-0 rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Colección</p><p className="mt-2 text-sm font-medium leading-5 text-slate-800">{selectedItem.testament} · {selectedItem.group}</p></div>}
                            {'chapters' in selectedItem && <div className="min-w-0 rounded-2xl bg-slate-50 p-4"><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Estructura</p><p className="mt-2 text-sm font-medium leading-5 text-slate-800">{selectedItem.chapters} capítulos</p></div>}
                          </div>
                        </section>
                        <section>
                          <h4 className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.17em] text-slate-400"><History size={14} />Línea histórica</h4>
                          <div className="relative ml-1 space-y-4 border-l border-slate-200 pl-5">
                            <div className="relative"><span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-white bg-blue-800 ring-1 ring-blue-800/15" /><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Marco histórico</p><p className="mt-1 text-sm leading-6 text-slate-700">{itemDescription(selectedItem)}</p></div>
                            {'dateWritten' in selectedItem && <div className="relative"><span className="absolute -left-[25px] top-1 size-2.5 rounded-full border-2 border-white bg-[#bd8a37] ring-1 ring-[#bd8a37]/20" /><p className="text-[10px] font-semibold uppercase tracking-[.12em] text-slate-400">Redacción estimada</p><p className="mt-1 text-sm leading-6 text-slate-700">{selectedItem.dateWritten} · {selectedItem.author === 'Desconocido' ? 'autor no identificado' : `tradicionalmente atribuido a ${selectedItem.author}`}</p></div>}
                          </div>
                        </section>
                      </>
                    ) : <section>
                      <div className="mb-2 flex items-center gap-2 text-slate-400"><Info size={15} /><h4 className="text-[10px] font-semibold uppercase tracking-[.17em]">Contexto</h4></div>
                      <p className="text-sm leading-7 text-slate-700">{itemDescription(selectedItem)}</p>
                    </section>}
                    {itemEvents(selectedItem).length > 0 && <section><h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[.17em] text-slate-400">Momentos clave</h4><ul className="space-y-2.5">{itemEvents(selectedItem).map((event) => <li key={event} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#bd8a37]" />{event}</li>)}</ul></section>}
                    {'location' in selectedItem && <section className="flex items-start gap-3 rounded-2xl bg-slate-50 p-4"><MapPin size={16} className="mt-0.5 shrink-0 text-blue-700" /><div><h4 className="text-[10px] font-semibold uppercase tracking-[.16em] text-slate-400">Ubicación</h4><p className="mt-1 text-sm leading-6 text-slate-700">{selectedItem.location}</p></div></section>}
                    {selectedItem.keyThemes?.length ? <section><h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[.17em] text-slate-400">Temas principales</h4><div className="flex flex-wrap gap-2">{selectedItem.keyThemes.map((theme) => <span key={theme} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600">{theme}</span>)}</div></section> : null}
                    {'interestingFacts' in selectedItem && selectedItem.interestingFacts?.length ? <section><h4 className="mb-3 text-[10px] font-semibold uppercase tracking-[.17em] text-slate-400">Detalles para explorar</h4><ul className="space-y-2.5">{selectedItem.interestingFacts.map((fact) => <li key={fact} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[#bd8a37]" />{fact}</li>)}</ul></section> : null}
                    {itemReference(selectedItem) && <p className="border-t border-slate-100 pt-4 text-xs text-slate-400">Primera mención <span className="font-medium text-slate-600">{itemReference(selectedItem)}</span></p>}
                    {activeTab === 'books' && <button onClick={() => { onNavigateToBible(selectedItem.id, 1); onClose(); }} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-blue-900 px-5 text-sm font-semibold text-white transition-colors hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"><BookOpen size={17} />Leer {selectedItem.name}</button>}
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>
        </main>
      </motion.section>
    </motion.div>
  );
}
