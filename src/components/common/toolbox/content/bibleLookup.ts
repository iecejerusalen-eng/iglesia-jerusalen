import { BIBLE_BOOKS } from '../../../../config/bibleBooks';
import { parseBibleReferences, parseVerseRange } from '../../../../utils/bibleParser';
import { readJsonStorage, writeJsonStorage } from './safeStorage';

const CACHE_KEY = 'jerusalen-toolbox-bible-cache-v1';
const HISTORY_KEY = 'jerusalen-toolbox-bible-history-v1';
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 7;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_CACHE_ITEMS = 20;
const MAX_HISTORY_ITEMS = 8;

const BIBLE_ENGLISH_NAMES: Record<string, string> = {
  genesis: 'Genesis', exodo: 'Exodus', levitico: 'Leviticus', numeros: 'Numbers', deuteronomio: 'Deuteronomy',
  josue: 'Joshua', jueces: 'Judges', rut: 'Ruth', '1-samuel': '1 Samuel', '2-samuel': '2 Samuel',
  '1-reyes': '1 Kings', '2-reyes': '2 Kings', '1-cronicas': '1 Chronicles', '2-cronicas': '2 Chronicles',
  esdras: 'Ezra', nehemias: 'Nehemiah', ester: 'Esther', job: 'Job', salmos: 'Psalms', proverbios: 'Proverbs',
  eclesiastes: 'Ecclesiastes', cantares: 'Song of Solomon', isaias: 'Isaiah', jeremias: 'Jeremiah',
  lamentaciones: 'Lamentations', ezequiel: 'Ezekiel', daniel: 'Daniel', oseas: 'Hosea', joel: 'Joel', amos: 'Amos',
  abdias: 'Obadiah', jonas: 'Jonah', miqueas: 'Micah', nahum: 'Nahum', habacuc: 'Habakkuk', sofonias: 'Zephaniah',
  hageo: 'Haggai', zacarias: 'Zechariah', malaquias: 'Malachi', mateo: 'Matthew', marcos: 'Mark', lucas: 'Luke',
  juan: 'John', hechos: 'Acts', romanos: 'Romans', '1-corintios': '1 Corinthians', '2-corintios': '2 Corinthians',
  galatas: 'Galatians', efesios: 'Ephesians', filipenses: 'Philippians', colosenses: 'Colossians',
  '1-tesalonicenses': '1 Thessalonians', '2-tesalonicenses': '2 Thessalonians', '1-timoteo': '1 Timothy',
  '2-timoteo': '2 Timothy', tito: 'Titus', filemon: 'Philemon', hebreos: 'Hebrews', santiago: 'James',
  '1-pedro': '1 Peter', '2-pedro': '2 Peter', '1-juan': '1 John', '2-juan': '2 John', '3-juan': '3 John',
  judas: 'Jude', apocalipsis: 'Revelation',
};

export type BibleLookupErrorCode = 'invalid-reference' | 'not-found' | 'offline' | 'timeout' | 'aborted' | 'provider-error' | 'invalid-response';

export class BibleLookupError extends Error {
  readonly code: BibleLookupErrorCode;

  constructor(code: BibleLookupErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.code = code;
    this.name = 'BibleLookupError';
  }
}

export interface BiblePassageResult {
  query: string;
  bookId: string;
  chapter: number;
  verses: string;
  reference: string;
  text: string;
  translationId: string;
  translationName: string;
  fetchedAt: string;
  fromCache: boolean;
  storageWarning: string | null;
}

export interface BibleHistoryItem {
  query: string;
  reference: string;
  searchedAt: string;
}

type CachedBiblePassage = Omit<BiblePassageResult, 'fromCache' | 'storageWarning'>;
interface BollsVerse { verse: number; text: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCachedPassage(value: unknown): value is CachedBiblePassage {
  return isRecord(value)
    && typeof value.query === 'string'
    && typeof value.bookId === 'string'
    && typeof value.chapter === 'number'
    && typeof value.verses === 'string'
    && typeof value.reference === 'string'
    && typeof value.text === 'string'
    && typeof value.translationId === 'string'
    && typeof value.translationName === 'string'
    && typeof value.fetchedAt === 'string';
}

function isCache(value: unknown): value is CachedBiblePassage[] {
  return Array.isArray(value) && value.every(isCachedPassage);
}

function isHistory(value: unknown): value is BibleHistoryItem[] {
  return Array.isArray(value) && value.every((item) => isRecord(item)
    && typeof item.query === 'string'
    && typeof item.reference === 'string'
    && typeof item.searchedAt === 'string');
}

function parseBollsResponse(value: unknown): BollsVerse[] {
  if (!Array.isArray(value)) throw new BibleLookupError('invalid-response', 'El proveedor principal devolvió un formato inesperado.');
  const verses: BollsVerse[] = [];
  for (const item of value) {
    if (!isRecord(item) || !Number.isInteger(item.verse) || typeof item.text !== 'string') {
      throw new BibleLookupError('invalid-response', 'El proveedor principal devolvió versículos inválidos.');
    }
    verses.push({ verse: Number(item.verse), text: item.text });
  }
  return verses;
}

function parseFallbackResponse(value: unknown): { text: string; translationId: string; translationName: string } {
  if (!isRecord(value) || typeof value.text !== 'string' || value.text.trim().length === 0) {
    throw new BibleLookupError('invalid-response', 'El proveedor alternativo devolvió un formato inesperado.');
  }
  return {
    text: value.text.trim(),
    translationId: typeof value.translation_id === 'string' ? value.translation_id : 'valera',
    translationName: typeof value.translation_name === 'string' ? value.translation_name : 'Reina-Valera 1909',
  };
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>?/g, '').replace(/\s+/g, ' ').trim();
}

function normalizeQuery(query: string): string {
  return query.trim().toLocaleLowerCase('es');
}

function createRequestSignal(externalSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void; timedOut: () => boolean } {
  const controller = new AbortController();
  let timeoutReached = false;
  const onAbort = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener('abort', onAbort, { once: true });
  const timeoutId = window.setTimeout(() => {
    timeoutReached = true;
    controller.abort(new DOMException('Tiempo de espera agotado', 'TimeoutError'));
  }, REQUEST_TIMEOUT_MS);
  return {
    signal: controller.signal,
    timedOut: () => timeoutReached,
    cleanup: () => {
      window.clearTimeout(timeoutId);
      externalSignal?.removeEventListener('abort', onAbort);
    },
  };
}

function loadCache(): CachedBiblePassage[] {
  const read = readJsonStorage(CACHE_KEY, [] as CachedBiblePassage[], isCache);
  if (read.error) console.error('No se pudo recuperar la caché bíblica.', read.error);
  return read.value.filter((item) => Date.now() - Date.parse(item.fetchedAt) <= CACHE_TTL_MS);
}

function storeCache(item: CachedBiblePassage): Error | null {
  try {
    const next = [item, ...loadCache().filter((entry) => normalizeQuery(entry.query) !== normalizeQuery(item.query))].slice(0, MAX_CACHE_ITEMS);
    writeJsonStorage(CACHE_KEY, next);
    return null;
  } catch (error: unknown) {
    const storageError = error instanceof Error ? error : new Error('No se pudo guardar el pasaje en la caché local.');
    console.error('No se pudo guardar el pasaje en la caché local.', storageError);
    return storageError;
  }
}

export function loadBibleHistory(): { items: BibleHistoryItem[]; error: Error | null } {
  const read = readJsonStorage(HISTORY_KEY, [] as BibleHistoryItem[], isHistory);
  return { items: read.value.slice(0, MAX_HISTORY_ITEMS), error: read.error };
}

export function saveBibleHistory(item: BibleHistoryItem): void {
  const current = loadBibleHistory().items;
  const next = [item, ...current.filter((entry) => normalizeQuery(entry.query) !== normalizeQuery(item.query))].slice(0, MAX_HISTORY_ITEMS);
  writeJsonStorage(HISTORY_KEY, next);
}

export function buildBibleChapterUrl(result: BiblePassageResult): string {
  const verseParam = result.verses ? `&versiculo=${encodeURIComponent(result.verses)}` : '';
  return `/recursos/biblia?libro=${encodeURIComponent(result.bookId)}&capitulo=${result.chapter}${verseParam}`;
}

export async function lookupBiblePassage(query: string, externalSignal?: AbortSignal): Promise<BiblePassageResult> {
  const parsed = parseBibleReferences(query)[0];
  if (!parsed?.bookId) throw new BibleLookupError('invalid-reference', 'Usa una referencia como “Juan 3:16”.');
  const bookIndex = BIBLE_BOOKS.findIndex((book) => book.id === parsed.bookId);
  const chapter = Number(parsed.chapter || '1');
  const book = BIBLE_BOOKS[bookIndex];
  if (!book || !Number.isInteger(chapter) || chapter < 1 || chapter > book.chapters) {
    throw new BibleLookupError('invalid-reference', 'El libro o capítulo indicado no es válido.');
  }

  const cached = loadCache().find((entry) => normalizeQuery(entry.query) === normalizeQuery(query));
  if (cached) return { ...cached, fromCache: true, storageWarning: null };
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new BibleLookupError('offline', 'No hay conexión y este pasaje aún no está disponible sin conexión.');
  }

  const request = createRequestSignal(externalSignal);
  const verses = parsed.verses.replace(/\s+/g, '');
  const cleanReference = `${book.name} ${chapter}${verses ? `:${verses}` : ''}`;
  let primaryError: unknown;

  try {
    try {
      const response = await fetch(`https://bolls.life/get-chapter/RVR1960/${bookIndex + 1}/${chapter}/`, { signal: request.signal });
      if (response.ok) {
        const chapterVerses = parseBollsResponse(await response.json());
        const requested = verses ? parseVerseRange(verses) : [];
        const selected = requested.length > 0
          ? chapterVerses.filter((verse) => requested.includes(verse.verse))
          : chapterVerses.slice(0, 3);
        if (selected.length > 0) {
          const suffix = verses ? '' : ` (v. 1–${selected.length})`;
          const item: CachedBiblePassage = {
            query: query.trim(), bookId: book.id, chapter, verses, reference: `${cleanReference}${suffix}`,
            text: selected.map((verse) => `${verse.verse}. ${stripHtml(verse.text)}`).join(' '),
            translationId: 'RVR1960', translationName: 'Reina-Valera 1960', fetchedAt: new Date().toISOString(),
          };
          const cacheError = storeCache(item);
          return { ...item, fromCache: false, storageWarning: cacheError ? 'El pasaje se encontró, pero no pudo guardarse para usarlo sin conexión.' : null };
        }
        primaryError = new BibleLookupError('not-found', 'El proveedor principal no devolvió los versículos solicitados.');
      } else {
        primaryError = new BibleLookupError(response.status === 404 ? 'not-found' : 'provider-error', `El proveedor principal respondió con estado ${response.status}.`);
      }
    } catch (error: unknown) {
      if (request.signal.aborted) throw error;
      primaryError = error;
      console.warn('La consulta bíblica principal falló; se intentará el proveedor alternativo.', error);
    }

    const englishBook = BIBLE_ENGLISH_NAMES[book.id] ?? book.id;
    const fallbackQuery = `${englishBook} ${chapter}${verses ? `:${verses}` : ''}`;
    const response = await fetch(`https://bible-api.com/${encodeURIComponent(fallbackQuery)}?translation=valera`, { signal: request.signal });
    if (!response.ok) {
      throw new BibleLookupError(response.status === 404 ? 'not-found' : 'provider-error', 'Ningún proveedor pudo entregar el pasaje.', { cause: primaryError });
    }
    const fallback = parseFallbackResponse(await response.json());
    const item: CachedBiblePassage = {
      query: query.trim(), bookId: book.id, chapter, verses, reference: cleanReference, text: fallback.text,
      translationId: fallback.translationId, translationName: fallback.translationName, fetchedAt: new Date().toISOString(),
    };
    const cacheError = storeCache(item);
    return { ...item, fromCache: false, storageWarning: cacheError ? 'El pasaje se encontró, pero no pudo guardarse para usarlo sin conexión.' : null };
  } catch (error: unknown) {
    if (request.timedOut()) throw new BibleLookupError('timeout', 'La búsqueda tardó demasiado. Inténtalo de nuevo.', { cause: error });
    if (externalSignal?.aborted) throw new BibleLookupError('aborted', 'La búsqueda fue cancelada.', { cause: error });
    if (error instanceof BibleLookupError) throw error;
    if (error instanceof TypeError) throw new BibleLookupError('offline', 'No fue posible conectar con los proveedores bíblicos.', { cause: error });
    throw new BibleLookupError('provider-error', 'Ocurrió un error inesperado al buscar el pasaje.', { cause: error });
  } finally {
    request.cleanup();
  }
}
