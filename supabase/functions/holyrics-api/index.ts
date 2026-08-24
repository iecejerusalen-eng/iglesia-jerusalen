import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

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

interface HolyricsRequest {
  action?: string;
  payload?: Record<string, unknown>;
  transport?: 'request' | 'send';
}

const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const getPublishableKey = () => {
  const keyMap = Deno.env.get('SUPABASE_PUBLISHABLE_KEYS');
  if (keyMap) {
    const parsed = JSON.parse(keyMap) as Record<string, string>;
    if (parsed.default) return parsed.default;
  }
  const legacyKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (legacyKey) return legacyKey;
  throw new Error('Supabase no tiene una clave publicable configurada para verificar la sesión.');
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ ok: false, error: 'method_not_allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) return response({ ok: false, error: 'missing_supabase_url' }, 500);

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return response({ ok: false, error: 'missing_authorization' }, 401);

  try {
    const userClient = createClient(supabaseUrl, getPublishableKey(), {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return response({ ok: false, error: 'invalid_session' }, 401);
    const { data: canManage, error: permissionError } = await userClient.rpc('current_user_can_worship_manager');
    if (permissionError) return response({ ok: false, error: 'permission_check_failed', message: permissionError.message }, 500);
    if (canManage !== true) return response({ ok: false, error: 'forbidden' }, 403);

    const body = await request.json() as HolyricsRequest;
    const action = body.action?.trim() ?? '';
    const transport = body.transport ?? 'request';
    if (!allowedActions.has(action)) return response({ ok: false, error: 'action_not_allowed' }, 400);
    if (transport !== 'request' && transport !== 'send') return response({ ok: false, error: 'invalid_transport' }, 400);

    const apiKey = Deno.env.get('HOLYRICS_API_KEY');
    const token = Deno.env.get('HOLYRICS_API_TOKEN');
    if (!apiKey || !token) return response({ ok: false, error: 'missing_holyrics_secrets', message: 'Configura HOLYRICS_API_KEY y HOLYRICS_API_TOKEN en los secretos de la Edge Function.' }, 503);

    const apiResponse = await fetch(`https://api.holyrics.com.br/${transport}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', api_key: apiKey, token },
      body: JSON.stringify(body.payload ?? {}),
    });
    const raw = await apiResponse.text();
    let parsed: unknown = raw;
    try { parsed = JSON.parse(raw) as unknown; } catch (parseError) {
      const reason = parseError instanceof Error ? parseError.message : 'respuesta no JSON';
      console.warn(`Holyrics devolvió contenido no JSON: ${reason}`);
    }
    if (!apiResponse.ok) return response({ ok: false, error: 'holyrics_http_error', status: apiResponse.status, response: parsed }, 502);
    return response({ ok: true, action, transport, response: parsed });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error desconocido al consultar Holyrics.';
    return response({ ok: false, error: 'holyrics_request_failed', message }, 502);
  }
});
