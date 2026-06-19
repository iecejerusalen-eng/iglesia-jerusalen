import { useState, useEffect } from 'react';
import { ShoppingCart, User, LogOut, ChevronDown, ShoppingBag, Heart, LayoutDashboard, Upload } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useCartStore } from '../../store/useCartStore';
import { useAuthStore } from '../../store/useAuthStore';
import { usePermissions } from '../../hooks/usePermissions';
import { AnimatePresence, motion } from 'framer-motion';
import { supabase } from '../../config/supabase';
import { toast } from 'sonner';
import NotificationTray from './NotificationTray';

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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'iglesia_jerusalen_web');

    try {
      const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'degrlmvsq';
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al subir la imagen a Cloudinary');
      }

      const uploadData = await response.json();
      const newPhotoUrl = uploadData.secure_url;

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
  const isTransparent = isHome && !isScrolled;
  const roleLower = role?.toLowerCase();
  const isAuthorized = roleLower === 'admin' || roleLower === 'pastor' || hasPermission('dashboard', 'view');

  return (
    <div className={`transition-all duration-500 ease-in-out ${
      isTransparent 
        ? 'absolute top-0 left-0 right-0 w-full bg-transparent border-transparent text-white/95 z-[60]' 
        : 'bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-white/10 text-gray-600 dark:text-gray-200 relative z-[60]'
    } text-sm py-2.5 px-4 md:px-8 flex justify-between items-center`}>
      <div className="flex gap-4">
        <span className={`hidden sm:inline font-medium text-xs transition-colors duration-500 ${
          isTransparent ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'
        }`}>
          Iglesia del Evangelio Cuadrangular Jerusalén
        </span>
      </div>
      
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Único Botón de Donaciones / Diezmos destacado */}
        <Link 
          to="/donations" 
          className={`font-bold transition-all duration-500 flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs shadow-2xs cursor-pointer ${
            isTransparent 
              ? 'text-gold bg-gold/10 hover:bg-gold/20 border border-gold/40' 
              : 'text-gold bg-gold/5 hover:bg-gold/10 border border-gold/25'
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse"></span>
          Donaciones / Diezmos
        </Link>
        
        <div className="flex items-center gap-4">
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
                  <img
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
                <div className="fixed inset-0 z-30" onClick={() => setUserMenuOpen(false)} />
              )}

              {/* Dropdown Menu */}
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl py-2 z-40 overflow-hidden border ${
                      isTransparent 
                        ? 'bg-slate-950/95 backdrop-blur-md border-white/15 text-white/90' 
                        : 'bg-white dark:bg-slate-900 border-gray-150 dark:border-white/10 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className={`px-4 py-3 flex flex-col items-center gap-1.5 border-b text-center ${
                      isTransparent ? 'border-white/10' : 'border-gray-150 dark:border-white/10'
                    }`}>
                      {photoUrl ? (
                        <img
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
                        <span>Panel Admin</span>
                      </Link>
                    )}
                    
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

          {/* Bandeja de Mensajes/Notificaciones */}
          <NotificationTray />

          {/* Icono de Carrito */}
          <Link 
            to="/cart" 
            className={`transition-colors duration-500 flex items-center gap-1 relative py-1 ${
              isTransparent ? 'text-white hover:text-gold' : 'text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-gold'
            }`}
          >
            <ShoppingCart size={16} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent-red text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
