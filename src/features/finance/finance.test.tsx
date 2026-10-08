import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import FinanceDashboard from '../../pages/admin/FinanceDashboard';
import MyContributions from '../../pages/public/MyContributions';
import type { Movement, Fund } from './model';

const state = vi.hoisted(() => ({
  view: false,
  edit: false,
  user: { id: '00000000-0000-4000-8000-000000000001' },
  loadMovements: vi.fn(),
  loadAdminMonth: vi.fn(),
  loadFunds: vi.fn(),
  generateDue: vi.fn(),
}));
vi.mock('../../store/useAuthStore', () => ({
  useAuthStore: (
    selector: (value: {
      user: typeof state.user;
      isLoading: boolean;
    }) => unknown,
  ) => selector({ user: state.user, isLoading: false }),
}));
vi.mock('../../config/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }),
      }),
    }),
  },
}));
vi.mock('./api', () => ({
  useFinanceAccess: () => ({
    data: { view: state.view, edit: state.edit },
    isPending: false,
    isError: false,
  }),
  loadFunds: state.loadFunds,
  loadMovements: state.loadMovements,
  loadAdminMonth: state.loadAdminMonth,
  generateDue: state.generateDue,
  loadAudit: async () => [],
  loadPeople: async () => [],
  loadNotices: async () => [],
  messageOf: () => 'Conexión fallida',
  proofLink: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const fund: Fund = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'Diezmos',
  kind: 'tithe',
  active: true,
  restricted: false,
};
const year = new Date().getFullYear();
const contribution: Movement = {
  id: '00000000-0000-4000-8000-000000000003',
  kind: 'income',
  fund_id: fund.id,
  user_id: state.user.id,
  amount: 25,
  occurred_on: `${year}-02-01`,
  contribution_month: `${year}-01-01`,
  method: 'cash',
  status: 'confirmed',
  category: 'Diezmo',
  description: 'Aporte voluntario',
  reference: null,
  proof_path: null,
  beneficiary: null,
  correction_reason: null,
  version: 1,
  receipt_number: 'FIN-PRIVATE',
  created_at: `${year}-02-01T00:00:00Z`,
};
function Wrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <HelmetProvider>
        <MemoryRouter>{children}</MemoryRouter>
      </HelmetProvider>
    </QueryClientProvider>
  );
}
beforeEach(() => {
  vi.clearAllMocks();
  state.view = false;
  state.edit = false;
  state.loadFunds.mockResolvedValue([fund]);
  state.loadMovements.mockResolvedValue([contribution]);
  state.loadAdminMonth.mockResolvedValue({
    movements: [contribution],
    budgets: [],
    recurring: [],
    closed: false,
  });
  state.generateDue.mockResolvedValue(undefined);
});
describe('Vistas financieras', () => {
  it('no carga el libro ni el directorio cuando el usuario carece de acceso', async () => {
    render(<FinanceDashboard />, { wrapper: Wrapper });
    expect(await screen.findByText('Finanzas privadas')).toBeInTheDocument();
    expect(state.loadAdminMonth).not.toHaveBeenCalled();
    expect(state.loadFunds).not.toHaveBeenCalled();
  });
  it('el cuerpo de apoyo consulta sin botones de edición ni generación de gastos', async () => {
    state.view = true;
    render(<FinanceDashboard />, { wrapper: Wrapper });
    await screen.findByText('Tu acceso es de consulta.');
    await screen.findByText('Ingresos confirmados');
    expect(
      screen.queryByRole('button', { name: 'Movimiento' }),
    ).not.toBeInTheDocument();
    expect(state.generateDue).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Movimientos' }));
    await screen.findByText('FIN-PRIVATE');
    expect(
      screen.queryByRole('button', { name: /Modificar FIN/ }),
    ).not.toBeInTheDocument();
  });
  it('el titular obtiene su historial filtrado por su ID y ve los meses sin registro', async () => {
    render(<MyContributions />, { wrapper: Wrapper });
    expect(await screen.findByText('Registro confirmado')).toBeInTheDocument();
    expect(screen.getAllByText('Sin registro')).toHaveLength(11);
    expect(state.loadMovements).toHaveBeenCalledWith(
      `${year}-01-01`,
      `${year}-12-31`,
      state.user.id,
    );
    expect(screen.getByRole('checkbox')).not.toBeChecked();
    expect(
      screen.queryByRole('button', { name: /Modificar FIN/ }),
    ).not.toBeInTheDocument();
  });
  it('muestra un fallo de conexión sin inventar un historial vacío', async () => {
    state.loadMovements.mockRejectedValue(new Error('Disconnected'));
    render(<MyContributions />, { wrapper: Wrapper });
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'No se pudo cargar tu historial',
    );
    expect(screen.queryByText('Calendario de diezmos')).not.toBeInTheDocument();
  });
});
