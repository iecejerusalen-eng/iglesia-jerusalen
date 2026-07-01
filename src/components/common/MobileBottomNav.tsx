import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchStore } from '../../store/useSearchStore';

interface NavItem {
  label: string;
  type: 'link' | 'sheet' | 'action';
  path?: string;
  sheetType?: 'comunidad' | 'recursos' | 'mas';
  onClick?: () => void;
  icon: (active: boolean) => React.ReactNode;
}

const MobileBottomNav: React.FC = () => {
  const location = useLocation();
  const [activeSheet, setActiveSheet] = useState<'comunidad' | 'recursos' | 'mas' | null>(null);
  const isSearchOpen = useSearchStore((state) => state.isOpen);


  const isActive = (path: string) => location.pathname === path;

  const isComunidadActive = () =>
    ['/ministerios', '/eventos', '/peticiones'].some((p) => location.pathname === p);

  const isRecursosActive = () =>
    ['/predicas', '/recursos/alabanzas', '/programas', '/recursos/biblia', '/recursos/juegos'].some((p) => location.pathname === p);

  const toggleSheet = (type: 'comunidad' | 'recursos' | 'mas') => {
    if (activeSheet === type) {
      setActiveSheet(null);
    } else {
      setActiveSheet(type);
    }
  };

  const closeSheet = () => setActiveSheet(null);

  const navItems: NavItem[] = [
    {
      label: 'Inicio',
      type: 'link',
      path: '/',
      icon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
          />
        </svg>
      ),
    },
    {
      label: 'Comunidad',
      type: 'sheet',
      sheetType: 'comunidad',
      icon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
    },
    {
      label: 'Recursos',
      type: 'sheet',
      sheetType: 'recursos',
      icon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
          />
        </svg>
      ),
    },
    {
      label: 'Buscar',
      type: 'action',
      onClick: () => {
        closeSheet();
        useSearchStore.getState().open();
      },
      icon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.637 10.637z"
          />
        </svg>
      ),
    },
    {
      label: 'Más',
      type: 'sheet',
      sheetType: 'mas',
      icon: (active) => (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          className={`w-6 h-6 transition-transform duration-300 ${active ? 'scale-110' : ''}`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
          />
        </svg>
      ),
    },
  ];

  const renderSheetContent = () => {
    switch (activeSheet) {
      case 'comunidad':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-serif text-primary dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">
              Comunidad
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/ministerios"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Ministerios</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Grupos de servicio y comunión</div>
                </div>
              </Link>
              <Link
                to="/eventos"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Eventos</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Calendario de reuniones y actividades</div>
                </div>
              </Link>
              <Link
                to="/peticiones"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Peticiones de Oración</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Comparte y apoya en oración mutua</div>
                </div>
              </Link>
            </div>
          </div>
        );
      case 'recursos':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-serif text-primary dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">
              Recursos
            </h3>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/recursos/biblia"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-amber-55 dark:bg-amber-950/30 text-amber-700 dark:text-gold rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">La Santa Biblia</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Lee y busca pasajes de las Escrituras</div>
                </div>
              </Link>
              <Link
                to="/predicas"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Prédicas</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Escucha los sermones dominicales</div>
                </div>
              </Link>
              <Link
                to="/recursos/alabanzas"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 0v15m0-15l-10.5 3m0 0v15m0-15l10.5 3m-10.5 0h10.5" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Alabanzas e Himnos</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Letras y acordes de cantos</div>
                </div>
              </Link>
              <Link
                to="/programas"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-sky-50 dark:bg-sky-900/30 text-sky-600 dark:text-sky-400 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Programas / Estudios</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Planes de discipulado y escuela dominical</div>
                </div>
              </Link>
              <Link
                to="/recursos/juegos"
                onClick={closeSheet}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
              >
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center">
                  <span className="text-xl leading-none">🎮</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-800 dark:text-gray-200">Juegos Bíblicos</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Aprende jugando con dinámicas interactivas</div>
                </div>
              </Link>
            </div>
          </div>
        );
      case 'mas':
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-bold font-serif text-primary dark:text-white border-b border-gray-100 dark:border-white/10 pb-2">
              Más opciones
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/nosotros"
                onClick={closeSheet}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center"
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 11.517 1.403l-.041.02a.75.75 0 01-.517-1.403zm0 6.25l.041-.02a.75.75 0 11.517 1.403l-.041.02a.75.75 0 01-.517-1.403zm0-12.5c.621 0 1.125.504 1.125 1.125v1.25c0 .621-.504 1.125-1.125 1.125s-1.125-.504-1.125-1.125v-1.25C10.125 5.504 10.629 5 11.25 5z" />
                  </svg>
                </div>
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Nosotros</div>
              </Link>
              <Link
                to="/contacto"
                onClick={closeSheet}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center"
              >
                <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                </div>
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Contacto</div>
              </Link>
              <Link
                to="/donaciones"
                onClick={closeSheet}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center"
              >
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
                  </svg>
                </div>
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Donaciones</div>
              </Link>
              <Link
                to="/tienda"
                onClick={closeSheet}
                className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center"
              >
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl mb-2">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5h6.75" />
                  </svg>
                </div>
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Tienda</div>
              </Link>
              <Link
                to="/admin"
                onClick={closeSheet}
                className="col-span-2 flex items-center justify-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors text-center"
              >
                <div className="p-2.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.34 15.84c-.68-.34-1.44-.08-1.78.6l-.34.68c-.34.68-.08 1.44.6 1.78l.68.34c.68.34 1.44.08 1.78-.6l.34-.68c.34-.68.08-1.44-.6-1.78l-.68-.34z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.43l-1.003.828c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .252c-.008.379.137.751.43.992l1.004.828c.424.35.534.954.26 1.43l-1.297 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.43l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.252c.007-.379-.138-.751-.43-.992l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.645-.869l.214-1.28z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="font-semibold text-sm text-gray-800 dark:text-gray-200">Panel Admin</div>
              </Link>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      {/* Menú inferior principal */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-gray-200/80 dark:border-white/10 px-2 py-1 md:hidden pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_24px_rgba(0,0,0,0.3)] transition-all duration-300">
        <div className="flex justify-around items-center max-w-lg mx-auto h-12">
          {navItems.map((item) => {
            const isItemActive =
              item.type === 'link'
                ? isActive(item.path || '')
                : item.type === 'action'
                ? isSearchOpen
                : item.sheetType === 'comunidad'
                ? isComunidadActive() || activeSheet === 'comunidad'
                : item.sheetType === 'recursos'
                ? isRecursosActive() || activeSheet === 'recursos'
                : activeSheet === 'mas';

            if (item.type === 'link') {
              return (
                <Link
                  key={item.label}
                  to={item.path || '#'}
                  onClick={closeSheet}
                  aria-label={item.label}
                  className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors"
                >
                  <div className={`mb-0.5 ${isItemActive ? 'text-accent-red dark:text-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}>
                    {item.icon(isItemActive)}
                  </div>
                  <span className={isItemActive ? 'text-accent-red dark:text-gold font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                    {item.label}
                  </span>
                </Link>
              );
            } else if (item.type === 'action') {
              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  aria-label={item.label}
                  className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <div className={`mb-0.5 ${isItemActive ? 'text-accent-red dark:text-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}>
                    {item.icon(isItemActive)}
                  </div>
                  <span className={isItemActive ? 'text-accent-red dark:text-gold font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                    {item.label}
                  </span>
                </button>
              );
            } else {
              return (
                <button
                  key={item.label}
                  onClick={() => toggleSheet(item.sheetType!)}
                  aria-label={`Menú ${item.label}`}
                  className="flex flex-col items-center justify-center flex-1 h-full py-1 text-[10px] font-medium transition-colors cursor-pointer"
                >
                  <div className={`mb-0.5 ${isItemActive ? 'text-accent-red dark:text-gold' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600'}`}>
                    {item.icon(isItemActive)}
                  </div>
                  <span className={isItemActive ? 'text-accent-red dark:text-gold font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                    {item.label}
                  </span>
                </button>
              );
            }
          })}
        </div>
      </div>

      {/* Sheets desplegables con Framer Motion */}
      <AnimatePresence>
        {activeSheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeSheet}
              className="fixed inset-0 bg-black/40 dark:bg-black/60 z-30 md:hidden backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="fixed left-0 right-0 z-35 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-white/10 rounded-t-2xl px-5 pt-6 pb-8 md:hidden shadow-[0_-8px_32px_rgba(0,0,0,0.12)] max-w-lg mx-auto"
              style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom))' }}
            >
              {/* Drag Handle */}
              <div className="w-12 h-1 bg-gray-200 dark:bg-slate-700 rounded-full mx-auto mb-4" />
              {renderSheetContent()}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default MobileBottomNav;
