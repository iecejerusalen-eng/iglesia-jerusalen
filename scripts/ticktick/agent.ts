import fs from 'fs';
import path from 'path';

// Note: This requires Node 18+ for native fetch
const TOKEN_PATH = path.join(__dirname, 'token.json');

async function getAccessToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    console.error('No token found. Please run auth.js first.');
    process.exit(1);
  }
  const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  return tokenData.access_token;
}

async function fetchTasks(token: string) {
  const res = await fetch('https://api.ticktick.com/open/v1/project', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const projects = await res.json();
  
  // We need to fetch tasks from the 'inbox' or other projects.
  // The TickTick open API endpoint for tasks is usually under projects.
  // Wait, let's look at projects first.
  console.log('Projects:', JSON.stringify(projects, null, 2));

  // Typically, to get tasks for a project: /open/v1/project/{projectId}/data
  for (const project of projects) {
    if (project.id === 'inbox') {
      const pRes = await fetch(`https://api.ticktick.com/open/v1/project/${project.id}/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await pRes.json();
      console.log('Inbox Tasks:', JSON.stringify(data.tasks, null, 2));
    }
  }
}

async function main() {
  console.log('--- Iniciando Antigravity TickTick Agent ---');
  const token = await getAccessToken();
  console.log('Token obtenido exitosamente.');
  
  await fetchTasks(token);
  
  console.log('--- Analisis de tareas finalizado ---');
}

main().catch(console.error);
