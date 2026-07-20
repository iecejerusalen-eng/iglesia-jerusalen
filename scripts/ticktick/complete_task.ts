import fs from 'fs';
import path from 'path';

// Lee el token desde token.json
const tokenPath = path.join(process.cwd(), 'scripts', 'ticktick', 'token.json');
let tokenData = { access_token: '' };

try {
  const tokenFile = fs.readFileSync(tokenPath, 'utf8');
  tokenData = JSON.parse(tokenFile);
} catch (e) {
  console.error('Error leyendo token. Ejecuta auth.cjs primero.');
  process.exit(1);
}

const token = tokenData.access_token;
const taskIds = process.argv.slice(2);

if (taskIds.length === 0) {
  console.log('Provee los IDs de las tareas a completar');
  process.exit(1);
}

async function completeTask(taskId: string, projectId: string) {
  try {
    const response = await fetch(`https://api.ticktick.com/open/v1/project/${projectId}/task/${taskId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: 2 // 2 means completed in ticktick API
      })
    });
    
    // The TickTick open API v1 actually requires updating the entire task for standard completion, or simply a POST to complete endpoint?
    // Wait, the official API doc for completion says: POST /open/v1/project/{projectId}/task/{taskId}/complete
    
    const completeUrl = `https://api.ticktick.com/open/v1/project/${projectId}/task/${taskId}/complete`;
    const res = await fetch(completeUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (res.ok) {
      console.log(`Tarea ${taskId} completada exitosamente.`);
    } else {
      console.log(`Error al completar la tarea ${taskId}:`, res.status, res.statusText);
      const err = await res.text();
      console.log(err);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

async function run() {
    // 69969494ebc75a00000000be is the project PROYECTOS
    const projectId = "69969494ebc75a00000000be";
    for(const id of taskIds) {
        await completeTask(id, projectId);
    }
}

run();
