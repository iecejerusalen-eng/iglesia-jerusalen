import { lazy, Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import TopBar from '../components/common/TopBar';
import Navigation from '../components/common/Navigation';
import Footer from '../components/common/Footer';
import Preloader from '../components/public/Preloader';
import StickyNav from '../components/public/StickyNav';
import MobileBottomNav from '../components/common/MobileBottomNav';
const SearchPalette = lazy(() => import('../components/public/SearchPalette'));

const PublicLayout = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-sans relative transition-colors duration-500 overflow-x-hidden w-full">
      <Preloader />
      <StickyNav />
      <TopBar />
      <Navigation key={location.pathname} />
      <main className={`flex-grow pb-20 pb-safe md:pb-0 ${isHome ? '' : 'pt-[78px]'}`}>
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <Suspense fallback={null}><SearchPalette /></Suspense>
    </div>
  );
};

export default PublicLayout;

