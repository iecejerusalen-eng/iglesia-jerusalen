import fs from 'fs';
import path from 'path';
import os from 'os';

const home = os.homedir();
console.log('Home directory:', home);

const pathsToCheck = [
  path.join(home, '.supabase'),
  path.join(home, '.config', 'supabase'),
  path.join(home, 'AppData', 'Roaming', 'supabase'),
  path.join(home, 'AppData', 'Local', 'supabase')
];

for (const p of pathsToCheck) {
  if (fs.existsSync(p)) {
    console.log(`Found directory: ${p}`);
    try {
      const contents = fs.readdirSync(p);
      console.log(`Contents:`, contents);
      // If there is a file like 'token' or 'config.toml'
      for (const item of contents) {
        const itemPath = path.join(p, item);
        const stat = fs.statSync(itemPath);
        if (stat.isFile()) {
          console.log(`  File: ${item} (${stat.size} bytes)`);
          if (item.toLowerCase().includes('token')) {
            const token = fs.readFileSync(itemPath, 'utf8').trim();
            console.log(`  Found token file! Length: ${token.length}`);
            console.log(`  Token: ${token.substring(0, 10)}...`);
          }
        }
      }
    } catch (e) {
      console.error(`Error reading ${p}:`, e.message);
    }
  } else {
    console.log(`Directory does not exist: ${p}`);
  }
}
