import type { MinistryPage } from '../types/ministryPages';

export const slugifyMinistryPage = (value: string): string => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 80);

export const flattenMinistryPageTree = <T extends MinistryPage>(pages: T[]): T[] => {
  const result: T[] = [];
  const visited = new Set<string>();
  const append = (parentId: string | null) => {
    pages
      .filter((page) => page.parent_id === parentId)
      .sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title, 'es'))
      .forEach((page) => {
        if (visited.has(page.id)) return;
        visited.add(page.id);
        result.push(page);
        append(page.id);
      });
  };
  append(null);
  return result;
};

export const getMinistryPageAncestors = <T extends MinistryPage>(target: T, pages: T[]): T[] => {
  const result: T[] = [];
  const visited = new Set<string>();
  let cursor: T | undefined = target;
  while (cursor && !visited.has(cursor.id)) {
    visited.add(cursor.id);
    result.unshift(cursor);
    cursor = cursor.parent_id ? pages.find((page) => page.id === cursor?.parent_id) : undefined;
  }
  return result;
};

export const buildMinistryPagePath = <T extends MinistryPage>(target: T, pages: T[]): string =>
  getMinistryPageAncestors(target, pages).map((page) => page.slug).join('/');

export const resolveMinistryPagePath = <T extends MinistryPage>(segments: string[], pages: T[]): T | null => {
  if (segments.length < 1 || segments.length > 4) return null;
  let parentId: string | null = null;
  let resolved: T | undefined;
  for (const segment of segments) {
    resolved = pages.find((page) => page.parent_id === parentId && page.slug === segment);
    if (!resolved) return null;
    parentId = resolved.id;
  }
  return resolved || null;
};
