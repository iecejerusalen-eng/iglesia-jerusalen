export const DRUM_STYLES = [
  'Balada Worship',
  'Pop Worship 4/4',
  'Rock 1/4 (Marcado en Negras)',
  'Rock 1/2 (Marcado en Corcheas)',
  'Worship 6/8',
  'Worship 4/4 (Balada Rítmica)',
  'Pop/Rock 4/4',
  'Funk / Gospel',
  'Disco / Folk (Corito Rápido)',
  'Cumbia Cristiana',
  'Vals 3/4',
  'Marcha',
  'Acústico / Sin Batería'
];

export function isValidChord(chord: string): boolean {
  return isChord(chord);
}

export function extractBracketTokens(text: string): string[] {
  return [...text.matchAll(/\[([^\]\r\n]+)\]/g)].map((match) => match[1].trim()).filter(Boolean);
}

export function getInvalidChordTokens(text: string): string[] {
  return [...new Set(extractBracketTokens(text).filter((token) => !isValidChord(token)))];
}

export function transposeNote(note: string, steps: number): string {
  return transposeParsedNote(note, steps, note.includes('b') ? 'flat' : 'sharp', note);
}

export function transposeChord(chord: string, steps: number): string {
  return transposeParsedChord(chord, steps, chord.includes('b') ? 'flat' : 'sharp');
}

export function getOriginalKey(text: string): string | null {
  return detectKeyCandidate(text);
}

export function chordToNashville(chord: string, originalKey: string | null): string {
  return convertChordToNashville(chord, originalKey);
}

export function htmlToBracketText(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  temp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation').forEach(el => {
    const chord = el.getAttribute('data-chord');
    if (chord) {
      el.parentNode?.replaceChild(document.createTextNode(`[${chord}]`), el);
    } else {
      el.remove();
    }
  });
  
  let text = '';
  temp.childNodes.forEach(node => {
    if (node.nodeType === 1) {
      const el = node as HTMLElement;
      if (el.tagName === 'P') {
        text += el.textContent + '\n';
      } else if (el.tagName === 'BR') {
        text += '\n';
      } else {
        text += el.textContent;
      }
    } else if (node.nodeType === 3) {
      text += node.textContent;
    }
  });
  
  return text.trim();
}

export function processBracketText(text: string, transposeAmount: number = 0, nashvilleMode: boolean = false, originalKey: string | null = null): string {
  if (!text) return '';
  return transposeBracketText(text, transposeAmount, { nashville: nashvilleMode, key: originalKey });
}

export function bracketTextToHtml(
  text: string,
  transposeAmount: number = 0,
  nashvilleMode: boolean = false,
  originalKey: string | null = null,
  accidentalPreference: AccidentalPreference = 'auto',
): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  const lines = escaped.split('\n');
  const processedLines = lines.map(line => {
    const isChordOnly = Boolean(line.trim()) && !line.replace(/\[([^\]]+)\]/g, '').trim();

    const compiledLine = line.replace(/\[([^\]]+)\]/g, (match, chord: string) => {
      if (!isValidChord(chord)) return match;
      let finalChord = transposeParsedChord(chord, transposeAmount, accidentalPreference, originalKey);
      if (nashvilleMode) {
        finalChord = chordToNashville(
          finalChord,
          originalKey ? transposeParsedNote(originalKey, transposeAmount, accidentalPreference, originalKey) : null,
        );
      }
      if (isChordOnly) {
        return `<span class="chord-node-wrapper chord-only-badge" data-chord-node="true" data-chord="${finalChord}">${finalChord}</span>`;
      }
      return `<span class="chord-node-wrapper" data-chord-node="true" data-chord="${finalChord}"></span>`;
    });

    const lineClass = isChordOnly ? 'lyrics-line chord-only-line' : 'lyrics-line';
    return `<p class="${lineClass}">${compiledLine || '&nbsp;'}</p>`;
  }).join('');
  
  return processedLines;
}
import {
  chordToNashville as convertChordToNashville,
  detectKeyCandidate,
  isChord,
  transposeBracketText,
  transposeChord as transposeParsedChord,
  transposeNote as transposeParsedNote,
} from './musicEngine';
import type { AccidentalPreference } from '../../../types';
