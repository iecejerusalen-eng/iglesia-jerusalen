import type { AccidentalPreference, LyricsSongBlock, SongStructureBlock } from '../../../types';
import { isChord, uniqueChords } from './musicEngine';

export interface ParsedCifraClubSong {
  title?: string;
  artist?: string;
  key?: string;
  bpm?: number;
  structureBlocks: SongStructureBlock[];
  bracketLyrics: string;
  chords: string[];
}

const SECTION_HEADER_MAP: Record<string, { type: LyricsSongBlock['section_type']; label: string }> = {
  intro: { type: 'intro', label: 'Intro' },
  introduccion: { type: 'intro', label: 'Intro' },
  'first part': { type: 'estrofa', label: 'Estrofa 1' },
  'second part': { type: 'estrofa', label: 'Estrofa 2' },
  'third part': { type: 'estrofa', label: 'Estrofa 3' },
  'fourth part': { type: 'estrofa', label: 'Estrofa 4' },
  estrofa: { type: 'estrofa', label: 'Estrofa' },
  verso: { type: 'estrofa', label: 'Estrofa' },
  'pre-refrao': { type: 'puente', label: 'Pre-Coro' },
  'pre-refrao 2': { type: 'puente', label: 'Pre-Coro 2' },
  'pre-coro': { type: 'puente', label: 'Pre-Coro' },
  chorus: { type: 'coro', label: 'Coro' },
  'chorus 1': { type: 'coro', label: 'Coro 1' },
  'chorus 2': { type: 'coro', label: 'Coro 2' },
  coro: { type: 'coro', label: 'Coro' },
  puente: { type: 'puente', label: 'Puente' },
  bridge: { type: 'puente', label: 'Puente' },
  outro: { type: 'outro', label: 'Outro' },
  final: { type: 'outro', label: 'Outro' },
  ending: { type: 'outro', label: 'Outro' },
  solo: { type: 'solo', label: 'Solo' },
  melodia: { type: 'melodia', label: 'Melodía' },
};

function normalizeLine(line: string): string {
  return line
    .replace(/^"+>?/, '')
    .replace(/^>/, '')
    .replace(/Continues after the ad/gi, '')
    .replace(/\[Standard Rhythm[^\]]*\]/gi, '')
    .trim();
}

function isChordLine(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;
  
  const tokens = trimmed.split(/\s+/);
  if (tokens.length === 0) return false;
  return tokens.every((token) => isChord(token.replace(/^"|>|"/g, '')));
}

function mergeChordsIntoLyrics(chordLine: string, lyricLine: string): string {
  const chordTokens: Array<{ chord: string; index: number }> = [];
  const regex = /([A-G](?:#|b)?(?:[^\s]*))/g;
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(chordLine)) !== null) {
    const raw = match[1].replace(/^"|>|"/g, '');
    if (isChord(raw)) {
      chordTokens.push({ chord: raw, index: match.index });
    }
  }

  if (chordTokens.length === 0) return lyricLine;
  if (!lyricLine.trim()) {
    return chordTokens.map((c) => `[${c.chord}]`).join(' ');
  }

  let result = lyricLine;
  const sortedTokens = [...chordTokens].sort((a, b) => b.index - a.index);
  
  for (const { chord, index } of sortedTokens) {
    const insertPos = Math.min(index, result.length);
    result = result.slice(0, insertPos) + `[${chord}]` + result.slice(insertPos);
  }

  return result;
}

export function parseCifraClubText(rawText: string): ParsedCifraClubSong {
  let title: string | undefined;
  let artist: string | undefined;
  let key: string | undefined;
  let bpm: number | undefined;

  const rawLines = rawText.split(/\r?\n/);
  const cleanedLines: string[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    let line = normalizeLine(rawLines[i]);
    if (!line) {
      if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] !== '') {
        cleanedLines.push('');
      }
      continue;
    }

    if (/^https?:\/\//i.test(line)) {
      continue;
    }

    const titleMatch = line.match(/^Título:\s*(.+)$/i);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }
    const artistMatch = line.match(/^(?:Autor|Artista):\s*(.+)$/i);
    if (artistMatch) {
      artist = artistMatch[1].trim();
      continue;
    }
    const keyMatch = line.match(/^Key:\s*([A-G](?:#|b)?m?)$/i);
    if (keyMatch) {
      key = keyMatch[1].trim();
      continue;
    }
    const bpmMatch = line.match(/(\d+)\s*bpm/i);
    if (bpmMatch) {
      bpm = parseInt(bpmMatch[1], 10);
    }

    // Split inline header like "[Intro] C Em D" into two lines: "[Intro]" and "C Em D"
    const inlineHeaderMatch = line.match(/^(\[[^\]]+\])\s*(.*)$/);
    if (inlineHeaderMatch) {
      const header = inlineHeaderMatch[1].trim();
      const rest = inlineHeaderMatch[2].trim();
      
      if (cleanedLines.length === 0 || cleanedLines[cleanedLines.length - 1] !== header) {
        cleanedLines.push(header);
      }
      if (rest) {
        cleanedLines.push(rest);
      }
      continue;
    }

    if (cleanedLines.length > 0 && cleanedLines[cleanedLines.length - 1] === line) {
      continue;
    }

    cleanedLines.push(line);
  }

  const sectionBlocks: Array<{ header: string; lines: string[] }> = [];
  let currentHeader: string | null = null;
  let currentLines: string[] = [];

  for (let i = 0; i < cleanedLines.length; i++) {
    const line = cleanedLines[i];
    const headerMatch = line.match(/^\[([^\]]+)\]$/);

    if (headerMatch) {
      if (currentHeader && currentLines.length > 0) {
        sectionBlocks.push({ header: currentHeader, lines: currentLines });
        currentLines = [];
      }
      currentHeader = headerMatch[1].trim();
      continue;
    }

    if (!currentHeader) {
      currentHeader = 'Intro';
    }

    if (isChordLine(line)) {
      const nextLine = cleanedLines[i + 1];
      if (nextLine && !nextLine.startsWith('[') && !isChordLine(nextLine) && nextLine.trim() !== '') {
        const merged = mergeChordsIntoLyrics(line, nextLine);
        currentLines.push(merged);
        i++;
      } else {
        const chordOnlyLine = line
          .split(/\s+/)
          .map((c) => `[${c.replace(/^"|>|"/g, '')}]`)
          .join(' ');
        currentLines.push(chordOnlyLine);
      }
    } else {
      currentLines.push(line);
    }
  }

  if (currentHeader && currentLines.length > 0) {
    sectionBlocks.push({ header: currentHeader, lines: currentLines });
  }

  const structureBlocks: SongStructureBlock[] = [];

  for (const block of sectionBlocks) {
    const lowerHeader = block.header.toLowerCase();
    const mapped = SECTION_HEADER_MAP[lowerHeader] || {
      type: 'otro',
      label: block.header,
    };

    const lyricsText = block.lines.join('\n').trim();
    if (!lyricsText) continue;

    structureBlocks.push({
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      type: 'lyrics',
      section_type: mapped.type,
      label: mapped.label,
      lyrics: lyricsText,
      melody_guide: null,
    });
  }

  const fullBracketLyrics = structureBlocks
    .map((b) => (b.type === 'lyrics' ? `[${b.label}]\n${b.lyrics}` : ''))
    .filter(Boolean)
    .join('\n\n');

  const chords = uniqueChords(fullBracketLyrics);

  if (chords.length > 0) {
    structureBlocks.push(
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        type: 'chord_diagram',
        instrument: 'guitar',
        chords,
      },
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        type: 'chord_diagram',
        instrument: 'piano',
        chords,
      },
      {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
        type: 'chord_diagram',
        instrument: 'ukulele',
        chords,
      },
    );
  }

  return {
    title,
    artist,
    key: key || (chords[0] ? chords[0] : undefined),
    bpm,
    structureBlocks,
    bracketLyrics: fullBracketLyrics,
    chords,
  };
}
