import type { Cell } from '../../../types';
import type { StrategicMapMember, StrategicMapMetrics } from '../types';

const EARTH_RADIUS_M = 6_371_000;

export const hasValidCoordinates = (latitude: number | null | undefined, longitude: number | null | undefined) => (
  typeof latitude === 'number'
  && Number.isFinite(latitude)
  && latitude >= -90
  && latitude <= 90
  && typeof longitude === 'number'
  && Number.isFinite(longitude)
  && longitude >= -180
  && longitude <= 180
);

export const distanceInMeters = (from: [number, number], to: [number, number]) => {
  const [fromLat, fromLng] = from;
  const [toLat, toLng] = to;
  const radians = Math.PI / 180;
  const deltaLat = (toLat - fromLat) * radians;
  const deltaLng = (toLng - fromLng) * radians;
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(fromLat * radians) * Math.cos(toLat * radians) * Math.sin(deltaLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isMemberCovered = (member: StrategicMapMember, cells: Cell[]) => {
  const { latitude, longitude } = member;
  if (typeof latitude !== 'number' || typeof longitude !== 'number' || !hasValidCoordinates(latitude, longitude)) return false;

  return cells.some((cell) => (
    cell.status !== 'archived'
    && hasValidCoordinates(cell.latitude, cell.longitude)
    && distanceInMeters([latitude, longitude], [cell.latitude, cell.longitude])
      <= (cell.coverage_radius_m ?? 500)
  ));
};

export const calculateStrategicMapMetrics = (members: StrategicMapMember[], cells: Cell[]): StrategicMapMetrics => {
  const membersWithLocation = members.filter((member) => hasValidCoordinates(member.latitude, member.longitude));
  const coveredMembers = membersWithLocation.filter((member) => isMemberCovered(member, cells)).length;

  return {
    membersWithLocation: membersWithLocation.length,
    membersWithoutLocation: members.length - membersWithLocation.length,
    cellsWithLocation: cells.filter((cell) => hasValidCoordinates(cell.latitude, cell.longitude)).length,
    coveredMembers,
    uncoveredMembers: membersWithLocation.length - coveredMembers,
    dataCoverage: members.length ? Math.round((membersWithLocation.length / members.length) * 100) : 0,
  };
};

export const filterMembersForMap = (
  members: StrategicMapMember[],
  cells: Cell[],
  mode: 'pastoral' | 'cells' | 'expansion' | 'quality',
  query: string,
) => {
  const normalizedQuery = query.trim().toLocaleLowerCase('es');

  return members.filter((member) => {
    const name = `${member.first_name} ${member.last_name}`.toLocaleLowerCase('es');
    const matchesQuery = !normalizedQuery || name.includes(normalizedQuery) || member.address?.toLocaleLowerCase('es').includes(normalizedQuery);
    if (!matchesQuery) return false;
    if (mode === 'expansion') return hasValidCoordinates(member.latitude, member.longitude) && !isMemberCovered(member, cells);
    if (mode === 'quality') return !hasValidCoordinates(member.latitude, member.longitude);
    return true;
  });
};
