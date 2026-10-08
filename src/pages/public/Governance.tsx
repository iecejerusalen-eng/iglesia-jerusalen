import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight, Download, Printer, BookOpen, Search, ChevronLeft, ChevronRight, Columns2, FileText, Bookmark, Focus, Type, Link2, RotateCcw, ArrowUp, Clock } from 'lucide-react';
import logo from '../../assets/Jerusalén/Logo completo colorido.svg';
import facade from '../../assets/Jerusalén/Fachada Iglesia Jerusalén.jpg';
import './Governance.css';

type Page = { number: number; text: string };
type DocumentData = { title: string; sourceFile: string; scanned: boolean; transcription?: string; pages: Page[] };
const documents = [
  { slug: 'estatutos', title: 'Estatuto', pages: 16, description: 'Las bases de nuestra organización, identidad y vida en comunidad.' },
  { slug: 'reglamento-interno', title: 'Reglamento interno', pages: 53, description: 'Los principios y las normas que orientan nuestro servicio y nuestra organización.' },
];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');
function blocks(text: string) {
  const result: { kind: 'heading' | 'article' | 'paragraph'; text: string }[] = [];
  let paragraph = '';
  const flush = () => { if (paragraph.trim()) result.push({ kind: 'paragraph', text: paragraph.trim() }); paragraph = ''; };
  for (const raw of text.split('\n')) {
    const line = raw.trim().replace(/\s+/g, ' ');
    if (!line) { flush(); continue; }
    if (/^\d{1,3}$/.test(line)) continue;
    const article = line.match(/^((?:Artículo|Articulo|Art\.)\s*\d+(?:\s*\d+)?[.\s-]*)(.*)$/);
    if (article) {
      flush(); result.push({ kind: 'article', text: article[1].trim() }); paragraph = article[2];
    } else if (/^(?:Título|Titulo|Capítulo|Capitulo)\s+[IVXLCDM]+\b/i.test(line) || (line.length > 7 && line.length < 125 && /[A-ZÁÉÍÓÚÑ]/.test(line) && line === line.toLocaleUpperCase('es') && !/^\d+[.)]/.test(line))) {
      flush(); result.push({ kind: 'heading', text: line });
    } else if (/^Que,/.test(line) || /^(?:[a-z]\.|[a-z]\)|\d+[.)])\s/i.test(line)) {
      flush(); paragraph = line;
    } else paragraph += (paragraph ? ' ' : '') + line;
  }
  flush(); return result;
}
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const lower = normalize(text); const term = normalize(query);
  const parts = []; let cursor = 0; let index = lower.indexOf(term);
  while (index >= 0) {
    parts.push(text.slice(cursor, index), <mark key={index}>{text.slice(index, index + query.length)}</mark>);
    cursor = index + query.length; index = lower.indexOf(term, cursor);
  }
  parts.push(text.slice(cursor)); return <>{parts}</>;
}
export default function Governance() {
  const { document: slug } = useParams();
  return <GovernanceReader key={slug ?? 'index'} />;
}
function GovernanceReader() {
  const { document: slug } = useParams();
  const selected = documents.find(item => item.slug === slug);
  const [data, setData] = useState<DocumentData | null>(null);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [slide, setSlide] = useState(0);
  const [mode, setMode] = useState<'continuous' | 'slides'>('continuous');
  const [columns, setColumns] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [focus, setFocus] = useState(false);
  const [warm, setWarm] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [toolMessage, setToolMessage] = useState('');
  const [saved, setSaved] = useState<{ pages: number[]; error: string }>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(`governance-bookmarks-${slug}`) ?? '[]');
      if (!Array.isArray(value) || value.some(page => !Number.isInteger(page) || page < 1 || page > (selected?.pages ?? 0))) throw new Error('Formato de marcadores inválido');
      return { pages: value, error: '' };
    } catch (cause) { return { pages: [], error: `No se pudieron recuperar los marcadores: ${cause instanceof Error ? cause.message : 'almacenamiento no disponible'}` }; }
  });
  const parsedPages = useMemo(() => data?.pages.map(page => ({ ...page, blocks: blocks(page.text) })) ?? [], [data]);
  const readingMinutes = useMemo(() => Math.ceil((data?.pages.reduce((total, page) => total + page.text.split(/\s+/).length, 0) ?? 0) / 200), [data]);
  useEffect(() => {
    const controller = new AbortController();
    if (selected) fetch(`/documentos/${selected.slug}.json`, { signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error('No se pudo cargar el documento.'); return response.json(); })
      .then((value: DocumentData) => { if (!Array.isArray(value.pages) || !value.pages.length || value.pages.some(page => !page.text)) throw new Error('Transcripción no disponible. Consulta el PDF original.'); setData(value); })
      .catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Error al cargar el documento.'); });
    return () => controller.abort();
  }, [selected]);
  const matches = useMemo(() => parsedPages.filter(page => normalize(page.text).includes(normalize(search))), [parsedPages, search]);
  const visible = mode === 'slides' ? matches.slice(slide, slide + 1) : matches;
  useEffect(() => {
    if (!data || !matches.length) return;
    const observer = new IntersectionObserver(entries => {
      const entry = entries.filter(item => item.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (entry) setCurrentPage(Number(entry.target.id.replace('pagina-', '')));
    }, { rootMargin: '-15% 0px -55% 0px', threshold: 0 });
    document.querySelectorAll('.governance-page').forEach(page => observer.observe(page));
    return () => observer.disconnect();
  }, [data, matches, mode, slide]);
  function goToPage(number: number) {
    setSearch(''); setMode('continuous');
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(`pagina-${number}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })));
  }
  function toggleBookmark(number: number) {
    const next = saved.pages.includes(number) ? saved.pages.filter(page => page !== number) : [...saved.pages, number].sort((a, b) => a - b);
    try { localStorage.setItem(`governance-bookmarks-${slug}`, JSON.stringify(next)); setSaved({ pages: next, error: '' }); setToolMessage(next.includes(number) ? `Página ${number} guardada en este navegador.` : `Marcador de página ${number} eliminado.`); }
    catch (cause) { setToolMessage(`No se pudo guardar el marcador: ${cause instanceof Error ? cause.message : 'almacenamiento no disponible'}`); }
  }
  async function copyPageLink(number: number) {
    try { await navigator.clipboard.writeText(`${window.location.origin}/nosotros/documentos/${slug}#pagina-${number}`); setToolMessage(`Enlace de la página ${number} copiado.`); }
    catch (cause) { setToolMessage(`No se pudo copiar el enlace: ${cause instanceof Error ? cause.message : 'permiso no disponible'}`); }
  }
  useEffect(() => {
    if (!data) return;
    const number = Number(window.location.hash.replace('#pagina-', ''));
    if (Number.isInteger(number) && number >= 1 && number <= data.pages.length) requestAnimationFrame(() => document.getElementById(`pagina-${number}`)?.scrollIntoView());
  }, [data]);
  function changeSlide(index: number) { setSlide(index); document.getElementById('document-reader')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  return <main className={`governance ${selected ? "governance-document" : ""} ${focus ? "governance-focus" : ""} ${warm ? "governance-warm" : ""}`} style={{ "--reading-size": `${fontSize}px` } as CSSProperties}>
    <Helmet><title>{selected?.title ?? 'Estatutos y reglamento'} | Iglesia Jerusalén</title><meta name="description" content="Lee los estatutos y el reglamento interno de la Iglesia Cuadrangular y descarga los documentos originales." /></Helmet>
    <header className="governance-header">
      <div className="governance-hero-copy">
        <Link to={selected ? '/nosotros/documentos' : '/nosotros'} className="governance-controls governance-back"><ArrowLeft size={16} />{selected ? 'Todos los documentos' : 'Volver a Nosotros'}</Link>
        <img src={logo} alt="Iglesia Jerusalén" className="governance-logo" />
        <p className="governance-eyebrow">Nuestra identidad · Biblioteca institucional</p>
        <h1>{selected?.title ?? 'Nuestra fe. Nuestra comunidad. Nuestro camino.'}</h1>
        <p className="governance-intro">{selected?.description ?? 'Conoce los documentos que acompañan la vida de la Iglesia del Evangelio Cuadrangular del Ecuador.'}</p>
        {selected && <div className="governance-controls governance-actions"><a href={`/documentos/${selected.slug}.pdf`} download className="governance-primary"><Download size={18} />PDF original</a><button onClick={() => { setSearch(''); setMode('continuous'); requestAnimationFrame(() => requestAnimationFrame(() => window.print())); }} disabled={!data} className="governance-secondary"><Printer size={18} />Guardar página en PDF</button></div>}
        <div className="governance-meta"><span>Lectura pública</span><span>{selected ? `${selected.pages} páginas de referencia` : 'Dos documentos · Una identidad'}</span></div>
      </div>
      <figure className="governance-hero-image"><img src={facade} alt="Fachada de la Iglesia Jerusalén" fetchPriority="high" /><figcaption>Iglesia Jerusalén · Nuestra casa de fe</figcaption></figure>
    </header>
    <div className="governance-body">
      {!slug && <section className="governance-library" aria-label="Documentos disponibles">{documents.map((item, index) => <article key={item.slug}><span className="governance-document-number">0{index + 1}</span><BookOpen size={28} /><p className="governance-eyebrow">{item.pages} páginas · Documento institucional</p><h2>{item.title}</h2><p>{item.description}</p><div className="governance-actions"><Link to={`/nosotros/documentos/${item.slug}`} className="governance-primary">Comenzar lectura <ArrowRight size={17} /></Link><a href={`/documentos/${item.slug}.pdf`} download className="governance-download"><Download size={17} />PDF original</a></div></article>)}</section>}
      {slug && !selected && <p>Documento no encontrado. <Link to="/nosotros/documentos">Ver documentos disponibles</Link></p>}
      {selected && error && <p role="alert">{error} <a href={`/documentos/${selected.slug}.pdf`}>Abrir PDF original</a></p>}
      {selected && !data && !error && <p role="status">Preparando la lectura…</p>}
      {selected && data && <>
        <div className="governance-source-note"><FileText size={22} /><p>{data.scanned ? 'Transcripción automática del escaneo, pendiente de revisión editorial. Puede contener errores de reconocimiento; verifica nombres, cifras y artículos en el original.' : 'Edición web de lectura basada en el documento proporcionado. El PDF original conserva tablas, símbolos y firmas.'}<span>Referencia: {data.sourceFile}</span></p></div>
        <div className={`governance-controls governance-tools-dock ${controlsOpen ? "is-open" : ""}`}><button className="governance-dock-tab" aria-expanded={controlsOpen} aria-controls="reading-tools" onClick={() => setControlsOpen(!controlsOpen)}><Type size={17} />{controlsOpen ? "Ocultar controles" : "Controles"}</button><section id="reading-tools" className="governance-toolbelt" aria-label="Herramientas de lectura">
          <div className="governance-progress"><BookOpen size={18} /><div><strong>{selected.title}</strong><span>Página visible {mode === 'slides' ? matches[slide]?.number ?? currentPage : currentPage} de {data.pages.length}</span></div><progress aria-label="Posición en el documento" value={mode === 'slides' ? matches[slide]?.number ?? currentPage : currentPage} max={data.pages.length} /></div>
          <div className="governance-tool-buttons">{search && <button onClick={() => setSearch('')}>Borrar búsqueda: {search}</button>}<span className="governance-time"><Clock size={15} />~{readingMinutes} min</span><button aria-label="Reducir tamaño de texto" disabled={fontSize <= 14} onClick={() => setFontSize(size => size - 1)}>A−</button><span aria-label="Tamaño de texto">{fontSize}</span><button aria-label="Aumentar tamaño de texto" disabled={fontSize >= 22} onClick={() => setFontSize(size => size + 1)}>A+</button><button aria-pressed={warm} onClick={() => setWarm(!warm)} title="Fondo cálido"><Type size={17} /><span>Fondo cálido</span></button><button aria-pressed={focus} onClick={() => setFocus(!focus)}><Focus size={17} /><span>{focus ? 'Salir de concentración' : 'Concentración'}</span></button><button aria-label="Restablecer ajustes de lectura" onClick={() => { setFontSize(16); setWarm(false); setFocus(false); setColumns(false); }}><RotateCcw size={16} /></button></div>
        </section></div>
        <p role="status" className="governance-tool-message">{toolMessage || saved.error}</p>
        <div className="governance-reader-grid" id="document-reader">
          <div className={`governance-controls governance-index-dock ${indexOpen ? "is-open" : ""}`}><button className="governance-dock-tab" aria-expanded={indexOpen} aria-controls="reading-index" onClick={() => setIndexOpen(!indexOpen)}><BookOpen size={17} />{indexOpen ? "Ocultar índice" : "Índice"}</button><aside id="reading-index" className="governance-sidebar" aria-label="Índice y búsqueda">
            <p className="governance-eyebrow">Tu lectura</p>
            <label htmlFor="document-search"><Search size={16} />Buscar palabra o artículo</label><input id="document-search" value={search} onChange={event => { setSearch(event.target.value); setSlide(0); }} placeholder="Ej. misión, artículo 20" />
            <p aria-live="polite" className="governance-match-count">{matches.length} de {data.pages.length} páginas{search ? ' coinciden' : ''}</p>
            <div className="governance-reading-modes"><button aria-pressed={mode === 'continuous'} onClick={() => setMode('continuous')}>Continua</button><button aria-pressed={mode === 'slides'} onClick={() => { setMode('slides'); setSlide(0); }}>Por página</button></div>
            <button className="governance-column-button" aria-pressed={columns} onClick={() => setColumns(!columns)}><Columns2 size={17} />{columns ? 'Una columna' : 'Dos columnas'}</button>
            <details className="governance-bookmarks"><summary><Bookmark size={15} />Mis marcadores ({saved.pages.length})</summary><p>Se guardan solo en este navegador.</p>{saved.pages.length ? saved.pages.map(number => <div key={number}><button onClick={() => goToPage(number)}>Página {number}</button><button aria-label={`Quitar marcador de página ${number}`} onClick={() => toggleBookmark(number)}>×</button></div>) : <p>Guarda una página desde el icono de marcador.</p>}</details>
            <label htmlFor="document-page">Índice por páginas</label><select id="document-page" value={mode === 'slides' ? String(matches[slide]?.number ?? '') : ''} onChange={event => { const index = matches.findIndex(page => page.number === Number(event.target.value)); if (mode === 'slides') changeSlide(index); else document.getElementById(`pagina-${event.target.value}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}><option value="" disabled>Ir a una página</option>{matches.map(page => <option key={page.number} value={page.number}>Página {page.number}</option>)}</select>
            <nav aria-label="Secciones del documento" className="governance-section-index">{parsedPages.flatMap(page => page.blocks.filter(block => block.kind === 'heading' && /T[IÍ]TULO|CAP[IÍ]TULO/i.test(block.text)).map((block, index) => <button key={`${page.number}-${index}`} onClick={() => { setSearch(''); setMode('continuous'); requestAnimationFrame(() => document.getElementById(`pagina-${page.number}`)?.scrollIntoView({ behavior: 'smooth' })); }}>{block.text}<span>P. {page.number}</span></button>))}</nav>
          </aside></div>
          <div className="governance-reading-content">
            {mode === 'slides' && matches.length > 0 && <div className="governance-controls governance-slide-controls"><button disabled={slide === 0} onClick={() => changeSlide(slide - 1)} aria-label="Página anterior"><ChevronLeft size={20} /></button><span>Página {matches[slide]?.number} de {data.pages.length}</span><button disabled={slide >= matches.length - 1} onClick={() => changeSlide(slide + 1)} aria-label="Página siguiente"><ChevronRight size={20} /></button></div>}
            {visible.map(page => <article id={`pagina-${page.number}`} key={page.number} className="governance-page"><div className="governance-page-label"><span>{selected.title}</span><span>Página {page.number} / {data.pages.length}</span><div className="governance-controls governance-page-tools"><button aria-label={`${saved.pages.includes(page.number) ? 'Quitar marcador de' : 'Guardar'} página ${page.number}`} aria-pressed={saved.pages.includes(page.number)} onClick={() => toggleBookmark(page.number)}><Bookmark size={16} fill={saved.pages.includes(page.number) ? 'currentColor' : 'none'} /></button><button aria-label={`Copiar enlace de página ${page.number}`} onClick={() => copyPageLink(page.number)}><Link2 size={16} /></button></div></div><div className={`governance-prose ${columns ? 'governance-two-columns' : ''}`}>{page.blocks.map((block, index) => block.kind === 'heading' ? <h2 key={index}><Highlight text={block.text} query={search} /></h2> : block.kind === 'article' ? <h3 key={index}><Highlight text={block.text} query={search} /></h3> : <p key={index}><Highlight text={block.text} query={search} /></p>)}</div>{data.scanned && <details className="governance-controls governance-original"><summary>Comparar con la página original</summary><img loading="lazy" decoding="async" src={`/documentos/${selected.slug}-${page.number}.webp`} alt={`Original escaneado, página ${page.number}`} /></details>}</article>)}
            {!matches.length && <p role="status">No hay resultados. <button onClick={() => setSearch('')}>Borrar búsqueda</button></p>}
          </div>
        </div>
        <button className="governance-controls governance-top-button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}><ArrowUp size={17} />Volver al inicio</button>
      </>}
    </div>
  </main>;
}
