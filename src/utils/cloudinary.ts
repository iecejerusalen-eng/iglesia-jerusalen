// Utility wrapper for Cloudinary uploads used throughout the project.
// Re-exports the generic upload function from the lib folder and provides a
// convenience `uploadImage` helper that defaults the resource type to "image".

import { uploadFileToCloudinary } from '../lib/cloudinaryService';

/**
 * Upload an image file to Cloudinary.
 * @param file - The image file to upload.
 * @param folder - Destination folder inside the Cloudinary account.
 * @returns Promise resolving to the secure URL of the uploaded image.
 */
export const uploadImage = async (file: File, folder: string): Promise<{ secure_url: string }> => {
  // Force the resource type to "image" for clarity.
  const secure_url = await uploadFileToCloudinary(file, folder, 'image');
  return { secure_url };
};

// Re-export the generic function for cases where callers need explicit control.
export { uploadFileToCloudinary };
