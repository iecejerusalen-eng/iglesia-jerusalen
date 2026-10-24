import { useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, ChevronDown, ShoppingBag, Heart, LayoutDashboard, Upload, MapPin, Radio, HandHeart } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import NotificationTray from './NotificationTray';
import { uploadMediaFile } from '../../lib/mediaService';
import { PUBLIC_LAUNCH_VISIBILITY } from '../../config/publicLaunchVisibility';

const TopBar = () => {
  const totalItems = useCartStore((state) => state.getTotalItems());
  const { user, role, firstName, lastName, signOut, photoUrl } = useAuthStore();
  const { hasPermission } = usePermissions();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [updatingProfilePhoto, setUpdatingProfilePhoto] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!user) return;

    setUpdatingProfilePhoto(true);
    try {
      const newPhotoUrl = await uploadMediaFile(file, 'profiles', 'image');

      // Update in Supabase profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: newPhotoUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update the Zustand store locally
      useAuthStore.getState().setProfileInfo(
        firstName,
        lastName,
        newPhotoUrl
      );

      toast.success('Foto de perfil actualizada con éxito.');
    } catch (err) {
      console.error(err);
      toast.error('No se pudo actualizar la foto de perfil.');
    } finally {
      setUpdatingProfilePhoto(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';
  const isHomeAtTop = isHome && !isScrolled;
  const isTransparent = isHomeAtTop && document.documentElement.classList.contains('dark');
  const roleLower = role?.toLowerCase();
  const isAuthorized = roleLower === 'admin' || roleLower === 'pastor' || hasPermission('dashboard', 'view');

  return (
    <div className={`h-[46px] transition-all duration-500 ease-in-out ${
      isHomeAtTop
        ? `absolute top-0 left-0 right-0 w-full z-[100] ${isTransparent ? 'bg-transparent border-transparent text-white/95' : 'bg-white/90 dark:bg-slate-950/90 border-b border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-200 backdrop-blur-md'}`
        : 'bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-200 relative z-[100]'
    } text-sm`}>
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-3 sm:px-4 md:px-8">
        <Link
          to="/contacto"
          className={`group flex min-w-0 items-center gap-2 rounded-full py-1 pr-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${
            isTransparent ? 'text-white/75 hover:text-white' : 'text-slate-500 hover:text-primary dark:text-slate-400 dark:hover:text-white'
          }`}
          aria-label="Iglesia Jerusalén en Milagro, Ecuador"
        >
          <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors ${
            isTransparent
              ? 'border-white/15 bg-white/10 text-gold'
              : 'border-primary/10 bg-primary/5 text-primary dark:border-white/10 dark:bg-white/5 dark:text-gold'
          }`}>
            <MapPin size={12} aria-hidden="true" />
          </span>
          <span className="whitespace-nowrap">
            Milagro<span className="hidden sm:inline">, Ecuador</span>
          </span>
          <span className={`hidden h-3 w-px lg:block ${isTransparent ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/15'}`} aria-hidden="true" />
          <span className="hidden truncate lg:block">Iglesia del Evangelio Cuadrangular Jerusalén</span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">

        {/* Botón de Culto En Vivo */}
        <Link 
          to="/en-vivo" 
          className="group flex h-7 items-center gap-1.5 rounded-full border border-red-500/20 bg-red-500/[0.08] px-2.5 text-[11px] font-extrabold text-red-500 shadow-xs transition hover:border-red-500/35 hover:bg-red-500/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:px-3"
          aria-label="Ir al culto en vivo"
        >
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-40 motion-reduce:animate-none" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <Radio size={12} className="hidden sm:block" aria-hidden="true" />
          <span className="hidden sm:inline">En Vivo</span>
          <span className="sm:hidden">Vivo</span>
        </Link>

        {/* Único Botón de Donaciones / Diezmos destacado */}
        <Link 
          to="/donaciones" 
          className={`hidden h-7 items-center gap-1.5 rounded-full border px-3 text-[11px] font-extrabold shadow-2xs transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold lg:flex ${
            isTransparent 
              ? 'border-gold/35 bg-gold/10 text-gold hover:bg-gold/20'
              : 'border-gold/25 bg-gold/5 text-amber-700 hover:border-gold/45 hover:bg-gold/10 dark:text-gold'
          }`}
        >
          <HandHeart size={13} aria-hidden="true" />
          Donaciones / Diezmos
        </Link>
        
        <div className="flex items-center gap-1 sm:gap-2">
          <NotificationTray />

          {/* Cart Icon Link */}
          {PUBLIC_LAUNCH_VISIBILITY.store && <Link
            to="/tienda" 
            className={`relative p-1.5 rounded-full transition-colors cursor-pointer ${
              isTransparent ? 'text-white hover:text-gold' : 'text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-gold'
            }`}
            title="Ver carrito de compras"
          >
            <ShoppingCart size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-gold text-slate-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-bounce">
                {totalItems}
              </span>
            )}
          </Link>}

          {user ? (
            <div className="relative">
              {/* Botón de Perfil / Hola, [Nombre] */}
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2 transition-colors duration-500 cursor-pointer py-1 font-semibold text-xs ${
                  isTransparent ? 'text-white hover:text-gold' : 'text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-gold'
                }`}
              >
                {photoUrl ? (
                  <img loading="lazy"
                    src={photoUrl}
                    alt="Perfil"
                    className="w-6 h-6 rounded-full object-cover border border-gray-250"
                  />
                ) : (
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] uppercase transition-colors duration-500 ${
                    isTransparent ? 'bg-white/10 text-white border border-white/20' : 'bg-primary/10 text-primary'
                  }`}>
                    {firstName ? firstName[0] : user.email?.[0] || 'U'}
                  </div>
                )}
                <span className="hidden sm:inline">
                  Hola, {firstName || user.user_metadata?.full_name || user.email?.split('@')[0]}
                </span>
                <ChevronDown size={12} className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Backdrop para cerrar clickeando fuera */}
              {userMenuOpen && (
                <div className="fixed inset-0 z-[105]" onClick={() => setUserMenuOpen(false)} />
              )}

              {/* Dropdown Menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-2xl py-2 z-[110] overflow-hidden border ${
                      isTransparent 
                        ? 'bg-slate-950/95 backdrop-blur-md border-white/15 text-white/90' 
                        : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-white/10 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-3 flex flex-col items-center gap-1.5 border-b text-center ${
                      isTransparent ? 'border-white/10' : 'border-gray-150 dark:border-white/10'
                    }`}>
                      {photoUrl ? (
                        <img loading="lazy"
                          src={photoUrl}
                          alt="Avatar"
                          className="w-12 h-12 rounded-full object-cover border-2 border-gold/40"
                        />
                      ) : (
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg uppercase ${
                          isTransparent ? 'bg-white/10 text-white' : 'bg-primary/10 text-primary'
                        }`}>
                          {firstName ? firstName[0] : user.email?.[0] || 'U'}
                        </div>
                      )}
                      <div className="w-full truncate">
                        <p className="text-xs font-bold truncate">
                          {firstName || user.user_metadata?.full_name || user.email?.split('@')[0]}
                        </p>
                        <p className={`text-[10px] truncate ${isTransparent ? 'text-white/50' : 'text-gray-400'}`}>
                          {user.email}
                        </p>
                      </div>
                      
                      <label htmlFor="profilePhotoUpload" className={`text-[10px] font-bold px-2 py-0.5 rounded-md cursor-pointer flex items-center gap-1.5 mt-1 transition-all select-none border ${
                        isTransparent 
                          ? 'text-gold bg-gold/10 hover:bg-gold/25 border-gold/30' 
                          : 'text-gold bg-gold/5 hover:bg-gold/15 border-gold/20'
                      }`}>
                        {updatingProfilePhoto ? (
                          <span>Cargando...</span>
                        ) : (
                          <>
                            <Upload size={10} />
                            <span>Cambiar Foto</span>
                          </>
                        )}
                        <input
                          id="profilePhotoUpload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleProfilePhotoUpload}
                          disabled={updatingProfilePhoto}
                        />
                      </label>
                    </div>

                    {isAuthorized && (
                      <Link 
                        to="/admin" 
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b transition-colors ${
                          isTransparent 
                            ? 'text-white hover:bg-white/10 hover:text-gold border-white/10' 
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-gold border-gray-100 dark:border-white/5'
                        }`}
                      >
                        <LayoutDashboard size={14} className="text-primary" />
                        <span>Panel Admin (CRM)</span>
                      </Link>
                    )}

                    {roleLower === 'admin' && (
                      <Link 
                        to="/lms/director" 
                        onClick={() => setUserMenuOpen(false)}
                        className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b transition-colors ${
                          isTransparent 
                            ? 'text-white hover:bg-white/10 hover:text-gold border-white/10' 
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-gold border-gray-100 dark:border-white/5'
                        }`}
                      >
                        <LayoutDashboard size={14} className="text-amber-500" />
                        <span>Panel Maestro</span>
                      </Link>
                    )}

                    <Link 
                      to="/lms/estudiante" 
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold border-b transition-colors ${
                        isTransparent 
                          ? 'text-white hover:bg-white/10 hover:text-gold border-white/10' 
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-gold border-gray-100 dark:border-white/5'
                      }`}
                    >
                      <LayoutDashboard size={14} className="text-gold" />
                      <span>Panel de Estudiante</span>
                    </Link>
                    
                    <Link to="/mis-aportes" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800"><Heart size={14} /><span>Mis aportes privados</span></Link>

                    <Link 
                      to="/mis-compras" 
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors ${
                        isTransparent ? 'text-white/80 hover:bg-white/10 hover:text-gold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-gold'
                      }`}
                    >
                      <ShoppingBag size={14} className="text-gray-500" />
                      <span>Mis Compras</span>
                    </Link>

                    <Link 
                      to="/peticiones" 
                      onClick={() => setUserMenuOpen(false)}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors ${
                        isTransparent ? 'text-white/80 hover:bg-white/10 hover:text-gold' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-primary dark:hover:text-gold'
                      }`}
                    >
                      <Heart size={14} className="text-gray-500" />
                      <span>Mis Peticiones</span>
                    </Link>

                    <hr className={isTransparent ? 'border-white/10 my-1' : 'border-gray-100 dark:border-white/5 my-1'} />

                    <button
                      onClick={() => {
                        setUserMenuOpen(false);
                        signOut();
                      }}
                      className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold transition-colors w-full text-left cursor-pointer ${
                        isTransparent ? 'text-red-400 hover:bg-white/10' : 'text-accent-red hover:bg-red-50 dark:hover:bg-red-950/30'
                      }`}
                    >
                      <LogOut size={14} />
                      <span>Cerrar Sesión</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link 
              to="/login" 
              className={`transition-colors duration-500 flex items-center gap-1.5 text-xs font-bold mr-2 ${
                isTransparent ? 'text-white hover:text-gold' : 'text-gray-750 dark:text-gray-200 hover:text-primary dark:hover:text-gold'
              }`}
            >
              <User size={14} />
              <span>Ingresar</span>
            </Link>
          )}
        </div>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
