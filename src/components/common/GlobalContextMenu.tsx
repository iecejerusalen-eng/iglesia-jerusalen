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
import { CONTEXT_MENU_GROUPS } from '@/components/common/contextMenuItems';
import type { ContextMenuNavItem, ContextMenuActionItem } from '@/components/common/contextMenuItems';

// Icon lookup table for desktop menu
const DESKTOP_ICONS: Record<string, React.ReactNode> = {
  Home: <Home className="w-4 h-4 mr-2 text-rose-500" />,
  Calendar: <Calendar className="w-4 h-4 mr-2 text-blue-500" />,
  Globe2: <Globe2 className="w-4 h-4 mr-2 text-amber-500" />,
  GraduationCap: <GraduationCap className="w-4 h-4 mr-2 text-emerald-500" />,
  ShoppingBag: <ShoppingBag className="w-4 h-4 mr-2 text-purple-500" />,
  MessageSquareHeart: <MessageSquareHeart className="w-4 h-4 mr-2 text-rose-500" />,
  MapPin: <MapPin className="w-4 h-4 mr-2 text-rose-600 animate-bounce" />,
  ArrowLeft: <ArrowLeft className="w-4 h-4 mr-2 text-gray-500" />,
  ArrowRight: <ArrowRight className="w-4 h-4 mr-2 text-gray-500" />,
  RotateCw: <RotateCw className="w-4 h-4 mr-2 text-gray-500" />,
  Copy: <Copy className="w-4 h-4 mr-2 text-gray-500" />,
  Search: <Search className="w-4 h-4 mr-2 text-blue-500" />,
};

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

  /** Resolve an action item's onClick handler */
  const resolveAction = (actionKey: string) => {
    switch (actionKey) {
      case 'openRoute':     return () => setIsRouteOpen(true);
      case 'historyBack':   return () => window.history.back();
      case 'historyForward':return () => window.history.forward();
      case 'reload':        return () => window.location.reload();
      case 'copyLink':      return handleCopyLink;
      case 'toggleTheme':   return toggleTheme;
      case 'openSearch':    return handleOpenSearch;
      default:              return () => {};
    }
  };

  /** Resolve a theme-dynamic icon for the desktop menu */
  const resolveDesktopIcon = (iconKey: string) => {
    if (iconKey === 'ThemeToggle') {
      return isDarkMode
        ? <Sun className="w-4 h-4 mr-2 text-amber-400" />
        : <Moon className="w-4 h-4 mr-2 text-slate-700" />;
    }
    return DESKTOP_ICONS[iconKey] ?? null;
  };

  const resolveDesktopLabel = (item: ContextMenuActionItem) => {
    if (item.actionKey === 'toggleTheme') {
      return isDarkMode ? 'Modo Claro' : 'Modo Oscuro';
    }
    return item.label;
  };

  // ── Touch: long-press opens the mobile drawer ──────────────────────────────
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    touchTimerRef.current = setTimeout(() => {
      setIsMobileDrawerOpen(true);
      navigator.vibrate?.(50);
    }, 450);
  };

  const handleTouchEndOrMove = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  // ── Shared route modal ─────────────────────────────────────────────────────
  const routeModal = (
    <RouteModal
      isOpen={isRouteOpen}
      onClose={() => setIsRouteOpen(false)}
      destination={{
        name: 'Iglesia Jerusalén Central (Milagro)',
        lat: -2.139188,
        lng: -79.5949891,
      }}
    />
  );

  // ── MOBILE: plain wrapper + Bottom Sheet (no Radix ContextMenu) ───────────
  if (isMobile) {
    return (
      <>
        <div
          className="min-h-screen flex flex-col w-full select-none outline-none [-webkit-touch-callout:none]"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchEndOrMove}
          onTouchEnd={handleTouchEndOrMove}
          onContextMenu={(e) => e.preventDefault()} // suppress native context menu on mobile
        >
          {children}
        </div>

        <MobileContextDrawer
          isOpen={isMobileDrawerOpen}
          onClose={() => setIsMobileDrawerOpen(false)}
          onOpenRoute={() => setIsRouteOpen(true)}
          onOpenSearch={handleOpenSearch}
        />

        {routeModal}
      </>
    );
  }

  // ── DESKTOP: Radix ContextMenu (right-click) ───────────────────────────────
  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger className="min-h-screen flex flex-col w-full select-none outline-none">
          {children}
        </ContextMenuTrigger>

        <ContextMenuPopup className="w-64">
          {CONTEXT_MENU_GROUPS.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && <ContextMenuSeparator />}
              <ContextMenuGroup>
                {group.groupLabel && (
                  <ContextMenuGroupLabel>{group.groupLabel}</ContextMenuGroupLabel>
                )}
                {group.items.map((item, ii) => {
                  if (item.type === 'separator') {
                    return <ContextMenuSeparator key={ii} />;
                  }

                  if (item.type === 'nav') {
                    const navItem = item as ContextMenuNavItem;
                    return (
                      <ContextMenuItem key={ii} onClick={() => navigate(navItem.path)}>
                        {resolveDesktopIcon(navItem.iconKey)}
                        <span>{navItem.label}</span>
                        {navItem.shortcut && (
                          <ContextMenuShortcut>{navItem.shortcut}</ContextMenuShortcut>
                        )}
                      </ContextMenuItem>
                    );
                  }

                  if (item.type === 'action') {
                    const actionItem = item as ContextMenuActionItem;
                    // Special styling for the route item
                    const isRoute = actionItem.actionKey === 'openRoute';
                    return (
                      <ContextMenuItem key={ii} onClick={resolveAction(actionItem.actionKey)}>
                        {resolveDesktopIcon(actionItem.iconKey)}
                        <span className={isRoute ? 'font-semibold text-rose-600 dark:text-rose-400' : ''}>
                          {resolveDesktopLabel(actionItem)}
                        </span>
                        {actionItem.shortcut && (
                          <ContextMenuShortcut>{actionItem.shortcut}</ContextMenuShortcut>
                        )}
                      </ContextMenuItem>
                    );
                  }

                  return null;
                })}
              </ContextMenuGroup>
            </React.Fragment>
          ))}
        </ContextMenuPopup>
      </ContextMenu>

      {routeModal}
    </>
  );
}

export default GlobalContextMenu;
