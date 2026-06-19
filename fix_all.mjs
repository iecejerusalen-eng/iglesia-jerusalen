import fs from 'fs';
import path from 'path';

const dir = 'src/pages/public';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Replace text-primary, text-gray-xxx, and bg-white without their dark counterparts
  content = content.replace(/text-primary(?! dark:text-white| dark:text-\w+)/g, 'text-primary dark:text-white');
  content = content.replace(/text-gray-655(?! dark:text-gray-\d+)/g, 'text-gray-655 dark:text-gray-300');
  content = content.replace(/text-gray-500(?! dark:text-gray-\d+)/g, 'text-gray-500 dark:text-gray-400');
  content = content.replace(/text-gray-600(?! dark:text-gray-\d+)/g, 'text-gray-600 dark:text-gray-300');
  content = content.replace(/bg-white(?! dark:bg-slate-900| dark:bg-slate-950|\/)/g, 'bg-white dark:bg-slate-900');

  // Fix duplicates that might have been created
  content = content.replace(/dark:text-white dark:text-white/g, 'dark:text-white');
  content = content.replace(/dark:text-gray-300 dark:text-gray-300/g, 'dark:text-gray-300');
  content = content.replace(/dark:bg-slate-900 dark:bg-slate-900/g, 'dark:bg-slate-900');

  fs.writeFileSync(filePath, content);
}
console.log("Fixed dark mode classes across all public pages.");
