import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TOKEN_PATH = path.join(__dirname, 'token.json');

const parts = [
  {
    title: 'SIGE: Árbol Estructural y Sitemap',
    content: `
## Árbol Estructural (Sitemap) Injerido
El sistema utiliza rutas parametrizadas para manejar la navegación interna, evitando crear múltiples archivos físicos y dependiendo fuertemente del query param \`section\`.

- \`/\` (Login Público)
- \`/notificacion?t=1\` (Bandeja de Entrada)
- \`/notificacion?t=2\` (Mensajes Enviados)
- \`/profesor/aula-virtual\`
  - \`?section=semanas&id={course_id}\` (Vista de módulos/semanas por curso)
  - \`?section=actividades&id={course_id}\` (Revisión de actividades y calificaciones)
- \`/estudiante/aula-virtual\`
  - \`?section=resumen_actividad&id={course_id}&actividad_id={activity_id}\` (Vista de detalle de tarea para estudiante con días restantes)
- Periodos Académicos (Switch global en el navbar)
`
  },
  {
    title: 'SIGE: Árbol de Base de Datos y Relaciones (Inferencia)',
    content: `
## Esquema Entidad-Relación Inferido
Basado en los IDs descubiertos (\`id=1867\`, \`id=72007\`, \`actividad_id=74942\`), el modelo relacional es robusto y altamente normalizado:

1. **Usuarios (users)**: Campos \`rol\` (Docente, Estudiante, Representante).
2. **Periodos Académicos (academic_periods)**: Define el año lectivo activo.
3. **Cursos/Clases (courses)**: Ej. ID 1867 (Ciencias Sociales 6TO EGB A). Tienen relación con Docente, Materia y Grado.
4. **Matrículas (enrollments)**: Une \`student_id\` con \`course_id\`.
5. **Módulos/Semanas (course_weeks)**: Divisiones temporales dentro de un curso (ej. Parcial 1, Semana 1).
6. **Actividades (activities)**: Ej. ID 74942 (Trabajo Áulico: RIMPE 1). Tienen fecha de inicio, fecha límite (ej. "5d rest.") y \`course_id\`.
7. **Entregas (submissions)**: Une \`student_id\` con \`activity_id\` y guarda la nota ("29/29").
8. **Mensajes (messages)**: Sistema interno de mensajería (Inbox/Outbox).
`
  },
  {
    title: 'SIGE: Matriz de Permisos (Docente vs Estudiante)',
    content: `
## Matriz de Capacidades y Permisos

| Módulo/Acción | Rol Docente (\`mparralesp\`) | Rol Estudiante (\`valvaradop1\`) |
|---|---|---|
| **Cursos** | Acceso a \`section=semanas\` y \`section=actividades\` para administrar. Visualiza cantidad de alumnos ("29 Est."). | Acceso a cursos donde está matriculado. |
| **Actividades** | Califica y revisa envíos (Ve progreso grupal: "5/29", "27/27"). | Visualiza tareas pendientes con contador de días ("5d rest.") en \`section=resumen_actividad\`. |
| **Mensajería** | Puede enviar y recibir (Módulo \`/notificacion\`). | Puede enviar y recibir (Módulo \`/notificacion\`). |
| **Periodo Académico** | Puede cambiar el filtro histórico. | Puede cambiar el filtro histórico. |
`
  },
  {
    title: 'SIGE: Módulos Especiales (Zoom, Reportes, Comunicados)',
    content: `
## Análisis de Módulos Específicos
- **Comunicados / Notificaciones**: El sistema tiene una mensajería interna fuertemente integrada (\`/notificacion?t=1\`) similar a un correo electrónico interno. Es fundamental para la comunicación sin depender de WhatsApp.
- **Gestión de Evaluaciones**: Los títulos como "RESOLUCIÓN BANCO DE PREGUNTAS PRÁCTICO" indican que SIGE posee un módulo de exámenes en línea o banco de preguntas.
- **Trazabilidad (Dashboards)**: El docente tiene un dashboard que le indica cuántas tareas han sido calificadas (ej. "2/29" o "27/27"), funcionando como un semáforo de progreso.
`
  },
  {
    title: 'SIGE: Conclusiones Avanzadas y Mejoras Estratégicas UX/UI',
    content: `
## Conclusiones Avanzadas para nuestra Aula Virtual (Jerusalén)
1. **Rutas SEO/Amigables**: SIGE usa URLs basadas puramente en Query Params (\`?section=...&id=...\`). Nosotros debemos usar rutas semánticas en React (\`/profesor/cursos/1867/actividades\`) para mejor arquitectura y navegación.
2. **Dashboard Docente**: El docente valora métricas rápidas. La vista de "X de Y estudiantes calificados" (ej. "5/29") que tiene SIGE debe ser replicada en nuestra aula con barras de progreso circulares (Glassmorphism).
3. **Urgencia Estudiantil**: El estudiante de SIGE ve etiquetas como "5d rest." (5 días restantes). Esto crea sentido de urgencia. Debemos incorporar \`date-fns\` para calcular tiempo restante y mostrarlo en rojo si queda menos de 24h.
`
  }
];

async function main() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('No se encontró el token de TickTick.');
    return;
  }
  
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf-8'));
  const token = tokenData.access_token;
  
  const pRes = await fetch('https://api.ticktick.com/open/v1/project', { headers: { 'Authorization': 'Bearer ' + token } });
  const projects = await pRes.json();
  const contextList = projects.find((p: any) => p.name === 'Context');
  const projectId = contextList ? contextList.id : undefined;
  
  for (const part of parts) {
    await fetch('https://api.ticktick.com/open/v1/task', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: part.title,
        content: part.content,
        projectId: projectId
      })
    });
    console.log('Saved:', part.title);
  }
}

main().catch(console.error);
