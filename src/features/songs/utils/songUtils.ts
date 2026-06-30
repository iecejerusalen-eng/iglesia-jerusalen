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

export function htmlToBracketText(html: string): string {
  if (!html) return '';
  const temp = document.createElement('div');
  temp.innerHTML = html;
  
  // Replace chord spans with [Chord]
  temp.querySelectorAll('span.chord-node-wrapper, span.chord-node, span.chord-annotation').forEach(el => {
    const chord = el.getAttribute('data-chord');
    if (chord) {
      el.parentNode?.replaceChild(document.createTextNode(`[${chord}]`), el);
    } else {
      el.remove();
    }
  });
  
  // Replace paragraphs with text + newline
  let text = '';
  temp.childNodes.forEach(node => {
    if (node.nodeType === 1) { // ELEMENT_NODE
      const el = node as HTMLElement;
      if (el.tagName === 'P') {
        text += el.textContent + '\n';
      } else if (el.tagName === 'BR') {
        text += '\n';
      } else {
        text += el.textContent;
      }
    } else if (node.nodeType === 3) { // TEXT_NODE
      text += node.textContent;
    }
  });
  
  return text.trim();
}

export function bracketTextToHtml(text: string): string {
  if (!text) return '';
  let escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
  
  const lines = escaped.split('\n');
  const processedLines = lines.map(line => {
    const compiledLine = line.replace(/\[([a-zA-Z0-9#\/+\-.]+?)\]/g, (_, chord) => {
      return `<span class="chord-node-wrapper" data-chord-node="true" data-chord="${chord}"></span>`;
    });
    return `<p class="lyrics-line">${compiledLine || '&nbsp;'}</p>`;
  }).join('');
  
  return processedLines;
}
