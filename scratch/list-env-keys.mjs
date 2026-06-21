import fs from 'fs';
const content = fs.readFileSync('g:/CODE/Iglesia Jerusalén/.env.local', 'utf8');
console.log(content.split('\n').map(l => l.split('=')[0].trim()).filter(Boolean));
