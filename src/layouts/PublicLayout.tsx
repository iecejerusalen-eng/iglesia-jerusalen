import { lazy, Suspense } from 'react';
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
const SearchPalette = lazy(() => import('../components/public/SearchPalette'));

const ROUTE_METADATA: Array<{ match: string; title: string; description: string }> = [
  { match: '/visita', title: 'Planifica tu visita | Iglesia Jerusalén', description: 'Encuentra horarios, ubicación y todo lo necesario para visitar la Iglesia Jerusalén.' },
  { match: '/predicas', title: 'Prédicas y sermones | Iglesia Jerusalén', description: 'Escucha y mira las prédicas y enseñanzas de la Iglesia Jerusalén.' },
  { match: '/podcast', title: 'Podcast | Iglesia Jerusalén', description: 'Escucha conversaciones, enseñanzas y contenidos de audio de la Iglesia Jerusalén.' },
  { match: '/eventos', title: 'Eventos | Iglesia Jerusalén', description: 'Consulta los próximos eventos y actividades de la Iglesia Jerusalén.' },
  { match: '/ministerios', title: 'Ministerios | Iglesia Jerusalén', description: 'Conoce los ministerios y espacios de servicio de la Iglesia Jerusalén.' },
  { match: '/donations', title: 'Donaciones | Iglesia Jerusalén', description: 'Apoya la misión de la Iglesia Jerusalén con una donación segura.' },
  { match: '/contacto', title: 'Contacto | Iglesia Jerusalén', description: 'Comunícate con la Iglesia Jerusalén y encuentra nuestros canales oficiales.' },
  { match: '/peticiones', title: 'Peticiones de oración | Iglesia Jerusalén', description: 'Comparte tu petición de oración con la comunidad de la Iglesia Jerusalén.' },
  { match: '/recursos', title: 'Recursos | Iglesia Jerusalén', description: 'Explora recursos bíblicos, alabanzas, juegos y contenidos para crecer en la fe.' },
  { match: '/tienda', title: 'Tienda | Iglesia Jerusalén', description: 'Encuentra productos y recursos de la Iglesia Jerusalén.' },
  { match: '/aula-virtual', title: 'Aula virtual | Iglesia Jerusalén', description: 'Accede a los programas y recursos de formación de la Iglesia Jerusalén.' },
  { match: '/misiones', title: 'Misiones | Iglesia Jerusalén', description: 'Conoce el trabajo misionero y las historias de servicio de la Iglesia Jerusalén.' },
  { match: '/comunidad', title: 'Comunidad | Iglesia Jerusalén', description: 'Comparte testimonios, peticiones y noticias con la comunidad de la Iglesia Jerusalén.' },
  { match: '/reservas', title: 'Reservas | Iglesia Jerusalén', description: 'Consulta espacios disponibles y solicita una reserva en la Iglesia Jerusalén.' },
  { match: '/en-vivo', title: 'Culto en vivo | Iglesia Jerusalén', description: 'Participa en las transmisiones y cultos en vivo de la Iglesia Jerusalén.' },
  { match: '/programas', title: 'Programas de estudio | Iglesia Jerusalén', description: 'Encuentra programas de formación bíblica y discipulado de la Iglesia Jerusalén.' },
  { match: '/publicaciones', title: 'Publicaciones | Iglesia Jerusalén', description: 'Lee artículos, recursos y publicaciones de la Iglesia Jerusalén.' },
  { match: '/escuela-dominical', title: 'Escuela dominical | Iglesia Jerusalén', description: 'Materiales y actividades de formación para la Escuela Dominical.' },
  { match: '/cumpleanos', title: 'Cumpleaños | Iglesia Jerusalén', description: 'Celebra con la comunidad los cumpleaños de la Iglesia Jerusalén.' },
  { match: '/expositores', title: 'Expositores | Iglesia Jerusalén', description: 'Conoce a los pastores y expositores de la Iglesia Jerusalén.' },
  { match: '/recursos/biblia', title: 'Biblia | Iglesia Jerusalén', description: 'Consulta el texto bíblico y busca pasajes para tu estudio personal.' },
  { match: '/recursos/juegos', title: 'Juegos bíblicos | Iglesia Jerusalén', description: 'Aprende la Biblia mediante juegos y desafíos interactivos.' },
];

function getRouteMetadata(pathname: string) {
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  return ROUTE_METADATA.find(({ match }) => normalizedPath === match || normalizedPath.startsWith(`${match}/`)) ?? {
    title: 'Iglesia Jerusalén',
    description: 'Iglesia del Evangelio Cuadrangular Jerusalén: comunidad, fe, formación y servicio.',
  };
}

const PublicLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';
  const metadata = getRouteMetadata(location.pathname);
  const canonicalPath = location.pathname === '/' ? '/' : location.pathname.replace(/\/$/, '');
  const canonicalUrl = `${window.location.origin}${canonicalPath}`;

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-sans relative transition-colors duration-500 overflow-x-hidden w-full">
      <Helmet>
        <title>{metadata.title}</title>
        <meta name="description" content={metadata.description} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={metadata.title} />
        <meta property="og:description" content={metadata.description} />
        <meta property="og:url" content={canonicalUrl} />
      </Helmet>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-slate-950 focus:font-bold focus:rounded-lg shadow-xl">
        Saltar al contenido principal
      </a>
      <Preloader />
      <StickyNav />
      <TopBar />
      <Navigation key={location.pathname} />
      <main id="main-content" className={`flex-grow pb-20 pb-safe md:pb-0 ${isHome ? '' : 'pt-[78px]'}`}>
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <StickyGlobalPlayer />
      <TodayActivityPeek />
      <Suspense fallback={null}><SearchPalette /></Suspense>
    </div>
  );
};

export default PublicLayout;
