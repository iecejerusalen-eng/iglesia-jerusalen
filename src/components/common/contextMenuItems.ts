/**
 * Fuente única de verdad para los ítems del menú contextual.
 * Cualquier cambio aquí se refleja automáticamente en:
 *  - El ContextMenu de escritorio (clic derecho)
 *  - El Bottom Sheet Drawer de móvil (long-press)
 */

export interface ContextMenuNavItem {
  type: 'nav';
  label: string;
  path: string;
  /** Tailwind color classes for the icon background and color on mobile */
  colorClasses: string;
  /** Icon component name (used as a key to look up the icon in the renderers) */
  iconKey: string;
  shortcut?: string;
}

export interface ContextMenuActionItem {
  type: 'action';
  actionKey: string;
  label: string;
  iconKey: string;
  shortcut?: string;
}

export interface ContextMenuSeparatorItem {
  type: 'separator';
}

export interface ContextMenuGroupDef {
  groupLabel?: string;
  items: (ContextMenuNavItem | ContextMenuActionItem | ContextMenuSeparatorItem)[];
}

/**
 * Ordered list of menu groups.
 * Add new items here and they will appear in BOTH desktop and mobile menus.
 */
export const CONTEXT_MENU_GROUPS: ContextMenuGroupDef[] = [
  {
    groupLabel: 'Navegación Iglesia',
    items: [
      {
        type: 'nav',
        label: 'Inicio',
        path: '/',
        iconKey: 'Home',
        colorClasses: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        shortcut: 'Alt+H',
      },
      {
        type: 'nav',
        label: 'Eventos y Horarios',
        path: '/eventos',
        iconKey: 'Calendar',
        colorClasses: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      },
      {
        type: 'nav',
        label: 'Misiones 3D',
        path: '/misiones',
        iconKey: 'Globe2',
        colorClasses: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
      },
      {
        type: 'nav',
        label: 'Aula Virtual',
        path: '/universidad',
        iconKey: 'GraduationCap',
        colorClasses: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
      },
      {
        type: 'nav',
        label: 'Tienda',
        path: '/tienda',
        iconKey: 'ShoppingBag',
        colorClasses: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      },
      {
        type: 'nav',
        label: 'Oración y Contacto',
        path: '/contacto',
        iconKey: 'MessageSquareHeart',
        colorClasses: 'bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400',
      },
    ],
  },
  {
    groupLabel: 'Ruta & Ubicación',
    items: [
      {
        type: 'action',
        actionKey: 'openRoute',
        label: '¿Cómo llegar a la Iglesia?',
        iconKey: 'MapPin',
      },
    ],
  },
  {
    groupLabel: 'Acciones de Página',
    items: [
      {
        type: 'action',
        actionKey: 'historyBack',
        label: 'Atrás',
        iconKey: 'ArrowLeft',
        shortcut: 'Alt+←',
      },
      {
        type: 'action',
        actionKey: 'historyForward',
        label: 'Adelante',
        iconKey: 'ArrowRight',
        shortcut: 'Alt+→',
      },
      {
        type: 'action',
        actionKey: 'reload',
        label: 'Recargar Página',
        iconKey: 'RotateCw',
        shortcut: 'Ctrl+R',
      },
      {
        type: 'action',
        actionKey: 'copyLink',
        label: 'Copiar Enlace',
        iconKey: 'Copy',
      },
    ],
  },
  {
    groupLabel: 'Preferencias y Búsqueda',
    items: [
      {
        type: 'action',
        actionKey: 'toggleTheme',
        label: 'toggleTheme', // resolved dynamically in renderers
        iconKey: 'ThemeToggle',
      },
      {
        type: 'action',
        actionKey: 'openSearch',
        label: 'Buscar...',
        iconKey: 'Search',
        shortcut: 'Ctrl+K',
      },
    ],
  },
];
