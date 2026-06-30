import { supabase } from '../config/supabase';

/**
 * Sube un archivo a Cloudinary usando la API REST (Unsigned Upload).
 * @param file - Archivo (File object) a subir.
 * @param folder - Carpeta destino dentro de Cloudinary (ej: 'logos', 'inventory').
 * @param resourceType - 'auto' | 'image' | 'video' | 'raw' (por defecto auto).
 * @returns Promesa que resuelve a la URL segura (secure_url) de Cloudinary.
 */
export const uploadFileToCloudinary = async (
  file: File,
  folder: string,
  resourceType: 'image' | 'video' | 'raw' | 'auto' = 'auto'
): Promise<string> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'degrlmvsq';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'iglesia_jerusalen_web';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  // Optional: you can prepend a base directory if needed, e.g., `iglesia-jerusalen/${folder}`
  formData.append('folder', `iglesia-jerusalen/${folder}`);

  const endpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Error al subir archivo a Cloudinary');
    }

    const data = await response.json();
    return data.secure_url;
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

/**
 * Devuelve la URL pública correcta ya sea que el archivo esté en Cloudinary o en Supabase (Legacy).
 * @param pathOrUrl - Ruta de supabase (ej: 'logo.png') o URL completa de Cloudinary.
 * @param fallbackBucket - Nombre del bucket de Supabase donde buscar el archivo si es legacy.
 */
export const getStorageUrl = (pathOrUrl: string | null | undefined, fallbackBucket: string): string => {
  if (!pathOrUrl) return '';
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://')) {
    return pathOrUrl;
  }
  return supabase.storage.from(fallbackBucket).getPublicUrl(pathOrUrl).data.publicUrl;
};
