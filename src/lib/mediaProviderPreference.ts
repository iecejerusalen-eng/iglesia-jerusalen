import type { MediaProvider } from './mediaService';

const isR2Configured = Boolean(import.meta.env.VITE_R2_UPLOAD_ENDPOINT);

const STORAGE_KEY = 'jerusalen_media_provider';

export const getPreferredMediaProvider = (): MediaProvider => {
  const value = window.localStorage.getItem(STORAGE_KEY);
  if (value === 'supabase') return 'supabase';
  if (value === 'r2' && isR2Configured) return 'r2';
  return 'cloudinary';
};

export const setPreferredMediaProvider = (provider: MediaProvider): void => {
  window.localStorage.setItem(STORAGE_KEY, provider);
};
