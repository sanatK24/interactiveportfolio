import { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import type { Database } from '../types/supabase';

interface UploadResult {
  url: string | null;
  error: Error | null;
}

export const useFileUpload = (): {
  uploadFile: (file: File, folder: string) => Promise<UploadResult>;
  isLoading: boolean;
  error: Error | null;
} => {
  const supabase = useSupabaseClient<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const uploadFile = async (file: File, folder: string): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        throw new Error('File size exceeds 50MB limit');
      }

      // Validate file type
      const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
      if (!validTypes.includes(file.type)) {
        throw new Error('Invalid file type. Only PNG, JPEG, and WEBP images are allowed');
      }

      const fileName = `${Date.now()}-${file.name}`;
      
      // Upload the file to the certifications bucket
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('certifications')
        .upload(`${folder}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Extract UUID from the path
      const uuid = uploadData.path.split('/').pop();
      if (!uuid) {
        throw new Error('Failed to extract UUID from uploaded file');
      }

      return {
        url: uuid,
        error: null
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(new Error(errorMessage));
      return {
        url: null,
        error: new Error(errorMessage)
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
