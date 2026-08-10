import { describe, expect, it } from 'vitest';
import type { DashboardMember } from '../types';
import { buildTalentDirectory, processChartData } from './useDashboardStats';

const member = (overrides: Partial<DashboardMember> = {}): DashboardMember => ({
  id: 'member-1',
  first_name: 'Ana',
  last_name: 'Pérez',
  ...overrides,
});

describe('dashboard data preparation', () => {
  it('relates categorized talents to their member and removes duplicates', () => {
    const directory = buildTalentDirectory([member({
      photo_url: '/ana.webp',
      member_talents: [
        { catalog_roles: { name: '[Música] Piano' } },
        { catalog_roles: { name: '[Música] Piano' } },
        { catalog_roles: { name: 'Enseñanza' } },
      ],
    })]);

    expect(directory).toEqual([
      {
        memberId: 'member-1',
        memberName: 'Ana Pérez',
        photoUrl: '/ana.webp',
        talentName: 'Enseñanza',
        category: 'Otros',
      },
      {
        memberId: 'member-1',
        memberName: 'Ana Pérez',
        photoUrl: '/ana.webp',
        talentName: 'Piano',
        category: 'Música',
      },
    ]);
  });

  it('sorts service areas and talent categories by real member count', () => {
    const charts = processChartData([
      member({
        member_service_areas: [{ catalog_roles: { name: 'Multimedia' } }],
        member_talents: [{ catalog_roles: { name: '[Creativo] Fotografía' } }],
      }),
      member({
        id: 'member-2',
        first_name: 'Luis',
        member_service_areas: [
          { catalog_roles: { name: 'Alabanza' } },
          { catalog_roles: { name: 'Multimedia' } },
        ],
        member_talents: [{ catalog_roles: { name: '[Creativo] Diseño' } }],
      }),
    ]);

    expect(charts.areasData).toEqual([
      { name: 'Multimedia', miembros: 2 },
      { name: 'Alabanza', miembros: 1 },
    ]);
    expect(charts.talentCategoriesData[0]).toEqual({ name: 'Creativo', value: 2 });
  });
});
