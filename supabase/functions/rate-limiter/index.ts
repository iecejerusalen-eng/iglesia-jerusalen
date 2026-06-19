// @ts-nocheck
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req: any) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
    }

    // Parse Request Body
    const { endpoint } = await req.json();
    if (!endpoint) {
      return new Response(
        JSON.stringify({ error: 'Missing endpoint field in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract client IP address from headers
    // Supabase Edge Functions automatically receive headers like x-forwarded-for
    const forwardedFor = req.headers.get('x-forwarded-for');
    const clientIp = forwardedFor 
      ? forwardedFor.split(',')[0].trim() 
      : req.headers.get('cf-connecting-ip') || '127.0.0.1';

    // Initialize Supabase Client with service_role privileges to call check_rate_limit
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Call the PostgreSQL check_rate_limit RPC
    const { data: isAllowed, error: rpcError } = await supabaseAdmin.rpc('check_rate_limit', {
      client_ip: clientIp,
      target_endpoint: endpoint,
      max_requests: 5,
      window_minutes: 15
    });

    if (rpcError) {
      console.error('RPC Error check_rate_limit:', rpcError);
      throw rpcError;
    }

    if (!isAllowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Límite de solicitudes excedido. Por favor intenta de nuevo en 15 minutos.',
          ip: clientIp,
          endpoint 
        }),
        { 
          status: 429, 
          statusText: 'Too Many Requests',
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Request allowed.', ip: clientIp }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
