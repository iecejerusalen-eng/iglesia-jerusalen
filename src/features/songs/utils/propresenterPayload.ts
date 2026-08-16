import type { Song, SongStructureBlock } from '../../../types';
import { htmlToBracketText, isValidChord } from './songUtils';

export type ProPresenterContentMode = 'lyrics' | 'lyrics-chords';

export interface ProPresenterSlideLine {
  lyrics: string;
  chord_line: string;
  chords: string[];
}

export interface ProPresenterSlide {
  id: string;
  index: number;
  section: string;
  text: string;
  stage_text: string;
  lines: ProPresenterSlideLine[];
}

export interface ProPresenterSongPayload {
  schema_version: 1;
  song_id: string;
  arrangement_id: string | null;
  title: string;
  artist: string | null;
  mode: ProPresenterContentMode;
  original_key: string | null;
  bpm: number | null;
  time_signature: string | null;
  capo: number;
  generated_at: string;
  slides: ProPresenterSlide[];
}

interface SourceSection {
  id: string;
  label: string;
  lines: string[];
}

interface ProPresenterImportTextOptions {
  mode: ProPresenterContentMode;
  linesPerSlide?: number;
  chordLinePrefix?: string;
}

function nonEmptyLines(value: string): string[] {
  return value.split(/\r?\n/).map((line) => line.trimEnd()).filter((line) => line.trim().length > 0);
}

function sectionsFromLegacyLyrics(song: Song): SourceSection[] {
  const source = nonEmptyLines(htmlToBracketText(song.lyrics ?? ''));
  const sections: SourceSection[] = [];
  let current: SourceSection = { id: 'general-1', label: 'Canción', lines: [] };

  source.forEach((line) => {
    const heading = line.match(/^\s*\[([^\]]+)]\s*$/);
    if (heading && !isValidChord(heading[1].trim())) {
      if (current.lines.length > 0) sections.push(current);
      const label = heading[1].trim();
      current = { id: `section-${sections.length + 1}`, label, lines: [] };
      return;
    }
    current.lines.push(line);
  });
  if (current.lines.length > 0) sections.push(current);
  return sections;
}

function getSections(song: Song): SourceSection[] {
  const lyricBlocks = (song.structure_blocks ?? []).filter(
    (block): block is Extract<SongStructureBlock, { type: 'lyrics' }> => block.type === 'lyrics',
  );
  if (lyricBlocks.length === 0) return sectionsFromLegacyLyrics(song);
  return lyricBlocks
    .map((block) => ({ id: block.id, label: block.label, lines: nonEmptyLines(block.lyrics) }))
    .filter((section) => section.lines.length > 0);
}

export function parseProPresenterLine(value: string): ProPresenterSlideLine {
  const chords: string[] = [];
  const placements: Array<{ chord: string; position: number }> = [];
  let lyrics = '';
  let cursor = 0;
  const matcher = /\[([^\]]+)]/g;
  let match = matcher.exec(value);

  while (match) {
    lyrics += value.slice(cursor, match.index);
    const candidate = match[1].trim();
    if (isValidChord(candidate)) {
      placements.push({ chord: candidate, position: lyrics.length });
      chords.push(candidate);
    } else {
      lyrics += match[0];
    }
    cursor = match.index + match[0].length;
    match = matcher.exec(value);
  }
  lyrics += value.slice(cursor);
  lyrics = lyrics.trim();

  const chordCharacters: string[] = [];
  placements.forEach(({ chord, position }) => {
    const safePosition = Math.max(0, Math.min(position, Math.max(0, lyrics.length - 1)));
    while (chordCharacters.length < safePosition) chordCharacters.push(' ');
    for (let index = 0; index < chord.length; index += 1) chordCharacters[safePosition + index] = chord[index];
  });

  return {
    lyrics,
    chord_line: chordCharacters.join('').trimEnd(),
    chords,
  };
}

function importSectionsFromBracketText(value: string): string[][] {
  const sections: string[][] = [];
  let current: string[] = [];
  nonEmptyLines(value).forEach((line) => {
    const heading = line.match(/^\s*\[([^\]]+)]\s*$/);
    if (heading && !isValidChord(heading[1].trim())) {
      if (current.length > 0) sections.push(current);
      current = [];
      return;
    }
    current.push(line);
  });
  if (current.length > 0) sections.push(current);
  return sections;
}

function formatSlideLines(
  lines: ProPresenterSlideLine[],
  mode: ProPresenterContentMode,
  chordLinePrefix = '',
): string {
  if (mode === 'lyrics') return lines.map((line) => line.lyrics).join('\n');
  return lines
    .flatMap((line) => line.chord_line ? [`${chordLinePrefix}${line.chord_line}`, line.lyrics] : [line.lyrics])
    .join('\n');
}

/**
 * Generates plain text ready for ProPresenter's text importer. Blank paragraphs
 * delimit slides. Chord mode emits a chord line followed by its lyric line.
 */
export function formatProPresenterImportText(
  bracketText: string,
  options: ProPresenterImportTextOptions,
): string {
  const linesPerSlide = Math.min(4, Math.max(1, options.linesPerSlide ?? 2));
  const slides: string[] = [];
  importSectionsFromBracketText(bracketText).forEach((section) => {
    for (let offset = 0; offset < section.length; offset += linesPerSlide) {
      const lines = section.slice(offset, offset + linesPerSlide).map(parseProPresenterLine);
      const formatted = formatSlideLines(lines, options.mode, options.chordLinePrefix).trimEnd();
      if (formatted.trim()) slides.push(formatted);
    }
  });
  return slides.join('\n\n');
}

export function formatProPresenterPayloadText(
  payload: ProPresenterSongPayload,
  mode: ProPresenterContentMode = payload.mode,
): string {
  return payload.slides
    .map((slide) => formatSlideLines(slide.lines, mode).trimEnd())
    .filter((slide) => Boolean(slide.trim()))
    .join('\n\n');
}

export function buildProPresenterPayload(
  song: Song,
  options: { mode: ProPresenterContentMode; arrangementId?: string | null; linesPerSlide?: number },
): ProPresenterSongPayload {
  const linesPerSlide = Math.min(4, Math.max(1, options.linesPerSlide ?? 2));
  const slides: ProPresenterSlide[] = [];

  getSections(song).forEach((section) => {
    for (let offset = 0; offset < section.lines.length; offset += linesPerSlide) {
      const lines = section.lines.slice(offset, offset + linesPerSlide).map(parseProPresenterLine);
      const audienceText = lines.map((line) => line.lyrics).join('\n');
      const stageText = lines.map((line) => line.chord_line ? `${line.chord_line}\n${line.lyrics}` : line.lyrics).join('\n');
      slides.push({
        id: `${section.id}-${Math.floor(offset / linesPerSlide) + 1}`,
        index: slides.length,
        section: section.label,
        text: options.mode === 'lyrics' ? audienceText : stageText,
        stage_text: stageText,
        lines,
      });
    }
  });

  return {
    schema_version: 1,
    song_id: song.id,
    arrangement_id: options.arrangementId ?? null,
    title: song.title,
    artist: song.artist,
    mode: options.mode,
    original_key: song.original_key ?? null,
    bpm: song.bpm,
    time_signature: song.time_signature ?? null,
    capo: song.capo ?? 0,
    generated_at: new Date().toISOString(),
    slides,
  };
}
