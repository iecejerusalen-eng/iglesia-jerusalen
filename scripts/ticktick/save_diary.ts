import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.join(__dirname, 'token.json');

const dailySummary = `
### 🏗️ Backend / Base de Datos
- **Migraciones Supabase (RLS)**: Se implementó \`DROP POLICY IF EXISTS\` en las políticas del Banco de Preguntas (\`20260720050000_question_bank.sql\`) para evitar conflictos de creación.
- **Seguridad en Vistas**: Se corrigieron las advertencias de \`SECURITY DEFINER\` incorporando explícitamente \`WITH (security_invoker = true)\` a las vistas de reportes.
- **CRM Schema**: Verificación de la migración de hoy (\`20260720010000_add_crm_fields_to_members.sql\`) que añade \`marital_status\` y \`birth_place\`.

### 🖥️ Frontend / UI
- **CRM Miembros**: Se validó que el formulario \`MemberForm.tsx\` ahora soporta la captura de Estado Civil y Lugar de Nacimiento con diseño Glassmorphism.
- **Calendarios**: Se confirmó la implementación del botón \`<FileDown> Exportar PDF\` en las vistas de Cumpleaños y Eventos para impresión de cronogramas.

### 🤖 Infraestructura de Agentes y Automatización (TickTick)
- **Integración OAuth**: Se programó exitosamente la conexión segura \`auth.cjs\` con TickTick.
- **Desarrollo Autónomo**: Creación del skill global \`/ticktick\` con 4 modos operativos (Automático, Consultivo, Diario, y Contexto) y cron (\`0 * * * *\`) para el desarrollo en segundo plano.
- **CI/CD Automatizado**: Se incluyó la función para realizar \`git commit\` y \`git push\` automático tras verificaciones locales exitosas.

### 📋 Próximos Pasos (Mañana)
- Proseguir con tareas específicas en TickTick, incluyendo la resolución de nuevos requerimientos en el CRM (como el botón Imprimir) y revisión del Aula Virtual.
`;

async function main() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('No se encontró el token de TickTick.');
    return;
  }
  
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const token = tokenData.access_token;
  
  // 1. Get all projects (lists)
  const pRes = await fetch('https://api.ticktick.com/open/v1/project', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const projects = await pRes.json();
  
  // 2. Find "Tasks" list
  const tasksList = projects.find((p: {name: string, id: string}) => p.name === 'Tasks');
  
  const projectId = tasksList ? tasksList.id : undefined;
  
  // 3. Create Task
  await fetch('https://api.ticktick.com/open/v1/task', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Resumen Diario de Implementaciones: 20 de Julio 2026',
      content: dailySummary,
      projectId: projectId
    })
  });
  
  console.log('Diario de implementaciones guardado exitosamente en TickTick.');
}

main().catch(console.error);
