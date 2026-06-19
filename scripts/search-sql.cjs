const fs = require('fs');
const path = require('path');

const dirPath = path.join(__dirname, '..', 'supabase');

try {
  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    if (file.endsWith('.sql')) {
      const filePath = path.join(dirPath, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.toLowerCase().includes('profiles') || line.toLowerCase().includes('trigger')) {
          console.log(`${file}:${idx + 1}: ${line.trim()}`);
        }
      });
    }
  }
} catch (err) {
  console.error('Error scanning supabase directory:', err);
}
