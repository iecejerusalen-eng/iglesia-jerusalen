import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import TopBar from '../components/common/TopBar';
import Navigation from '../components/common/Navigation';
import Footer from '../components/common/Footer';
import Preloader from '../components/public/Preloader';
import StickyNav from '../components/public/StickyNav';
import MobileBottomNav from '../components/common/MobileBottomNav';
import StickyGlobalPlayer from '../components/audio/StickyGlobalPlayer';
import TodayActivityPeek from '../components/public/TodayActivityPeek';
import ChurchAssistantWidget from '../components/public/ChurchAssistantWidget';

const ROUTE_METADATA: Array<{ match: string; title: string; description: string; exact?: boolean }> = [
  { match: '/', title: 'Iglesia Jerusalén en Milagro, Guayas | Iglesia Cuadrangular', description: 'Iglesia del Evangelio Cuadrangular Jerusalén en Milagro, Guayas, Ecuador. Consulta horarios de culto, ubicación, ministerios y transmisiones en vivo; planifica tu visita.' },
  { match: '/visita', title: 'Visita Iglesia Jerusalén en Milagro | Iglesia Cuadrangular', description: 'Planifica tu primera visita a la Iglesia del Evangelio Cuadrangular Jerusalén en Milagro, Guayas. Consulta horarios de culto, dirección y cómo llegar.' },
  { match: '/predicas', title: 'Prédicas y sermones | Iglesia Jerusalén', description: 'Escucha y mira las prédicas y enseñanzas de la Iglesia Jerusalén.' },
  { match: '/podcast', title: 'Podcast | Iglesia Jerusalén', description: 'Escucha conversaciones, enseñanzas y contenidos de audio de la Iglesia Jerusalén.' },
  { match: '/eventos', title: 'Eventos | Iglesia Jerusalén', description: 'Consulta los próximos eventos y actividades de la Iglesia Jerusalén.' },
  { match: '/aniversario-65', title: '65.º aniversario | Iglesia Jerusalén', description: '' },
  { match: '/ministerios', title: 'Ministerios | Iglesia Jerusalén', description: 'Conoce los ministerios y espacios de servicio de la Iglesia Jerusalén en Milagro, Guayas.', exact: true },
  { match: '/donaciones', title: 'Donaciones y Ofrendas | Iglesia Jerusalén en Milagro', description: 'Conoce las formas de aportar a la obra de Iglesia Cuadrangular Jerusalén en Milagro, Guayas. Consulta instrucciones para diezmos, ofrendas y donaciones.' },
  { match: '/contacto', title: 'Contacto | Iglesia Jerusalén en Milagro', description: 'Comunícate con la Iglesia del Evangelio Cuadrangular Jerusalén en Milagro, Guayas. Consulta dirección, teléfonos, correo y cómo llegar.' },
  { match: '/peticiones', title: 'Peticiones de oración | Iglesia Jerusalén', description: 'Comparte tu petición de oración con la comunidad de la Iglesia Jerusalén.' },
  { match: '/recursos/juegos', title: 'Juegos bíblicos | Iglesia Jerusalén', description: '' },
  { match: '/recursos', title: 'Recursos | Iglesia Jerusalén', description: 'Explora recursos bíblicos, alabanzas, juegos y contenidos para crecer en la fe.' },
  { match: '/tienda', title: 'Tienda | Iglesia Jerusalén', description: '' },
  { match: '/aula-virtual', title: 'Aula virtual | Iglesia Jerusalén', description: 'Accede a los programas y recursos de formación de la Iglesia Jerusalén.' },
  { match: '/misiones', title: 'Misiones | Iglesia Jerusalén', description: '' },
  { match: '/comunidad', title: 'Comunidad | Iglesia Jerusalén', description: 'Comparte testimonios, peticiones y noticias con la comunidad de la Iglesia Jerusalén.' },
  { match: '/reservas', title: 'Reservas | Iglesia Jerusalén', description: 'Consulta espacios disponibles y solicita una reserva en la Iglesia Jerusalén.' },
  { match: '/en-vivo', title: 'Culto en vivo | Iglesia Jerusalén', description: '' },
  { match: '/programas', title: 'Programas de estudio | Iglesia Jerusalén', description: 'Encuentra programas de formación bíblica y discipulado de la Iglesia Jerusalén.' },
  { match: '/publicaciones', title: 'Publicaciones | Iglesia Jerusalén', description: 'Lee artículos, recursos y publicaciones de la Iglesia Jerusalén.' },
  { match: '/escuela-dominical', title: 'Escuela dominical | Iglesia Jerusalén', description: 'Materiales y actividades de formación para la Escuela Dominical.' },
  { match: '/cumpleanos', title: 'Cumpleaños | Iglesia Jerusalén', description: '' },
  { match: '/expositores', title: 'Expositores | Iglesia Jerusalén', description: 'Conoce a los pastores y expositores de la Iglesia Jerusalén.' },
  { match: '/recursos/biblia', title: 'Biblia | Iglesia Jerusalén', description: 'Consulta el texto bíblico y busca pasajes para tu estudio personal.' },
  { match: '/nosotros', title: 'Iglesia Jerusalén en Milagro | Historia y fe Cuadrangular', description: 'Conoce la historia, identidad, misión y liderazgo de la Iglesia del Evangelio Cuadrangular Jerusalén en Milagro, Guayas.', exact: true },
];

function getRouteMetadata(pathname: string) {
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return ROUTE_METADATA.find(({ match, exact }) => normalizedPath === match || (!exact && match !== '/' && normalizedPath.startsWith(`${match}/`))) ?? {
    title: 'Iglesia Jerusalén',
    description: '',
  };
}

const PublicLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const metadata = getRouteMetadata(location.pathname);
  const canonicalPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  const canonicalUrl = `https://www.iecejerusalen.com${canonicalPath}`;

  useEffect(() => {
    document.head.querySelectorAll('[data-seo-fallback="true"]').forEach((tag) => tag.remove());
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-sans relative transition-colors duration-500 overflow-x-hidden w-full">
      <Helmet>
        <title>{metadata.title}</title>
        {metadata.description && <meta name="description" content={metadata.description} />}
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metadata.title} />
        {metadata.description && <meta property="og:description" content={metadata.description} />}
        <meta property="og:url" content={canonicalUrl} />
        <meta name="twitter:title" content={metadata.title} />
        {metadata.description && <meta name="twitter:description" content={metadata.description} />}
      </Helmet>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-950 focus:font-bold focus:rounded-lg shadow-xl">
        Saltar al contenido principal
      </a>
      <Preloader />
      <StickyNav />
      <div className="block">
        <TopBar />
      </div>
      <Navigation />
      <main id="main-content" className={`flex-grow pb-20 pb-safe md:pb-0 ${isHome ? '' : 'pt-[78px]'}`}>
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <StickyGlobalPlayer />
      <TodayActivityPeek />
      <ChurchAssistantWidget />
    </div>
  );
};

export default PublicLayout;
