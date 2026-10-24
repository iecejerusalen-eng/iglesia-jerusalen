import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PurposeDashboard } from './PurposeDashboard';
import type { MemberWithRelations } from '../utils/schema';

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: [] }),
}));

describe('PurposeDashboard', () => {
  it('muestra el perfil seleccionado en una capa visible fuera del layout del admin', () => {
    const member = {
      id: 'member-1',
      first_name: 'Ana',
      last_name: 'Pérez',
      photo_url: null,
      ministry_id: null,
      leadership_role: null,
      ministries: null,
      member_service_areas: [],
      member_talents: [],
      member_spiritual_gifts: [],
      member_emails: [],
      phone: null,
      conversion_date: null,
      baptism_date: null,
    } as unknown as MemberWithRelations;

    render(<PurposeDashboard members={[member]} loading={false} onEdit={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /^Ver perfil$/ }));

    expect(screen.getByRole('dialog')).toBeVisible();
    expect(within(screen.getByRole('dialog')).getByRole('heading', { name: 'Ana Pérez' })).toBeVisible();
  });
});
