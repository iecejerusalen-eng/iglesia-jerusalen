/** Temporarily hide unfinished public products without removing their pages. */
const publicPreviewEnabled = import.meta.env.MODE !== 'production';

export const PUBLIC_LAUNCH_VISIBILITY = {
  store: publicPreviewEnabled,
  classroom: publicPreviewEnabled,
  adminOnboarding: false,
} as const;

type PublicFeatureVisibility = Pick<typeof PUBLIC_LAUNCH_VISIBILITY, 'store' | 'classroom'>;

export function isPublicPathVisible(path: string, visibility: PublicFeatureVisibility = PUBLIC_LAUNCH_VISIBILITY): boolean {
  const normalizedPath = path.split(/[?#]/, 1)[0].replace(/\/$/, '') || '/';

  if (normalizedPath === '/tienda' || normalizedPath.startsWith('/tienda/') || normalizedPath === '/cart' || normalizedPath.startsWith('/cart/')) {
    return visibility.store;
  }

  if (normalizedPath === '/aula-virtual' || normalizedPath.startsWith('/aula-virtual/')) {
    return visibility.classroom;
  }

  return true;
}
