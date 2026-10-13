import { supabase } from '../config/supabase';
import { uploadFileToCloudinary } from './cloudinaryService';
export { getPreferredMediaProvider } from './mediaProviderPreference';
import { getPreferredMediaProvider } from './mediaProviderPreference';

export type MediaProvider = 'cloudinary' | 'supabase' | 'r2';
export type MediaResourceType = 'image' | 'video' | 'raw';

export interface MediaAsset {
  url: string;
  provider: MediaProvider;
  storagePath: string | null;
  publicId: string | null;
  format: string;
  resourceType: MediaResourceType;
}

interface R2UploadResponse {
  url?: string;
  key?: string;
}

export const isR2Configured = Boolean(import.meta.env.VITE_R2_UPLOAD_ENDPOINT);

export const getAvailableMediaProviders = (): Array<{ id: MediaProvider; label: string; description: string }> => [
  { id: 'cloudinary', label: 'Cloudinary', description: 'CDN, transformaciones y vídeos' },
  { id: 'supabase', label: 'Supabase Storage', description: 'Biblioteca propia del proyecto' },
  ...(isR2Configured ? [{ id: 'r2' as const, label: 'Cloudflare R2', description: 'Objetos grandes y respaldos' }] : []),
];

const registerAsset = async (asset: MediaAsset, file: File, folder: string, sha256: string | null): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from('media_vault_files').insert({
    name: file.name,
    url: asset.url,
    provider: asset.provider,
    storage_path: asset.storagePath,
    folder,
    mimetype: file.type,
    size: file.size,
    uploaded_by: sessionData.session?.user.id || null,
    metadata: { public_id: asset.publicId, resource_type: asset.resourceType, format: asset.format, sha256, rights: 'unverified' },
  });
  if (error) throw new Error(`El recurso se subió, pero no pudo catalogarse: ${error.message}`);
};

export const catalogUploadedMediaAsset = async (asset: MediaAsset, fileName: string, mimeType: string, size: number, folder: string): Promise<void> => {
  const { data: sessionData } = await supabase.auth.getSession();
  const { error } = await supabase.from('media_vault_files').insert({
    name: fileName,
    url: asset.url,
    provider: asset.provider,
    storage_path: asset.storagePath,
    folder,
    mimetype: mimeType,
    size,
    uploaded_by: sessionData.session?.user.id || null,
    metadata: { public_id: asset.publicId, resource_type: asset.resourceType, format: asset.format },
  });
  if (error) throw new Error(`El recurso se subió, pero no pudo catalogarse: ${error.message}`);
};

const uploadToSupabase = async (file: File, folder: string, resourceType: MediaResourceType): Promise<MediaAsset> => {
  const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
  const storagePath = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from('media_library').upload(storagePath, file, { contentType: file.type, upsert: false });
  if (error) throw new Error(`Supabase Storage rechazó el archivo: ${error.message}`);
  const { data } = supabase.storage.from('media_library').getPublicUrl(storagePath);
  return { url: data.publicUrl, provider: 'supabase', storagePath, publicId: null, format: extension, resourceType };
};

const uploadToR2 = async (file: File, folder: string, resourceType: MediaResourceType): Promise<MediaAsset> => {
  const endpoint = import.meta.env.VITE_R2_UPLOAD_ENDPOINT;
  if (!endpoint) throw new Error('Cloudflare R2 todavía no tiene un endpoint seguro de subida configurado.');
  const body = new FormData();
  body.append('file', file);
  body.append('folder', folder);
  body.append('resourceType', resourceType);
  const response = await fetch(endpoint, { method: 'POST', body });
  const payload = await response.json() as R2UploadResponse;
  if (!response.ok || !payload.url) throw new Error('El endpoint de Cloudflare R2 no devolvió una URL válida.');
  return { url: payload.url, provider: 'r2', storagePath: payload.key || null, publicId: null, format: file.name.split('.').pop()?.toLowerCase() || 'bin', resourceType };
};

export const uploadMediaAsset = async (file: File, provider: MediaProvider, folder: string, resourceType: MediaResourceType = 'image'): Promise<MediaAsset> => {
  // Bound hashing memory; large videos remain explicitly unverified for duplicates.
  const sha256 = file.size <= 100 * 1024 * 1024 ? Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()))).map(byte => byte.toString(16).padStart(2,'0')).join('') : null;
  if (sha256) {
    const duplicates = await supabase.from('media_vault_files').select('id').contains('metadata',{sha256}).limit(1);
    if (duplicates.error) throw new Error(`No se pudo comprobar duplicados: ${duplicates.error.message}`);
    if (duplicates.data?.length) throw new Error('Este archivo ya está en la biblioteca. Busca el recurso existente antes de volver a subirlo.');
  }
  const asset = provider === 'cloudinary'
    ? { url: await uploadFileToCloudinary(file, folder, resourceType), provider, storagePath: null, publicId: null, format: file.name.split('.').pop()?.toLowerCase() || 'bin', resourceType }
    : provider === 'supabase'
      ? await uploadToSupabase(file, folder, resourceType)
      : await uploadToR2(file, folder, resourceType);
  await registerAsset(asset, file, folder, sha256);
  return asset;
};

export const uploadMediaFile = async (file: File, folder: string, resourceType: MediaResourceType | 'auto' = 'auto'): Promise<string> => {
  const normalizedType: MediaResourceType = resourceType === 'auto'
    ? file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'raw'
    : resourceType;
  const asset = await uploadMediaAsset(file, getPreferredMediaProvider(), folder, normalizedType);
  return asset.url;
};
