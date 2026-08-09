import { describe, expect, it } from 'vitest';
import { createEmptyPermissions, mergePermissions, slugifyRoleName, togglePermission } from './accessControl';

describe('access control helpers', () => {
  it('enables view automatically when edit is enabled', () => {
    const permissions = togglePermission(createEmptyPermissions(), 'users', 'edit');
    expect(permissions.users).toEqual({ view: true, edit: true });
  });

  it('disables edit automatically when view is disabled', () => {
    const initial = { ...createEmptyPermissions(), users: { view: true, edit: true } };
    const permissions = togglePermission(initial, 'users', 'view');
    expect(permissions.users).toEqual({ view: false, edit: false });
  });

  it('unions permissions from multiple roles', () => {
    const permissions = mergePermissions(
      { users: { view: true, edit: false } },
      { users: { view: false, edit: true } },
    );
    expect(permissions.users).toEqual({ view: true, edit: true });
  });

  it('creates stable slugs for custom roles', () => {
    expect(slugifyRoleName('Coordinación Jóvenes')).toBe('coordinacion_jovenes');
  });
});
