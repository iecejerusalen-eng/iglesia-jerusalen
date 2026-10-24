import type { Schedule } from '../../types';

export type AssistantLink = { label: string; href: string };
export type PublicEventSummary = {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  location_name: string | null;
  emoji: string | null;
};
export type PublicMinistrySummary = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  schedule: string | null;
};
export type PublicSpaceSummary = {
  id: string;
  name: string;
  description: string | null;
  capacity: number | null;
  features: string[] | null;
};
export type PublicProgramSummary = {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  category: string | null;
  audience: string | null;
  duration_label: string | null;
  access_type: string | null;
  source: 'study_programs' | 'open_resources' | 'studies';
};
export type PublicPodcastEpisodeSummary = {
  id: string;
  title: string;
  description: string | null;
  show_notes: string | null;
  audio_duration_seconds: number | null;
  episode_number: number | null;
  published_at: string | null;
};
export type ChurchAssistantKnowledge = {
  schedules?: Schedule[] | null;
  events?: PublicEventSummary[] | null;
  ministries?: PublicMinistrySummary[] | null;
  spaces?: PublicSpaceSummary[] | null;
  programs?: PublicProgramSummary[] | null;
  podcastEpisodes?: PublicPodcastEpisodeSummary[] | null;
};
export type KnowledgeNeed = 'schedules' | 'events' | 'ministries' | 'spaces' | 'programs' | 'podcastEpisodes';

export const CHURCH_LINKS = {
  contact: { label: 'Contactar a la iglesia', href: '/contacto' },
  visit: { label: 'Planificar mi visita', href: '/visita' },
  events: { label: 'Ver agenda', href: '/eventos' },
  ministries: { label: 'Ver ministerios', href: '/ministerios' },
  prayer: { label: 'Peticiones de oración', href: '/peticiones' },
  podcast: { label: 'Escuchar el podcast', href: '/podcast' },
  songs: { label: 'Abrir alabanzas e himnos', href: '/recursos/alabanzas' },
  programs: { label: 'Explorar programas', href: '/programas' },
  classroom: { label: 'Ir al Aula Virtual', href: '/aula-virtual' },
  bookings: { label: 'Ver espacios y reservas', href: '/reservas' },
  store: { label: 'Explorar la tienda', href: '/tienda' },
  community: { label: 'Abrir la comunidad', href: '/comunidad' },
  doctrine: { label: 'Conocer nuestra fe', href: '/nosotros/doctrina' },
} satisfies Record<string, AssistantLink>;

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

function isSpaceQuestion(query: string) {
  return /\b(reserv|espacio|espacios|sala|salas|salon|salones|auditorio|auditorios|alquilar|rentar)\b/.test(query)
    && !/\b(parqueo|estacionamiento|accesibilidad|discapacidad)\b/.test(query);
}

function isSpaceListQuestion(query: string) {
  return isSpaceQuestion(query)
    && /\b(que|cuales|ver|lista|muestr|disponibles|hay)\b/.test(query)
    && /\b(espacio|espacios|sala|salas|salon|salones|auditorio|auditorios)\b/.test(query);
}

function isProgramListQuestion(query: string) {
  return /\b(programa|programas|curso|cursos|devocional|devocionales|formacion)\b/.test(query)
    && /\b(que|cuales|ver|lista|muestr|ofrecen|disponibles|hay|gratuitos|gratuito|gratis)\b/.test(query);
}

function isPodcastListQuestion(query: string) {
  return /\b(episodio|episodios|ultimo|ultimos|ultima|ultimas|reciente|recientes|nuevo|nuevos|nueva|nuevas)\b/.test(query);
}

const QUESTION_STOP_WORDS = new Set([
  'quiero', 'buscar', 'busco', 'informacion', 'programa', 'programas', 'curso', 'cursos',
  'devocional', 'devocionales', 'formacion', 'episodio', 'episodios', 'podcast', 'ultimo',
  'ultimos', 'ultima', 'ultimas', 'reciente', 'recientes', 'nuevo', 'nuevos', 'nueva', 'nuevas',
  'cuales', 'cuantos', 'cuantas', 'ofrece', 'ofrecen', 'disponibles', 'disponible', 'gratuito',
  'gratuitos', 'gratis', 'hay', 'que', 'para', 'sobre', 'como', 'donde', 'puedo', 'iglesia',
]);

function assistantTopicTerms(query: string) {
  return query.split(/\s+/).filter((term) => term.length >= 4 && !QUESTION_STOP_WORDS.has(term));
}

function isMinistryQuestion(query: string) {
  return /\b(ministerio|ministros|servir|voluntariado|voluntario|jovenes|juvenil|adolescentes|ninos|ninas|infantil|alabanza|musica|musicos|parejas|damas|caballeros|escuela dominical)\b/.test(query);
}

export function getKnowledgeNeeds(message: string): KnowledgeNeed[] {
  const query = normalizeAssistantText(message);
  const needs = new Set<KnowledgeNeed>();

  if (isScheduleQuestion(query)) needs.add('schedules');
  if (isEventQuestion(query)) needs.add('events');
  if (isMinistryQuestion(query)) needs.add('ministries');
  if (isSpaceListQuestion(query)) needs.add('spaces');
  if (isProgramListQuestion(query)) needs.add('programs');
  if (isPodcastListQuestion(query)) needs.add('podcastEpisodes');

  return [...needs];
}

type AssistantConversationMessage = { role: 'user' | 'assistant'; text: string };

export function contextualizeFollowUp(message: string, conversation: AssistantConversationMessage[]) {
  const shortQuery = normalizeAssistantText(message)
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const isDateFollowUp = /^(?:(?:y|para|tambien)\s+)*(?:(?:el|la|este|esta)\s+)?(?:(?:proximo|proxima)\s+)?(?:hoy|manana|domingo|lunes|martes|miercoles|jueves|viernes|sabado|fin de semana|semana)$/.test(shortQuery);
  if (!isDateFollowUp) return message;

  const lastUserMessage = [...conversation].reverse().find((item) => item.role === 'user');
  const lastAssistantMessage = [...conversation].reverse().find((item) => item.role === 'assistant');
  if (!lastUserMessage || !lastAssistantMessage) return message;

  const previousQuestion = normalizeAssistantText(lastUserMessage.text);
  const previousAnswer = normalizeAssistantText(lastAssistantMessage.text);
  const askedAboutEvents = /\b(evento|eventos|agenda|actividad|actividades)\b/.test(previousQuestion);
  const askedAboutSchedules = /\b(horario|horarios|culto|cultos|reunion|reuniones|servicio|servicios|escuela dominical)\b/.test(previousQuestion);
  const answeredWithEvents = /\b(eventos publicos|eventos publicados|agenda|no encuentro eventos|no veo un evento)\b/.test(previousAnswer);
  const answeredWithSchedules = /\b(horarios publicados|horario publicado|horarios ahora|horarios para ese dia)\b/.test(previousAnswer);

  if (answeredWithEvents || (askedAboutEvents && !askedAboutSchedules)) return `eventos ${message}`;
  if (answeredWithSchedules || askedAboutSchedules) return `horarios de culto ${message}`;
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

function formatEventDateRange(start: string, end: string) {
  const startLabel = formatEventDate(start);
  return start === end ? startLabel : `${startLabel} al ${formatEventDate(end)}`;
}

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : null;
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

export function answerFromPublicInfo(message: string, knowledge: ChurchAssistantKnowledge) {
  const query = normalizeAssistantText(message);

  // Event language takes precedence when a question also names a day of the week.
  if (isEventQuestion(query)) {
    if (knowledge.events === null) return { text: 'No pude consultar la agenda en este momento. Puedes abrir la página de eventos y volver a intentarlo.', links: [CHURCH_LINKS.events] };
    const allEvents = knowledge.events ?? [];
    if (!allEvents.length) return { text: 'No hay próximos eventos publicados en la agenda ahora mismo. Revisa la página más adelante por si se actualiza.', links: [CHURCH_LINKS.events] };

    const range = eventDateRange(query, new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Guayaquil' }).format(new Date()));
    const periodEvents = allEvents.filter((event) => eventDateMatches(event, range));
    if (range && !periodEvents.length) {
      return { text: 'No encuentro eventos públicos publicados para ese período. Puedes revisar la agenda por si hay una actualización.', links: [CHURCH_LINKS.events] };
    }

    const topicTerms = /joven|adolesc/.test(query) ? ['joven', 'adolesc']
      : /nino|nina|infantil/.test(query) ? ['nino', 'nina', 'infantil']
        : /dama|mujer/.test(query) ? ['dama', 'mujer']
          : /caballero|hombre/.test(query) ? ['caballero', 'hombre']
            : /pareja|matrimonio|familia/.test(query) ? ['pareja', 'matrimonio', 'familia'] : [];
    const relatedEvents = topicTerms.length
      ? periodEvents.filter((event) => topicTerms.some((term) => normalizeAssistantText(`${event.title} ${event.description ?? ''} ${event.location_name ?? ''}`).includes(term)))
      : periodEvents;
    const selectedEvents = relatedEvents.length ? relatedEvents : periodEvents;
    const lines = selectedEvents.slice(0, 5).map((event) => {
      const time = formatTime(event.start_time);
      const endTime = formatTime(event.end_time);
      const rangeText = time ? ` · ${time}${endTime ? `–${endTime}` : ''}` : '';
      const description = plainTextSummary(event.description, 135);
      const location = plainTextSummary(event.location_name, 80);
      const details = [description, location ? `Lugar: ${location}` : null].filter(Boolean).join(' · ');
      return `${event.emoji ? `${event.emoji} ` : ''}${event.title} — ${formatEventDateRange(event.start_date, event.end_date)}${rangeText}${details ? ` · ${details}` : ''}.`;
    });
    const intro = relatedEvents.length || !topicTerms.length ? 'Estos son los eventos públicos publicados para ese período:' : 'No veo un evento publicado con ese tema para ese período; estos son los próximos eventos de la agenda:';
    const eventLinks = selectedEvents.slice(0, 3).map((event) => ({
      label: `Ver ${plainTextSummary(event.title, 32)}`,
      href: `/eventos?event=${encodeURIComponent(event.id)}`,
    }));
    const links = topicTerms.length ? [CHURCH_LINKS.events, CHURCH_LINKS.ministries] : [CHURCH_LINKS.events];
    return { text: `${intro}\n${lines.join('\n')}`, links: [...eventLinks, ...links] };
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

  if (/\b(ubicacion|direccion|llegar|mapa|navegar|como llego|donde queda|donde esta (?:la )?iglesia|donde es la iglesia|donde nos reunimos|donde estan ubicados|donde se encuentra la iglesia)\b/.test(query)) {
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
    if (/\b(vestir|ropa)\b/.test(query)) return { text: 'No tenemos un código de vestimenta. Puedes venir como eres; nuestro equipo te orientará al llegar.', links: [CHURCH_LINKS.visit] };
    if (/\b(registrarme|registrar|registro)\b/.test(query)) return { text: 'Avisarnos que vienes es opcional. Si quieres, en la página de visita puedes indicar la fecha y si necesitas apoyo para prepararnos para recibirte.', links: [CHURCH_LINKS.visit] };
    if (/\b(accesibilidad|accesible|discapacidad|parqueo|estacionamiento)\b/.test(query)) return { text: 'En el formulario de visita puedes contarnos si necesitas accesibilidad o parqueo. Para confirmar una necesidad específica antes de ir, comunícate con secretaría.', links: [CHURCH_LINKS.visit, CHURCH_LINKS.contact] };
    if (/\b(ninos|ninas)\b/.test(query)) return { text: '¡Qué bueno que nos visites! En el formulario puedes indicar que vienes con niños para que el equipo se prepare. También puedes venir sin registrarte.', links: [CHURCH_LINKS.visit] };
    return { text: '¡Nos encantará recibirte! Puedes revisar los horarios, indicarnos si necesitas apoyo y encontrar cómo llegar. Avisarnos antes es opcional.', links: [CHURCH_LINKS.visit, { label: 'Cómo llegar', href: 'https://www.google.com/maps/search/?api=1&query=Iglesia+Cuadrangular+Jerusalen+Milagro+Ecuador' }] };
  }

  if (/\b(oracion|orar|peticion|peticiones|consejeria|ayuda espiritual)\b/.test(query)) {
    return { text: 'Puedes enviar una petición desde la página de Peticiones. Para usar ese formulario necesitas iniciar sesión; allí eliges si compartirla en el muro público o mantenerla privada. No escribas aquí información personal o confidencial.', links: [CHURCH_LINKS.prayer, CHURCH_LINKS.contact] };
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

  if (/\b(podcast|episodio|episodios)\b/.test(query)) {
    if (isPodcastListQuestion(query)) {
      if (knowledge.podcastEpisodes === null) {
        return { text: 'No pude consultar los episodios publicados ahora. Puedes abrir el podcast y revisar el catálogo directamente.', links: [CHURCH_LINKS.podcast] };
      }
      const episodes = knowledge.podcastEpisodes ?? [];
      if (!episodes.length) return { text: 'No encuentro episodios publicados en este momento. Puedes revisar el podcast más adelante.', links: [CHURCH_LINKS.podcast] };
      const topicTerms = assistantTopicTerms(query);
      const matches = topicTerms.length
        ? episodes.filter((episode) => topicTerms.some((term) => normalizeAssistantText(`${episode.title} ${episode.description ?? ''} ${episode.show_notes ?? ''}`).includes(term)))
        : [];
      const selected = (matches.length ? matches : episodes).slice(0, /\b(ultimo|ultimos|ultima|ultimas)\b/.test(query) ? 1 : 5);
      const lines = selected.map((episode) => {
        const duration = episode.audio_duration_seconds ? ` · ${Math.round(episode.audio_duration_seconds / 60)} min` : '';
        const date = episode.published_at
          ? ` · ${new Intl.DateTimeFormat('es-EC', { day: 'numeric', month: 'short', timeZone: 'America/Guayaquil' }).format(new Date(episode.published_at))}`
          : '';
        const summary = plainTextSummary(episode.description || episode.show_notes, 150);
        return `${episode.title}${episode.episode_number ? ` · Episodio ${episode.episode_number}` : ''}${date}${duration}${summary ? ` — ${summary}` : ''}`;
      });
      const intro = matches.length ? 'Estos episodios publicados coinciden con tu tema:' : 'Estos son los episodios publicados más recientes:';
      return { text: `${intro}\n${lines.join('\n')}`, links: [CHURCH_LINKS.podcast] };
    }
    return { text: 'En el podcast de la iglesia puedes explorar y escuchar los episodios que estén publicados. Si buscas mensajes de predicación, también puedes abrir la página de prédicas.', links: [CHURCH_LINKS.podcast, { label: 'Ver prédicas', href: '/predicas' }] };
  }

  if (/\b(alabanza|alabanzas|himno|himnos|himnario|cancion|canciones|letra|repertorio|coros|musica)\b/.test(query)
    && !/\b(ministerio|ministros|servir|voluntariado|voluntario)\b/.test(query)) {
    return { text: 'La biblioteca de alabanzas e himnos permite buscar canciones y abrir sus letras cuando están disponibles.', links: [CHURCH_LINKS.songs, { label: 'Ver transmisión en vivo', href: '/en-vivo' }] };
  }

  if (/\b(aula virtual|mis cursos|curso|cursos|programa|programas|devocional|devocionales|formacion)\b/.test(query)) {
    const classroom = /\b(aula virtual|mis cursos|ingresar a clases|entrar a clases)\b/.test(query);
    if (/\b(estudio biblico|estudios biblicos)\b/.test(query)) {
      return { text: 'El estudio bíblico reúne lecturas, mapas, personajes y recorridos para explorar los pasajes. Puedes abrirlo directamente o ver otros programas de formación.', links: [{ label: 'Abrir estudio bíblico', href: '/programas/estudio-biblico' }, CHURCH_LINKS.programs] };
    }
    if (isProgramListQuestion(query)) {
      if (knowledge.programs === null) {
        return { text: 'No pude consultar los programas publicados ahora. Puedes abrir la página de Programas para revisar el catálogo.', links: [CHURCH_LINKS.programs, CHURCH_LINKS.classroom] };
      }
      const programs = knowledge.programs ?? [];
      if (!programs.length) return { text: 'No encuentro programas publicados para mostrar en este momento. Puedes revisar el catálogo más adelante.', links: [CHURCH_LINKS.programs] };
      const topicTerms = assistantTopicTerms(query);
      const matches = topicTerms.length
        ? programs.filter((program) => topicTerms.some((term) => normalizeAssistantText(`${program.title} ${program.summary ?? ''} ${program.category ?? ''} ${program.audience ?? ''}`).includes(term)))
        : [];
      const selected = (matches.length ? matches : programs).slice(0, 4);
      const lines = selected.map((program) => {
        const details = [program.category, program.audience, program.duration_label].filter(Boolean).join(' · ');
        const summary = plainTextSummary(program.summary, 140);
        return `${program.title}${details ? ` (${details})` : ''}${summary ? ` — ${summary}` : ''}`;
      });
      const intro = matches.length ? 'Encontré estos programas publicados relacionados con tu búsqueda:' : topicTerms.length ? 'No encontré uno que coincida con ese tema; estos son algunos programas publicados:' : 'Estos son algunos programas publicados:';
      const links = selected.slice(0, 3).map((program) => ({ label: program.title, href: `/programas/${program.source === 'study_programs' ? program.slug : program.id}` }));
      return { text: `${intro}\n${lines.join('\n')}\nEl acceso puede variar según cada programa; revisa sus requisitos en la ficha.`, links: [...links, CHURCH_LINKS.programs] };
    }
    return classroom
      ? { text: 'Abre el Aula Virtual para ingresar a tu espacio de formación. Si aún no has iniciado sesión, el sitio te pedirá entrar con tu cuenta.', links: [CHURCH_LINKS.classroom, { label: 'Ingresar', href: '/login' }] }
      : { text: 'En Programas puedes explorar grupos en vivo, devocionales, lecturas guiadas y cursos gratuitos disponibles. La oferta publicada puede cambiar.', links: [CHURCH_LINKS.programs, CHURCH_LINKS.classroom] };
  }

  if (isSpaceQuestion(query)) {
    if (isSpaceListQuestion(query)) {
      if (knowledge.spaces === null) {
        return { text: 'No pude consultar los espacios publicados ahora. Puedes volver a revisar la página de reservas o contactar a secretaría.', links: [CHURCH_LINKS.bookings, CHURCH_LINKS.contact] };
      }
      const spaces = (knowledge.spaces ?? []).slice(0, 6);
      if (!spaces.length) {
        return { text: 'No hay espacios activos publicados para solicitar una reserva ahora. Puedes consultar nuevamente más adelante o escribir a secretaría.', links: [CHURCH_LINKS.bookings, CHURCH_LINKS.contact] };
      }
      const lines = spaces.map((space) => {
        const details = [
          space.capacity ? `capacidad publicada: ${space.capacity}` : null,
          space.features?.length ? `características: ${plainTextSummary(space.features.join(', '), 120)}` : null,
          space.description ? plainTextSummary(space.description, 150) : null,
        ].filter(Boolean).join(' · ');
        return `${space.name}${details ? ` — ${details}` : ''}`;
      });
      return {
        text: `Estos son los espacios activos publicados para solicitar una reserva:\n${lines.join('\n')}\nLa lista no confirma disponibilidad para una fecha; cada solicitud queda pendiente de confirmación.`,
        links: [CHURCH_LINKS.bookings, { label: 'Ingresar para solicitar', href: '/login' }],
      };
    }
    return {
      text: 'Puedes revisar los espacios activos y enviar una solicitud desde Reservas. Para solicitarla debes iniciar sesión; la reserva queda pendiente hasta que la iglesia la confirme. Este chat no puede consultar el estado de una reserva personal.',
      links: [CHURCH_LINKS.bookings, { label: 'Ingresar', href: '/login' }, CHURCH_LINKS.contact],
    };
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

  if (/\b(en vivo|transmision|transmiten|streaming|youtube)\b/.test(query)) return { text: 'Puedes abrir la transmisión y comprobar si hay un culto en vivo en este momento.', links: [{ label: 'Ver en vivo', href: '/en-vivo' }] };
  if (/\b(predica|predicas|sermon|sermones|mensaje|mensajes)\b/.test(query)) return { text: 'En la página de prédicas puedes explorar mensajes publicados por la iglesia.', links: [{ label: 'Ver prédicas', href: '/predicas' }] };
  if (/\b(biblia|biblico|biblica|leer la biblia|estudio biblico)\b/.test(query)) return { text: 'Puedes leer pasajes en el lector bíblico o explorar el estudio por libros y capítulos.', links: [{ label: 'Leer la Biblia', href: '/recursos/biblia' }, { label: 'Explorar el estudio bíblico', href: '/programas/estudio-biblico' }] };
  if (/\b(doctrina|creencias|fe cuadrangular|principios de fe|evangelio cuadrangular|cuatro simbolos|que cree la iglesia|que cree iglesia|que creemos como iglesia|en que creemos|salvador|sanador|bautizador|rey que viene)\b/.test(query)) {
    return {
      text: 'La Iglesia Jerusalén anuncia a Jesucristo como Salvador, Bautizador con el Espíritu Santo, Sanador y Rey que viene pronto. La página doctrinal reúne los principios de fe y sus referencias bíblicas.',
      links: [CHURCH_LINKS.doctrine, { label: 'Conocer la iglesia', href: '/nosotros' }],
    };
  }
  if (/\b(quienes somos|que iglesia|denominacion|cuadrangular)\b/.test(query)) return { text: 'Somos la Iglesia Evangélica Cuadrangular Jerusalén y nos reunimos en Milagro, Ecuador. Conoce más sobre nuestra comunidad en la página institucional.', links: [{ label: 'Conocer la iglesia', href: '/nosotros' }, { label: 'Planificar una visita', href: '/visita' }] };
  if (/\b(donacion|donaciones|ofrenda|ofrendas|diezmo|diezmos|aportar|apoyo economico)\b/.test(query)) return { text: 'Puedes consultar los canales de diezmos y ofrendas publicados en la sección de donaciones.', links: [{ label: 'Ver donaciones', href: '/donaciones' }] };
  if (/\b(tienda|catalogo|productos|comprar|compras|pedido|pedidos|carrito)\b/.test(query)) return { text: 'En la tienda puedes consultar el catálogo publicado y revisar el precio, los detalles y la disponibilidad en cada producto. El chat no procesa pedidos ni pagos; usa las opciones que aparecen en la tienda.', links: [CHURCH_LINKS.store, { label: 'Ver carrito', href: '/cart' }, CHURCH_LINKS.contact] };
  if (/\b(comunidad|testimonio|testimonios|publicar|compartir|muro)\b/.test(query)) return { text: 'El muro de la comunidad reúne testimonios, peticiones y noticias. Para publicar debes iniciar sesión; no compartas allí información personal que quieras mantener privada. Para una petición de oración, la página de Peticiones permite elegir si compartirla o mantenerla privada.', links: [CHURCH_LINKS.community, { label: 'Iniciar sesión', href: '/login' }, CHURCH_LINKS.prayer] };
  if (/\b(cuenta|iniciar sesion|iniciar sesion|registrar cuenta|login)\b/.test(query)) return { text: 'Para ingresar o crear una cuenta, abre el acceso de la plataforma. Si tienes problemas, contacta a secretaría.', links: [{ label: 'Ingresar', href: '/login' }, CHURCH_LINKS.contact] };
  if (/\b(ayuda|ayudar|que puedes hacer|que sabes|temas|opciones)\b/.test(query)) {
    return { text: 'Puedo ayudarte con horarios, eventos, ministerios, visitas, reservas, tienda, comunidad y recursos de formación, música y Biblia. También te conecto con oración y contacto.', links: [CHURCH_LINKS.visit, CHURCH_LINKS.events, CHURCH_LINKS.bookings, CHURCH_LINKS.store, CHURCH_LINKS.community, CHURCH_LINKS.programs, CHURCH_LINKS.contact] };
  }

  return null;
}

export function offlineAssistantAnswer(message: string): { text: string; links: AssistantLink[] } {
  const query = normalizeAssistantText(message);
  const suggestions: AssistantLink[] = [];
  if (/biblia|biblic|doctrina|fe|creencia|oracion/.test(query)) suggestions.push({ label: 'Biblia y estudio', href: '/recursos/biblia' }, { label: 'Doctrina', href: '/nosotros/doctrina' });
  if (/podcast|episodio/.test(query)) suggestions.push(CHURCH_LINKS.podcast);
  if (/alabanza|himno|cancion|letra|himnario|coros/.test(query)) suggestions.push(CHURCH_LINKS.songs);
  if (/curso|cursos|programa|aula virtual|formacion/.test(query)) suggestions.push(CHURCH_LINKS.programs, CHURCH_LINKS.classroom);
  if (/reserv|espacio|salon|auditorio/.test(query)) suggestions.push(CHURCH_LINKS.bookings);
  if (/tienda|catalogo|producto|compr|pedido|carrito/.test(query)) suggestions.push(CHURCH_LINKS.store);
  if (/comunidad|testimonio|muro|publicar/.test(query)) suggestions.push(CHURCH_LINKS.community);
  if (/visita|llegar|ubicacion|familia|nino|parqueo|accesibilidad/.test(query)) suggestions.push(CHURCH_LINKS.visit);
  if (/evento|actividad|agenda/.test(query)) suggestions.push(CHURCH_LINKS.events);
  if (/ministerio|servir|joven|musica|infantil/.test(query)) suggestions.push(CHURCH_LINKS.ministries);
  suggestions.push(CHURCH_LINKS.contact);
  const uniqueLinks = [...new Map(suggestions.map((link) => [link.href, link])).values()];
  return {
    text: 'Todavía no puedo responder esa pregunta abierta con suficiente certeza. Puedo ayudarte con la información publicada o conectarte con el equipo de la iglesia.',
    links: uniqueLinks.slice(0, 4),
  };
}
