import http from 'node:http';

const port = Number(process.env.HOLYRICS_BRIDGE_PORT ?? 4892);
const apiUrl = (process.env.HOLYRICS_LOCAL_API_URL ?? 'http://127.0.0.1:50001/api').replace(/\/$/, '');
const token = process.env.HOLYRICS_LOCAL_TOKEN ?? '';
const allowedOrigins = new Set((process.env.HOLYRICS_BRIDGE_ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(',').map((origin) => origin.trim()).filter(Boolean));
const allowedActions = new Set([
  'GetVersion',
  'GetAPIServerInfo',
  'CheckPermissions',
  'GetSongs',
  'GetLyrics',
  'SearchLyrics',
  'GetTexts',
  'SearchText',
  'GetServices',
  'GetSchedules',
  'GetEvents',
  'GetMembers',
  'GetRoles',
  'GetAnnouncements',
  'GetPlaylists',
  'ShowLyrics',
  'ShowText',
  'ShowVerse',
  'SetCurrentSchedule',
  'NextSlide',
  'PreviousSlide',
  'ClearScreen',
  'ClearLyrics',
  'HideLyrics',
  'BlackScreen',
  'LogoScreen',
  'ShowAlert',
  'HideAlert',
  'SetBackground',
  'TriggerAction',
  'SendMIDI',
  'GetStageView',
  'GetChords',
  'ShowQuickMessage',
  'ShowAnnouncement',
]);

const corsHeaders = {
  'Access-Control-Allow-Headers': 'content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

const send = (request, response, status, body) => {
  const origin = request.headers.origin;
  const originHeader = origin && allowedOrigins.has(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {};
  response.writeHead(status, { ...corsHeaders, ...originHeader, 'Content-Type': 'application/json' });
  response.end(JSON.stringify(body));
};

const readJson = (request) => new Promise((resolve, reject) => {
  let raw = '';
  request.on('data', (chunk) => { raw += chunk; });
  request.on('end', () => {
    if (!raw.trim()) { resolve({}); return; }
    try { resolve(JSON.parse(raw)); } catch (error) { reject(error); }
  });
  request.on('error', reject);
});

const callHolyrics = async (action, payload) => {
  if (!token) throw new Error('Falta HOLYRICS_LOCAL_TOKEN en la configuración del puente.');
  const target = new URL(`${apiUrl}/${action}`);
  target.searchParams.set('token', token);
  const apiResponse = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload ?? {}),
  });
  const raw = await apiResponse.text();
  let parsed = raw;
  try { parsed = JSON.parse(raw); } catch (parseError) {
    const reason = parseError instanceof Error ? parseError.message : 'respuesta no JSON';
    console.warn(`Respuesta no JSON desde Holyrics: ${reason}`);
  }
  if (!apiResponse.ok) throw new Error(`Holyrics respondió HTTP ${apiResponse.status}: ${typeof parsed === 'string' ? parsed : JSON.stringify(parsed)}`);
  return parsed;
};

const server = http.createServer(async (request, response) => {
  const origin = request.headers.origin;
  if (origin && !allowedOrigins.has(origin)) { send(request, response, 403, { ok: false, error: 'origin_not_allowed' }); return; }
  if (request.method === 'OPTIONS') { send(request, response, 204, {}); return; }
  if (request.method === 'GET' && request.url === '/health') { send(request, response, 200, { ok: true, api_url: apiUrl }); return; }
  if (request.method !== 'POST' || request.url !== '/holyrics') { send(request, response, 404, { ok: false, error: 'not_found' }); return; }

  try {
    const body = await readJson(request);
    const action = typeof body.action === 'string' ? body.action.trim() : '';
    if (!allowedActions.has(action)) { send(request, response, 400, { ok: false, error: 'action_not_allowed' }); return; }
    const result = await callHolyrics(action, body.payload);
    send(request, response, 200, { ok: true, action, response: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido en el puente local.';
    send(request, response, 502, { ok: false, error: 'local_request_failed', message });
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Puente Holyrics disponible en http://127.0.0.1:${port}`);
  console.log(`API local configurada: ${apiUrl}`);
});
