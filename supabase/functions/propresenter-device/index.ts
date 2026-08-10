import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.107.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-token',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type DeviceAction = 'pair' | 'heartbeat' | 'poll' | 'ack';

interface DeviceRequest {
  action: DeviceAction;
  connection_id?: string;
  pairing_code?: string;
  computer_name?: string;
  app_version?: string;
  last_error?: string | null;
  command_id?: string;
  status?: 'acknowledged' | 'failed';
  error_message?: string | null;
}

const response = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const hashValue = async (value: string) => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

const createDeviceToken = () => `${crypto.randomUUID()}-${crypto.randomUUID()}`;

const getConnectionForToken = async (admin: SupabaseClient, token: string) => {
  const tokenHash = await hashValue(token);
  const { data, error } = await admin
    .from('propresenter_connections')
    .select('id, name, mode, is_enabled')
    .eq('device_token_hash', tokenHash)
    .maybeSingle();
  if (error) throw error;
  return data;
};

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return response({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceRoleKey) return response({ error: 'Function is not configured' }, 500);

  try {
    const body = await request.json() as DeviceRequest;
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    if (body.action === 'pair') {
      if (!body.connection_id || !body.pairing_code) return response({ error: 'connection_id and pairing_code are required' }, 400);
      const pairingHash = await hashValue(body.pairing_code.trim().toUpperCase());
      const { data: connection, error } = await admin
        .from('propresenter_connections')
        .select('id, name, mode, is_enabled')
        .eq('id', body.connection_id)
        .eq('device_token_hash', pairingHash)
        .maybeSingle();
      if (error) throw error;
      if (!connection || !connection.is_enabled) return response({ error: 'Invalid or disabled pairing code' }, 401);

      const deviceToken = createDeviceToken();
      const { error: updateError } = await admin.from('propresenter_connections').update({
        device_token_hash: await hashValue(deviceToken),
        device_token_issued_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
        last_error: null,
      }).eq('id', connection.id);
      if (updateError) throw updateError;
      return response({ device_token: deviceToken, connection });
    }

    const deviceToken = request.headers.get('x-device-token');
    if (!deviceToken) return response({ error: 'x-device-token is required' }, 401);
    const connection = await getConnectionForToken(admin, deviceToken);
    if (!connection || !connection.is_enabled) return response({ error: 'Invalid or disabled device token' }, 401);

    if (body.action === 'heartbeat') {
      const { error } = await admin.from('propresenter_connections').update({
        computer_name: body.computer_name?.slice(0, 120) ?? null,
        app_version: body.app_version?.slice(0, 80) ?? null,
        last_error: body.last_error?.slice(0, 500) ?? null,
        last_seen_at: new Date().toISOString(),
      }).eq('id', connection.id);
      if (error) throw error;
      return response({ ok: true, connection_id: connection.id });
    }

    if (body.action === 'poll') {
      const { data: commands, error } = await admin
        .from('propresenter_commands')
        .select('id, command_type, payload, created_at')
        .eq('connection_id', connection.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(20);
      if (error) throw error;
      const commandIds = (commands ?? []).map((command) => command.id);
      if (commandIds.length > 0) {
        const { error: markError } = await admin.from('propresenter_commands').update({ status: 'sent' }).in('id', commandIds);
        if (markError) throw markError;
      }
      return response({ commands: commands ?? [] });
    }

    if (body.action === 'ack') {
      if (!body.command_id || !body.status) return response({ error: 'command_id and status are required' }, 400);
      const { error } = await admin.from('propresenter_commands').update({
        status: body.status,
        error_message: body.error_message?.slice(0, 500) ?? null,
        acknowledged_at: new Date().toISOString(),
      }).eq('id', body.command_id).eq('connection_id', connection.id);
      if (error) throw error;
      return response({ ok: true });
    }

    return response({ error: 'Unsupported action' }, 400);
  } catch (error) {
    console.error('propresenter-device error', error);
    return response({ error: error instanceof Error ? error.message : 'Unexpected error' }, 500);
  }
});
