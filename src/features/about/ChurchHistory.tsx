import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowDown, ArrowLeft, ArrowRight, BookOpenText, ChevronDown, Church, Globe2, MapPin } from 'lucide-react';
import { historyMilestones } from './churchHistoryData';
import narrative from './churchHistoryNarrative.json';
import PastoralTimeline from './PastoralTimeline';
import LearningQuiz from './LearningQuiz';
import LearningProgress from './LearningProgress';
import BlockRenderer from '../../components/public/BlockRenderer';
import type { LearningDocument, PublishedLearningDocument } from './learningDocument';
import './churchHistory.css';

function MilestoneTimeline() {
  const timeline = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: timeline, offset: ['start center', 'end center'] });
  return <div ref={timeline} className="history-timeline"><div className="history-timeline-rail" aria-hidden="true"><motion.div className="gold-emphasis-line" style={{ scaleY: reduced ? 1 : scrollYProgress }} /></div><ol>{historyMilestones.map((event, index) => <motion.li key={`${event.year}-${index}`} initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.45 }}>
    <div className="history-year"><span className="text-church-gold-gradient">{event.year}</span><small>{event.date}</small></div><div className="history-milestone"><span className="history-timeline-dot" aria-hidden="true" /><p className="history-eyebrow">Capítulo {String(index + 1).padStart(2, '0')}</p><h3>{event.title}</h3><p>{event.text}</p>{event.image && <img src={event.image} alt={event.alt} loading="lazy" decoding="async" width="1448" height="1086" />}</div>
  </motion.li>)}</ol></div>;
}

export default function ChurchHistory({ document, published, preview = false }: { document: LearningDocument; published?: PublishedLearningDocument; preview?: boolean }) {
  const Heading = preview ? 'h2' : 'h1';
  const [openScope, setOpenScope] = useState<'mundo' | 'ecuador' | 'jerusalen' | null>(null);
  return <div className="church-history">
    {!preview && <Helmet><title>Nuestra historia · Desde 1961 | Iglesia Jerusalén</title><meta name="description" content="La historia completa de Iglesia Jerusalén en Milagro: sus inicios en 1961, las familias pastorales, el primer templo y una misión que continúa." /><meta property="og:image" content="https://www.iecejerusalen.com/images/cuadrangular/fachada-jerusalen-v03.jpg" /></Helmet>}
    <div className="history-shell">{!preview && <Link className="history-back" to="/nosotros"><ArrowLeft size={17} /> Volver a Nosotros</Link>}
      <header className="history-hero"><div className="history-hero-copy"><p className="history-eyebrow">Milagro, Ecuador · Desde 1961</p><Heading>De una semilla<br />a un <em>legado de fe.</em></Heading><p>Esta es nuestra historia: familias que respondieron al llamado, una comunidad que echó raíces y un evangelio que sigue transformando vidas.</p><a className="history-button" href="#jerusalen">Recorrer nuestra historia <ArrowDown size={18} /></a><div className="history-hero-years"><span>1961 <small>Primeros pasos</small></span><span>2009 <small>Nuestro templo actual</small></span><span>Hoy <small>La misión continúa</small></span></div></div><figure><img src="/images/cuadrangular/fachada-jerusalen-v03.jpg" alt="Fachada de Iglesia del Evangelio Cuadrangular Jerusalén, con sus ventanales azules y el nombre de la congregación" width="1448" height="1086" fetchPriority="high" /><figcaption><MapPin size={15} aria-hidden="true" /> Nuestra casa en Milagro, Guayas</figcaption></figure></header>
      <section className="history-scope-nav" aria-label="Explora los ámbitos de la Iglesia Cuadrangular"><ol className="history-scope-steps">
        <li><button id="scope-trigger-mundo" type="button" aria-expanded={openScope === 'mundo'} aria-controls="history-scope-panel" onClick={() => setOpenScope(openScope === 'mundo' ? null : 'mundo')}><Globe2 aria-hidden="true" /><span><small><b>01</b> · Una familia en el mundo</small>Iglesia Cuadrangular Internacional</span><ChevronDown size={17} aria-hidden="true" /></button></li>
        <li className="history-scope-connector" aria-hidden="true"><span /><ArrowRight size={16} /></li>
        <li><button id="scope-trigger-ecuador" type="button" aria-expanded={openScope === 'ecuador'} aria-controls="history-scope-panel" onClick={() => setOpenScope(openScope === 'ecuador' ? null : 'ecuador')}><MapPin aria-hidden="true" /><span><small><b>02</b> · Nuestra obra nacional</small>Iglesia Cuadrangular del Ecuador</span><ChevronDown size={17} aria-hidden="true" /></button></li>
        <li className="history-scope-connector" aria-hidden="true"><span /><ArrowRight size={16} /></li>
        <li><button id="scope-trigger-jerusalen" type="button" aria-expanded={openScope === 'jerusalen'} aria-controls="history-scope-panel" onClick={() => setOpenScope(openScope === 'jerusalen' ? null : 'jerusalen')}><Church aria-hidden="true" /><span><small><b>03</b> · Nuestra comunidad local</small>Iglesia Cuadrangular Jerusalén</span><ChevronDown size={17} aria-hidden="true" /></button></li>
      </ol></section>
      <div id="history-scope-panel" className={`history-scope-panel${openScope ? ' is-open' : ''}`} role="region" aria-labelledby={openScope ? `scope-trigger-${openScope}` : undefined} aria-hidden={!openScope} inert={!openScope}>
        <div className="history-scope-panel-inner">
          {openScope === 'mundo' && <><p className="history-eyebrow">Familia internacional</p><h2>Un mensaje para todas las generaciones</h2><p>En 1922, durante una campaña en Oakland, Aimee Semple McPherson relacionó la visión de Ezequiel con Jesucristo como Salvador, Bautizador, Sanador y Rey que viene. Angelus Temple abrió sus puertas en Los Ángeles en 1923.</p><Link className="history-text-link" to="/nosotros/origen-cuadrangular">Conoce el origen del mensaje <ArrowRight size={17} /></Link></>}
          {openScope === 'ecuador' && <><p className="history-eyebrow">Nuestra obra nacional · Desde 1956</p><h2>La misión Cuadrangular llega a Ecuador</h2><p>{narrative.paragraphs[0]}</p><p>El Reglamento interno registra la personería jurídica mediante el Acuerdo Ministerial 826, del 14 de julio de 1976.</p><Link className="history-text-link" to="/nosotros/documentos/reglamento-interno">Leer el reglamento institucional <ArrowRight size={17} /></Link></>}
          {openScope === 'jerusalen' && <><p className="history-eyebrow">Nuestra comunidad local · Milagro</p><h2>Una historia construida en comunidad</h2><p>Recorre los hitos, las familias pastorales y el crecimiento de la congregación desde sus primeros años hasta la misión que continúa hoy.</p><a className="history-text-link" href="#jerusalen">Ir a la línea de tiempo <ArrowDown size={17} /></a></>}
        </div>
      </div>
      <section id="jerusalen" className="history-local"><div className="history-section-heading"><div><p className="history-eyebrow">Iglesia Cuadrangular Jerusalén · Local</p><h2>La fe que nos trajo <span className="text-church-gold-gradient">hasta aquí.</span></h2></div><a className="history-text-link" href="#relato-completo">Leer el relato completo <BookOpenText size={18} /></a></div><MilestoneTimeline /></section>
      <PastoralTimeline /><Link className="history-text-link" to="/nosotros/pastores">Explorar la historia de nuestros pastores <ArrowRight size={17} /></Link>
      <section id="relato-completo" className="history-full-story"><aside><p className="history-eyebrow">Memoria de la congregación</p><h2>Nuestra historia, <span className="text-church-gold-gradient">contada completa.</span></h2><p>Relato histórico compartido por la iglesia, acompañado por su archivo fotográfico y el folleto conmemorativo.</p><a className="history-text-link" href="#legado">Pastores surgidos de Jerusalén <ArrowDown size={17} /></a></aside><div className="history-prose">{narrative.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}{index === 4 && <> <a className="history-text-link" href="#legado">Consultar sus nombres <ArrowDown size={15} /></a></>}</p>)}</div></section>
      <section id="legado" className="history-legacy"><p className="history-eyebrow">Un legado que se multiplica</p><h2>Desde Jerusalén, <span className="text-church-gold-gradient">para servir.</span></h2><p>El relato de la congregación recuerda a estos pastores y familias surgidos de la iglesia central:</p><ul>{narrative.pastors.map(name => <li key={name}>{name.startsWith('(+)') && <span className="history-memorial" aria-label="En memoria">† </span>}{name.replace('(+) ', '')}</li>)}</ul><p className="history-footnote">† Conservamos la señal de memoria junto al nombre indicado en el documento original.</p></section>
      <section className="history-sources"><h2>Conservamos nuestra memoria</h2><p>Texto histórico y fotografías aportados por la iglesia · Folleto conmemorativo «TRIFOLD 01», página 2. Los retratos de estudio son restauraciones con IA; en la galería puedes consultar cada fotografía original.</p><div className="history-source-links">{document.sources.map(source => <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer">{source.title} <ArrowRight size={14} /></a>)}</div>
        <details><summary>Lectura complementaria de la iglesia{published?.reviewed_at && published.reviewer_label ? ` · Revisada por ${published.reviewer_label}` : ''}</summary><div className="history-editorial-chapters">{document.content.chapters.map(chapter => <section key={chapter.id}><h3>{chapter.title}</h3><BlockRenderer blocks={chapter.blocks.map(block => block.type === 'image' && block.id === 'fachada' ? { ...block, image_url: '/images/cuadrangular/fachada-jerusalen-v03.jpg' } : block)} /></section>)}</div></details>
      </section>
      <LearningQuiz questions={document.content.quiz} />{!preview && <LearningProgress topic="historia" />}
      <footer className="history-closing"><p className="history-eyebrow">Ayer, hoy y por los siglos · Hebreos 13:8</p><h2>La historia sigue.<br /><em>Tú también eres parte.</em></h2><Link className="history-button" to="/visita">Planifica tu visita <ArrowRight size={18} /></Link><Link className="history-text-link" to="/nosotros/himno">Continúa con nuestro himno <ArrowRight size={17} /></Link></footer>
    </div>
  </div>;
}
