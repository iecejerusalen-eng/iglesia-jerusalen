import type { EmailTemplate } from '../types';

export const PRESET_TEMPLATES: Omit<EmailTemplate, 'created_at'>[] = [
  {
    id: 'preset-newsletter-1',
    name: 'Boletín Dominical Jerusalén',
    subject: '¡Este domingo te esperamos en casa! 🏛️ - Noticias y Horarios',
    category: 'newsletter',
    body_html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boletín Dominical - Iglesia Jerusalén</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 15px 35px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 35px 30px; text-align: center; border-bottom: 4px solid #eab308;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; tracking-style: 0.05em; text-transform: uppercase;">
                🏛️ IGLESIA CRISTIANA JERUSALÉN
              </h1>
              <p style="color: #cbd5e1; margin: 6px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;">
                Uniendo Familias en el Amor de Cristo
              </p>
            </td>
          </tr>

          <!-- Hero Image -->
          <tr>
            <td style="padding: 0;">
              <img src="https://images.unsplash.com/photo-1544427920-c49ccfb85579?auto=format&fit=crop&w=1200&q=80" alt="Comunidad en Adoración" style="width: 100%; max-height: 240px; object-fit: cover; display: block;" />
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 35px 30px; color: #334155; font-size: 15px; line-height: 1.6;">
              <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">
                ¡Hola {{first_name}} {{last_name}}! 👋
              </h2>
              <p style="margin-bottom: 20px;">
                Nos alegra saludarte y compartir contigo lo que Dios está haciendo en nuestra congregación. Te invitamos a acompañarnos este domingo para rendir culto juntos y recibir una palabra de fe y esperanza para tu vida.
              </p>

              <!-- Quote Box / Versículo -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border-left: 4px solid #eab308; border-radius: 8px; margin: 25px 0; padding: 18px 20px;">
                <tr>
                  <td>
                    <p style="margin: 0; font-style: italic; color: #1e293b; font-size: 15px; font-weight: 600;">
                      "Yo me alegré con los que me decían: A la casa de Jehová iremos."
                    </p>
                    <p style="margin: 6px 0 0 0; font-size: 12px; color: #64748b; font-weight: 700; text-transform: uppercase;">
                      — Salmos 122:1
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Program Highlights -->
              <h3 style="color: #1e3a8a; font-size: 17px; margin-top: 30px; margin-bottom: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">
                📅 Horarios de Servicios Dominicales
              </h3>
              
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
                <tr>
                  <td style="padding: 12px; background-color: #eff6ff; border-radius: 12px; width: 48%; vertical-align: top;">
                    <strong style="color: #1e40af; font-size: 14px; display: block; margin-bottom: 4px;">🌅 1er Culto de la Mañana</strong>
                    <span style="font-size: 13px; color: #3b82f6; font-weight: bold;">8:00 AM - 10:00 AM</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Alabanza, Predicación y Escuela Dominical para niños.</p>
                  </td>
                  <td width="4%"></td>
                  <td style="padding: 12px; background-color: #fefce8; border-radius: 12px; width: 48%; vertical-align: top;">
                    <strong style="color: #854d0e; font-size: 14px; display: block; margin-bottom: 4px;">☀️ 2do Culto de Celebración</strong>
                    <span style="font-size: 13px; color: #ca8a04; font-weight: bold;">10:30 AM - 12:30 PM</span>
                    <p style="margin: 4px 0 0 0; font-size: 12px; color: #475569;">Transmisión en vivo y Santa Cena comunitaria.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <div style="text-align: center; margin: 35px 0 25px 0;">
                <a href="https://iglesia-jerusalen.vercel.app/eventos" style="background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff; text-decoration: none; padding: 15px 32px; border-radius: 12px; font-weight: 700; font-size: 15px; display: inline-block; box-shadow: 0 8px 20px rgba(37, 99, 235, 0.35);">
                  ✨ Confirmar Mi Asistencia
                </a>
              </div>

              <p style="font-size: 13px; color: #64748b; text-align: center; margin-top: 15px;">
                ¿Tienes alguna petición de oración? <a href="https://iglesia-jerusalen.vercel.app/contacto" style="color: #2563eb; font-weight: 600;">Escríbenos aquí</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b;">
              <p style="margin: 0 0 10px 0; font-weight: 700; color: #e2e8f0; font-size: 13px;">
                Iglesia Cristiana Jerusalén
              </p>
              <p style="margin: 0 0 15px 0;">
                Calle Principal de la Fe #123 · Tel: (555) 019-2834 · Email: contacto@iglesiajerusalen.org
              </p>
              <div style="margin-bottom: 15px;">
                <a href="#" style="color: #eab308; text-decoration: none; margin: 0 8px; font-weight: 600;">Facebook</a> ·
                <a href="#" style="color: #eab308; text-decoration: none; margin: 0 8px; font-weight: 600;">YouTube</a> ·
                <a href="#" style="color: #eab308; text-decoration: none; margin: 0 8px; font-weight: 600;">Instagram</a>
              </div>
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                Recibes este correo porque estás registrado en la comunidad de {{church_name}}. <br />
                <a href="#" style="color: #94a3b8; text-decoration: underline;">Cancelar suscripción</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'preset-welcome-2',
    name: 'Bienvenida a la Familia Jerusalén',
    subject: '¡Te damos la más cálida bienvenida a {{church_name}}! 🤝',
    category: 'welcome',
    body_html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Bienvenida a la Iglesia Jerusalén</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: sans-serif;">
  <table role="presentation" width="100%" style="background-color: #f8fafc; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06);">
          
          <tr style="background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-align: center;">
            <td style="padding: 30px;">
              <h1 style="margin: 0; font-size: 24px;">🌱 ¡Bienvenido a Casa, {{first_name}}!</h1>
              <p style="margin-top: 8px; opacity: 0.9; font-size: 14px;">Estamos felices de tenerte con nosotros</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; color: #334155; font-size: 15px; line-height: 1.6;">
              <p>Querido/a <strong>{{first_name}}</strong>,</p>
              <p>En nombre de nuestro equipo pastoral y de toda la congregación de <strong>{{church_name}}</strong>, queremos expresarte nuestro más sincero agradecimiento por visitarnos.</p>
              
              <div style="background-color: #ecfdf5; border-radius: 12px; padding: 20px; margin: 20px 0; border: 1px solid #a7f3d0;">
                <h3 style="margin-top: 0; color: #047857;">Tus Próximos Pasos con Nosotros:</h3>
                <ul style="margin: 0; padding-left: 20px; color: #065f46;">
                  <li style="margin-bottom: 8px;"><strong>Unirte a un Grupo de Vida:</strong> Conoce hermanos cerca de tu hogar.</li>
                  <li style="margin-bottom: 8px;"><strong>Escuela de Discipulado:</strong> Crece en el conocimiento de la Palabra.</li>
                  <li style="margin-bottom: 0;"><strong>Equipos de Voluntariado:</strong> Sirve con tus dones y talentos.</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://iglesia-jerusalen.vercel.app/nosotros" style="background-color: #059669; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 10px; font-weight: bold; display: inline-block;">
                  Conocer Más Sobre Nosotros
                </a>
              </div>
            </td>
          </tr>

          <tr style="background-color: #0f172a; text-align: center; color: #94a3b8; padding: 20px; font-size: 12px;">
            <td style="padding: 20px;">
              <p style="margin: 0; color: #ffffff; font-weight: bold;">{{church_name}}</p>
              <p style="margin: 5px 0 0 0;">"Una iglesia viva para glorificar al Rey"</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'preset-event-3',
    name: 'Invitación a Evento & Conferencia',
    subject: '🔥 Gran Conferencia de Fe y Familia - ¡Reserva tu lugar!',
    category: 'event',
    body_html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Invitación a Evento Especial</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: sans-serif;">
  <table role="presentation" width="100%" style="background-color: #0f172a; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #1e293b; border-radius: 20px; overflow: hidden; border: 1px solid #334155; color: #f8fafc;">
          
          <tr>
            <td style="padding: 35px 30px; text-align: center; background: linear-gradient(135deg, #7c3aed 0%, #4c1d95 100%);">
              <span style="background-color: #f59e0b; color: #0f172a; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 900; text-transform: uppercase;">
                EVENTO ESPECIAL
              </span>
              <h1 style="margin: 15px 0 5px 0; font-size: 28px; color: #ffffff;">CONFERENCIA RENOVACIÓN 2026</h1>
              <p style="margin: 0; color: #ddd6fe; font-size: 14px;">"Transformados por la fuerza de Su Espíritu"</p>
            </td>
          </tr>

          <tr>
            <td style="padding: 30px; font-size: 15px; line-height: 1.6;">
              <p>Hola <strong>{{first_name}}</strong>,</p>
              <p>Te invitamos a dos días inolvidables de adoración intensa, conferencias inspiradoras y comunión fraternal junto a conferencistas invitados.</p>

              <div style="background-color: #0f172a; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin: 25px 0;">
                <p style="margin: 0 0 10px 0; color: #fbbf24; font-weight: bold; font-size: 16px;">📍 Detalles del Evento</p>
                <p style="margin: 4px 0; color: #cbd5e1;">🗓️ <strong>Fecha:</strong> 15 y 16 de Octubre, 2026</p>
                <p style="margin: 4px 0; color: #cbd5e1;">⏰ <strong>Hora:</strong> 6:30 PM (Apertura de puertas 5:30 PM)</p>
                <p style="margin: 4px 0; color: #cbd5e1;">🏛️ <strong>Lugar:</strong> Auditorio Principal {{church_name}}</p>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="https://iglesia-jerusalen.vercel.app/eventos" style="background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 16px 36px; border-radius: 12px; font-weight: 800; font-size: 16px; display: inline-block; box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);">
                  🎟️ Inscribirme Ahora Gratis
                </a>
              </div>
            </td>
          </tr>

          <tr style="background-color: #020617; text-align: center; color: #64748b; padding: 20px; font-size: 12px;">
            <td style="padding: 20px;">
              <p style="margin: 0; color: #cbd5e1;">{{church_name}} · Ministerio de Eventos</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  },
  {
    id: 'preset-pastoral-4',
    name: 'Carta Pastoral & Peticiones de Oración',
    subject: '📜 Una palabra de aliento del Pastor para ti',
    category: 'announcement',
    body_html: `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Carta Pastoral</title>
</head>
<body style="margin: 0; padding: 0; background-color: #fafafa; font-family: 'Georgia', serif;">
  <table role="presentation" width="100%" style="background-color: #fafafa; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; padding: 40px; border: 1px solid #e5e5e5; color: #262626; font-size: 16px; line-height: 1.8;">
          
          <tr>
            <td style="border-bottom: 2px solid #eab308; pb: 20px; text-align: center;">
              <h2 style="margin: 0; font-family: sans-serif; color: #1e3a8a; font-size: 22px;">CARTA PASTORAL</h2>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #737373; font-family: sans-serif;">{{church_name}}</p>
            </td>
          </tr>

          <tr>
            <td style="padding-top: 30px;">
              <p>Estimado/a <strong>{{first_name}}</strong>,</p>
              
              <p>En medio de las ocupaciones y desafíos diarios, mi oración constante por ti y por tu familia es que la paz de Dios, que sobrepasa todo entendimiento, guarde vuestros corazones y vuestros pensamientos en Cristo Jesús.</p>

              <p>Recuerda que no caminas solo/a. Nuestra comunidad de fe está aquí para sostenerte en oración y acompañarte en cada etapa de tu crecimiento espiritual.</p>

              <div style="background-color: #fefce8; border: 1px solid #fef08a; padding: 20px; border-radius: 8px; margin: 30px 0; font-family: sans-serif; font-size: 14px;">
                <strong style="color: #854d0e; display: block; margin-bottom: 8px;">🙏 ¿Necesitas oración esta semana?</strong>
                <span style="color: #713f12;">Déjanos tus peticiones y nuestro equipo pastoral estará intercediendo por ti de manera confidencial.</span>
                <div style="margin-top: 15px;">
                  <a href="https://iglesia-jerusalen.vercel.app/oracion" style="color: #1e3a8a; font-weight: bold; text-decoration: underline;">Enviar Petición de Oración →</a>
                </div>
              </div>

              <p style="margin-top: 40px; font-style: italic;">
                Con amor pastoral,<br />
                <strong>Pastor Principal</strong><br />
                <span style="font-size: 13px; color: #737373; font-family: sans-serif;">Iglesia Cristiana Jerusalén</span>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
  }
];
