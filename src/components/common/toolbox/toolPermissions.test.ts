import { describe, expect, it } from 'vitest';
import { canAccessTool } from './toolPermissions';

describe('toolbox role access', () => {
  it('keeps Bible and notes available to every user', () => {
    expect(canAccessTool('bible', [])).toBe(true);
    expect(canAccessTool('notes', ['member'])).toBe(true);
    expect(canAccessTool('notes', [null])).toBe(true);
  });

  it('limits operational tools to the ministry that needs them', () => {
    expect(canAccessTool('metronome', ['musicos'])).toBe(true);
    expect(canAccessTool('tuner', ['musico'])).toBe(true);
    expect(canAccessTool('clicker', ['ujieres'])).toBe(true);
    expect(canAccessTool('timer', ['diáconos'])).toBe(true);
    expect(canAccessTool('clicker', ['musico'])).toBe(false);
    expect(canAccessTool('metronome', ['member'])).toBe(false);
  });

  it('gives the full toolbox to admins and general editors', () => {
    for (const role of ['admin', 'editor general']) {
      expect(canAccessTool('metronome', [role])).toBe(true);
      expect(canAccessTool('tuner', [role])).toBe(true);
      expect(canAccessTool('clicker', [role])).toBe(true);
      expect(canAccessTool('timer', [role])).toBe(true);
    }
  });
});
