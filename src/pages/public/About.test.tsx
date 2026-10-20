import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
import About from './About';
import { HelmetProvider } from 'react-helmet-async';
const { result, filters } = vi.hoisted(() => ({ result: vi.fn(), filters: vi.fn() }));
vi.mock('../../config/supabase', () => ({ supabase: { from: (table: string) => {
  const builder = { select: () => builder, eq: (key: string, value: unknown) => { filters(table, key, value); return builder; }, order: () => builder, maybeSingle: () => result(table), abortSignal: () => table === 'page_contents' ? builder : result(table) };
  return builder;
} } }));
vi.mock('../../components/public/PrinciplesOfFaith', () => ({ default: () => null }));
vi.mock('../../components/public/about/InternationalHistory', () => ({ default: () => null }));
vi.mock('../../components/public/about/NationalHistory', () => ({ default: () => null }));
vi.mock('./components/PremiumAboutHero', () => ({ default: ({ title }: { title: string }) => <h1>{title}</h1> }));
const show = () => render(<HelmetProvider><MemoryRouter><About /></MemoryRouter></HelmetProvider>);
beforeEach(() => { vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} }); result.mockReset(); filters.mockReset(); vi.spyOn(console, 'error').mockImplementation(() => undefined); });
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe('Nosotros público', () => {
  it('no expone referencias CRM y consulta únicamente líderes públicos', async () => {
    result.mockResolvedValue({ data: null, error: null }); show();
    await waitFor(() => expect(filters).toHaveBeenCalledWith('speakers', 'is_public', true));
    expect(screen.queryByText(/CRM/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Leer en línea' })[0]).toHaveAttribute('href', '/nosotros/documentos/estatutos');
  });
  it('conserva la página cuando rechaza una consulta y permite reintentar sin consulta insegura', async () => {
    result.mockImplementation((table: string) => table === 'speakers' ? Promise.reject(new Error('Sin conexión')) : Promise.resolve({ data: { title: 'Nuestra iglesia' }, error: null }));
    show();
    expect(await screen.findByRole('alert')).toHaveTextContent('No se pudo actualizar');
    expect(screen.getByRole('heading', { name: 'Nuestra iglesia' })).toBeInTheDocument();
    expect(result.mock.calls.filter(([table]) => table === 'speakers')).toHaveLength(1);
    result.mockResolvedValue({ data: null, error: null });
    fireEvent.click(screen.getByRole('button', { name: 'Volver a intentar' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
