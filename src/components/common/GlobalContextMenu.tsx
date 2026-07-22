import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuPopup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuGroup,
  ContextMenuGroupLabel,
} from '@/components/ui/context-menu';
import {
  Home,
  MapPin,
  Calendar,
  Globe2,
  GraduationCap,
  ShoppingBag,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Copy,
  Moon,
  Sun,
  Search,
  MessageSquareHeart,
} from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';
import { RouteModal } from '@/components/map/RouteModal';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileContextDrawer } from '@/components/common/MobileContextDrawer';

interface GlobalContextMenuProps {
  children: React.ReactNode;
}

export function GlobalContextMenu({ children }: GlobalContextMenuProps) {
  const navigate = useNavigate();
  const { setTheme, getEffectiveTheme } = useThemeStore();
  const [isRouteOpen, setIsRouteOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const isMobile = useIsMobile();
  const touchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isDarkMode = getEffectiveTheme() === 'dark';

  const toggleTheme = () => {
    setTheme(isDarkMode ? 'light' : 'dark');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Enlace copiado al portapapeles');
  };

  const handleOpenSearch = () => {
    const event = new KeyboardEvent('keydown', {
      key: 'k',
      ctrlKey: true,
      bubbles: true,
    });
    document.dispatchEvent(event);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = e.target as HTMLElement;
      touchTimerRef.current = setTimeout(() => {
        if (isMobile) {
          setIsMobileDrawerOpen(true);
          if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(50);
          }
        } else {
          const contextMenuEvent = new MouseEvent('contextmenu', {
            bubbles: true,
            cancelable: true,
            clientX: touch.clientX,
            clientY: touch.clientY,
          });
          target.dispatchEvent(contextMenuEvent);
        }
      }, 450);
    }
  };

  const handleTouchEndOrMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger 
          className="min-h-screen flex flex-col w-full select-none outline-none [-webkit-touch-callout:none]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchEndOrMove}
          onTouchEnd={handleTouchEndOrMove}
        >
          {children}
        </ContextMenuTrigger>

        <ContextMenuPopup className="w-64">
          <ContextMenuGroup>
            <ContextMenuGroupLabel>Navegación Iglesia</ContextMenuGroupLabel>
            <ContextMenuItem onClick={() => navigate('/')}>
              <Home className="w-4 h-4 mr-2 text-rose-500" />
              <span>Inicio</span>
              <ContextMenuShortcut>Alt+H</ContextMenuShortcut>
            </ContextMenuItem>
            
            <ContextMenuItem onClick={() => navigate('/eventos')}>
              <Calendar className="w-4 h-4 mr-2 text-blue-500" />
              <span>Eventos y Horarios</span>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => navigate('/misiones')}>
              <Globe2 className="w-4 h-4 mr-2 text-amber-500" />
              <span>Misiones 3D</span>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => navigate('/universidad')}>
              <GraduationCap className="w-4 h-4 mr-2 text-emerald-500" />
              <span>Aula Virtual</span>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => navigate('/tienda')}>
              <ShoppingBag className="w-4 h-4 mr-2 text-purple-500" />
              <span>Tienda</span>
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuSeparator />

          <ContextMenuGroup>
            <ContextMenuGroupLabel>Ruta & Ubicación</ContextMenuGroupLabel>
            <ContextMenuItem onClick={() => setIsRouteOpen(true)}>
              <MapPin className="w-4 h-4 mr-2 text-rose-600 animate-bounce" />
              <span className="font-semibold text-rose-600 dark:text-rose-400">¿Cómo llegar a la Iglesia?</span>
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuSeparator />

          <ContextMenuGroup>
            <ContextMenuGroupLabel>Acciones de Página</ContextMenuGroupLabel>
            <ContextMenuItem onClick={() => window.history.back()}>
              <ArrowLeft className="w-4 h-4 mr-2 text-gray-500" />
              <span>Atrás</span>
              <ContextMenuShortcut>Alt+←</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => window.history.forward()}>
              <ArrowRight className="w-4 h-4 mr-2 text-gray-500" />
              <span>Adelante</span>
              <ContextMenuShortcut>Alt+→</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => window.location.reload()}>
              <RotateCw className="w-4 h-4 mr-2 text-gray-500" />
              <span>Recargar Página</span>
              <ContextMenuShortcut>Ctrl+R</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem onClick={handleCopyLink}>
              <Copy className="w-4 h-4 mr-2 text-gray-500" />
              <span>Copiar Enlace</span>
            </ContextMenuItem>
          </ContextMenuGroup>

          <ContextMenuSeparator />

          <ContextMenuGroup>
            <ContextMenuItem onClick={toggleTheme}>
              {isDarkMode ? (
                <Sun className="w-4 h-4 mr-2 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 mr-2 text-slate-700" />
              )}
              <span>{isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}</span>
            </ContextMenuItem>

            <ContextMenuItem onClick={handleOpenSearch}>
              <Search className="w-4 h-4 mr-2 text-blue-500" />
              <span>Buscar...</span>
              <ContextMenuShortcut>Ctrl+K</ContextMenuShortcut>
            </ContextMenuItem>

            <ContextMenuItem onClick={() => navigate('/contacto')}>
              <MessageSquareHeart className="w-4 h-4 mr-2 text-rose-500" />
              <span>Oración y Contacto</span>
            </ContextMenuItem>
          </ContextMenuGroup>
        </ContextMenuPopup>
      </ContextMenu>

      {/* Menú Contextual Rápido en formato Bottom Sheet para Móviles */}
      <MobileContextDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpenRoute={() => setIsRouteOpen(true)}
        onOpenSearch={handleOpenSearch}
      />

      {/* Modal interactivo de mapa de ruta a la Iglesia */}
      <RouteModal
        isOpen={isRouteOpen}
        onClose={() => setIsRouteOpen(false)}
        destination={{
          name: 'Iglesia Jerusalén Central (Milagro)',
          lat: -2.139188,
          lng: -79.5949891,
        }}
      />
    </>
  );
}

export default GlobalContextMenu;
