import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const workspaceDir = path.resolve(__dirname, '..');

const searchTerms = ['pass', 'pwd', 'secret', 'key', 'token', 'postgres:', 'postgresql:'];
const ignoreDirs = ['node_modules', 'dist', '.git', '.vscode', 'assets'];

function search(dir) {
  try {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        if (!ignoreDirs.includes(file)) {
          search(fullPath);
        }
      } else {
        // Only check text files
        if (file.endsWith('.js') || file.endsWith('.ts') || file.endsWith('.json') || file.endsWith('.env') || file.includes('.env.')) {
          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');
          lines.forEach((line, idx) => {
            const lowerLine = line.toLowerCase();
            for (const term of searchTerms) {
              if (lowerLine.includes(term)) {
                // Avoid logging very long lines or common libraries
                if (line.length < 200 && !lowerLine.includes('supabase_url') && !lowerLine.includes('anon_key') && !lowerLine.includes('cloudinary') && !lowerLine.includes('github_token') && !lowerLine.includes('service_role')) {
                  console.log(`${path.relative(workspaceDir, fullPath)}:${idx + 1}: ${line.trim()}`);
                }
              }
            }
          });
        }
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

search(workspaceDir);
console.log('Search completed.');
