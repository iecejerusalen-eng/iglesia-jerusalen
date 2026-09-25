import { describe, it, expect } from 'vitest';
import { parseBibleReferences, searchLocalIndex } from '../searchIndexService';
import type { SearchIndexItem } from '../../types';

describe('searchIndexService', () => {
  describe('parseBibleReferences', () => {
    it('detects single verse references', () => {
      const result = parseBibleReferences('Juan 3:16');
      expect(result).toHaveLength(1);
      expect(result[0].bookId).toBe('JHN');
      expect(result[0].chapter).toBe(3);
      expect(result[0].verses).toBe('16');
    });

    it('detects chapters with verse ranges', () => {
      const result = parseBibleReferences('Salmos 23:1-6');
      expect(result).toHaveLength(1);
      expect(result[0].bookId).toBe('PSA');
      expect(result[0].chapter).toBe(23);
      expect(result[0].verses).toBe('1-6');
    });

    it('detects books with numbers', () => {
      const result = parseBibleReferences('1 Corintios 13:4');
      expect(result).toHaveLength(1);
      expect(result[0].bookId).toBe('1CO');
      expect(result[0].chapter).toBe(13);
    });

    it('returns empty array when no Bible reference matches', () => {
      const result = parseBibleReferences('horarios de culto');
      expect(result).toHaveLength(0);
    });
  });

  describe('searchLocalIndex', () => {
    const mockItems: SearchIndexItem[] = [
      {
        id: '1',
        title: 'Prédica de Fe',
        subtitle: 'Pastor David Nicola · 2026',
        path: '/predicas/1',
        category: 'predicas',
        keywords: ['predica', 'fe', 'pastor', 'david', 'nicola'],
        source: 'sermon',
      },
      {
        id: '2',
        title: 'Lector Bíblico',
        subtitle: 'Reina Valera 1960',
        path: '/recursos/biblia',
        category: 'recursos',
        keywords: ['biblia', 'lectura', 'palabra'],
        source: 'static_route',
      },
      {
        id: '3',
        title: 'Teología Sistemática I',
        subtitle: 'Aula Virtual',
        path: '/aula-virtual',
        category: 'formacion',
        keywords: ['teologia', 'curso', 'aula', 'virtual', 'lms'],
        source: 'course',
      }
    ];

    it('returns all items when search query is empty', () => {
      const results = searchLocalIndex('', mockItems);
      expect(results).toHaveLength(3);
    });

    it('finds items by title', () => {
      const results = searchLocalIndex('Prédica', mockItems);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('finds items by keywords ignoring accents and case', () => {
      const results = searchLocalIndex('teologia', mockItems);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('3');
    });

    it('finds items by subtitle', () => {
      const results = searchLocalIndex('David Nicola', mockItems);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });

    it('handles multiple search tokens', () => {
      const results = searchLocalIndex('pastor fe', mockItems);
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('1');
    });
  });
});
