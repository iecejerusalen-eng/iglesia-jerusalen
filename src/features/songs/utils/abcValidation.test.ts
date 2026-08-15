import { describe, expect, it } from 'vitest';
import { validateAbcNotation } from './abcValidation';

describe('ABC notation validation', () => {
  it('accepts a complete score with headers and notes', () => {
    expect(validateAbcNotation('X:1\nT:Intro\nM:4/4\nK:G\nG2 B2 d2 g2 |').valid).toBe(true);
  });

  it('explains missing headers or notes', () => {
    expect(validateAbcNotation('T:Intro\nK:G\nG2 B2 |')).toMatchObject({ valid: false, message: 'Falta el encabezado ABC X:.' });
    expect(validateAbcNotation('X:1\nT:Intro\nK:G')).toMatchObject({ valid: false, message: 'La partitura ABC no contiene notas después de K:.' });
  });
});
