import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Obtener el dominio de los argumentos de la terminal
const domain = process.argv[2];

if (!domain) {
  console.error('Uso: node scripts/fetch-logo.js <dominio.com>');
  process.exit(1);
}

// Limpiar el nombre del archivo del dominio
const name = domain.replace(/^(https?:\/\/)?(www\.)?/, '').split('.')[0];
const targetDir = path.join(__dirname, '..', 'src', 'assets', 'logos');
const targetPath = path.join(targetDir, `${name}.png`);

// Asegurarse de que el directorio de logos exista
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// URL de la API de Clearbit
const logoUrl = `https://logo.clearbit.com/${domain}`;

console.log(`Buscando logo para ${domain} desde ${logoUrl}...`);

https.get(logoUrl, (response) => {
  if (response.statusCode === 404) {
    console.error(`Error: No se encontró ningún logo para el dominio: ${domain}`);
    process.exit(1);
  }

  if (response.statusCode !== 200) {
    console.error(`Error: Respuesta del servidor con código de estado ${response.statusCode}`);
    process.exit(1);
  }

  const fileStream = fs.createWriteStream(targetPath);
  response.pipe(fileStream);

  fileStream.on('finish', () => {
    fileStream.close();
    console.log(`¡Éxito! Logo guardado en: src/assets/logos/${name}.png`);
  });
}).on('error', (err) => {
  console.error('Error al descargar el logo:', err.message);
  process.exit(1);
});
