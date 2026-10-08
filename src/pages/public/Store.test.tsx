import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Store from './Store';

const { order } = vi.hoisted(() => ({ order: vi.fn() }));
vi.mock('../../config/supabase', () => ({
  supabase: { from: () => ({ select: () => ({ is: () => ({ order }) }) }) },
}));
const renderStore = () => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })}><HelmetProvider><MemoryRouter><Store /></MemoryRouter></HelmetProvider></QueryClientProvider>);
const products = [
  { id: '1', name: 'Guía de oración', description: 'Lectura diaria', category: 'Libros', price: 12, stock: 4, created_at: '2026-01-01', is_active: true },
  { id: '2', name: 'Taza', category: 'Accesorios', price: 8, stock: 3, created_at: '2026-01-02', is_active: true },
];

beforeEach(() => { order.mockReset(); });
describe('Catálogo público', () => {
  it('distingue un catálogo vacío de un fallo de conexión', async () => {
    order.mockResolvedValue({ data: [], error: null });
    renderStore();
    expect(await screen.findByText('Estamos preparando el catálogo')).toBeInTheDocument();
    expect(screen.queryByText('Volver a intentar')).not.toBeInTheDocument();
  });
  it('muestra un error recuperable cuando falla la consulta', async () => {
    order.mockResolvedValue({ data: null, error: { message: 'Unavailable' } });
    renderStore();
    expect(await screen.findByText('El catálogo no está disponible')).toBeInTheDocument();
    expect(screen.getByText('Volver a intentar')).toBeInTheDocument();
  });
  it('busca sin tildes y permite restablecer filtros sin resultados', async () => {
    order.mockResolvedValue({ data: products, error: null });
    renderStore();
    await screen.findByRole('heading', { name: 'Guía de oración' });
    fireEvent.change(screen.getByRole('textbox', { name: 'Buscar productos' }), { target: { value: 'guia de oracion' } });
    expect(screen.getByRole('heading', { name: 'Guía de oración' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Taza' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Accesorios' }));
    expect(screen.getByRole('button', { name: 'Accesorios' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('No encontramos productos')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Ver todo el catálogo'));
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Taza' })).toBeInTheDocument());
  });
});
