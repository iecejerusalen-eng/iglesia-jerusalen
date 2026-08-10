import { describe, expect, it } from 'vitest';
import { ADMIN_MODULES, MODULE_GROUPS, PERMISSION_MODULES, getAdminModulePermission } from './adminModules';

describe('admin module catalog', () => {
  it('uses unique navigation ids and paths', () => {
    const ids = ADMIN_MODULES.map((module) => module.id);
    const paths = ADMIN_MODULES.map((module) => module.path);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('assigns every module to a declared workspace', () => {
    const groups = new Set(MODULE_GROUPS.map((group) => group.key));
    expect(ADMIN_MODULES.every((module) => groups.has(module.group))).toBe(true);
  });

  it('keeps permission aliases out of the role matrix', () => {
    const matrixIds = PERMISSION_MODULES.map((module) => module.id);
    expect(new Set(matrixIds).size).toBe(matrixIds.length);
    expect(ADMIN_MODULES.filter((module) => module.permission).every((module) => module.showInPermissions === false)).toBe(true);
  });

  it('maps new workspaces to established permissions', () => {
    const permissionById = Object.fromEntries(
      ADMIN_MODULES.map((module) => [module.id, getAdminModulePermission(module)]),
    );

    expect(permissionById.contact_inbox).toBe('chat');
    expect(permissionById.schedules).toBe('events');
    expect(permissionById.discipleship).toBe('study_programs');
    expect(permissionById.audit_activity).toBe('users');
  });
});
