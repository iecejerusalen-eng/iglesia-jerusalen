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

const CHORDS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLATS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

export function transposeNote(note: string, steps: number): string {
  if (!note) return note;
  const isFlat = note.includes('b');
  let index = CHORDS.indexOf(note);
  if (index === -1) index = FLATS.indexOf(note);
  if (index === -1) return note;

  let newIndex = (index + steps) % 12;
  if (newIndex < 0) newIndex += 12;

  return isFlat ? FLATS[newIndex] : CHORDS[newIndex];
}

export function transposeChord(chord: string, steps: number): string {
  if (!chord || steps === 0) return chord;
  
  const regex = /^([CDEFGAB][#b]?)([^/]*)(\/?)([CDEFGAB][#b]?)?$/;
  const match = chord.match(regex);
  if (!match) return chord; 

  const [, root, mod, slash, bass] = match;

  const newRoot = transposeNote(root, steps);
  const newBass = bass ? transposeNote(bass, steps) : '';

  return `${newRoot}${mod}${slash}${newBass}`;
}

export function getOriginalKey(text: string): string | null {
  if (!text) return null;
  const match = text.match(/\[([a-zA-Z0-9#/+\-.]+)\]/);
  if (match && match[1]) {
    const chordRegex = /^([CDEFGAB][#b]?)/;
    const rootMatch = match[1].match(chordRegex);
    if (rootMatch && rootMatch[1]) {
      return rootMatch[1];
    }
  }
  return null;
}

export function chordToNashville(chord: string, originalKey: string | null): string {
  if (!originalKey) return chord;
  
  const regex = /^([CDEFGAB][#b]?)([^/]*)(\/?)([CDEFGAB][#b]?)?$/;
  const match = chord.match(regex);
  if (!match) return chord; 

  const [, root, mod, slash, bass] = match;
  
  let keyIndex = CHORDS.indexOf(originalKey);
  if (keyIndex === -1) keyIndex = FLATS.indexOf(originalKey);
  if (keyIndex === -1) return chord;

  const getDegree = (note: string) => {
    let noteIndex = CHORDS.indexOf(note);
    if (noteIndex === -1) noteIndex = FLATS.indexOf(note);
    if (noteIndex === -1) return note;

    let diff = noteIndex - keyIndex;
    if (diff < 0) diff += 12;
    
    const degrees: Record<number, string> = {
      0: '1', 1: 'b2', 2: '2', 3: 'b3', 4: '3', 5: '4', 
      6: 'b5', 7: '5', 8: 'b6', 9: '6', 10: 'b7', 11: '7'
    };
    return degrees[diff] || note;
  };

  const rootDegree = getDegree(root);
  const bassDegree = bass ? getDegree(bass) : '';

  return `${rootDegree}${mod}${slash}${bassDegree}`;
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
  return text.replace(/\[([a-zA-Z0-9#/+\-.]+?)\]/g, (_, chord) => {
    let finalChord = chord;
    if (transposeAmount !== 0) {
      finalChord = transposeChord(finalChord, transposeAmount);
    }
    if (nashvilleMode) {
      finalChord = chordToNashville(finalChord, originalKey ? transposeNote(originalKey, transposeAmount) : null);
    }
    return `[${finalChord}]`;
  });
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
    const compiledLine = line.replace(/\[([a-zA-Z0-9#/+\-.]+?)\]/g, (_, chord) => {
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
