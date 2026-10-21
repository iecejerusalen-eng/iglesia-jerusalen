import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import PastoralTimeline, { PastorPortrait } from '../../features/about/PastoralTimeline';
import { assistantPastors } from '../../features/about/churchHistoryData';

export default function Pastors() {
  return <div className="church-history"><Helmet><title>Pastores · Un legado de servicio | Iglesia Jerusalén</title><meta name="description" content="Conoce las familias pastorales que han acompañado a Iglesia Jerusalén desde 1961. Retratos, historia y una misión compartida en Milagro." /></Helmet>
    <div className="history-shell"><Link className="history-back" to="/nosotros"><ArrowLeft size={17} /> Volver a Nosotros</Link><header className="pastors-page-header"><p className="history-eyebrow">Nuestra memoria viva · Desde 1961</p><h1>Pastores que sembraron <em className="text-church-gold-gradient">en nuestra historia.</em></h1><p>Honramos a las familias que han acompañado, enseñado y servido a nuestra congregación. Cada etapa forma parte de un mismo llamado.</p><Link className="history-text-link" to="/nosotros/historia">Leer la historia completa <ArrowRight size={17} /></Link></header><PastoralTimeline />
      <section className="assistant-pastors"><PastorPortrait pastor={assistantPastors} /><div><p className="history-eyebrow">{assistantPastors.role} · {assistantPastors.period}</p><h2>{assistantPastors.names}</h2><p>{assistantPastors.description}</p></div></section>
      <footer className="history-closing"><p className="history-eyebrow">El servicio continúa</p><h2>Una iglesia, muchas manos, <em>la misma fe.</em></h2><Link to="/nosotros#liderazgo" className="history-button">Conoce el liderazgo actual <ArrowRight size={18} /></Link></footer>
    </div>
  </div>;
}
