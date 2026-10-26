import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import ChurchAssistantWidget from './ChurchAssistantWidget';
import TodayActivityPeek from './TodayActivityPeek';

const { todayEvents, invoke } = vi.hoisted(() => ({
  todayEvents: [{
    id: 'event-1',
    title: 'Actividad de prueba',
    emoji: '📅',
    start_date: '2026-10-25',
    end_date: '2026-10-25',
    start_time: '10:00',
    end_time: '11:00',
  }],
  invoke: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: todayEvents, isLoading: false, isError: false }),
}));

vi.mock('../../config/supabase', () => ({
  supabase: { functions: { invoke } },
}));

vi.mock('../../features/study-programs/service', () => ({
  fetchProgramCatalog: vi.fn(),
}));

function renderInRouter(element: ReactNode) {
  return render(<MemoryRouter>{element}</MemoryRouter>);
}

describe('controles flotantes públicos', () => {
  beforeEach(() => {
    invoke.mockResolvedValue({ data: { ai_configured: false }, error: null });
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false, addListener: vi.fn(), removeListener: vi.fn() }));
  });

  it('cierra la agenda de hoy con su botón, al tocar fuera y con Escape', () => {
    renderInRouter(<TodayActivityPeek />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver actividad de hoy' }));
    expect(screen.getByRole('heading', { name: /octubre/i })).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Cerrar actividad de hoy' })[1]);
    expect(screen.queryByRole('heading', { name: /octubre/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver actividad de hoy' }));
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole('heading', { name: /octubre/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Ver actividad de hoy' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('heading', { name: /octubre/i })).not.toBeInTheDocument();
  });

  it('cierra el asistente con su X, al tocar fuera y con Escape', async () => {
    renderInRouter(<ChurchAssistantWidget />);
    const launcher = screen.getByRole('button', { name: 'Abrir chat de la iglesia' });

    fireEvent.click(launcher);
    expect(await screen.findByRole('dialog', { name: 'Asistente de la Iglesia Jerusalén' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cerrar asistente' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Asistente de la Iglesia Jerusalén' })).not.toBeInTheDocument());

    fireEvent.click(launcher);
    expect(await screen.findByRole('dialog', { name: 'Asistente de la Iglesia Jerusalén' })).toBeInTheDocument();
    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Asistente de la Iglesia Jerusalén' })).not.toBeInTheDocument());

    fireEvent.click(launcher);
    expect(await screen.findByRole('dialog', { name: 'Asistente de la Iglesia Jerusalén' })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Asistente de la Iglesia Jerusalén' })).not.toBeInTheDocument());
  });
});
