import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useFileUpload } from '../hooks/useFileUpload';
import { Editor } from '@tinymce/tinymce-react';
import type { Database } from '../types/supabase';

type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert'];

type BlogPostFormData = Omit<BlogPostInsert, 'id' | 'created_at' | 'updated_at'> & {
  thumbnail: File | null;
  slug?: string;  // Make slug optional since it's generated during submission
};

const generateSlug = (title: string, timestamp = Date.now()): string => {
  return `${title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')}-${timestamp}`;
};

interface BlogPostFormProps {
  onSuccess?: () => void;
}

export const BlogPostForm: React.FC<BlogPostFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: '',
    content: '',
    excerpt: '',
    thumbnail: null,
    slug: '',
    is_published: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadFile } = useFileUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check authentication
      const { data: { user }, error: authError } = await useSupabaseClient().auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to create a blog post');
      }

      if (!formData.title.trim()) {
        throw new Error('Title is required');
      }

      let thumbnailUrl = '';
      if (formData.thumbnail) {
        const uploadResult = await uploadFile(formData.thumbnail, 'blog');
        if (uploadResult.error) {
          throw new Error('Failed to upload thumbnail: ' + uploadResult.error.message);
        }
        thumbnailUrl = uploadResult.url || '';
      }

      // Generate a unique slug with timestamp
      let slug = generateSlug(formData.title);

      // First check if slug exists
      const { data: existingPost, error: checkError } = await useSupabaseClient()
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();

      if (checkError) {
        console.error('Check error:', checkError);
        if (checkError.code === 'PGRST116') {
          // Generate a new slug with timestamp
          slug = generateSlug(formData.title, Date.now());
          console.log('Generated new slug:', slug);
        } else {
          throw checkError;
        }
      }
      if (existingPost) {
        // Generate a new slug with timestamp
        slug = generateSlug(formData.title, Date.now());
        console.log('Generated new slug:', slug);
      }

      console.log('Final slug:', slug);

      const { error: createError } = await useSupabaseClient()
        .from('blog_posts')
        .insert({
          title: formData.title,
          content: formData.content,
          slug,
          is_published: false,  // Set to false by default
          excerpt: formData.excerpt || '',
          thumbnail_url: thumbnailUrl || null
        })
        .select();

      if (createError) {
        console.error('Create error:', createError);
        if (createError.code === '23505') {
          // Generate a new slug with timestamp
          slug = generateSlug(formData.title, Date.now());
          console.log('Generated new slug:', slug);
          
          // Try again with new slug
          const { error: retryError } = await useSupabaseClient()
            .from('blog_posts')
            .insert({
              title: formData.title,
              content: formData.content,
              slug,
              is_published: false,  // Set to false by default
              excerpt: formData.excerpt || '',
              thumbnail_url: thumbnailUrl || null
            })
            .select();

          if (retryError) {
            throw retryError;
          }
        } else {
          throw createError;
        }
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Error object:', err);
      setError(err instanceof Error ? err.message : 'Failed to create blog post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Title
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Excerpt
        </label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={3}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Content
        </label>
        <Editor
          apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
          init={{
            height: 500,
            menubar: true,
            plugins: [
              'advlist autolink lists link image charmap print preview anchor',
              'searchreplace visualblocks code fullscreen',
              'insertdatetime media table paste code help wordcount'
            ],
            toolbar: 'undo redo | formatselect | bold italic backcolor | \
              alignleft aligncenter alignright alignjustify | \
              bullist numlist outdent indent | removeformat | help'
          }}
          value={formData.content}
          onEditorChange={(content) => setFormData({ ...formData, content })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Thumbnail (Optional)
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setFormData({ ...formData, thumbnail: e.target.files[0] });
            }
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
};
