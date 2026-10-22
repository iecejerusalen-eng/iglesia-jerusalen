export interface StoreBackend {
  authenticate(token: string): Promise<string>;
  limit(key: string): Promise<void>;
  execute(action: string, actor: string | null, secret: string, payload: Record<string, unknown>): Promise<unknown>;
  upload(path: string, file: File): Promise<void>;
  remove(path: string): Promise<void>;
  signedUrl(path: string): Promise<string>;
}
export class StoreValidationError extends Error {}

export function isReceiptContent(bytes: Uint8Array, mime: string): boolean {
  if (mime === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (mime === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => bytes[i] === v);
  if (mime === 'application/pdf') return new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  return mime === 'image/webp' && new TextDecoder().decode(bytes.slice(0, 4)) === 'RIFF'
    && new TextDecoder().decode(bytes.slice(8, 12)) === 'WEBP';
}

async function limitedBody(request: Request, max: number): Promise<Uint8Array<ArrayBuffer>> {
  const reader = request.body?.getReader();
  if (!reader) throw new Error('Solicitud vacía');
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.length;
      if (length > max) { await reader.cancel(); throw new Error('Solicitud demasiado grande'); }
      chunks.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
  return bytes;
}

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);

export function createStoreHandler(backend: StoreBackend, anonKey: string) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    const allowed = !origin || ['https://www.iecejerusalen.com', 'https://iecejerusalen.com'].includes(origin)
      || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
    const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': allowed && origin ? origin : 'https://www.iecejerusalen.com',
      'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
      'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Vary': 'Origin' };
    const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
    if (!allowed) return response({ error: 'Origen no permitido' }, 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST') return response({ error: 'Método no permitido' }, 405);
    try {
      const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') || '';
      let actor: string | null = null;
      if (token && token !== anonKey) actor = await backend.authenticate(token);
      else if (request.headers.get('apikey') !== anonKey && token !== anonKey) return response({ error: 'Autenticación requerida' }, 401);
      // Use a bounded shared guest budget rather than trusting client-supplied proxy/IP headers.
      await backend.limit(actor ? `user:${actor}` : 'guest:store');
      const multipart = request.headers.get('content-type')?.startsWith('multipart/form-data');
      const bytes = await limitedBody(request, multipart ? 5 * 1024 * 1024 + 32768 : 32768);
      if (multipart) {
        const form = await new Response(bytes, { headers: { 'Content-Type': request.headers.get('content-type') || '' } }).formData();
        const file = form.get('file');
        const orderId = form.get('order_id');
        const secret = form.get('secret');
        if (!(file instanceof File) || typeof orderId !== 'string' || typeof secret !== 'string') throw new Error('Comprobante inválido');
        if (file.size === 0 || file.size > 5 * 1024 * 1024 || !isReceiptContent(new Uint8Array(await file.arrayBuffer()), file.type)) throw new Error('Selecciona un comprobante JPG, PNG, WebP o PDF válido, de hasta 5 MB');
        await backend.execute('authorize_receipt', actor, secret, { order_id: orderId });
        const extension: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' };
        const path = `${orderId}/${crypto.randomUUID()}.${extension[file.type]}`;
        await backend.upload(path, file);
        try {
          return response(await backend.execute('attach_receipt', actor, secret, { order_id: orderId, path }));
        } catch (error) {
          // A lost RPC response may already have committed the association. Never delete that proof.
          if (!(error instanceof StoreValidationError)) throw new Error('No se pudo confirmar la asociación del comprobante. Actualiza el pedido antes de reintentar; no repitas la transferencia.', { cause: error });
          // Only a definitive transaction rejection proves this upload is an orphan.
          try { await backend.remove(path); }
          catch (cleanupError) { throw new Error('El pedido no aceptó el comprobante y su archivo necesita limpieza administrativa. No vuelvas a transferir.', { cause: cleanupError }); }
          throw error;
        }
      }
      const input: unknown = JSON.parse(new TextDecoder().decode(bytes));
      if (!record(input) || typeof input.action !== 'string' || !record(input.payload)) throw new Error('Solicitud inválida');
      const { action, payload } = input;
      if (!['create', 'pos', 'status', 'list_orders', 'receipt_read', 'admin_update'].includes(action)) throw new Error('Operación no disponible');
      if (['pos', 'list_orders', 'admin_update'].includes(action) && !actor) return response({ error: 'Inicia sesión para continuar' }, 401);
      const result = await backend.execute(action, actor, typeof input.secret === 'string' ? input.secret : '', payload);
      if (action === 'receipt_read') {
        if (!record(result) || typeof result.path !== 'string') throw new Error('Comprobante no disponible');
        return response({ url: await backend.signedUrl(result.path) });
      }
      return response(result);
    } catch (error) {
      return response({ error: error instanceof Error ? error.message : 'No se pudo completar la operación', rejected: error instanceof StoreValidationError }, 400);
    }
  };
}
