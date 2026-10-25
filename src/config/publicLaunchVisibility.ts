import { getSiteFeatureVisibility, type SiteFeatureVisibility } from '../store/useSiteFeatureVisibilityStore';

type PublicFeatureVisibility = Pick<SiteFeatureVisibility, 'store' | 'classroom'>;

export function isPublicPathVisible(path: string, visibility: PublicFeatureVisibility = getSiteFeatureVisibility()): boolean {
  const normalizedPath = path.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';

  if (normalizedPath === '/tienda' || normalizedPath.startsWith('/tienda/') || normalizedPath === '/cart' || normalizedPath.startsWith('/cart/')) {
    return visibility.store;
  }

  if (normalizedPath === '/aula-virtual' || normalizedPath.startsWith('/aula-virtual/')) {
    return visibility.classroom;
  }

  return true;
}
