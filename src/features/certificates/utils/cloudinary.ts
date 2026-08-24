import { uploadMediaAsset, type MediaResourceType } from '../../../lib/mediaService';
import { getPreferredMediaProvider } from '../../../lib/mediaProviderPreference';

export const uploadCertificateAsset = async (
  file: File,
  folder: string,
  resourceType: 'raw' | 'image' | 'auto' = 'raw'
): Promise<{ secure_url: string; public_id: string }> => {
  try {
    const normalizedType: MediaResourceType = resourceType === 'auto'
      ? file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'raw'
      : resourceType;
    const asset = await uploadMediaAsset(file, getPreferredMediaProvider(), `certificates/${folder}`, normalizedType);
    return {
      secure_url: asset.url,
      public_id: asset.publicId || asset.storagePath || '',
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
