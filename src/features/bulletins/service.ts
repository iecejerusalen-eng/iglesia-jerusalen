import { addDays, format, getDay, startOfDay } from 'date-fns';
import { supabase } from '../../config/supabase';
import type { Bulletin, BulletinBirthday, BulletinDraft, BulletinEvent } from './types';

const asArray = <T>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const nextSunday = (from = new Date()) => {
  const base = startOfDay(from);
  const daysUntilSunday = (7 - getDay(base)) % 7;
  return format(addDays(base, daysUntilSunday === 0 ? 7 : daysUntilSunday), 'yyyy-MM-dd');
};

export const getDefaultBulletinDate = nextSunday;

const normalizeBulletin = (row: Record<string, unknown>): Bulletin => ({
  id: String(row.id),
  fecha_culto: String(row.fecha_culto),
  titulo_mensaje: typeof row.titulo_mensaje === 'string' ? row.titulo_mensaje : null,
  expositor: typeof row.expositor === 'string' ? row.expositor : null,
  versiculo_texto: typeof row.versiculo_texto === 'string' ? row.versiculo_texto : null,
  versiculo_referencia: typeof row.versiculo_referencia === 'string' ? row.versiculo_referencia : null,
  eventos: asArray<BulletinEvent>(row.eventos),
  anuncio_titulo: typeof row.anuncio_titulo === 'string' ? row.anuncio_titulo : null,
  anuncio_descripcion: typeof row.anuncio_descripcion === 'string' ? row.anuncio_descripcion : null,
  cumpleaneros: asArray<BulletinBirthday>(row.cumpleaneros),
  ofrendas_objetivo: typeof row.ofrendas_objetivo === 'string' ? row.ofrendas_objetivo : null,
  mensaje_pastoral: typeof row.mensaje_pastoral === 'string' ? row.mensaje_pastoral : null,
  foto_pastor: typeof row.foto_pastor === 'string' ? row.foto_pastor : null,
  estado: row.estado === 'aprobado' || row.estado === 'enviado' ? row.estado : 'borrador',
  generado_automaticamente: row.generado_automaticamente !== false,
  aprobado_por: typeof row.aprobado_por === 'string' ? row.aprobado_por : null,
  aprobado_at: typeof row.aprobado_at === 'string' ? row.aprobado_at : null,
  url_pdf: typeof row.url_pdf === 'string' ? row.url_pdf : null,
  url_imagen_wa: typeof row.url_imagen_wa === 'string' ? row.url_imagen_wa : null,
  created_at: String(row.created_at ?? ''),
  updated_at: String(row.updated_at ?? '')
});

const ensureSuccess = <T>(result: { data: T | null; error: { message: string } | null }, context: string): T => {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  if (result.data === null) throw new Error(`${context}: no se recibió información.`);
  return result.data;
};

const ensureOptional = <T>(result: { data: T | null; error: { message: string } | null }, context: string): T | null => {
  if (result.error) throw new Error(`${context}: ${result.error.message}`);
  return result.data;
};

export async function fetchBulletin(date: string): Promise<Bulletin | null> {
  const result = await supabase.from('boletines').select('*').eq('fecha_culto', date).maybeSingle();
  if (result.error) throw new Error(`No se pudo cargar el boletín: ${result.error.message}`);
  return result.data ? normalizeBulletin(result.data as Record<string, unknown>) : null;
}

export async function generateBulletin(date: string): Promise<Bulletin> {
  const target = new Date(`${date}T12:00:00`);
  const today = format(startOfDay(new Date()), 'yyyy-MM-dd');
  const weekEnd = format(addDays(startOfDay(new Date()), 7), 'yyyy-MM-dd');
  const weekNumber = Number(format(target, 'I'));

  const [sermonResult, verseResult, eventsResult, announcementResult, birthdaysResult, schedulesResult] = await Promise.all([
    supabase.from('sermons').select('title, pastor_name').eq('date', date).limit(1).maybeSingle(),
    supabase.from('versiculos_semana').select('texto, referencia').eq('semana', weekNumber).maybeSingle(),
    supabase.from('events').select('id, title, start_date, start_time, location_name').gte('start_date', today).lte('start_date', weekEnd).order('start_date', { ascending: true }),
    supabase.from('church_announcements').select('title, summary, body').eq('is_featured', true).gte('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('members').select('id, first_name, last_name, birth_date').not('birth_date', 'is', null),
    supabase.from('schedules').select('id, title, day, time_range, description').eq('active', true).order('day', { ascending: true })
  ]);

  const sermon = ensureOptional(sermonResult, 'No se pudo consultar la prédica');
  const verse = ensureOptional(verseResult, 'No se pudo consultar el versículo semanal');
  const events = ensureSuccess(eventsResult, 'No se pudieron consultar los eventos');
  const announcement = ensureOptional(announcementResult, 'No se pudo consultar el anuncio destacado');
  const members = ensureSuccess(birthdaysResult, 'No se pudieron consultar los cumpleaños');
  const schedules = ensureSuccess(schedulesResult, 'No se pudieron consultar los horarios');

  const weekStart = startOfDay(new Date());
  const weekFinish = addDays(weekStart, 7);
  const birthdays: BulletinBirthday[] = (members ?? []).flatMap((member) => {
    const birthDate = new Date(`${member.birth_date}T12:00:00`);
    const thisYear = new Date(weekStart.getFullYear(), birthDate.getMonth(), birthDate.getDate(), 12);
    const normalized = thisYear < weekStart ? addDays(thisYear, 365) : thisYear;
    return normalized >= weekStart && normalized <= weekFinish ? [{ id: member.id, nombre: `${member.first_name} ${member.last_name}`.trim(), fecha: member.birth_date }] : [];
  });
  const scheduleText = (schedules ?? []).map((schedule) => `${schedule.title} · ${schedule.day} ${schedule.time_range}`).join('  |  ');
  const payload = {
    fecha_culto: date,
    titulo_mensaje: sermon?.title ?? null,
    expositor: sermon?.pastor_name ?? null,
    versiculo_texto: verse?.texto ?? null,
    versiculo_referencia: verse?.referencia ?? null,
    eventos: (events ?? []).map((event) => ({ id: event.id, nombre: event.title, fecha: event.start_date, hora: event.start_time, lugar: event.location_name })) satisfies BulletinEvent[],
    anuncio_titulo: announcement?.title ?? null,
    anuncio_descripcion: announcement?.summary ?? announcement?.body ?? null,
    cumpleaneros: birthdays,
    ofrendas_objetivo: null,
    mensaje_pastoral: scheduleText ? `Horarios: ${scheduleText}` : null,
    generado_automaticamente: true,
    estado: 'borrador'
  };
  const saved = await supabase.from('boletines').upsert(payload, { onConflict: 'fecha_culto' }).select('*').single();
  return normalizeBulletin(ensureSuccess(saved, 'No se pudo guardar el boletín generado') as Record<string, unknown>);
}

export async function saveBulletin(id: string, draft: BulletinDraft): Promise<Bulletin> {
  const result = await supabase.from('boletines').update({ ...draft, updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  return normalizeBulletin(ensureSuccess(result, 'No se pudo guardar el boletín') as Record<string, unknown>);
}

export async function approveBulletin(id: string): Promise<Bulletin> {
  const { data: authData } = await supabase.auth.getUser();
  const result = await supabase.from('boletines').update({ estado: 'aprobado', aprobado_por: authData.user?.id ?? null, aprobado_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', id).select('*').single();
  return normalizeBulletin(ensureSuccess(result, 'No se pudo aprobar el boletín') as Record<string, unknown>);
}
