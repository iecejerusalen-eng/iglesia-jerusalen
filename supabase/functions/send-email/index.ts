import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  to: string | string[];
  subject: string;
  template: "attendance_alert" | "missing_homework" | "forum_reply" | "general_notification";
  data: Record<string, any>;
}

// Funciones para generar HTML basado en el template
function generateHtml(template: string, data: Record<string, any>): string {
  const baseStyles = `
    font-family: 'Inter', sans-serif;
    color: #1e293b;
    line-height: 1.6;
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
    background-color: #f8fafc;
    border-radius: 12px;
  `;
  const headerStyles = `
    background-color: #0f172a;
    padding: 20px;
    text-align: center;
    border-radius: 12px 12px 0 0;
    color: #eab308;
  `;
  const contentStyles = `
    background-color: #ffffff;
    padding: 30px;
    border-radius: 0 0 12px 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  `;
  const buttonStyles = `
    display: inline-block;
    padding: 12px 24px;
    background-color: #eab308;
    color: #ffffff !important;
    text-decoration: none;
    font-weight: bold;
    border-radius: 8px;
    margin-top: 20px;
  `;

  let contentHtml = "";

  switch (template) {
    case "attendance_alert":
      contentHtml = `
        <h2 style="color: #0f172a;">Alerta de Inasistencia</h2>
        <p>Hola <strong>${data.studentName}</strong>,</p>
        <p>Hemos notado que tienes ausencias recientes en el curso <strong>${data.courseName}</strong>.</p>
        <p>Te recordamos que la asistencia es fundamental para tu crecimiento espiritual y académico en la Iglesia Jerusalén.</p>
        <p>Si tienes algún inconveniente o petición de oración, por favor comunícate con tu maestro.</p>
      `;
      break;
    case "missing_homework":
      contentHtml = `
        <h2 style="color: #0f172a;">Alerta Académica: Tareas Pendientes</h2>
        <p>Hola <strong>${data.studentName}</strong>,</p>
        <p>Este es un aviso automático porque no hemos recibido tus entregas en el curso <strong>${data.courseName}</strong>.</p>
        <p>Tienes <strong>${data.missingTasksCount} tareas pendientes</strong>.</p>
        <p>Por favor, ingresa al Aula Virtual para ponerte al día.</p>
        <center>
          <a href="${data.portalUrl || 'https://iglesia-jerusalen.web.app'}" style="${buttonStyles}">Ir al Aula Virtual</a>
        </center>
      `;
      break;
    default:
      contentHtml = `
        <h2 style="color: #0f172a;">Notificación</h2>
        <p>${data.message || "Tienes una nueva notificación de la Iglesia Jerusalén."}</p>
      `;
  }

  return `
    <div style="background-color: #cbd5e1; padding: 40px 20px;">
      <div style="${baseStyles}">
        <div style="${headerStyles}">
          <h1 style="margin: 0; font-size: 24px;">Iglesia Jerusalén</h1>
          <p style="margin: 5px 0 0; color: #cbd5e1; font-size: 14px;">Plataforma Educativa</p>
        </div>
        <div style="${contentStyles}">
          ${contentHtml}
        </div>
        <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 12px;">
          <p>© ${new Date().getFullYear()} Iglesia Jerusalén. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, template, data } = (await req.json()) as EmailRequest;

    if (!RESEND_API_KEY) {
      console.warn("No RESEND_API_KEY found, simulating email send.");
      console.log(\`Simulating email to \${to} - Subject: \${subject}\`);
      return new Response(
        JSON.stringify({ message: "Email simulation successful (No API Key)" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const htmlContent = generateHtml(template, data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: \`Bearer \${RESEND_API_KEY}\`,
      },
      body: JSON.stringify({
        from: "Aula Virtual Jerusalén <aula@jerusalen.edu.ec>", // Debe cambiarse al dominio verificado real
        to,
        subject,
        html: htmlContent,
      }),
    });

    const resData = await res.json();

    if (res.ok) {
      return new Response(JSON.stringify(resData), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      return new Response(JSON.stringify({ error: resData }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
