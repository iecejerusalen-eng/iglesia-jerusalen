import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { useMenuStore } from '../../store/useMenuStore';
import { DEFAULT_MENU_ITEMS, menuService } from '../../services/menuService';
import { useSiteFeatureVisibilityStore } from '../../store/useSiteFeatureVisibilityStore';
import MobileBottomNav from './MobileBottomNav';

const mocks = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock('../../config/supabase', () => ({
  supabase: { from: mocks.from },
}));

function createBadgeQuery() {
  const query = {
    select: vi.fn(() => query),
    gte: vi.fn(() => query),
    limit: vi.fn(() => Promise.resolve({ count: 0, error: null })),
  };
  return query;
}

describe('Mobile explore navigation', () => {
  beforeEach(() => {
    mocks.from.mockImplementation(() => createBadgeQuery());
    useMenuStore.setState({ items: menuService.ensureRequiredPublicItems(DEFAULT_MENU_ITEMS) });
    useSiteFeatureVisibilityStore.setState({
      visibility: { store: false, classroom: false, adminOnboarding: false, toolbox: false },
      isLoaded: true,
    });
  });

  afterEach(() => cleanup());

  it('opens the shared public menu and excludes unreleased destinations', async () => {
    render(<MemoryRouter><MobileBottomNav /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Explorar todas las páginas públicas' }));

    await screen.findByRole('dialog');
    expect(screen.getByRole('link', { name: /Nosotros/ })).toHaveAttribute('href', '/nosotros');
    expect(screen.getByRole('link', { name: /Publicaciones/ })).toHaveAttribute('href', '/publicaciones');
    expect(screen.getByRole('link', { name: /Estudio bíblico/ })).toHaveAttribute('href', '/programas/estudio-biblico');
    expect(screen.queryByRole('link', { name: /Tienda/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Aula Virtual/ })).not.toBeInTheDocument();
  });

  it('opens the same menu focused on Comunidad and closes with Escape', async () => {
    render(<MemoryRouter><MobileBottomNav /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir comunidad, ministerios y peticiones' }));

    expect(await screen.findByRole('dialog')).toHaveTextContent('Vida en comunidad');
    expect(screen.getByRole('link', { name: /Ministerios/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /La Santa Biblia/ })).not.toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
