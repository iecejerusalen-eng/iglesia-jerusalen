import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { homedir } from 'node:os';
import { join } from 'node:path';

const functionUrl = process.env.SUPABASE_FUNCTION_URL;
const connectionId = process.env.PROPRESENTER_CONNECTION_ID;
const pairingCode = process.env.PROPRESENTER_PAIRING_CODE;
const proPresenterUrl = (process.env.PROPRESENTER_URL || 'http://127.0.0.1:50001').replace(/\/$/, '');
const messageId = process.env.PROPRESENTER_MESSAGE_ID?.trim();
const messageToken = process.env.PROPRESENTER_MESSAGE_TOKEN?.trim() || 'text';
const stageChordsEnabled = process.env.PROPRESENTER_STAGE_CHORDS !== 'false';
const overlayPort = Number(process.env.OVERLAY_PORT || 43177);
const idlePollMs = Math.max(1_500, Number(process.env.IDLE_POLL_MS || 5_000));
const activePollMs = Math.max(500, Number(process.env.ACTIVE_POLL_MS || 800));
const configDirectory = join(homedir(), '.iglesia-jerusalen');
const configPath = join(configDirectory, 'propresenter-device.json');

if (!functionUrl) throw new Error('Falta SUPABASE_FUNCTION_URL. Usa la URL de tu función propresenter-device.');
if (!Number.isInteger(overlayPort) || overlayPort < 1 || overlayPort > 65_535) throw new Error('OVERLAY_PORT debe ser un puerto válido.');

const jsonHeaders = { 'Content-Type': 'application/json' };
const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const overlayState = {
  content: null,
  currentSlideIndex: 0,
  visible: false,
  updatedAt: new Date().toISOString(),
};

const overlayDocument = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Jerusalén · Overlay ProPresenter</title>
  <style>
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, sans-serif; }
    * { box-sizing: border-box; }
    html, body { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
    main { display: flex; width: 100%; height: 100%; align-items: flex-end; justify-content: center; padding: 6vh 7vw; opacity: 0; transition: opacity 180ms ease; }
    main.visible { opacity: 1; }
    .content { width: min(92vw, 1600px); white-space: pre-line; text-align: center; color: #fff; font-size: clamp(34px, 4.25vw, 82px); font-weight: 800; line-height: 1.16; letter-spacing: -.025em; text-wrap: balance; text-shadow: 0 3px 12px rgba(0,0,0,.92), 0 1px 2px rgba(0,0,0,1); }
    body.stage main { align-items: center; justify-content: flex-start; padding: 5vh 6vw; }
    body.stage .content { width: min(94vw, 1800px); text-align: left; text-wrap: auto; }
    .stage-line + .stage-line { margin-top: clamp(24px, 4vh, 60px); }
    .stage-chords { min-height: 1.25em; overflow: hidden; color: #fbbf24; font-family: "Cascadia Mono", "SFMono-Regular", Consolas, monospace; font-size: clamp(24px, 2.8vw, 54px); font-weight: 900; line-height: 1.15; letter-spacing: 0; white-space: pre; text-shadow: 0 2px 10px rgba(0,0,0,.95); }
    .stage-lyrics { color: #fff; font-size: clamp(38px, 4.6vw, 88px); font-weight: 850; line-height: 1.12; text-wrap: balance; }
    .meta { position: fixed; right: 2vw; top: 2vh; color: rgba(255,255,255,.68); font-size: 13px; font-weight: 700; opacity: 0; }
    body.debug { background: linear-gradient(135deg, #07152f, #152555); }
    body.debug .meta { opacity: 1; }
  </style>
</head>
<body>
  <main id="overlay"><div id="content" class="content"></div></main>
  <div id="meta" class="meta"></div>
  <script>
    const root = document.getElementById('overlay');
    const content = document.getElementById('content');
    const meta = document.getElementById('meta');
    const parameters = new URLSearchParams(location.search);
    const stageView = parameters.get('view') === 'stage';
    if (parameters.has('debug')) document.body.classList.add('debug');
    if (stageView) document.body.classList.add('stage');
    let revision = '';
    function renderSlide(slide) {
      content.replaceChildren();
      if (!slide) return;
      if (!stageView) {
        content.textContent = slide.text || '';
        return;
      }
      const lines = Array.isArray(slide.lines) ? slide.lines : [];
      lines.forEach((line) => {
        const group = document.createElement('div');
        group.className = 'stage-line';
        if (line.chord_line) {
          const chords = document.createElement('div');
          chords.className = 'stage-chords';
          chords.textContent = line.chord_line;
          group.appendChild(chords);
        }
        const lyrics = document.createElement('div');
        lyrics.className = 'stage-lyrics';
        lyrics.textContent = line.lyrics || '';
        group.appendChild(lyrics);
        content.appendChild(group);
      });
      if (lines.length === 0) content.textContent = slide.stage_text || slide.text || '';
    }
    async function refresh() {
      try {
        const response = await fetch('/state', { cache: 'no-store' });
        const state = await response.json();
        if (state.updatedAt !== revision) {
          revision = state.updatedAt;
          renderSlide(state.slide);
          meta.textContent = state.content ? state.content.title + ' · ' + (state.currentSlideIndex + 1) + '/' + state.content.slides.length : 'Sin contenido';
          root.classList.toggle('visible', Boolean(state.visible && state.slide));
        }
      } catch (error) {
        root.classList.remove('visible');
      }
    }
    refresh();
    setInterval(refresh, 250);
  </script>
</body>
</html>`;

const writeJson = (response, status, value) => {
  response.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
  });
  response.end(JSON.stringify(value));
};

const currentSlide = () => overlayState.content?.slides?.[overlayState.currentSlideIndex] ?? null;
const touchOverlay = () => { overlayState.updatedAt = new Date().toISOString(); };

const startOverlayServer = () => {
  const server = createServer((request, response) => {
    const url = new URL(request.url || '/', `http://127.0.0.1:${overlayPort}`);
    if (request.method === 'GET' && url.pathname === '/overlay') {
      response.writeHead(200, { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=utf-8' });
      response.end(overlayDocument);
      return;
    }
    if (request.method === 'GET' && url.pathname === '/state') {
      writeJson(response, 200, { ...overlayState, slide: currentSlide() });
      return;
    }
    if (request.method === 'GET' && url.pathname === '/health') {
      writeJson(response, 200, {
        ok: true,
        version: 'bridge-0.3.0',
        overlay_url: `http://127.0.0.1:${overlayPort}/overlay`,
        stage_overlay_url: `http://127.0.0.1:${overlayPort}/overlay?view=stage`,
      });
      return;
    }
    writeJson(response, 404, { error: 'Not found' });
  });
  server.listen(overlayPort, '127.0.0.1', () => {
    console.log(`Overlay local: http://127.0.0.1:${overlayPort}/overlay`);
  });
  server.on('error', (error) => {
    console.error(`No se pudo iniciar el overlay local: ${error.message}`);
  });
  return server;
};

const callDevice = async (body, token) => {
  const headers = token ? { ...jsonHeaders, 'x-device-token': token } : jsonHeaders;
  const response = await fetch(functionUrl, { method: 'POST', headers, body: JSON.stringify(body) });
  const raw = await response.text();
  let data = {};
  if (raw) {
    try { data = JSON.parse(raw); } catch { throw new Error(`Device API devolvió una respuesta no válida (${response.status}).`); }
  }
  if (!response.ok) throw new Error(data.error || `Device API respondió ${response.status}`);
  return data;
};

const readSavedDevice = async () => {
  try {
    return JSON.parse(await readFile(configPath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return null;
    throw error;
  }
};

const pairDevice = async () => {
  if (!connectionId || !pairingCode) throw new Error('Para el primer arranque define PROPRESENTER_CONNECTION_ID y PROPRESENTER_PAIRING_CODE.');
  const data = await callDevice({ action: 'pair', connection_id: connectionId, pairing_code: pairingCode }, null);
  await mkdir(configDirectory, { recursive: true });
  await writeFile(configPath, JSON.stringify({ connectionId: data.connection.id, deviceToken: data.device_token }, null, 2), { mode: 0o600 });
  console.log(`Dispositivo emparejado: ${data.connection.name}`);
  return { connectionId: data.connection.id, deviceToken: data.device_token };
};

const getDevice = async () => (await readSavedDevice()) || pairDevice();

const callProPresenter = async (path, options = {}) => {
  const response = await fetch(`${proPresenterUrl}${path}`, { ...options, headers: { ...jsonHeaders, ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`ProPresenter respondió ${response.status} en ${path}`);
  if (response.status === 204) return null;
  const raw = await response.text();
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return raw; }
};

const readContent = (command) => {
  const content = command?.payload?.content;
  if (!content || typeof content !== 'object' || !Array.isArray(content.slides)) {
    throw new Error('La orden no incluye un snapshot válido de la canción.');
  }
  return content;
};

const showMessageSlide = async () => {
  if (!messageId) return;
  const slide = currentSlide();
  if (!slide) throw new Error('No hay una diapositiva preparada.');
  await callProPresenter(`/v1/message/${encodeURIComponent(messageId)}/trigger`, {
    method: 'POST',
    body: JSON.stringify([{ name: messageToken, text: { text: slide.text } }]),
  });
};

const currentStageChords = () => {
  const slide = currentSlide();
  if (!slide || !Array.isArray(slide.lines)) return '';
  return slide.lines
    .map((line) => typeof line?.chord_line === 'string' ? line.chord_line : '')
    .filter(Boolean)
    .join('\n')
    .trimEnd();
};

const showStageChords = async () => {
  if (!stageChordsEnabled) return;
  const chords = currentStageChords();
  await callProPresenter('/v1/stage/message', chords
    ? { method: 'PUT', body: JSON.stringify(chords) }
    : { method: 'DELETE' });
};

const loadOverlayContent = async (content, slideIndex = 0) => {
  overlayState.content = content;
  overlayState.currentSlideIndex = Math.max(0, Math.min(Number(slideIndex) || 0, Math.max(0, content.slides.length - 1)));
  overlayState.visible = content.slides.length > 0;
  touchOverlay();
  await Promise.all([showMessageSlide(), showStageChords()]);
};

const moveOverlay = async (offset) => {
  if (!overlayState.content?.slides?.length) return false;
  overlayState.currentSlideIndex = Math.max(0, Math.min(overlayState.currentSlideIndex + offset, overlayState.content.slides.length - 1));
  overlayState.visible = true;
  touchOverlay();
  await Promise.all([showMessageSlide(), showStageChords()]);
  return true;
};

const advancePresentation = async (offset) => {
  const path = offset > 0
    ? '/v1/presentation/active/next/trigger'
    : '/v1/presentation/active/previous/trigger';
  const [overlayResult, presentationResult] = await Promise.allSettled([
    moveOverlay(offset),
    callProPresenter(path),
  ]);
  const overlayAdvanced = overlayResult.status === 'fulfilled' && overlayResult.value;
  const presentationAdvanced = presentationResult.status === 'fulfilled';
  if (!overlayAdvanced && !presentationAdvanced) {
    if (presentationResult.status === 'rejected') throw presentationResult.reason;
    if (overlayResult.status === 'rejected') throw overlayResult.reason;
    throw new Error('No hay contenido preparado ni una presentación activa para avanzar.');
  }
  if (overlayResult.status === 'rejected') console.warn(`El overlay no pudo avanzar: ${overlayResult.reason}`);
  if (presentationResult.status === 'rejected') console.warn(`La presentación activa no pudo avanzar: ${presentationResult.reason}`);
};

const clearOutput = async () => {
  overlayState.visible = false;
  touchOverlay();
  const operations = [callProPresenter('/v1/clear/layer/slide')];
  if (messageId) operations.push(callProPresenter(`/v1/message/${encodeURIComponent(messageId)}/clear`));
  if (stageChordsEnabled) operations.push(callProPresenter('/v1/stage/message', { method: 'DELETE' }));
  const results = await Promise.allSettled(operations);
  if (results.every((result) => result.status === 'rejected')) {
    const failure = results[0];
    throw failure.status === 'rejected' ? failure.reason : new Error('No se pudo limpiar la salida.');
  }
};

const executeCommand = async (command) => {
  switch (command.command_type) {
    case 'test_connection':
      await callProPresenter('/version');
      return;
    case 'show_lyrics':
    case 'show_chords':
    case 'sync_service':
      await loadOverlayContent(readContent(command), command.payload?.slide_index);
      return;
    case 'trigger_slide':
      await loadOverlayContent(readContent(command), command.payload?.slide_index);
      return;
    case 'next_slide':
      await advancePresentation(1);
      return;
    case 'previous_slide':
      await advancePresentation(-1);
      return;
    case 'clear_output':
      await clearOutput();
      return;
    default:
      throw new Error(`Orden no compatible: ${command.command_type}`);
  }
};

const run = async () => {
  startOverlayServer();
  let device = await getDevice();
  let lastHeartbeat = 0;
  let activeUntil = 0;
  console.log(`Bridge activo. ProPresenter: ${proPresenterUrl}`);
  if (messageId) console.log(`Mensajes ProPresenter: ${messageId} · token {${messageToken}}`);

  while (true) {
    try {
      const now = Date.now();
      if (now - lastHeartbeat > 20_000) {
        await callDevice({ action: 'heartbeat', computer_name: process.env.COMPUTERNAME || process.env.HOSTNAME || 'Equipo de producción', app_version: 'bridge-0.3.0' }, device.deviceToken);
        lastHeartbeat = now;
      }
      const data = await callDevice({ action: 'poll' }, device.deviceToken);
      const commands = Array.isArray(data.commands) ? data.commands : [];
      if (commands.length > 0) activeUntil = Date.now() + 15_000;
      for (const command of commands) {
        try {
          await executeCommand(command);
          await callDevice({ action: 'ack', command_id: command.id, status: 'acknowledged' }, device.deviceToken);
          console.log(`OK ${command.command_type} ${command.id}`);
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          await callDevice({ action: 'ack', command_id: command.id, status: 'failed', error_message: message }, device.deviceToken);
          console.error(`FAIL ${command.command_type}: ${message}`);
        }
      }
      await wait(Date.now() < activeUntil ? activePollMs : idlePollMs);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`Bridge desconectado: ${message}`);
      await wait(5_000);
      if (pairingCode && connectionId && message.includes('Invalid or disabled device token')) device = await pairDevice();
    }
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
