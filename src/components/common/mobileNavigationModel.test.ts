import { describe, expect, it, vi } from 'vitest';
import { DEFAULT_MENU_ITEMS, menuService, type MenuItem } from '../../services/menuService';
import { buildMobileExploreItems } from './mobileNavigationModel';

vi.mock('../../config/supabase', () => ({ supabase: { from: vi.fn() } }));

describe('buildMobileExploreItems', () => {
  it('uses the desktop menu tree and includes its required public destinations', () => {
    const items = buildMobileExploreItems(menuService.ensureRequiredPublicItems(DEFAULT_MENU_ITEMS));
    const byUrl = new Map(items.map((item) => [item.url, item]));

    expect(byUrl.get('/nosotros')?.group).toBe('iglesia');
    expect(byUrl.get('/publicaciones')?.group).toBe('recursos');
    expect(byUrl.get('/programas/estudio-biblico')?.group).toBe('recursos');
    expect(byUrl.get('/eventos')?.group).toBe('agenda');
    expect(byUrl.get('/contacto')?.group).toBe('contacto');
  });

  it('omits hidden launches, private paths, unsafe URLs, invisible parents and duplicates', () => {
    const menu: MenuItem[] = [
      ...DEFAULT_MENU_ITEMS,
      { id: 'store', label: 'Tienda', url: '/tienda', order_index: 80, is_visible: true },
      { id: 'classroom', label: 'Aula Virtual', url: '/aula-virtual', order_index: 90, is_visible: true },
      { id: 'private', label: 'Admin', url: '/admin', order_index: 100, is_visible: true },
      { id: 'personal-schedule', label: 'Mi horario', url: '/mi-horario', order_index: 101, is_visible: true },
      { id: 'member-home', label: 'Mi iglesia', url: '/mi-iglesia', order_index: 102, is_visible: true },
      { id: 'external', label: 'External', url: 'https://example.com', order_index: 110, is_visible: true },
      { id: 'hidden-parent', label: 'Oculto', url: '#', order_index: 120, is_visible: false },
      { id: 'hidden-child', label: 'No publicar', url: '/publicaciones/privado', order_index: 10, parent_id: 'hidden-parent', is_visible: true },
      { id: 'duplicate', label: 'Copia', url: '/nosotros', order_index: 130, is_visible: true },
    ];

    const items = buildMobileExploreItems(menu, { store: false, classroom: false });
    const urls = items.map((item) => item.url);

    expect(urls).not.toContain('/tienda');
    expect(urls).not.toContain('/aula-virtual');
    expect(urls).not.toContain('/admin');
    expect(urls).not.toContain('/mi-horario');
    expect(urls).not.toContain('/mi-iglesia');
    expect(urls).not.toContain('https://example.com');
    expect(urls).not.toContain('/publicaciones/privado');
    expect(urls.filter((url) => url === '/nosotros')).toHaveLength(1);
  });

  it('respects a launch flag when a feature is enabled', () => {
    const items = buildMobileExploreItems(DEFAULT_MENU_ITEMS, { store: true, classroom: true });

    expect(items.some((item) => item.url === '/tienda')).toBe(true);
    expect(items.some((item) => item.url === '/aula-virtual')).toBe(true);
  });
});
