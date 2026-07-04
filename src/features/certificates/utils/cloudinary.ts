export const uploadCertificateAsset = async (
  file: File,
  folder: string,
  resourceType: 'raw' | 'image' | 'auto' = 'raw'
): Promise<{ secure_url: string; public_id: string }> => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'degrlmvsq';
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'iglesia_jerusalen_web';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);
  formData.append('folder', `iglesia-jerusalen/certificates/${folder}`);

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
    return {
      secure_url: data.secure_url,
      public_id: data.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
