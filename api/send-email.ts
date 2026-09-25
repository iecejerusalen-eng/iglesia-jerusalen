import { Resend } from 'resend';
import { z } from 'zod';

const emailSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1).max(200),
  html: z.string().min(1),
  text: z.string().optional(),
  from: z.string().optional(),
  replyTo: z.string().email().optional(),
});

type HandlerRequest = { method?: string; body?: unknown };
type HandlerResponse = { status: (code: number) => HandlerResponse; json: (value: unknown) => void };

export default async function handler(req: HandlerRequest, res: HandlerResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Solo se admite POST.' });
  }

  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ 
      error: 'Datos de correo inválidos.', 
      details: parsed.error.format() 
    });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY no está configurada en las variables de entorno.');
    return res.status(500).json({ error: 'El servicio de correo no está configurado en el servidor.' });
  }

  try {
    const resend = new Resend(apiKey);
    const { to, subject, html, text, from, replyTo } = parsed.data;

    const fromAddress = from || process.env.RESEND_FROM_EMAIL || 'Iglesia Jerusalén <onboarding@resend.dev>';

    const result = await resend.emails.send({
      from: fromAddress,
      to,
      subject,
      html,
      text,
      replyTo,
    });

    if (result.error) {
      console.error('Error al despachar correo con Resend:', result.error);
      return res.status(500).json({ error: result.error.message });
    }

    return res.status(200).json({ ok: true, id: result.data?.id });
  } catch (err: unknown) {
    console.error('Excepción al enviar correo:', err);
    return res.status(500).json({ 
      error: err instanceof Error ? err.message : 'Error inesperado al enviar el correo.' 
    });
  }
}
