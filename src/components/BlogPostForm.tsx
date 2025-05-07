import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFileUpload } from '../hooks/useFileUpload';
import { Editor } from '@tinymce/tinymce-react';

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
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { uploadFile } = useFileUpload();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error('You must be logged in to create a blog post');
      }

      if (!title.trim()) {
        throw new Error('Title is required');
      }

      let thumbnailUrl = '';
      if (thumbnail) {
        const uploadResult = await uploadFile(thumbnail, 'blog');
        if (uploadResult.error) {
          throw new Error('Failed to upload thumbnail: ' + uploadResult.error.message);
        }
        thumbnailUrl = uploadResult.url || '';
      }

      // Generate a unique slug with timestamp
      let slug = generateSlug(title);

      // First check if slug exists
      const { data: existingPost, error: checkError } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single();

      if (checkError) {
        console.error('Check error:', checkError);
        if (checkError.code === 'PGRST116') {
          // Generate a new slug with timestamp
          slug = generateSlug(title, Date.now());
          console.log('Generated new slug:', slug);
        } else {
          throw checkError;
        }
      }
      if (existingPost) {
        // Generate a new slug with timestamp
        slug = generateSlug(title, Date.now());
        console.log('Generated new slug:', slug);
      }

      console.log('Final slug:', slug);

      const { error: createError } = await supabase
        .from('blog_posts')
        .insert({
          title,
          content,
          excerpt,
          thumbnail_url: thumbnailUrl,
          slug,
          is_published: true
        })
        .select();

      if (createError) {
        console.error('Create error:', createError);
        if (createError.code === '23505') {
          // Generate a new slug with timestamp
          slug = generateSlug(title, Date.now());
          console.log('Generated new slug:', slug);
          
          // Try again with new slug
          const { error: retryError } = await supabase
            .from('blog_posts')
            .insert({
              title,
              content,
              excerpt,
              thumbnail_url: thumbnailUrl,
              slug,
              is_published: true
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
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Excerpt
        </label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
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
          value={content}
          onEditorChange={(content) => setContent(content)}
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
              setThumbnail(e.target.files[0]);
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
