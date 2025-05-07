import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UploadResult {
  url: string | null;
  error: Error | null;
}

export const useFileUpload = (): { uploadFile: (file: File, folder: string) => Promise<UploadResult>, isLoading: boolean, error: Error | null } => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (file: File, folder: string): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`${folder}/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(`${folder}/${fileName}`);

      return {
        url: publicUrlData.publicUrl,
        error: null
      };
    } catch (err) {
      setError(err as Error);
      return {
        url: null,
        error: err as Error
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadFile,
    isLoading,
    error
  };
};
