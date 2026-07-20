import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.join(__dirname, 'token.json');

const sigeContext = `
## SIGE Aula Virtual - Contexto General
- **URL**: https://sige.jerusalen.edu.ec
- **Propósito**: Plataforma actual de la institución, aparentemente basada en sistemas tradicionales de gestión académica (ej. Moodle).
- **Estructura**: Permite el inicio de sesión para docentes y estudiantes, revisión de calificaciones, tareas, y material de clases.
- **Objetivo de Migración**: Extraer sus mejores funciones (entorno visual claro, organización de materiales) para implementarlas y mejorarlas con tecnologías modernas (React, Supabase) en nuestra nueva aula virtual, eliminando procesos burocráticos y enfocándose en una estética premium (glassmorphism).
`;

const localLmsContext = `
## Aula Virtual Iglesia Jerusalén - Contexto Actual
- **Stack Tecnológico**: React, TypeScript, TailwindCSS, Vite (Frontend) + Supabase (Backend/Database).
- **Diseño**: Interfaz moderna, basada en Glassmorphism, con paleta de colores corporativa (Oro, Blanco, Tonos oscuros de contraste).
- **Base de Datos (Supabase)**:
  - Cursos, Módulos y Recursos ('lms_courses', 'lms_modules', 'lms_resources').
  - Matriculación y Progreso ('lms_enrollments').
  - Gamificación: Sesiones de estudio ('lms_study_sessions'), Rachas de estudio diarias ('lms_study_streaks') y Certificados automáticos ('lms_certificates').
  - Evaluaciones: Banco de preguntas categorizadas ('lms_questions', 'lms_question_categories'), Exámenes ('lms_quizzes', 'lms_quiz_attempts').
  - Vistas de reportes ('lms_quiz_results_view') con seguridad (security_invoker = true).
- **Funcionalidades Clave**: 
  - Gestión de Categorías para Docentes (RLS policies implementadas).
  - Zoom Status Tracking (Asistencia y estatus de conexión a reuniones virtuales).
  - Vistas dedicadas para Docente y Estudiante.
- **Próximos Pasos**: Terminar la integración del dashboard de estudiante, mejorar la sincronización de las respuestas del cuestionario y añadir las funciones extraídas del análisis del SIGE.
`;

async function main() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('No se encontró el token de TickTick. Por favor autentícate primero.');
    return;
  }
  
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const token = tokenData.access_token;
  
  // 1. Get all projects
  const pRes = await fetch('https://api.ticktick.com/open/v1/project', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const projects = await pRes.json();
  
  // 2. Find or Create "Antigravity Context" project
  let contextProject = projects.find((p: { name: string, id: string }) => p.name === 'Antigravity Context');
  
  if (!contextProject) {
    console.log('Creando proyecto "Antigravity Context"...');
    // TickTick doesn't officially expose project creation on open API v1 for third-parties easily in all scopes, 
    // but assuming standard REST for the project creation if allowed, or fallback to inbox.
    // If not allowed, we use Inbox.
    contextProject = { id: 'inbox' }; // Fallback
  }
  
  const projectId = contextProject.id;
  
  // 3. Create Task 1: SIGE
  await fetch('https://api.ticktick.com/open/v1/task', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Contexto: Aula Virtual SIGE',
      content: sigeContext,
      projectId: projectId === 'inbox' ? undefined : projectId
    })
  });
  
  // 4. Create Task 2: Jerusalen LMS
  await fetch('https://api.ticktick.com/open/v1/task', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Contexto: Aula Virtual Jerusalén (Supabase+React)',
      content: localLmsContext,
      projectId: projectId === 'inbox' ? undefined : projectId
    })
  });
  
  console.log('Contexto guardado exitosamente en TickTick.');
}

main().catch(console.error);
