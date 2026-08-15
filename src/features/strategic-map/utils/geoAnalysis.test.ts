import { describe, expect, it } from 'vitest';
import type { Cell } from '../../../types';
import type { StrategicMapMember } from '../types';
import { calculateStrategicMapMetrics, filterMembersForMap, hasValidCoordinates, isMemberCovered } from './geoAnalysis';

const member = (overrides: Partial<StrategicMapMember> = {}): StrategicMapMember => ({
  id: 'member-1',
  first_name: 'Ana',
  last_name: 'Pérez',
  photo_url: null,
  is_leader: false,
  leadership_role: null,
  ministry_id: null,
  latitude: -2.139188,
  longitude: -79.5949891,
  phone: null,
  phone_country_code: null,
  address: null,
  created_at: '2026-08-14T00:00:00.000Z',
  ...overrides,
});

const cell = (overrides: Partial<Cell> = {}): Cell => ({
  id: 'cell-1',
  name: 'Célula Central',
  leader_id: null,
  sector: null,
  latitude: -2.139188,
  longitude: -79.5949891,
  status: 'active',
  coverage_radius_m: 500,
  created_at: '2026-08-14T00:00:00.000Z',
  ...overrides,
});

describe('strategic map geo analysis', () => {
  it('rejects absent and out-of-range coordinates', () => {
    expect(hasValidCoordinates(-2.1, -79.5)).toBe(true);
    expect(hasValidCoordinates(null, -79.5)).toBe(false);
    expect(hasValidCoordinates(91, -79.5)).toBe(false);
  });

  it('calculates territorial coverage from the configured radius', () => {
    expect(isMemberCovered(member(), [cell()])).toBe(true);
    expect(isMemberCovered(member({ latitude: -2.15, longitude: -79.6 }), [cell()])).toBe(false);
  });

  it('reports data quality and members outside coverage', () => {
    const members = [member(), member({ id: 'member-2', latitude: null, longitude: null }), member({ id: 'member-3', latitude: -2.15, longitude: -79.6 })];
    expect(calculateStrategicMapMetrics(members, [cell()])).toMatchObject({
      membersWithLocation: 2,
      membersWithoutLocation: 1,
      coveredMembers: 1,
      uncoveredMembers: 1,
    });
    expect(filterMembersForMap(members, [cell()], 'expansion', '')).toHaveLength(1);
    expect(filterMembersForMap(members, [cell()], 'quality', '')).toHaveLength(1);
  });
});
