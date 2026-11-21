import { DEFAULT_MENU_ITEMS, type MenuItem } from '../../services/menuService';
import { isPublicPathVisible } from '../../config/publicLaunchVisibility';
import type { SiteFeatureVisibility } from '../../store/useSiteFeatureVisibilityStore';

export type MobileExploreGroupId = 'iglesia' | 'comunidad' | 'recursos' | 'agenda' | 'contacto';

export interface MobileExploreItem extends MenuItem {
  group: MobileExploreGroupId;
}

export const MOBILE_EXPLORE_GROUPS: Array<{ id: MobileExploreGroupId; label: string }> = [
  { id: 'iglesia', label: 'La iglesia' },
  { id: 'comunidad', label: 'Comunidad' },
  { id: 'recursos', label: 'Recursos' },
  { id: 'agenda', label: 'Agenda' },
  { id: 'contacto', label: 'Contacto' },
];

const PRIVATE_OR_TRANSACTION_PATH = /^\/(?:admin|lms|checkout|order-success|registro-miembro|login|cart|mis-compras|mis-aportes|certificados|cert-verify|mi-horario|mi-iglesia)(?:\/|$)/i;

function isSafeInternalPublicPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('//') && !PRIVATE_OR_TRANSACTION_PATH.test(path);
}

function resolveGroup(item: MenuItem, parentLabel: string): MobileExploreGroupId {
  const path = item.url.split(/[?#]/, 1)[0].replace(/\/$/, '').toLowerCase();
  const parent = parentLabel.trim().toLowerCase();

  if (path === '/contacto' || parent.includes('contact')) return 'contacto';
  if (
    path === '/eventos' || path === '/agenda' || path === '/anuncios' ||
    path === '/boletin' || path === '/novedades' || parent.includes('agenda')
  ) return 'agenda';
  if (
    path === '/nosotros' || path.startsWith('/nosotros/') || path === '/visita' ||
    parent.includes('iglesia') || parent.includes('nosotros')
  ) return 'iglesia';
  if (
    path.startsWith('/recursos/') || path === '/predicas' || path === '/podcast' ||
    path.startsWith('/programas') || path.startsWith('/publicaciones') || parent.includes('recurso')
  ) return 'recursos';
  if (parent.includes('comunidad')) return 'comunidad';
  return 'comunidad';
}

export function buildMobileExploreItems(
  menuItems: MenuItem[] = DEFAULT_MENU_ITEMS,
  visibility?: Pick<SiteFeatureVisibility, 'store' | 'classroom'>,
): MobileExploreItem[] {
  const visibleParents = new Set(
    menuItems.filter((item) => !item.parent_id && item.is_visible).map((item) => item.id),
  );
  const parentLabels = new Map(
    menuItems.filter((item) => !item.parent_id).map((item) => [item.id, item.label]),
  );
  const seenUrls = new Set<string>();

  return menuItems
    .filter((item) => {
      const path = item.url.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';
      return item.is_visible &&
        (!item.parent_id || visibleParents.has(item.parent_id)) &&
        path !== '/' && path !== '#' &&
        isSafeInternalPublicPath(item.url) &&
        isPublicPathVisible(item.url, visibility) &&
        !seenUrls.has(item.url);
    })
    .sort((a, b) => a.order_index - b.order_index)
    .filter((item) => {
      if (seenUrls.has(item.url)) return false;
      seenUrls.add(item.url);
      return true;
    })
    .map((item) => ({
      ...item,
      group: resolveGroup(item, item.parent_id ? parentLabels.get(item.parent_id) || '' : item.label),
    }));
}
