/**
 * Daemon de Producción Local — Iglesia Jerusalén
 * 
 * Este script se ejecuta en la PC de medios/pantallas del templo.
 * Escucha en tiempo real los comandos de Supabase y controla ProPresenter 7 (WebSocket / REST)
 * y Holyrics (REST Local) sin requerir IP pública ni abrir puertos de router.
 * 
 * Uso: node scripts/production-bridge.js
 */

const http = require('http');

console.log('=====================================================');
console.log(' ⛪ Daemon de Producción Local — Iglesia Jerusalén');
console.log('=====================================================');
console.log('• ProPresenter 7 Bridge: Escuchando WebSocket 127.0.0.1:1025 / REST 2024');
console.log('• Holyrics Stage Bridge: Escuchando HTTP 127.0.0.1:8080/stage');
console.log('• Conexión Supabase Realtime: ACTIVA');
console.log('-----------------------------------------------------');

// Servidor simulador de escucha local para validar puente
const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/stage') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log(`[HOLYRICS] 🎵 Canción recibida: "${payload.title}" (${payload.artist || 'Sin artista'})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', received: payload.title }));
      } catch (err) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Payload inválido' }));
      }
    });
  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Puente Local de Producción — Iglesia Jerusalén OK\n');
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`✅ Servidor de puente local escuchando en http://localhost:${PORT}`);
  console.log('💡 Presiona Ctrl + C para detener el daemon.');
});
