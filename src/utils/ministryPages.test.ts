import { describe, expect, it } from 'vitest';
import type { MinistryPage } from '../types/ministryPages';
import { buildMinistryPagePath, flattenMinistryPageTree, resolveMinistryPagePath, slugifyMinistryPage } from './ministryPages';

const page = (id: string, parentId: string | null, slug: string, depth: number, sortOrder = 0): MinistryPage => ({
  id,
  ministry_id: 'ministry-1',
  parent_id: parentId,
  title: slug,
  slug,
  excerpt: '',
  cover_image_url: null,
  icon: 'file-text',
  depth,
  sort_order: sortOrder,
  status: 'published',
  is_password_protected: false,
  seo_title: null,
  seo_description: null,
  published_at: null,
  created_at: '',
  updated_at: '',
});

const pages = [
  page('root', null, 'equipo', 1),
  page('child', 'root', 'lideres', 2),
  page('grandchild', 'child', 'materiales', 3),
  page('level-four', 'grandchild', 'manual', 4),
  page('second-root', null, 'eventos', 1, 1),
];

describe('ministry page hierarchy utilities', () => {
  it('normalizes human titles into safe URL segments', () => {
    expect(slugifyMinistryPage('  Jóvenes & Misión 2026 ')).toBe('jovenes-mision-2026');
  });

  it('resolves and builds a complete four-level path', () => {
    const resolved = resolveMinistryPagePath(['equipo', 'lideres', 'materiales', 'manual'], pages);
    expect(resolved?.id).toBe('level-four');
    expect(buildMinistryPagePath(pages[3], pages)).toBe('equipo/lideres/materiales/manual');
  });

  it('rejects paths deeper than the supported limit', () => {
    expect(resolveMinistryPagePath(['a', 'b', 'c', 'd', 'e'], pages)).toBeNull();
  });

  it('flattens roots and descendants in navigation order', () => {
    expect(flattenMinistryPageTree(pages).map((item) => item.id)).toEqual([
      'root', 'child', 'grandchild', 'level-four', 'second-root',
    ]);
  });
});
