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

export function bracketTextToHtml(text: string, transposeAmount: number = 0, nashvilleMode: boolean = false, originalKey: string | null = null): string {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  const lines = escaped.split('\n');
  const processedLines = lines.map(line => {
    const compiledLine = line.replace(/\[([^\]]+)\]/g, (match, chord: string) => {
      if (!isValidChord(chord)) return match;
      let finalChord = chord;
      if (transposeAmount !== 0) {
        finalChord = transposeChord(finalChord, transposeAmount);
      }
      if (nashvilleMode) {
        finalChord = chordToNashville(finalChord, originalKey ? transposeNote(originalKey, transposeAmount) : null);
      }
      return `<span class="chord-node-wrapper" data-chord-node="true" data-chord="${finalChord}"></span>`;
    });
    return `<p class="lyrics-line">${compiledLine || '&nbsp;'}</p>`;
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
