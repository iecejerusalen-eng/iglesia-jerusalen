import { createClient } from 'npm:@supabase/supabase-js@2.107.0';
import { createStoreHandler, StoreValidationError } from './handler.ts';
import type { StoreBackend } from './handler.ts';

const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const rpc = async (name: string, params: Record<string, unknown>) => {
  const { data, error } = await client.rpc(name, params);
  if (error) {
    // P0001 messages are deliberately authored by our PL/pgSQL validation, never raw SQL/schema errors.
    if (error.code === 'P0001') throw new StoreValidationError(error.message);
    console.error('store-checkout database failure', { code: error.code });
    throw new Error('No se pudo completar la operación. Conserva tu referencia y reintenta.');
  }
  return data;
};
const backend: StoreBackend = {
  async authenticate(token) {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data.user || data.user.is_anonymous || !data.user.email_confirmed_at) throw new Error('Inicia sesión con una cuenta verificada');
    return data.user.id;
  },
  async limit(key) { await rpc('store_request_limit', { p_key: key }); },
  execute: (action, actor, secret, payload) => rpc('store_api', { p_action: action, p_actor: actor, p_secret: secret, p_payload: payload }),
  async upload(path, file) {
    const { error } = await client.storage.from('store-receipts').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error('No se pudo guardar el comprobante privado. Tu reserva se conserva.');
  },
  async remove(path) {
    const { error } = await client.storage.from('store-receipts').remove([path]);
    if (error) throw new Error('No se pudo retirar el archivo sin asociar');
  },
  async signedUrl(path) {
    const { data, error } = await client.storage.from('store-receipts').createSignedUrl(path, 300);
    if (error) throw new Error('No se pudo abrir el comprobante privado');
    return data.signedUrl;
  },
};
Deno.serve(createStoreHandler(backend, Deno.env.get('SUPABASE_ANON_KEY')!));
