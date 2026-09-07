import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const now = new Date();
  const day = now.getUTCDay();
  if (day !== 6) return new Response(JSON.stringify({ skipped: true, reason: 'La ejecución semanal está configurada para sábado.' }), { headers: corsHeaders });
  const sunday = new Date(now);
  sunday.setUTCDate(now.getUTCDate() + 1);
  const sundayDate = sunday.toISOString().slice(0, 10);
  const weekNumber = Math.ceil((((sunday.getTime() - new Date(Date.UTC(sunday.getUTCFullYear(), 0, 1)).getTime()) / 86400000) + 1) / 7);
  const weekEnd = new Date(now);
  weekEnd.setUTCDate(now.getUTCDate() + 7);
  const [sermon, verse, events, announcement, members, schedules] = await Promise.all([
    supabase.from('sermons').select('title, pastor_name').eq('date', sundayDate).limit(1).maybeSingle(),
    supabase.from('versiculos_semana').select('texto, referencia').eq('semana', weekNumber).maybeSingle(),
    supabase.from('events').select('id, title, start_date, start_time, location_name').gte('start_date', now.toISOString().slice(0, 10)).lte('start_date', weekEnd.toISOString().slice(0, 10)).order('start_date'),
    supabase.from('church_announcements').select('title, summary, body').eq('is_featured', true).gte('expires_at', now.toISOString()).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('members').select('id, first_name, last_name, birth_date').not('birth_date', 'is', null),
    supabase.from('schedules').select('title, day, time_range').eq('active', true).order('day')
  ]);
  for (const result of [sermon, verse, events, announcement, members, schedules]) if (result.error) throw result.error;
  const payload = {
    fecha_culto: sundayDate,
    titulo_mensaje: sermon.data?.title ?? null,
    expositor: sermon.data?.pastor_name ?? null,
    versiculo_texto: verse.data?.texto ?? null,
    versiculo_referencia: verse.data?.referencia ?? null,
    eventos: (events.data ?? []).map((event) => ({ id: event.id, nombre: event.title, fecha: event.start_date, hora: event.start_time, lugar: event.location_name })),
    anuncio_titulo: announcement.data?.title ?? null,
    anuncio_descripcion: announcement.data?.summary ?? announcement.data?.body ?? null,
    cumpleaneros: (members.data ?? []).filter((member) => member.birth_date).map((member) => ({ id: member.id, nombre: `${member.first_name} ${member.last_name}`.trim(), fecha: member.birth_date })),
    mensaje_pastoral: (schedules.data ?? []).map((schedule) => `${schedule.title} · ${schedule.day} ${schedule.time_range}`).join('  |  '),
    estado: 'borrador',
    generado_automaticamente: true
  };
  const saved = await supabase.from('boletines').upsert(payload, { onConflict: 'fecha_culto' }).select('id, fecha_culto, estado').single();
  if (saved.error) throw saved.error;
  return new Response(JSON.stringify({ bulletin: saved.data, notification: 'Revisión requerida por pastor/secretaría' }), { headers: corsHeaders });
});
