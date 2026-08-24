import { lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from '../components/common/TopBar';
import Navigation from '../components/common/Navigation';
import Footer from '../components/common/Footer';
import Preloader from '../components/public/Preloader';
import StickyNav from '../components/public/StickyNav';
import MobileBottomNav from '../components/common/MobileBottomNav';
import StickyGlobalPlayer from '../components/audio/StickyGlobalPlayer';
const SearchPalette = lazy(() => import('../components/public/SearchPalette'));

const PublicLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-sans relative transition-colors duration-500 overflow-x-hidden w-full">
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
      <Suspense fallback={null}><SearchPalette /></Suspense>
    </div>
  );
};

export default PublicLayout;
