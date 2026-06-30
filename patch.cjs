const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const helper = `// Helper function to retry lazy loading chunks
const lazyWithRetry = (componentImport) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      if (
        error.message.includes('Failed to fetch dynamically imported module') ||
        error.message.includes('Importing a module script failed') ||
        error.message.includes('error loading dynamically imported module')
      ) {
        if (!window.sessionStorage.getItem('chunk-failed-reload')) {
          window.sessionStorage.setItem('chunk-failed-reload', 'true');
          window.location.reload();
          return new Promise(() => {}); // Prevent rendering during reload
        }
      }
      window.sessionStorage.removeItem('chunk-failed-reload');
      throw error;
    }
  });
};
`;

code = code.replace('// Lazy loaded pages', helper + '\n// Lazy loaded pages');
code = code.replace(/lazy\(\(\) => import\(/g, 'lazyWithRetry(() => import(');
fs.writeFileSync('src/App.tsx', code);
