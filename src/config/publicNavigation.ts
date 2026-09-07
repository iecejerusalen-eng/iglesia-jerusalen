/**
 * Public destinations that must stay discoverable across desktop and mobile.
 * The database menu can still reorder or hide them from the admin menu editor.
 */
export const PUBLIC_NAVIGATION_LINKS = {
  podcast: { label: 'Podcast', url: '/podcast', description: 'Mensajes, conversaciones y devocionales en audio' },
  novedades: { label: 'Novedades', url: '/novedades', description: 'Actualizaciones y nuevas funciones de Iglesia Jerusalén' },
  boletin: { label: 'Boletín dominical', url: '/boletin', description: 'Información y recursos del próximo culto' },
} as const;

export const REQUIRED_PUBLIC_MENU_ITEMS = [
  { ...PUBLIC_NAVIGATION_LINKS.podcast, parentLabel: 'Recursos', order_index: 25, icon: 'Radio' },
  { ...PUBLIC_NAVIGATION_LINKS.novedades, parentLabel: 'Comunidad', order_index: 35, icon: 'Sparkles' },
  { ...PUBLIC_NAVIGATION_LINKS.boletin, parentLabel: 'Comunidad', order_index: 36, icon: 'Newspaper' },
] as const;
