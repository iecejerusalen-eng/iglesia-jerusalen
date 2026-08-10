import { beforeEach, describe, expect, it, vi } from 'vitest';
import { buildBibleChapterUrl, loadBibleHistory, lookupBiblePassage, saveBibleHistory } from '../bibleLookup';

describe('bibleLookup', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it('rechaza referencias inválidas sin consultar proveedores', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(lookupBiblePassage('texto cualquiera')).rejects.toMatchObject({ code: 'invalid-reference' });
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('valida y normaliza la respuesta principal', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify([
      { verse: 16, text: '<b>Porque</b> de tal manera amó Dios.' },
      { verse: 17, text: 'Porque no envió Dios a su Hijo para condenar.' },
    ]), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await lookupBiblePassage('Juan 3:16');

    expect(result.reference).toBe('Juan 3:16');
    expect(result.translationName).toBe('Reina-Valera 1960');
    expect(result.text).toBe('16. Porque de tal manera amó Dios.');
    expect(result.fromCache).toBe(false);
    expect(buildBibleChapterUrl(result)).toBe('/recursos/biblia?libro=juan&capitulo=3&versiculo=16');
  });

  it('usa el proveedor alternativo y muestra la traducción entregada', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('error', { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        text: 'Porque de tal manera amó Dios al mundo.',
        translation_id: 'valera',
        translation_name: 'Reina Valera 1909',
      }), { status: 200, headers: { 'Content-Type': 'application/json' } }));

    const result = await lookupBiblePassage('Juan 3:16');

    expect(result.translationId).toBe('valera');
    expect(result.translationName).toBe('Reina Valera 1909');
    expect(globalThis.fetch).toHaveBeenCalledTimes(2);
  });

  it('guarda un historial limitado y sin consultas duplicadas', () => {
    saveBibleHistory({ query: 'Juan 3:16', reference: 'Juan 3:16', searchedAt: '2026-08-10T10:00:00.000Z' });
    saveBibleHistory({ query: 'juan 3:16', reference: 'Juan 3:16', searchedAt: '2026-08-10T11:00:00.000Z' });

    const history = loadBibleHistory();
    expect(history.error).toBeNull();
    expect(history.items).toHaveLength(1);
    expect(history.items[0]?.searchedAt).toBe('2026-08-10T11:00:00.000Z');
  });
});
