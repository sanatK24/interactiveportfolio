import { useState } from 'react';
import { supabase } from '../lib/supabase';

interface UploadResult {
  url: string | null;
  error: Error | null;
}

interface UseFileUploadConfig {
  maxFileSize?: number;  // in bytes
  allowedTypes?: string[];
  defaultBucket?: string;
}

export const useFileUpload = (config: UseFileUploadConfig = {}): {
  uploadFile: (file: File, folder: string, bucket?: string) => Promise<UploadResult>;
  isLoading: boolean;
  error: Error | null;
} => {
  // Using centralized supabase client<Database>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedTypes = ['image/png', 'image/jpeg', 'image/webp'],
    defaultBucket = 'experience'
  } = config;

  const uploadFile = async (file: File, folder: string, bucket = defaultBucket): Promise<UploadResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate file size
      if (file.size > maxFileSize) {
        throw new Error(`File size exceeds ${maxFileSize / (1024 * 1024)}MB limit`);
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type. Only ${allowedTypes.join(', ')} are allowed`);
      }

      const fileName = `${Date.now()}-${file.name}`;
      
      // Upload the file to the specified bucket
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(`${folder}/${fileName}`, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL for the uploaded file
      const { data: publicUrlData } = await supabase.storage
        .from(bucket)
        .getPublicUrl(`${folder}/${fileName}`);

      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to get public URL for uploaded file');
      }

      return {
        url: publicUrlData.publicUrl,
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
