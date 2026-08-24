import { describe, expect, it } from 'vitest';
import { getToolDefinition, TOOLBOX_TOOLS } from './toolRegistry';

describe('toolRegistry', () => {
  it('mantiene identificadores únicos y metadatos completos', () => {
    const ids = TOOLBOX_TOOLS.map((tool) => tool.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(TOOLBOX_TOOLS).toHaveLength(6);
    for (const tool of TOOLBOX_TOOLS) {
      expect(tool.label.trim().length).toBeGreaterThan(0);
      expect(tool.shortDescription.trim().length).toBeGreaterThan(0);
    }
  });

  it('deja disponibles para un miembro únicamente Biblia y Notas', () => {
    const publicTools = TOOLBOX_TOOLS
      .filter((tool) => tool.isAvailable('member', '/predicas/sermon-de-prueba'))
      .map((tool) => tool.id);

    expect(publicTools).toEqual(['bible', 'notes']);
    expect(publicTools).not.toContain('clicker');
  });

  it('habilita el aforo para ujieres, administración y editor general', () => {
    const clicker = getToolDefinition('clicker');

    expect(clicker?.isAvailable('ujieres', '/')).toBe(true);
    expect(clicker?.isAvailable('admin', '/')).toBe(true);
    expect(clicker?.isAvailable('editor general', '/')).toBe(true);
    expect(clicker?.isAvailable('member', '/')).toBe(false);
  });

  it('resuelve el nombre real de cada panel', () => {
    expect(getToolDefinition('metronome')?.label).toBe('Metrónomo');
    expect(getToolDefinition('tuner')?.label).toBe('Afinador');
    expect(getToolDefinition('hub')).toBeNull();
  });
});
