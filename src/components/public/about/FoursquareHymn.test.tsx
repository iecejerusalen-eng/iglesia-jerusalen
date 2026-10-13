import { readFileSync } from 'node:fs';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FoursquareHymn from './FoursquareHymn';
import { hymnChorus, hymnVerses } from './foursquareHymnData';

describe('Himno Cuadrangular', () => {
  it('preserves each line of the church supplied regulation, page 2', () => {
    const source: { pages: { number: number; text: string }[] } = JSON.parse(readFileSync('public/documentos/reglamento-interno.json', 'utf8'));
    const page = source.pages.find((entry) => entry.number === 2)?.text.replace(/\s+/g, ' ');
    expect(page).toBeDefined();
    for (const line of [...hymnChorus, ...hymnVerses.flat()]) expect(page).toContain(line);
  });
  it('exposes all verses and links the original page without starting media', () => {
    render(<FoursquareHymn />);
    expect(screen.getByRole('heading', { name: 'Himno Cuadrangular' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { name: /^Estrofa/ })).toHaveLength(4);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/documentos/reglamento-interno.pdf#page=2');
  });
});
