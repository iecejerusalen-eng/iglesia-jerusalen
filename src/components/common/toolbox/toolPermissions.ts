import type { UserRole } from '../../../types';
import type { ToolboxPanel } from '../../../store/useToolboxStore';

export type ToolboxRole = UserRole | string | null | undefined;

const normalizeRole = (role: ToolboxRole): string => String(role ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[\s_-]+/g, '');

const roleMatches = (roles: readonly ToolboxRole[], aliases: readonly string[]): boolean => {
  const normalizedAliases = new Set(aliases.map(normalizeRole));
  return roles.some((role) => normalizedAliases.has(normalizeRole(role)));
};

const UNIVERSAL_TOOLS = new Set<ToolboxPanel>(['bible', 'notes']);
const ADMIN_EDITOR_ROLES = ['admin', 'superadmin', 'editor', 'editor general', 'editorgeneral'];
const LOGISTICS_ROLES = ['diacono', 'diaconos', 'diaconia', 'ujier', 'ujieres', 'usher', 'ushers'];
const MUSIC_ROLES = ['musico', 'musicos', 'musica', 'music', 'worship', 'worship team', 'alabanza'];

export function canAccessTool(tool: ToolboxPanel, roles: readonly ToolboxRole[]): boolean {
  if (tool === 'hub' || UNIVERSAL_TOOLS.has(tool)) return true;
  if (roleMatches(roles, ADMIN_EDITOR_ROLES)) return true;
  if (roleMatches(roles, LOGISTICS_ROLES)) return tool === 'clicker' || tool === 'timer';
  if (roleMatches(roles, MUSIC_ROLES)) return tool === 'metronome' || tool === 'tuner' || tool === 'timer';
  return false;
}

export function getToolboxRoles(role: ToolboxRole, roles: readonly ToolboxRole[] = []): ToolboxRole[] {
  return Array.from(new Set([role, ...roles].filter((item): item is ToolboxRole => item !== null && item !== undefined)));
}
