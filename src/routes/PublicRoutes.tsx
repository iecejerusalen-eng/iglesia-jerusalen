import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import PublicLayout from '../layouts/PublicLayout';

const lazyWithRetry = <T extends React.ComponentType<object>>(
  componentImport: () => Promise<{ default: T }>
) => {
  return lazy(async () => {
    try {
      const component = await componentImport();
      window.sessionStorage.removeItem('chunk-failed-reload');
      return component;
    } catch (error: unknown) {
      const err = error as { message?: string } | undefined;
      if (
        err?.message?.includes('Failed to fetch dynamically imported module') ||
        err?.message?.includes('Importing a module script failed') ||
        err?.message?.includes('error loading dynamically imported module')
      ) {
        if (!window.sessionStorage.getItem('chunk-failed-reload')) {
          window.sessionStorage.setItem('chunk-failed-reload', 'true');
          window.location.reload();
          return new Promise(() => {});
        }
      }
      window.sessionStorage.removeItem('chunk-failed-reload');
      throw error;
    }
  });
};

const Home = lazyWithRetry(() => import('../pages/public/Home'));
const Login = lazyWithRetry(() => import('../pages/auth/Login'));
const Store = lazyWithRetry(() => import('../pages/public/Store'));
const Cart = lazyWithRetry(() => import('../pages/public/Cart'));
const Donations = lazyWithRetry(() => import('../pages/public/Donations'));
const About = lazyWithRetry(() => import('../pages/public/About'));
const MinistriesOverview = lazyWithRetry(() => import('../pages/public/MinistriesOverview'));
const MinistryDetail = lazyWithRetry(() => import('../pages/public/MinistryDetail'));
const Sermons = lazyWithRetry(() => import('../pages/public/Sermons'));
const Contact = lazyWithRetry(() => import('../pages/public/Contact'));
const Events = lazyWithRetry(() => import('../pages/public/Events'));
const Petitions = lazyWithRetry(() => import('../pages/public/Petitions'));
const SongsLibrary = lazyWithRetry(() => import('../pages/public/SongsLibrary'));
const ProgramsOverview = lazyWithRetry(() => import('../pages/public/ProgramsOverview'));
const VirtualClassroomLanding = lazyWithRetry(() => import('../pages/public/VirtualClassroomLanding'));
const Presentation = lazyWithRetry(() => import('../pages/public/Presentation').then(m => ({ default: m.Presentation })));
const ProgramDetail = lazyWithRetry(() => import('../pages/public/ProgramDetail'));
const MyPurchases = lazyWithRetry(() => import('../pages/public/MyPurchases'));
const SundaySchool = lazyWithRetry(() => import('../pages/public/SundaySchool'));
const ReadingPlan = lazyWithRetry(() => import('../pages/public/ReadingPlan'));
const SermonDetail = lazyWithRetry(() => import('../pages/public/SermonDetail'));
const Birthdays = lazyWithRetry(() => import('../pages/public/Birthdays'));
const Bible = lazyWithRetry(() => import('../pages/public/Bible'));
const Missions = lazyWithRetry(() => import('../pages/public/Missions'));

const GamesHub = lazyWithRetry(() => import('../pages/public/GamesHub').then(m => ({ default: m.GamesHub })));
const Biblionario = lazyWithRetry(() => import('../pages/public/games/Biblionario').then(m => ({ default: m.Biblionario })));
const Hangman = lazyWithRetry(() => import('../pages/public/games/Hangman').then(m => ({ default: m.Hangman })));
const MemoryMatch = lazyWithRetry(() => import('../pages/public/games/MemoryMatch').then(m => ({ default: m.MemoryMatch })));

export default function PublicRoutes() {
  return (
    <Routes>
      <Route path="/presentacion" element={<Presentation />} />
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/tienda" element={<Store />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/donations" element={<Donations />} />
        <Route path="/nosotros" element={<About />} />
        <Route path="/ministerios" element={<MinistriesOverview />} />
        <Route path="/ministerios/:slug" element={<MinistryDetail />} />
        <Route path="/predicas" element={<Sermons />} />
        <Route path="/contacto" element={<Contact />} />
        <Route path="/eventos" element={<Events />} />
        <Route path="/peticiones" element={<Petitions />} />
        <Route path="/recursos/alabanzas" element={<SongsLibrary />} />
        <Route path="/programas" element={<ProgramsOverview />} />
        <Route path="/programas/:id" element={<ProgramDetail />} />
        <Route path="/aula-virtual" element={<VirtualClassroomLanding />} />
        <Route path="/mis-compras" element={<MyPurchases />} />
        <Route path="/escuela-dominical" element={<SundaySchool />} />
        <Route path="/plan-lectura" element={<ReadingPlan />} />
        <Route path="/predicas/:id" element={<SermonDetail />} />
        <Route path="/misiones" element={<Missions />} />
        <Route path="/cumpleanos" element={<Birthdays />} />
        <Route path="/recursos/biblia" element={<Bible />} />
        <Route path="/recursos/juegos" element={<GamesHub />} />
        <Route path="/recursos/juegos/quien-quiere-ser-biblionario" element={<Biblionario />} />
        <Route path="/recursos/juegos/ahorcado-biblico" element={<Hangman />} />
        <Route path="/recursos/juegos/memorama-biblico" element={<MemoryMatch />} />
      </Route>
    </Routes>
  );
}
