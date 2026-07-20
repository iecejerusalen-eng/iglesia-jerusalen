const http = require('http');
const url = require('url');
const fs = require('fs');

const CLIENT_ID = 'Je10zsEaXnG3RjMK6B';
const CLIENT_SECRET = 'DIEkZZIOr3tCBYZ0Tt5AfQ4YD9zmPl2J';
const REDIRECT_URI = 'http://localhost:5173/auth/callback';

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);

  if (parsedUrl.pathname === '/') {
    const authUrl = `https://ticktick.com/oauth/authorize?client_id=${CLIENT_ID}&scope=tasks:write%20tasks:read&state=state&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h1>TickTick OAuth</h1>
      <p><a href="${authUrl}">Haz clic aqui para autorizar la aplicacion con TickTick</a></p>
    `);
  } else if (parsedUrl.pathname === '/auth/callback') {
    const code = parsedUrl.query.code;
    
    if (code) {
      try {
        console.log('Got authorization code, requesting token...');
        
        const params = new URLSearchParams();
        params.append('client_id', CLIENT_ID);
        params.append('client_secret', CLIENT_SECRET);
        params.append('code', code);
        params.append('grant_type', 'authorization_code');
        params.append('redirect_uri', REDIRECT_URI);
        params.append('scope', 'tasks:write tasks:read');

        const tokenRes = await fetch('https://ticktick.com/oauth/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: params
        });

        const tokenData = await tokenRes.json();
        
        if (tokenData.access_token) {
          fs.writeFileSync('scripts/ticktick/token.json', JSON.stringify(tokenData, null, 2));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`<h1>Exito!</h1><p>El token ha sido guardado exitosamente. Ya puedes cerrar esta ventana.</p>`);
          console.log('Token successfully saved to scripts/ticktick/token.json');
          setTimeout(() => process.exit(0), 1000);
        } else {
          console.error('Error fetching token:', tokenData);
          res.writeHead(400, { 'Content-Type': 'text/plain' });
          res.end('Error fetching token.');
        }
      } catch (err) {
        console.error('Exception fetching token:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server error during token fetch.');
      }
    } else {
      res.writeHead(400, { 'Content-Type': 'text/plain' });
      res.end('No code provided');
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
});

server.listen(5173, () => {
  console.log('Servidor iniciado en http://localhost:5173');
  console.log('Por favor, entra a http://localhost:5173 para comenzar la autorizacion.');
});
