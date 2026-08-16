import { describe, expect, it } from 'vitest';
import type { Song } from '../../../types';
import {
  buildProPresenterPayload,
  formatProPresenterImportText,
  formatProPresenterPayloadText,
  parseProPresenterLine,
} from './propresenterPayload';

const baseSong: Song = {
  id: 'song-1',
  title: 'Santo por siempre',
  artist: 'Equipo de alabanza',
  bpm: 72,
  type_id: null,
  style_id: null,
  lyrics: '',
  has_chords: true,
  original_key: 'G',
  capo: 2,
  time_signature: '4/4',
  resource_links: [],
  structure_blocks: [{
    id: 'verse-1',
    type: 'lyrics',
    section_type: 'estrofa',
    label: 'Estrofa 1',
    lyrics: '[G]Mil generaciones\n[C]Se postran a adorarle\n[Em]Cantamos al Cordero',
  }],
  created_at: '2026-08-10T00:00:00.000Z',
};

describe('ProPresenter song payload', () => {
  it('separates lyrics and aligned chord information', () => {
    expect(parseProPresenterLine('[G]Mil genera[C]ciones')).toEqual({
      lyrics: 'Mil generaciones',
      chord_line: 'G         C',
      chords: ['G', 'C'],
    });
  });

  it('creates two-line slides with a complete delivery snapshot', () => {
    const payload = buildProPresenterPayload(baseSong, { mode: 'lyrics', linesPerSlide: 2 });
    expect(payload.slides).toHaveLength(2);
    expect(payload.slides[0].text).toBe('Mil generaciones\nSe postran a adorarle');
    expect(payload.slides[0].stage_text).toContain('G');
    expect(payload.song_id).toBe('song-1');
    expect(payload.original_key).toBe('G');
  });

  it('includes chords in the audience text only when requested', () => {
    const payload = buildProPresenterPayload(baseSong, { mode: 'lyrics-chords' });
    expect(payload.slides[0].text).toContain('G');
    expect(payload.slides[0].text).toContain('Mil generaciones');
  });

  it('formats blank-paragraph slides for ProPresenter text import', () => {
    const result = formatProPresenterImportText(
      '[Estrofa 1]\n[G]Mil generaciones\n[C]Se postran a adorarle\n[Coro]\n[Em]Cantamos al Cordero',
      { mode: 'lyrics', linesPerSlide: 2 },
    );
    expect(result).toBe('Mil generaciones\nSe postran a adorarle\n\nCantamos al Cordero');
  });

  it('places each chord line above its lyric line for stage import', () => {
    const result = formatProPresenterImportText('[G]Mil genera[C]ciones', {
      mode: 'lyrics-chords',
      linesPerSlide: 1,
    });
    expect(result).toBe('G         C\nMil generaciones');
  });

  it('prefixes only chord lines for Holylyrics comments', () => {
    const result = formatProPresenterImportText('[G]Mil genera[C]ciones\nSin acordes', {
      mode: 'lyrics-chords',
      linesPerSlide: 1,
      chordLinePrefix: '//',
    });
    expect(result).toBe('//G         C\nMil generaciones\n\nSin acordes');
  });

  it('can copy an already prepared payload without slide metadata', () => {
    const payload = buildProPresenterPayload(baseSong, { mode: 'lyrics', linesPerSlide: 2 });
    expect(formatProPresenterPayloadText(payload, 'lyrics')).toBe(
      'Mil generaciones\nSe postran a adorarle\n\nCantamos al Cordero',
    );
  });
});
