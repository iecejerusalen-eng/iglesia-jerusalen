import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Resend } from 'resend';

const input = z.object({ email: z.string().trim().email().max(320) });

type HandlerRequest = { method?: string; body?: unknown };
type HandlerResponse = { status: (code: number) => HandlerResponse; json: (value: unknown) => void };

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido.' });
  const parsed = input.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Escribe un correo válido.' });

  const email = parsed.data.email.toLowerCase();
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

  const client = createClient(supabaseUrl, supabaseKey);
  const { error } = await client.from('changelog_suscriptores').upsert({ email, activo: true }, { onConflict: 'email' });
  if (error) {
    console.error('Error de Supabase al suscribir correo.', error);
    return res.status(500).json({ error: 'No se pudo completar la suscripción.' });
  }

  if (process.env.RESEND_API_KEY) {
    try {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'Iglesia Jerusalén <novedades@iecejerusalen.com>';
      const mail = await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: '¡Te has unido a las novedades de Iglesia Jerusalén! 🔔',
        html: `<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8" /></head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          <tr>
            <td style="background-color: #1e1558; padding: 36px 32px; text-align: center;">
              <span style="font-size: 32px;">🔔</span>
              <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 12px 0 6px; letter-spacing: -0.02em;">Iglesia Jerusalén</h1>
              <p style="color: #fcd34d; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.15em; margin: 0;">Novedades y Actualizaciones</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 36px 32px; color: #334155; font-size: 15px; line-height: 1.6;">
              <p style="margin: 0 0 16px; font-size: 17px; font-weight: 700; color: #0f172a;">¡Hola! Te damos la bienvenida 🙌</p>
              <p style="margin: 0 0 16px;">Ya estás suscrito al boletín oficial de novedades de <strong>Iglesia Jerusalén</strong>. A partir de ahora recibirás una notificación en tu correo cada vez que publiquemos mejoras importantes en la plataforma, nuevas herramientas o recursos comunitarios.</p>
              <p style="margin: 0 0 24px; color: #64748b; font-size: 14px;">Solo te escribiremos cuando haya lanzamientos de verdadero valor. Cero spam.</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="https://www.iecejerusalen.com/novedades" style="background-color: #1e1558; color: #fcd34d; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 12px; display: inline-block; font-size: 14px;">Explorar novedades en vivo →</a>
              </div>
            </td>
          </tr>
          <tr>
            <td style="background-color: #f1f5f9; padding: 20px 32px; text-align: center; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 4px;">Iglesia Evangélica Cristiana Espiritual Jerusalén</p>
              <p style="margin: 0;"><a href="https://www.iecejerusalen.com" style="color: #64748b; text-decoration: none;">www.iecejerusalen.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
      });
      if (mail.error) console.error('La suscripción se guardó, pero falló el correo de confirmación.', mail.error);
    } catch (mailEx) {
      console.error('Error al invocar Resend:', mailEx);
    }
  }

  return res.status(200).json({ ok: true });
}

