import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

const functionUrl = process.env.SUPABASE_FUNCTION_URL;
const connectionId = process.env.PROPRESENTER_CONNECTION_ID;
const pairingCode = process.env.PROPRESENTER_PAIRING_CODE;
const proPresenterUrl = (process.env.PROPRESENTER_URL || 'http://127.0.0.1:50001').replace(/\/$/, '');
const overlayUrl = process.env.OVERLAY_URL?.replace(/\/$/, '');
const configDirectory = join(homedir(), '.iglesia-jerusalen');
const configPath = join(configDirectory, 'propresenter-device.json');

if (!functionUrl) throw new Error('Falta SUPABASE_FUNCTION_URL. Usa la URL de tu función propresenter-device.');

const jsonHeaders = { 'Content-Type': 'application/json' };

const callDevice = async (body, token) => {
  const headers = token ? { ...jsonHeaders, 'x-device-token': token } : jsonHeaders;
  const response = await fetch(functionUrl, { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await response.json();
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

const getDevice = async () => {
  const saved = await readSavedDevice();
  return saved || pairDevice();
};

const callProPresenter = async (path, options = {}) => {
  const response = await fetch(`${proPresenterUrl}${path}`, { ...options, headers: { ...jsonHeaders, ...(options.headers || {}) } });
  if (!response.ok) throw new Error(`ProPresenter ${response.status} en ${path}`);
  return response.status === 204 ? null : response.json();
};

const executeCommand = async (command) => {
  if (command.command_type === 'test_connection') {
    await callProPresenter('/v1/version');
    return;
  }
  if (command.command_type === 'next_slide') {
    await callProPresenter('/v1/playlist/active/presentation/next/trigger');
    return;
  }
  if (command.command_type === 'previous_slide') {
    await callProPresenter('/v1/playlist/active/presentation/previous/trigger');
    return;
  }
  if (!overlayUrl) throw new Error('Configura OVERLAY_URL para ejecutar órdenes de letras y transparencia.');
  const overlayMode = command.command_type === 'show_chords' ? 'lyrics-chords' : command.command_type === 'show_lyrics' ? 'lyrics' : command.command_type === 'clear_output' ? 'clear' : 'sync-service';
  const response = await fetch(`${overlayUrl}/commands`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify({ mode: overlayMode, ...command.payload }) });
  if (!response.ok) throw new Error(`Overlay respondió ${response.status}`);
};

const run = async () => {
  let device = await getDevice();
  let lastHeartbeat = 0;
  console.log(`Bridge activo. ProPresenter: ${proPresenterUrl}`);
  while (true) {
    try {
      const now = Date.now();
      if (now - lastHeartbeat > 15_000) {
        await callDevice({ action: 'heartbeat', computer_name: process.env.COMPUTERNAME || process.env.HOSTNAME || 'Equipo de producción', app_version: 'bridge-0.1.0' }, device.deviceToken);
        lastHeartbeat = now;
      }
      const data = await callDevice({ action: 'poll' }, device.deviceToken);
      for (const command of data.commands || []) {
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
      await new Promise((resolve) => setTimeout(resolve, 1200));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error(`Bridge desconectado: ${message}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      if (pairingCode && connectionId && message.includes('Invalid or disabled device token')) device = await pairDevice();
    }
  }
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
