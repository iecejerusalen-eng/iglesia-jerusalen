import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
const input = z.object({ token: z.string().uuid() });
type HandlerRequest = { method?: string; body?: unknown };
type HandlerResponse = { status: (code: number) => HandlerResponse; json: (value: unknown) => void };
export default async function handler(req: HandlerRequest, res: HandlerResponse) { if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' }); const parsed = input.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'Token de baja inválido.' }); const client = createClient(process.env.VITE_SUPABASE_URL ?? '', process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''); const { error } = await client.from('changelog_suscriptores').update({ activo: false }).eq('token_baja', parsed.data.token); if (error) { console.error('No se pudo dar de baja al suscriptor.', error); return res.status(500).json({ error: 'No se pudo completar la baja.' }); } return res.status(200).json({ ok: true }); }
