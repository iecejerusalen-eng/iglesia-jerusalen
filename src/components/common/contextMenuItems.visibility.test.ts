import { describe, expect, it, vi } from 'vitest';

vi.mock('../../config/publicLaunchVisibility', () => ({
  isPublicPathVisible: (path: string) => !(
    path === '/tienda' || path.startsWith('/tienda/') || path === '/cart' || path.startsWith('/cart/') || path === '/aula-virtual' || path.startsWith('/aula-virtual/')
  ),
}));

import { getVisibleContextMenuGroups } from './contextMenuItems';

describe('menú contextual durante el lanzamiento oculto', () => {
  it('retira enlaces de Tienda, carrito y Aula Virtual', () => {
    const links = getVisibleContextMenuGroups(() => true).flatMap((group) => group.items)
      .filter((item) => item.type === 'nav')
      .map((item) => item.path);

    expect(links).not.toContain('/tienda');
    expect(links).not.toContain('/cart');
    expect(links).not.toContain('/aula-virtual');
  });
});
