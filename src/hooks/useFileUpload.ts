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
      
      // First check if the bucket exists
      const { error: bucketError } = await supabase.storage
        .from('uploads')
        .list('');

      if (bucketError) {
        throw new Error(`Bucket error: ${bucketError.message}`);
      }

      // Upload the file
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(`${folder}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      // Get the public URL
      const { data, error } = await supabase.storage
        .from('uploads')
        .getPublicUrl(`${folder}/${fileName}`) as { data: { publicUrl: string }, error: any };

      if (error) {
        throw new Error(`URL error: ${error.message}`);
      }

      return {
        url: data?.publicUrl,
        error: null
      };
    } catch (err) {
      console.error('File upload error:', err);
      setError(err instanceof Error ? err : new Error('Upload failed'));
      return {
        url: null,
        error: err instanceof Error ? err : new Error('Upload failed')
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
