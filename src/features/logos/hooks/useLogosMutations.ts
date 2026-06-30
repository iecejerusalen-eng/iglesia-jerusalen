import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../config/supabase';
import type { LogoData } from '../types';
import { toast } from 'sonner';
import { uploadFileToCloudinary } from '../../../lib/cloudinaryService';

interface UploadLogoArgs {
  file: File;
  ministryId: string;
  variant: string;
  colorMode: string;
}

export const useUploadLogo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ file, ministryId, variant, colorMode }: UploadLogoArgs) => {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';

      // Subir a Cloudinary (resourceType 'image' o 'auto')
      const fileUrl = await uploadFileToCloudinary(file, 'logos', 'auto');

      const { error: dbError } = await supabase
        .from('logos')
        .insert({
          ministry_id: ministryId || null,
          variant,
          color_mode: colorMode,
          format: fileExt,
          storage_path: fileUrl
        });

      if (dbError) {
        throw dbError;
      }
    },
    onSuccess: () => {
      toast.success('Logo subido y registrado con éxito.');
      queryClient.invalidateQueries({ queryKey: ['logos'] });
    },
    onError: (err: any) => {
      console.error('Error uploading logo:', err);
      toast.error('Error al subir el logo: ' + err.message);
    }
  });
};

export const useDeleteLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (logo: LogoData) => {
      // Solo borrar del storage de Supabase si es una ruta antigua (legacy)
      if (!logo.storage_path.startsWith('http')) {
        const { error: storageError } = await supabase.storage
          .from('logos')
          .remove([logo.storage_path]);
        if (storageError) console.warn('Advertencia al borrar del storage:', storageError);
      }

      const { error: dbError } = await supabase
        .from('logos')
        .delete()
        .eq('id', logo.id);
      if (dbError) throw dbError;
    },
    onSuccess: () => {
      toast.success('Logo eliminado correctamente.');
      queryClient.invalidateQueries({ queryKey: ['logos'] });
    },
    onError: (err: any) => {
      console.error('Error deleting logo:', err);
      toast.error('Error al eliminar el logo: ' + err.message);
    }
  });
};
