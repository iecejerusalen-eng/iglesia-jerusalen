import abcjs from 'abcjs';

export interface AbcValidationResult {
  valid: boolean;
  message?: string;
}

const REQUIRED_HEADERS: Array<[string, RegExp]> = [
  ['X', /^X:\s*\d+\s*$/m],
  ['T', /^T:\s*.+$/m],
  ['K', /^K:\s*[^\r\n]+$/m],
];

export function validateAbcNotation(source: string): AbcValidationResult {
  const abc = source.trim();
  if (!abc) return { valid: false, message: 'La partitura ABC está vacía.' };

  const missingHeader = REQUIRED_HEADERS.find(([, pattern]) => !pattern.test(abc));
  if (missingHeader) {
    return { valid: false, message: `Falta el encabezado ABC ${missingHeader[0]}:.` };
  }

  const keyHeaderIndex = abc.search(/^K:/m);
  const body = keyHeaderIndex >= 0 ? abc.slice(keyHeaderIndex).split(/\r?\n/).slice(1).join('\n').trim() : '';
  if (!body) return { valid: false, message: 'La partitura ABC no contiene notas después de K:.' };

  try {
    abcjs.parseOnly(abc);
  } catch (error) {
    console.error('No se pudo analizar la notación ABC.', { error });
    return {
      valid: false,
      message: error instanceof Error ? error.message : 'La notación ABC contiene un error de sintaxis.',
    };
  }

  return { valid: true };
}
