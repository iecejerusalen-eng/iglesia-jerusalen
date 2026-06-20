import { Outlet } from 'react-router-dom';
import TopBar from '../components/common/TopBar';
import Navigation from '../components/common/Navigation';
import Footer from '../components/common/Footer';
import Preloader from '../components/public/Preloader';
import StickyNav from '../components/public/StickyNav';
import MobileBottomNav from '../components/common/MobileBottomNav';
import SearchPalette from '../components/public/SearchPalette';

const PublicLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-surface dark:bg-slate-950 text-gray-800 dark:text-gray-100 font-sans relative transition-colors duration-500">
      <Preloader />
      <StickyNav />
      <TopBar />
      <Navigation />
      <main className="flex-grow pb-16 md:pb-0">
        <Outlet />
      </main>
      <Footer />
      <MobileBottomNav />
      <SearchPalette />
    </div>
  );
};

export default PublicLayout;

