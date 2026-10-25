import type { Schedule } from '../../types';
import { PUBLIC_LAUNCH_VISIBILITY } from '../../config/publicLaunchVisibility';
import { BIBLE_BOOKS } from '../../config/bibleBooks';
import { BIBLE_BOOK_MAP, parseBibleReferences } from '../../utils/bibleParser';
import type { PublicSongSearchResult } from '../../features/songs/services/publicSongSearch';

export type AssistantLink = { label: string; href: string };
export type AssistantSuggestion = { label: string; message: string };
type PublicEventSpaceSummary = { name: string; address: string | null; map_url: string | null };
export type PublicEventSummary = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  spaces: PublicEventSpaceSummary | PublicEventSpaceSummary[] | null;
  emoji: string | null;
};
export type PublicSermonSummary = {
  id: string;
  title: string;
  pastor_name: string | null;
  date: string | null;
  description: string | null;
};
export type PublicPodcastSummary = {
  id: string;
  title: string;
  description: string | null;
  show_notes: string | null;
  episode_number: number | null;
  published_at: string | null;
};
export type PublicProgramSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  category: string;
  audience: string;
  tags: string[];
  modality: string;
  source: 'study_programs' | 'open_resources' | 'studies';
};
export type PublicMinistrySummary = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  schedule: string | null;
};
export type ChurchAssistantKnowledge = {
  schedules?: Schedule[] | null;
  events?: PublicEventSummary[] | null;
  sermons?: PublicSermonSummary[] | null;
  podcasts?: PublicPodcastSummary[] | null;
  programs?: PublicProgramSummary[] | null;
  songs?: PublicSongSearchResult[] | null;
  ministries?: PublicMinistrySummary[] | null;
};
export type KnowledgeNeed = 'schedules' | 'events' | 'sermons' | 'podcasts' | 'programs' | 'songs' | 'ministries';

export const CHURCH_LINKS = {
  contact: { label: 'Contactar a la iglesia', href: '/contacto' },
  community: { label: 'Explorar la comunidad', href: '/comunidad' },
  visit: { label: 'Planificar mi visita', href: '/visita' },
  events: { label: 'Ver agenda', href: '/eventos' },
  sermons: { label: 'Explorar prédicas', href: '/predicas' },
  ministries: { label: 'Ver ministerios', href: '/ministerios' },
  prayer: { label: 'Peticiones de oración', href: '/peticiones' },
  podcast: { label: 'Escuchar el podcast', href: '/podcast' },
  songs: { label: 'Abrir alabanzas e himnos', href: '/recursos/alabanzas' },
  programs: { label: 'Explorar programas', href: '/programas' },
  classroom: { label: 'Ir al Aula Virtual', href: '/aula-virtual' },
  doctrine: { label: 'Conocer nuestra fe', href: '/nosotros/doctrina' },
  symbols: { label: 'Ver los símbolos Cuadrangulares', href: '/nosotros/simbolos' },
  hymn: { label: 'Leer el Himno Cuadrangular', href: '/nosotros/himno' },
  pastors: { label: 'Conocer a los pastores', href: '/nosotros#liderazgo' },
} satisfies Record<string, AssistantLink>;

type AssistantConversationMessage = { role: 'user' | 'assistant'; text: string };

const ANIMA_EC_WHATSAPP = 'https://wa.me/593997196911';
const MSP_MENTAL_HEALTH_LINE = 'https://www.salud.gob.ec/a-traves-de-la-linea-171-msp-ofrece-atencion-en-salud-mental/';

function safetyLinks(includeEmergency: boolean): AssistantLink[] {
  return [
    ...(includeEmergency ? [{ label: 'Llamar al ECU 911 · 9-1-1', href: 'tel:911' }] : []),
    { label: 'Línea 171 de salud mental · opción 6', href: 'tel:171' },
    { label: 'Información oficial de la línea 171', href: MSP_MENTAL_HEALTH_LINE },
    { label: 'Escribir por WhatsApp a Anima EC', href: ANIMA_EC_WHATSAPP },
    CHURCH_LINKS.contact,
  ];
}

export function normalizeAssistantText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function isEventQuestion(query: string) {
  if (/\b(evento|eventos|agenda|actividad|actividades)\b/.test(query)) return true;
  const asksWhatIsHappening = /\b(que hay|hay algo|que pasa|que ocurre|que se hace)\b/.test(query);
  const namesPeriod = /\b(hoy|manana|fin de semana|esta semana|domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/.test(query);
  return asksWhatIsHappening && namesPeriod;
}

function isScheduleQuestion(query: string) {
  return /\b(horario|horarios|culto|cultos|reunion|reuniones|servicio|servicios|domingo|lunes|martes|miercoles|jueves|viernes|sabado|escuela dominical)\b/.test(query);
}

function isLiveQuestion(query: string) {
  return /\b(en vivo|transmit\w*|transmision|streaming|youtube|culto.{0,24}(?:en linea|online|internet|virtual)|(?:en linea|online|internet|virtual).{0,24}culto|ver.{0,24}culto.{0,24}(?:linea|online|internet|virtual))\b/.test(query);
}

function isMinistryQuestion(query: string) {
  return /\b(ministerio|ministros|servir|voluntariado|voluntario|jovenes|juvenil|adolescentes|ninos|ninas|infantil|alabanza|musica|musicos|parejas|damas|caballeros|escuela dominical)\b/.test(query);
}

function isSermonQuestion(query: string) {
  return /\b(predica|predicas|sermon|sermones|mensaje|mensajes)\b/.test(query);
}

function isPodcastQuestion(query: string) {
  return /\b(podcast|episodio|episodios)\b/.test(query);
}

function isProgramQuestion(query: string) {
  return /\b(programa|programas|curso|cursos|devocional|devocionales|formacion)\b/.test(query);
}

function isSongQuestion(query: string) {
  if (!/\b(alabanza|alabanzas|himno|himnos|himnario|cancion|canciones|letra|letras|repertorio|coros)\b/.test(query)) return false;
  if (/\b(ministerio|ministros|servir|voluntariado|voluntario)\b/.test(query)) return false;
  return !/\b(himno cuadrangular|himno de la cuadrangular|himno de iglesia cuadrangular)\b/.test(query);
}

export function getKnowledgeNeeds(message: string): KnowledgeNeed[] {
  const query = normalizeAssistantText(message);
  const needs = new Set<KnowledgeNeed>();

  if (isScheduleQuestion(query) && !isLiveQuestion(query)) needs.add('schedules');
  if (isEventQuestion(query)) needs.add('events');
  if (isSermonQuestion(query)) needs.add('sermons');
  if (isPodcastQuestion(query)) needs.add('podcasts');
  if (isProgramQuestion(query) && !/\b(aula virtual|mis cursos)\b/.test(query)) needs.add('programs');
  if (isSongQuestion(query)) needs.add('songs');
  if (isMinistryQuestion(query)) needs.add('ministries');

  return [...needs];
}

export function contextualizeFollowUp(
  message: string,
  conversation: readonly AssistantConversationMessage[] = [],
) {
  const query = normalizeAssistantText(message).replace(/[¿?¡!.,;:]/g, ' ').replace(/\s+/g, ' ').trim();
  const lastAssistant = [...conversation].reverse().find((item) => item.role === 'assistant');
  const lastUser = [...conversation].reverse().find((item) => item.role === 'user');
  if (!lastAssistant || !lastUser) return message;

  const roles = conversation.map((item) => item.role);
  const lastUserIndex = roles.lastIndexOf('user');
  const lastAssistantIndex = roles.lastIndexOf('assistant');
  if (lastAssistantIndex < lastUserIndex) return message;

  const assistantText = normalizeAssistantText(lastAssistant.text);
  if (assistantText.includes('estas en peligro inmediato o pensando en hacerte dano ahora')) return message;

  const isShortFollowUp = query.length <= 140 && (
    /^(y|tambien|ademas|para|sobre|donde|como|cual|cuales|cuando|hay|tienen|tiene|ofrecen|ofrece|otra|otro|mas|parecida|parecido|similar)\b/.test(query)
    || /^(hoy|manana|esta semana|fin de semana|domingo|lunes|martes|miercoles|jueves|viernes|sabado)$/.test(query)
  );
  if (!isShortFollowUp) return message;

  const priorContext = normalizeAssistantText(`${lastUser.text} ${lastAssistant.text}`);
  const isEventContext = /\b(evento|eventos|agenda|actividad|actividades)\b/.test(priorContext);
  const isSermonContext = /\b(predica|predicas|sermon|sermones|mensaje|mensajes)\b/.test(priorContext);
  const isPodcastContext = /\b(podcast|episodio|episodios)\b/.test(priorContext);
  const isProgramContext = /\b(programa|programas|curso|cursos|formacion|devocional|devocionales)\b/.test(priorContext);
  const isSongContext = /\b(cancion|canciones|cancionero|alabanza|alabanzas|himno|himnos|himnario)\b/.test(priorContext);
  const isMinistryContext = /\b(ministerio|ministros|ministerios|voluntariado|voluntario|servir|jovenes|juvenil|adolescentes|ninos|ninas|infantil|alabanza|musica|parejas|damas|caballeros|escuela dominical)\b/.test(priorContext);
  const isScheduleContext = /\b(horario|horarios|culto|cultos|reunion|reuniones|servicio|servicios|escuela dominical)\b/.test(priorContext);
  const asksForTopic = /\b(de|sobre|tema|habla|predica|mensaje|sermon|pastor|oracion|familia|fe|sanidad|perdon|amor|esperanza|servicio|biblia|salvacion|jesus|dios)\b/.test(query);
  if (isSongContext && /\b(otra|otro|mas|parecida|parecido|similar)\b/.test(query)) return lastUser.text + ' ' + message;
  if (isSongContext && asksForTopic) return 'canciones ' + message;

  if (isEventContext) {
    if (/\b(donde|ubicacion|direccion|llegar|mapa|como)\b/.test(query)) return `¿Dónde se realizan los eventos? ${message}`;
    if (/\b(hoy|manana|esta semana|fin de semana|domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/.test(query)) return `¿Qué eventos hay ${message.replace(/^[\s¿¡]*(?:y\s+)?/i, '').replace(/[?!.]+$/g, '')}?`;
    if (/\b(hora|horario|trata|cual|cuales|ese|esa|evento|actividad)\b/.test(query)) return `eventos ${message}`;
  }
  if (isPodcastContext && asksForTopic) return `episodios del podcast ${message}`;
  if (isSermonContext && asksForTopic) return `prédicas ${message}`;
  if (isProgramContext && /\b(linea|online|virtual|presencial|hibrido|descargar|conexion|joven|adolesc|nino|nina|infantil|mujer|dama|curso|programa|otro|otra)\b/.test(query)) return `programas ${message}`;
  if (isMinistryContext && /\b(nino|nina|infantil|joven|adolesc|dama|caballero|pareja|musica|alabanza|horario)\b/.test(query)) return `ministerios ${message}`;
  if (isScheduleContext && /\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado|horario|hora)\b/.test(query)) return `horarios de cultos ${message}`;

  return message;
}

function dayFilter(query: string, schedules: Schedule[]) {
  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const requestedDay = days.find((day) => new RegExp(`\\b${day}\\b`).test(query));
  if (!requestedDay) return schedules;
  return schedules.filter((schedule) => normalizeAssistantText(schedule.day).includes(requestedDay));
}

function formatEventDate(value: string) {
  const date = new Date(`${value}T12:00:00-05:00`);
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Guayaquil',
  }).format(date);
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
}

function formatSermonDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value.length === 10 ? `${value}T12:00:00-05:00` : value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Guayaquil' }).format(date);
}

function sermonTopicTerms(query: string) {
  const ignored = new Set(['predica', 'predicas', 'sermon', 'sermones', 'mensaje', 'mensajes', 'ultimo', 'ultimos', 'ultima', 'ultimas', 'reciente', 'recientes', 'quiero', 'ver', 'buscar', 'busco', 'conocer', 'cuales', 'cual', 'que', 'hay', 'sobre', 'para', 'las', 'los', 'del']);
  return query.split(/\s+/)
    .map((term) => term.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((term) => term.length >= 4 && !ignored.has(term));
}

function sermonMatches(query: string, sermon: PublicSermonSummary) {
  const terms = sermonTopicTerms(query);
  if (!terms.length) return false;
  const searchable = normalizeAssistantText(`${sermon.title} ${sermon.pastor_name ?? ''} ${sermon.description ?? ''}`);
  return terms.some((term) => searchable.includes(term));
}

function podcastTopicTerms(query: string) {
  const ignored = new Set(['podcast', 'episodio', 'episodios', 'ultimo', 'ultimos', 'ultima', 'ultimas', 'reciente', 'recientes', 'quiero', 'escuchar', 'buscar', 'busco', 'ver', 'cuales', 'cual', 'que', 'hay', 'sobre', 'tema', 'trata', 'habla', 'del', 'las', 'los']);
  return query.split(/\s+/)
    .map((term) => term.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((term) => term.length >= 4 && !ignored.has(term));
}

function podcastMatches(query: string, episode: PublicPodcastSummary) {
  const terms = podcastTopicTerms(query);
  if (!terms.length) return false;
  const searchable = normalizeAssistantText(`${episode.title} ${episode.description ?? ''} ${episode.show_notes ?? ''}`);
  return terms.some((term) => searchable.includes(term));
}

function podcastLink(episode: PublicPodcastSummary): AssistantLink {
  return { label: `Ver episodio: ${episode.title}`, href: `/podcast?episode=${encodeURIComponent(episode.id)}` };
}

function podcastDate(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Guayaquil' }).format(date);
}

function programTopicTerms(query: string) {
  const ignored = new Set(['programa', 'programas', 'curso', 'cursos', 'devocional', 'devocionales', 'formacion', 'quiero', 'ver', 'buscar', 'busco', 'conocer', 'cuales', 'cual', 'que', 'hay', 'estan', 'esta', 'son', 'tienen', 'tiene', 'existen', 'existe', 'muestran', 'para', 'sobre', 'ofrecen', 'ofrece', 'disponible', 'disponibles', 'publicado', 'publicados', 'iglesia', 'aprendizaje', 'aprender', 'ultimo', 'ultimos', 'ultima', 'ultimas', 'reciente', 'recientes', 'nuevo', 'nueva', 'nuevos', 'nuevas', 'otro', 'otra', 'otros', 'otras']);
  return query.split(/\s+/)
    .map((term) => term.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, ''))
    .filter((term) => term.length >= 4 && !ignored.has(term));
}

function programMatches(query: string, program: PublicProgramSummary) {
  const terms = programTopicTerms(query);
  const searchable = normalizeAssistantText(`${program.title} ${program.summary} ${program.category} ${program.audience} ${program.tags.join(' ')} ${program.modality} ${programModalityLabel(program.modality)}`);
  const audienceGroups = [
    { pattern: /nino|nina|infantil/, terms: ['nino', 'nina', 'infantil', 'infancia'] },
    { pattern: /joven|adolesc|chica|chico/, terms: ['joven', 'adolesc', 'chica', 'chico'] },
    { pattern: /mujer|dama/, terms: ['mujer', 'dama', 'chica'] },
    { pattern: /hombre|caballero|varon/, terms: ['hombre', 'caballero', 'varon'] },
  ];
  const group = audienceGroups.find(({ pattern }) => pattern.test(query));
  if (group && group.terms.some((term) => searchable.includes(term))) return true;
  return terms.some((term) => searchable.includes(term));
}

function programModalityLabel(modality: string) {
  if (modality === 'online') return 'En línea';
  if (modality === 'in_person') return 'Presencial';
  if (modality === 'hybrid') return 'Híbrido';
  if (modality === 'offline_package') return 'Para descargar, sin conexión';
  return '';
}

function programLink(program: PublicProgramSummary): AssistantLink {
  const identifier = program.source === 'study_programs' ? program.slug : program.id;
  return { label: `Ver programa: ${program.title}`, href: `/programas/${encodeURIComponent(identifier)}` };
}

function sermonLink(sermon: PublicSermonSummary): AssistantLink {
  return { label: `Escuchar: ${sermon.title}`, href: `/predicas/${encodeURIComponent(sermon.id)}` };
}

function shiftDate(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function eventDateRange(query: string, today: string): [string, string] | null {
  if (/\b(hoy)\b/.test(query)) return [today, today];
  if (/\b(manana)\b/.test(query)) {
    const tomorrow = shiftDate(today, 1);
    return [tomorrow, tomorrow];
  }
  if (/\b(este|esta|el) fin de semana\b/.test(query)) {
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
    if (weekday === 0) return [today, today];
    const daysUntilSaturday = (6 - weekday + 7) % 7;
    const saturday = shiftDate(today, daysUntilSaturday);
    return [saturday, shiftDate(saturday, 1)];
  }
  if (/\besta semana\b/.test(query)) {
    const weekday = (new Date(`${today}T12:00:00Z`).getUTCDay() + 6) % 7;
    return [today, shiftDate(today, 6 - weekday)];
  }

  const days = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const requestedDay = days.find((day) => new RegExp(`\\b${day}\\b`).test(query));
  if (!requestedDay) return null;
  const currentDay = new Date(`${today}T12:00:00Z`).getUTCDay();
  const targetDay = days.indexOf(requestedDay);
  const date = shiftDate(today, (targetDay - currentDay + 7) % 7);
  return [date, date];
}

function eventDateMatches(event: PublicEventSummary, range: [string, string] | null) {
  return !range || (event.start_date <= range[1] && event.end_date >= range[0]);
}

function eventLink(event: PublicEventSummary): AssistantLink {
  return { label: `Ver ${event.title}`, href: `/eventos?event=${encodeURIComponent(event.id)}` };
}

function eventMapLink(event: PublicEventSummary): AssistantLink | null {
  const space = Array.isArray(event.spaces) ? event.spaces[0] : event.spaces;
  if (!space?.map_url) return null;
  try {
    const url = new URL(space.map_url);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    return { label: `Cómo llegar: ${event.title}`, href: url.toString() };
  } catch {
    return null;
  }
}

function eventSummaryLine(event: PublicEventSummary): string {
  const time = formatTime(event.start_time);
  const endTime = formatTime(event.end_time);
  const rangeText = time ? ` · ${time}${endTime ? `–${endTime}` : ''}` : '';
  const dateText = event.end_date !== event.start_date
    ? `${formatEventDate(event.start_date)} al ${formatEventDate(event.end_date)}`
    : formatEventDate(event.start_date);
  const space = Array.isArray(event.spaces) ? event.spaces[0] : event.spaces;
  const place = space?.name ?? space?.address;
  const locationText = place ? ` · ${place}` : '';
  const description = plainTextSummary(event.description, 180);
  const descriptionText = description ? `: ${description}${/[.!?…]$/.test(description) ? '' : '.'}` : '.';
  return `${event.emoji ? `${event.emoji} ` : ''}${event.title} — ${dateText}${rangeText}${locationText}${descriptionText}`;
}

function bibleReferenceFromQuestion(message: string) {
  const normalized = normalizeAssistantText(message);
  const bookNames = Object.keys(BIBLE_BOOK_MAP)
    .map((name) => normalizeAssistantText(name))
    .sort((first, second) => second.length - first.length);
  for (const bookName of bookNames) {
    const escaped = bookName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`(^|[^a-z])(${escaped})(?=\\s+\\d)`).exec(normalized);
    if (!match || match.index === undefined) continue;
    const referenceStart = match.index + match[1].length;
    const parsed = parseBibleReferences(normalized.slice(referenceStart))[0];
    if (parsed?.bookId && parsed.chapter) return parsed;
  }
  return null;
}

function ministryMatches(query: string, ministry: PublicMinistrySummary) {
  const searchable = normalizeAssistantText(`${ministry.name} ${ministry.category} ${ministry.description ?? ''}`);
  const groups: Array<{ pattern: RegExp; terms: string[] }> = [
    { pattern: /joven|adolesc/, terms: ['joven', 'adolesc'] },
    { pattern: /nino|nina|infantil|escuela dominical|clase/, terms: ['nino', 'nina', 'infantil', 'escuela dominical', 'dominical', 'clase'] },
    { pattern: /alabanza|musica|musico|adoracion/, terms: ['alabanza', 'musica', 'musico', 'adoracion'] },
    { pattern: /dama|caballero|mujer|hombre/, terms: ['dama', 'caballero', 'mujer', 'hombre'] },
    { pattern: /pareja|matrimonio|familia/, terms: ['pareja', 'matrimonio', 'familia'] },
  ];
  const group = groups.find(({ pattern }) => pattern.test(query));
  if (group) return group.terms.some((term) => searchable.includes(term));

  const stopWords = new Set(['ministerio', 'ministerios', 'quiero', 'conocer', 'buscar', 'busco', 'informacion', 'iglesia', 'servir', 'participar', 'integrarme', 'tiene', 'tienen', 'hay', 'ofrece', 'cuales', 'cual', 'que']);
  const terms = query.split(/\s+/).filter((term) => term.length >= 4 && !stopWords.has(term));
  return terms.some((term) => searchable.includes(term));
}

function plainTextSummary(value: string | null, maxLength = 220) {
  if (!value) return '';
  const plain = value
    .replace(/<\/(p|h[1-6]|li|blockquote)>/gi, '. ')
    .replace(/<br\s*\/?\s*>/gi, '. ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/([.!?])(?:\s*[.!?])+/g, '$1')
    .trim();
  if (plain.length <= maxLength) return plain;
  const prefix = plain.slice(0, maxLength - 1);
  const boundary = prefix.lastIndexOf(' ');
  return `${prefix.slice(0, boundary > maxLength * 0.75 ? boundary : prefix.length).trimEnd()}…`;
}

export function answerFromPublicInfo(
  message: string,
  knowledge: ChurchAssistantKnowledge,
  conversation: readonly AssistantConversationMessage[] = [],
) {
  const query = normalizeAssistantText(message);

  const lastAssistant = [...conversation].reverse().find((item) => item.role === 'assistant');
  const roles = conversation.map((item) => item.role);
  const lastUserIndex = roles.lastIndexOf('user');
  const lastAssistantIndex = roles.lastIndexOf('assistant');
  const isSafetyFollowUp = Boolean(
    lastAssistant?.text.includes('¿Estás en peligro inmediato o pensando en hacerte daño ahora?')
      && lastAssistantIndex > lastUserIndex,
  );
  const safetyReply = query.replace(/[¿?¡!.,;:]/g, '').trim();
  if (isSafetyFollowUp && /^(si(?:\s|$)|no se$|no lo se$|no estoy seguro$|no estoy segura$)/.test(safetyReply)) {
    return {
      text: 'Gracias por decírmelo. Si estás en peligro o no estás seguro, llama al ECU 911 ahora y, si puedes, pide a una persona de confianza que se quede contigo y te acompañe a un servicio de emergencia. También puedes llamar o escribir por WhatsApp a Samaritans by Anima EC al (593) 99 719 6911. Este chat no es un servicio de emergencia ni confidencial.',
      links: safetyLinks(true),
    };
  }
  if (isSafetyFollowUp && /^(no|no estoy en peligro|no pienso hacerme dano|no quiero hacerme dano)$/.test(safetyReply)) {
    return {
      text: 'Gracias por responder. Siento que estés pasando por esto. Si puedes, habla hoy con alguien de confianza y no te quedes a solas con lo que sientes. Puedes llamar a la línea 171, opción 6, del Ministerio de Salud Pública, o contactar por WhatsApp a Anima EC. También puedes pedir acompañamiento a la iglesia.',
      links: safetyLinks(false),
    };
  }
  if (isSafetyFollowUp && /^(no se que hacer|no se que hacer ahora|necesito ayuda|ayudame)$/.test(safetyReply)) {
    return {
      text: 'Gracias por seguir aquí. No tienes que resolverlo todo ahora. Si podrías hacerte daño, llama al ECU 911 y busca a alguien de confianza que pueda acompañarte en persona. También puedes llamar gratis a la línea 171, opción 6, o escribir por WhatsApp a Anima EC. ¿Puedes acercarte o llamar ahora a una persona de confianza?',
      links: safetyLinks(true),
    };
  }
  if (isSafetyFollowUp && /\b(oracion|orar|oren|oremos|peticion|peticiones|necesito que oren|quiero que oren)\b/.test(query)) {
    return {
      text: 'Claro, puedes pedir oración a la iglesia. Y como me contaste que estás pasando por un momento difícil, quiero confirmar algo primero: ¿estás en peligro inmediato o pensando en hacerte daño ahora? Si sí, llama al ECU 911 y busca a alguien de confianza que pueda acompañarte en persona.',
      links: [CHURCH_LINKS.prayer, ...safetyLinks(true)],
    };
  }

  if (isLiveQuestion(query)) {
    return { text: 'Puedes abrir el espacio de Culto en Vivo y comprobar si hay una transmisión disponible ahora.', links: [{ label: 'Entrar al Culto en Vivo', href: '/comunidad/culto-en-vivo' }] };
  }

  if (/\b(no me gusta mi vida|no quiero vivir|no quiero seguir viviendo|quiero morir|quiero suicidarme|suicidio|hacerme dano|autolesion|acabar con todo)\b/.test(query)) {
    return {
      text: 'Siento mucho que estés pasando por un momento así. Gracias por decírmelo. ¿Estás en peligro inmediato o pensando en hacerte daño ahora? Si sí, llama al ECU 911 y busca a alguien de confianza que pueda estar contigo. También puedes llamar a la línea 171, opción 6, del Ministerio de Salud Pública, o escribir por WhatsApp a Anima EC. Este chat no es un canal de emergencia ni confidencial.',
      links: safetyLinks(true),
    };
  }
  if (/\b(estoy triste|me siento triste|ando triste|estoy deprimid[oa]|me siento deprimid[oa]|me siento sol[oa]|estoy angustiad[oa]|tengo ansiedad)\b/.test(query)) {
    return {
      text: 'Siento que estés pasando por un momento difícil. Gracias por contármelo. Si te ayuda, puedes hablar con alguien de confianza, pedir oración o contactar a la iglesia. También puedes llamar gratis a la línea 171, opción 6, del Ministerio de Salud Pública. No compartas aquí información personal; este chat no es confidencial.',
      links: [CHURCH_LINKS.prayer, ...safetyLinks(false)],
    };
  }
  if (/\b(no se que hacer(?: ahora)?|no puedo mas|necesito hablar con alguien|me siento desbordad[oa])\b/.test(query)) {
    return {
      text: 'Siento que estés pasando por un momento difícil. ¿Estás en peligro inmediato o pensando en hacerte daño ahora? Si sí, llama al ECU 911 y busca a alguien de confianza que pueda acompañarte en persona. También puedes llamar gratis a la línea 171, opción 6, o escribir por WhatsApp a Anima EC. Este chat no es confidencial.',
      links: safetyLinks(true),
    };
  }

  if (/\b(quien es (?:el )?pastor|quien es (?:la )?pastora|pastor(?:es)? principal(?:es)?|liderazgo pastoral)\b/.test(query)) {
    return {
      text: 'La página institucional presenta a David Nicola como pastor principal y a Corina Miranda como pastora co-principal de Iglesia Jerusalén.',
      links: [CHURCH_LINKS.pastors, { label: 'Historia de los pastores', href: '/nosotros/pastores' }, CHURCH_LINKS.contact],
    };
  }
  const asksAboutChurchIdentity = /\b(iglesia|jerusalen|cuadrangular|nuestra|nuestro)\b/.test(query);
  if (/\bvision\b/.test(query) && asksAboutChurchIdentity) {
    if (/\bmision\b/.test(query)) {
      return {
        text: 'La visión de Iglesia Jerusalén es evangelizar y discipular en Ecuador y el mundo, formando comunidades cristianas saludables y multiplicadoras, enviando misioneros y administrando sus recursos con eficiencia. Su misión es predicar a Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto, y formar discípulos llenos de santidad, amor fraternal y servicio.',
        links: [{ label: 'Leer visión y misión', href: '/nosotros#proposito' }, CHURCH_LINKS.doctrine],
      };
    }
    return {
      text: 'La visión publicada de Iglesia Jerusalén es ser una iglesia que evangeliza y discipula en Ecuador y el mundo, estableciendo comunidades cristianas saludables y multiplicadoras, enviando misioneros a otros países y con una administración eficiente.',
      links: [{ label: 'Leer visión y misión', href: '/nosotros#proposito' }, { label: 'Conocer la iglesia', href: '/nosotros' }],
    };
  }
  if (/\bmision\b/.test(query) && asksAboutChurchIdentity) {
    return {
      text: 'La misión publicada de Iglesia Jerusalén es predicar el Evangelio de Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto, y formar discípulos llenos de santidad, amor fraternal y servicio.',
      links: [{ label: 'Leer visión y misión', href: '/nosotros#proposito' }, CHURCH_LINKS.doctrine],
    };
  }
  if (/\b(simbol(?:o|os)|emblema(?:s)?|bandera)\b/.test(query) && /\b(cuadrangular|iglesia|jerusalen|cuatro)\b/.test(query)) {
    return {
      text: 'Los cuatro símbolos expresan los ministerios de Jesús: la cruz, Jesucristo como Salvador; la paloma, Bautizador con el Espíritu Santo; la copa, Sanador; y la corona, Rey que viene.',
      links: [CHURCH_LINKS.symbols, CHURCH_LINKS.doctrine],
    };
  }
  if (/\b(himno cuadrangular|himno de la cuadrangular|himno de iglesia cuadrangular)\b/.test(query)) {
    return {
      text: 'El Himno Cuadrangular canta sobre Jesús como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene. Puedes leer sus estrofas y el coro en la sección de aprendizaje de la iglesia.',
      links: [CHURCH_LINKS.hymn, CHURCH_LINKS.songs],
    };
  }
  if (/\b(que es la iglesia cuadrangular|que es cuadrangular|iglesia evangelica cuadrangular)\b/.test(query)) {
    return {
      text: 'La Iglesia Cuadrangular anuncia a Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto. La iglesia local Jerusalén forma parte de esta familia cristiana y se reúne en Milagro, Ecuador.',
      links: [CHURCH_LINKS.doctrine, { label: 'Conocer Iglesia Jerusalén', href: '/nosotros' }],
    };
  }

  {
    const reference = bibleReferenceFromQuestion(message);
    const book = reference && BIBLE_BOOKS.find((item) => item.id === reference.bookId);
    const chapter = Number(reference?.chapter);
    const verses = reference?.verses.replace(/[^\d,-]/g, '');
    if (reference && book && Number.isInteger(chapter) && chapter >= 1 && chapter <= book.chapters) {
      const params = new URLSearchParams({ libro: book.id, capitulo: String(chapter) });
      if (verses) params.set('versiculo', verses);
      return {
        text: `Puedes abrir ${reference.bookName} ${chapter}${verses ? `:${verses}` : ''} directamente en el lector bíblico.`,
        links: [{ label: `Leer ${reference.bookName} ${chapter}${verses ? `:${verses}` : ''}`, href: `/recursos/biblia?${params.toString()}` }, { label: 'Explorar el estudio bíblico', href: '/programas/estudio-biblico' }],
      };
    }
  }

  // Event language takes precedence when a question also names a day of the week.
  if (isEventQuestion(query)) {
    if (knowledge.events === null) return { text: 'No pude consultar la agenda en este momento. Puedes abrir la página de eventos y volver a intentarlo.', links: [CHURCH_LINKS.events] };
    const allEvents = knowledge.events ?? [];
    if (!allEvents.length) return { text: 'No hay próximos eventos publicados en la agenda ahora mismo. Revisa la página más adelante por si se actualiza.', links: [CHURCH_LINKS.events] };

    const range = eventDateRange(query, new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date()));
    const periodEvents = allEvents.filter((event) => eventDateMatches(event, range));
    if (range && !periodEvents.length) {
      const upcomingEvents = allEvents.slice(0, 3);
      const alternatives = upcomingEvents.length
        ? ` No hay actividades para esas fechas. Estos son los próximos eventos publicados:\n${upcomingEvents.map(eventSummaryLine).join('\n')}`
        : ' No hay próximos eventos publicados por ahora.';
      return {
        text: `No encuentro eventos públicos publicados para el período solicitado.${alternatives}`,
        links: [
          ...upcomingEvents.flatMap((event) => [eventLink(event), eventMapLink(event)].filter((link): link is AssistantLink => link !== null)),
          CHURCH_LINKS.events,
        ],
      };
    }

    const topicTerms = /joven|adolesc/.test(query) ? ['joven', 'adolesc']
      : /nino|nina|infantil/.test(query) ? ['nino', 'nina', 'infantil']
        : /dama|mujer/.test(query) ? ['dama', 'mujer']
          : /caballero|hombre/.test(query) ? ['caballero', 'hombre']
            : /pareja|matrimonio|familia/.test(query) ? ['pareja', 'matrimonio', 'familia'] : [];
    const relatedEvents = topicTerms.length
      ? periodEvents.filter((event) => topicTerms.some((term) => normalizeAssistantText(`${event.title} ${event.description ?? ''}`).includes(term)))
      : periodEvents;
    const selectedEvents = relatedEvents.length ? relatedEvents : periodEvents;
    const lines = selectedEvents.slice(0, 5).map(eventSummaryLine);
    const intro = relatedEvents.length || !topicTerms.length ? 'Estos son los eventos públicos publicados para ese período:' : 'No veo un evento publicado con ese tema para ese período; estos son los próximos eventos de la agenda:';
    const links = [
      ...selectedEvents.slice(0, 5).flatMap((event) => [eventLink(event), eventMapLink(event)].filter((link): link is AssistantLink => link !== null)),
      CHURCH_LINKS.events,
      ...(topicTerms.length ? [CHURCH_LINKS.ministries] : []),
    ];
    return { text: `${intro}\n${lines.join('\n')}`, links };
  }

  if (isScheduleQuestion(query)) {
    if (knowledge.schedules === null) return { text: 'No pude consultar los horarios ahora. Puedes ver la agenda y confirmar los detalles con la iglesia.', links: [CHURCH_LINKS.visit, CHURCH_LINKS.contact] };
    const schedulesForDay = dayFilter(query, knowledge.schedules ?? []);
    const asksForSundaySchool = /\b(escuela dominical|clases? dominicales)\b/.test(query);
    const schedules = asksForSundaySchool
      ? schedulesForDay.filter((schedule) => normalizeAssistantText(schedule.title).includes('escuela dominical'))
      : schedulesForDay;
    if (!schedules.length) return { text: 'No encuentro horarios publicados para ese día. Revisa la agenda o confirma con la iglesia.', links: [CHURCH_LINKS.visit, CHURCH_LINKS.events] };
    const lines = schedules.map((schedule) => `${schedule.day}: ${schedule.title}, ${schedule.time_range}.`);
    const intro = /\b(domingo|lunes|martes|miercoles|jueves|viernes|sabado)\b/.test(query) ? 'Estos son los horarios publicados para ese día:' : 'Estos son los horarios publicados:';
    return { text: `${intro}\n${lines.join('\n')}`, links: [CHURCH_LINKS.visit] };
  }

  if (isSermonQuestion(query)) {
    if (knowledge.sermons === null) return { text: 'No pude consultar las prédicas en este momento. Puedes abrir la biblioteca y volver a intentarlo.', links: [CHURCH_LINKS.sermons, CHURCH_LINKS.contact] };
    const sermons = knowledge.sermons ?? [];
    if (!sermons.length) return { text: 'No encuentro prédicas publicadas ahora mismo. Puedes revisar la biblioteca más adelante o contactarnos.', links: [CHURCH_LINKS.sermons, CHURCH_LINKS.contact] };
    const matches = sermons.filter((sermon) => sermonMatches(query, sermon));
    const selected = (matches.length ? matches : sermons).slice(0, 5);
    const lines = selected.map((sermon) => {
      const date = formatSermonDate(sermon.date);
      return `${sermon.title}${sermon.pastor_name ? ` — ${sermon.pastor_name}` : ''}${date ? ` · ${date}` : ''}.`;
    });
    const intro = matches.length
      ? 'Encontré estas prédicas relacionadas:'
      : sermonTopicTerms(query).length
        ? 'No encuentro ese tema entre las 12 prédicas más recientes; aquí tienes otras opciones:'
        : 'Estas son las prédicas recientes publicadas:';
    return { text: `${intro}\n${lines.join('\n')}`, links: [...selected.map(sermonLink), CHURCH_LINKS.sermons] };
  }

  if (isPodcastQuestion(query)) {
    if (knowledge.podcasts === null) return { text: 'No pude consultar los episodios ahora. Puedes abrir el catálogo y volver a intentarlo.', links: [CHURCH_LINKS.podcast, CHURCH_LINKS.contact] };
    const episodes = knowledge.podcasts ?? [];
    if (!episodes.length) return { text: 'No encuentro episodios publicados ahora mismo. Puedes revisar el podcast más adelante o contactarnos.', links: [CHURCH_LINKS.podcast, CHURCH_LINKS.contact] };
    const matches = episodes.filter((episode) => podcastMatches(query, episode));
    const selected = (matches.length ? matches : episodes).slice(0, 5);
    const lines = selected.map((episode) => {
      const date = podcastDate(episode.published_at);
      return `${episode.title}${episode.episode_number ? ` · Episodio ${episode.episode_number}` : ''}${date ? ` · ${date}` : ''}.`;
    });
    const intro = matches.length
      ? 'Encontré estos episodios relacionados:'
      : podcastTopicTerms(query).length
        ? 'No encuentro ese tema entre los episodios recientes; aquí tienes otras opciones:'
        : 'Estos son los episodios publicados más recientes:';
    return { text: `${intro}\n${lines.join('\n')}`, links: [...selected.map(podcastLink), CHURCH_LINKS.podcast] };
  }

  if (/\b(ubicacion|direccion|llegar|mapa|navegar|como llego|donde queda|donde esta (?:la )?iglesia|donde es la iglesia|donde nos reunimos|donde estan ubicados|donde se encuentra la iglesia|donde (?:esta|queda|se encuentra|se ubica) (?:(?:ubicad[oa]|situad[oa]|localizad[oa]) )?(?:(?:la|el) )?(?:iglesia|templo|congregacion)|donde estan? (?:(?:ubicad[oa]s?|situad[oa]s?|localizad[oa]s?) )?(?:(?:la|el) )?(?:iglesia|templo|congregacion))\b/.test(query)) {
    return {
      text: 'Estamos en Baquerizo Moreno, entre Av. Colón y Tulcán, en Milagro, Guayas. Elige tu aplicación de mapas para ver la ruta.',
      links: [
        { label: 'Google Maps', href: 'https://www.google.com/maps/search/?api=1&query=Iglesia+Cuadrangular+Jerusalen+Milagro+Ecuador' },
        { label: 'Waze', href: 'https://waze.com/ul?ll=-2.139188,-79.5949891&navigate=yes' },
        { label: 'Apple Maps', href: 'https://maps.apple.com/?daddr=-2.139188,-79.5949891' },
      ],
    };
  }

  const visitingWithChildren = /\b(ninos|ninas)\b/.test(query) && /\b(vengo|voy|vamos|iremos|ir|venir|visitar|visita|conocer|acompanar)\b/.test(query);
  if (/\b(primera vez|visitar|visita|llevar|vestir|ropa|registrarme|registrar|accesibilidad|accesible|discapacidad|parqueo|estacionamiento)\b/.test(query) || visitingWithChildren) {
    if (/\b(que debo llevar|que llevar a la iglesia|que necesito llevar)\b/.test(query)) return { text: 'Solo ven como eres. Si vienes con niños, nuestro equipo te orientará al llegar.', links: [CHURCH_LINKS.visit] };
    if (/\b(vestir|ropa)\b/.test(query)) return { text: 'No tenemos un código de vestimenta. Puedes venir como eres; nuestro equipo te orientará al llegar.', links: [CHURCH_LINKS.visit] };
    if (/\b(registrarme|registrar|registro)\b/.test(query)) return { text: 'Avisarnos que vienes es opcional. Si quieres, en la página de visita puedes indicar la fecha y si necesitas apoyo para prepararnos para recibirte.', links: [CHURCH_LINKS.visit] };
    if (/\b(accesibilidad|accesible|discapacidad|parqueo|estacionamiento)\b/.test(query)) return { text: 'En el formulario de visita puedes contarnos si necesitas accesibilidad o parqueo. Para confirmar una necesidad específica antes de ir, comunícate con secretaría.', links: [CHURCH_LINKS.visit, CHURCH_LINKS.contact] };
    if (/\b(ninos|ninas)\b/.test(query)) return { text: '¡Qué bueno que nos visites! En el formulario puedes indicar que vienes con niños para que el equipo se prepare. También puedes venir sin registrarte.', links: [CHURCH_LINKS.visit] };
    return { text: '¡Nos encantará recibirte! Puedes revisar los horarios, indicarnos si necesitas apoyo y encontrar cómo llegar. Avisarnos antes es opcional.', links: [CHURCH_LINKS.visit, { label: 'Cómo llegar', href: 'https://www.google.com/maps/search/?api=1&query=Iglesia+Cuadrangular+Jerusalen+Milagro+Ecuador' }] };
  }

  if (!isSongQuestion(query) && /\b(oracion|orar|oren|oremos|ora por mi|peticion|peticiones|consejeria|ayuda espiritual|necesito que oren|quiero que oren)\b/.test(query)) {
    return { text: 'Puedes enviar una petición desde la página de Peticiones. Para usar ese formulario necesitas iniciar sesión; allí eliges si compartirla en el muro público o mantenerla privada. No escribas aquí información personal o confidencial.', links: [CHURCH_LINKS.prayer, CHURCH_LINKS.contact] };
  }

  if (/\b(miembro|membresia|pertenecer|afiliarme)\b/.test(query)) {
    return { text: 'No encuentro un proceso de membresía publicado para explicártelo con certeza. Puedes consultar directamente con secretaría; mientras tanto, puedes conocer los ministerios y planificar una visita.', links: [CHURCH_LINKS.contact, CHURCH_LINKS.ministries, CHURCH_LINKS.visit] };
  }
  if (/\b(comunidad|muro|publicar en la comunidad|publicar un testimonio|publicar una peticion|publicar una noticia|participar|integrarme|unirme)\b/.test(query) && !isMinistryQuestion(query)) {
    if (/\b(publicar|compartir)\b/.test(query)) {
      return { text: 'Puedes explorar el Muro de la Comunidad. Para publicar un testimonio, petición o noticia, el sitio solicita iniciar sesión. No publiques información privada o sensible.', links: [CHURCH_LINKS.community, { label: 'Iniciar sesión', href: '/login' }] };
    }
    return { text: 'Puedes conocer las oportunidades de servicio en los ministerios y explorar el Muro de la Comunidad. Si buscas integrarte o recibir orientación, secretaría puede ayudarte.', links: [CHURCH_LINKS.ministries, CHURCH_LINKS.community, CHURCH_LINKS.contact] };
  }

  if (/\b(dios|jesus|cristo|espiritu santo|salvador|sanador|rey que viene|aleluya|gloria a dios)\b/.test(query)) {
    return {
      text: 'Si quieres conocer lo que enseña la Iglesia Jerusalén sobre Dios y Jesucristo, puedes consultar nuestra declaración de fe. También puedes buscar un pasaje bíblico o pedir acompañamiento y oración.',
      links: [CHURCH_LINKS.doctrine, { label: 'Buscar en la Biblia', href: '/recursos/biblia' }, CHURCH_LINKS.prayer],
    };
  }

  if (/\b(contacto|telefono|celular|llamar|correo|email|secretaria|whatsapp)\b/.test(query)) {
    return {
      text: 'Puedes comunicarte con secretaría por teléfono o correo, o escribirnos mediante el formulario de contacto.',
      links: [
        { label: 'Llamar a secretaría', href: 'tel:+593985263122' },
        { label: 'Enviar correo', href: 'mailto:iece_jerusalen@hotmail.com' },
        CHURCH_LINKS.contact,
      ],
    };
  }

  if (isSongQuestion(query)) {
    if (knowledge.songs === null) return { text: 'No pude consultar el cancionero en este momento. Puedes abrir la biblioteca e intentarlo de nuevo.', links: [CHURCH_LINKS.songs, CHURCH_LINKS.contact] };
    const previousSongList = [...conversation].reverse().find((item) => item.role === 'assistant' && normalizeAssistantText(item.text).includes('cancionero publicado'));
    const asksForAnotherSong = Boolean(previousSongList && /\b(otra|otro|mas|parecida|parecido|similar)\b/.test(query));
    const availableSongs = (knowledge.songs ?? []).filter((song) => !asksForAnotherSong || !previousSongList?.text.includes('\n' + song.title + (song.artist ? ' — ' + song.artist : '') + '.'));
    const songs = availableSongs.slice(0, 5);
    if (!songs.length) {
      const text = asksForAnotherSong
        ? 'No encuentro más canciones publicadas que coincidan con ese tema en este momento. Puedes revisar el cancionero completo.'
        : 'No encontré canciones publicadas para esa consulta. Puedes revisar la biblioteca o escribirnos para pedir orientación.';
      return { text, links: [CHURCH_LINKS.songs, CHURCH_LINKS.contact] };
    }
    const lines = songs.map((song) => `${song.title}${song.artist ? ` — ${song.artist}` : ''}.`);
    return {
      text: (asksForAnotherSong ? 'Encontré otras canciones en el cancionero publicado.' : 'Encontré estas canciones en el cancionero publicado.') + ' Abre una ficha para consultar la letra y los recursos disponibles:\n' + lines.join('\n'),
      links: [...songs.flatMap((song) => song.slug ? [{ label: `Ver canción: ${song.title}`, href: `/recursos/alabanzas/${encodeURIComponent(song.slug)}` }] : []), CHURCH_LINKS.songs],
    };
  }

  if (/\b(aula virtual|mis cursos|curso|cursos|programa|programas|devocional|devocionales|formacion)\b/.test(query)) {
    const classroom = /\b(aula virtual|mis cursos|ingresar a clases|entrar a clases)\b/.test(query);
    if (/\b(estudio biblico|estudios biblicos)\b/.test(query)) {
      return { text: 'El estudio bíblico reúne lecturas, mapas, personajes y recorridos para explorar los pasajes. Puedes abrirlo directamente o ver otros programas de formación.', links: [{ label: 'Abrir estudio bíblico', href: '/programas/estudio-biblico' }, CHURCH_LINKS.programs] };
    }
    if (classroom) {
      return PUBLIC_LAUNCH_VISIBILITY.classroom
        ? { text: 'Abre el Aula Virtual para ingresar a tu espacio de formación. Si aún no has iniciado sesión, el sitio te pedirá entrar con tu cuenta.', links: [CHURCH_LINKS.classroom, { label: 'Ingresar', href: '/login' }] }
        : { text: 'Puedes consultar los programas de formación publicados y sus recursos abiertos desde la página de Programas.', links: [CHURCH_LINKS.programs] };
    }
    if (knowledge.programs === null) return { text: 'No pude consultar los programas publicados ahora. Puedes abrir el catálogo e intentarlo de nuevo.', links: [CHURCH_LINKS.programs, CHURCH_LINKS.contact] };
    const programs = knowledge.programs ?? [];
    if (!programs.length) return { text: 'No encuentro programas publicados disponibles en este momento. Puedes revisar el catálogo más adelante o consultarlo con la iglesia.', links: [CHURCH_LINKS.programs, CHURCH_LINKS.contact] };
    const matches = programs.filter((program) => programMatches(query, program));
    const selected = (matches.length ? matches : programs).slice(0, 5);
    const lines = selected.map((program) => `${program.title}${program.audience ? ` — Para: ${program.audience}` : ''}${program.category ? ` · ${program.category}` : ''}${programModalityLabel(program.modality) ? ` · ${programModalityLabel(program.modality)}` : ''}${program.summary ? `: ${plainTextSummary(program.summary, 180)}` : ''}`);
    const topicTerms = programTopicTerms(query);
    const intro = matches.length
      ? 'Encontré estos programas relacionados:'
      : topicTerms.length
        ? 'No veo programas publicados para ese tema; aquí tienes otras opciones:'
        : 'Estos son los programas publicados:';
    return { text: `${intro}\n${lines.join('\n')}`, links: [...selected.map(programLink), CHURCH_LINKS.programs] };
  }

  if (isMinistryQuestion(query)) {
    if (knowledge.ministries === null) return { text: 'No pude consultar la lista de ministerios ahora. Puedes volver a intentarlo desde la página de ministerios o contactar a la iglesia.', links: [CHURCH_LINKS.ministries, CHURCH_LINKS.contact] };
    const ministries = knowledge.ministries ?? [];
    const matches = ministries.filter((ministry) => ministryMatches(query, ministry));
    const selected = (matches.length ? matches : ministries).slice(0, 5);
    if (!selected.length) return { text: 'Aún no hay ministerios publicados para mostrar. Escribe a la iglesia y te orientaremos sobre las oportunidades disponibles.', links: [CHURCH_LINKS.contact] };
    const lines = selected.map((ministry) => {
      const description = plainTextSummary(ministry.description);
      return `${ministry.name}${ministry.schedule ? ` — ${ministry.schedule}` : ''}${description ? `: ${description}` : ''}`;
    });
    const intro = matches.length ? 'Encontré estas opciones relacionadas:' : 'Estos son algunos ministerios publicados:';
    return { text: `${intro}\n${lines.join('\n')}`, links: [...selected.map((ministry) => ({ label: ministry.name, href: `/ministerios/${ministry.slug}` })), CHURCH_LINKS.contact] };
  }

  if (isSermonQuestion(query)) return { text: 'En la página de prédicas puedes explorar mensajes publicados por la iglesia.', links: [CHURCH_LINKS.sermons] };
  if (/\b(biblia|biblico|biblica|leer la biblia|estudio biblico)\b/.test(query)) return { text: 'Puedes leer pasajes en el lector bíblico o explorar el estudio por libros y capítulos.', links: [{ label: 'Leer la Biblia', href: '/recursos/biblia' }, { label: 'Explorar el estudio bíblico', href: '/programas/estudio-biblico' }] };
  if (/\b(doctrina|creencias|fe cuadrangular|principios de fe)\b/.test(query)) return { text: 'La página doctrinal presenta las creencias institucionales de la Iglesia Cuadrangular.', links: [{ label: 'Conocer la doctrina', href: '/nosotros/doctrina' }, CHURCH_LINKS.contact] };
  if (/\b(quienes somos|que iglesia|denominacion|cuadrangular)\b/.test(query)) return { text: 'Somos la Iglesia Evangélica Cuadrangular Jerusalén y nos reunimos en Milagro, Ecuador. Conoce más sobre nuestra comunidad en la página institucional.', links: [{ label: 'Conocer la iglesia', href: '/nosotros' }, { label: 'Planificar una visita', href: '/visita' }] };
  if (/\b(donar|donacion|donaciones|ofrenda|ofrendas|diezmar|diezmo|diezmos|aportar|aporte|apoyar economicamente|apoyo economico|transferencia)\b/.test(query)) return { text: 'Puedes revisar los canales publicados de diezmos, ofrendas y donaciones. Si el registro de aportes está habilitado, requiere iniciar sesión; el registro no transfiere dinero ni confirma el pago.', links: [{ label: 'Ver diezmos y donaciones', href: '/donaciones' }, { label: 'Iniciar sesión', href: '/login?redirectTo=%2Fdonaciones' }] };
  if (/\b(cuenta|iniciar sesion|iniciar sesion|registrar cuenta|login)\b/.test(query)) return { text: 'Para ingresar o crear una cuenta, abre el acceso de la plataforma. Si tienes problemas, contacta a secretaría.', links: [{ label: 'Ingresar', href: '/login' }, CHURCH_LINKS.contact] };
  if (/\b(ayuda|ayudar|que puedes hacer|que sabes|temas|opciones)\b/.test(query)) {
    return { text: 'Puedo ayudarte a encontrar horarios, eventos, ministerios, ubicación y datos para tu visita. También te llevo a oración, prédicas, podcast, alabanzas, Biblia, programas de formación y contacto.', links: [CHURCH_LINKS.visit, CHURCH_LINKS.events, CHURCH_LINKS.ministries, CHURCH_LINKS.podcast, CHURCH_LINKS.songs, CHURCH_LINKS.programs, CHURCH_LINKS.contact] };
  }

  return null;
}

export function offlineAssistantAnswer(message: string): { text: string; links: AssistantLink[]; suggestions: AssistantSuggestion[] } {
  const query = normalizeAssistantText(message);
  const suggestions: AssistantLink[] = [];
  let suggestedQuestions: AssistantSuggestion[];
  if (/alabanza|himno|cancion|letra|himnario|coro|musica|musical|adoracion/.test(query)) {
    suggestedQuestions = [
      { label: 'Canciones publicadas', message: '¿Qué canciones están publicadas?' },
      { label: 'Himno Cuadrangular', message: '¿Qué expresa el Himno Cuadrangular?' },
    ];
  } else if (/evento|actividad|agenda/.test(query)) {
    suggestedQuestions = [
      { label: 'Actividades de esta semana', message: '¿Qué actividades hay esta semana?' },
      { label: 'Horarios de cultos', message: '¿Cuáles son los horarios de los cultos?' },
    ];
  } else if (/podcast|episodio/.test(query)) {
    suggestedQuestions = [
      { label: 'Episodios recientes', message: '¿Cuáles son los episodios recientes del podcast?' },
      { label: 'Prédicas recientes', message: '¿Cuáles son las prédicas recientes?' },
    ];
  } else if (/predica|sermon|mensaje/.test(query)) {
    suggestedQuestions = [
      { label: 'Prédicas recientes', message: '¿Cuáles son las prédicas recientes?' },
      { label: 'Episodios del podcast', message: '¿Cuáles son los episodios recientes del podcast?' },
    ];
  } else if (/curso|programa|aula virtual|formacion/.test(query)) {
    suggestedQuestions = [
      { label: 'Programas publicados', message: '¿Qué programas están publicados?' },
      { label: 'Estudio bíblico', message: '¿Qué incluye el estudio bíblico?' },
    ];
  } else if (/ministerio|servir|joven|infantil/.test(query)) {
    suggestedQuestions = [
      { label: 'Ministerios', message: '¿Qué ministerios tiene la iglesia?' },
      { label: 'Horarios de cultos', message: '¿Cuáles son los horarios de los cultos?' },
    ];
  } else if (/visita|llegar|ubicacion|direccion|mapa|donde|templo|familia|nino|parqueo|accesibilidad/.test(query)) {
    suggestedQuestions = [
      { label: 'Planificar mi visita', message: 'Voy a visitar la iglesia por primera vez.' },
      { label: 'Cómo llegar', message: '¿Dónde está ubicada la iglesia?' },
    ];
  } else if (/pastor|vision|mision|simbol|doctrina|cuadrangular|quienes somos/.test(query)) {
    suggestedQuestions = [
      { label: 'Visión y misión', message: '¿Cuál es la visión y misión de Iglesia Jerusalén?' },
      { label: 'Símbolos Cuadrangulares', message: '¿Cuáles son los símbolos de la Iglesia Cuadrangular?' },
      { label: 'Nuestros pastores', message: '¿Quiénes son los pastores de la Iglesia Jerusalén?' },
    ];
  } else {
    suggestedQuestions = [
      { label: 'Horarios de cultos', message: '¿Cuáles son los horarios de los cultos?' },
      { label: 'Próximas actividades', message: '¿Qué actividades hay esta semana?' },
      { label: 'Planificar mi visita', message: 'Voy a visitar la iglesia por primera vez.' },
    ];
  }
  if (/biblia|biblic|doctrina|fe|creencia|oracion/.test(query)) suggestions.push({ label: 'Biblia y estudio', href: '/recursos/biblia' }, { label: 'Doctrina', href: '/nosotros/doctrina' });
  if (/podcast|episodio/.test(query)) suggestions.push(CHURCH_LINKS.podcast);
  if (/alabanza|himno|cancion|letra|himnario|coros|musica|musical|adoracion/.test(query)) suggestions.push(CHURCH_LINKS.songs);
  if (/curso|cursos|programa|aula virtual|formacion/.test(query)) {
    suggestions.push(CHURCH_LINKS.programs);
    if (PUBLIC_LAUNCH_VISIBILITY.classroom) suggestions.push(CHURCH_LINKS.classroom);
  }
  if (/visita|llegar|ubicacion|familia|nino|parqueo|accesibilidad/.test(query)) suggestions.push(CHURCH_LINKS.visit);
  if (/evento|actividad|agenda/.test(query)) suggestions.push(CHURCH_LINKS.events);
  if (/ministerio|servir|joven|infantil/.test(query)) suggestions.push(CHURCH_LINKS.ministries);
  suggestions.push(CHURCH_LINKS.contact);
  const uniqueLinks = [...new Map(suggestions.map((link) => [link.href, link])).values()];
  return {
    text: 'Todavía no puedo responder esa pregunta abierta con suficiente certeza. Puedo ayudarte con la información publicada o conectarte con el equipo de la iglesia.',
    links: uniqueLinks.slice(0, 4),
    suggestions: suggestedQuestions,
  };
}
