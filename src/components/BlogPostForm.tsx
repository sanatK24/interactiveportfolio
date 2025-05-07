import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useFileUpload } from '../hooks/useFileUpload';

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
      let thumbnailUrl = '';
      if (thumbnail) {
        const uploadResult = await uploadFile(thumbnail, 'blog');
        if (uploadResult.error) {
          throw new Error('Failed to upload thumbnail');
        }
        thumbnailUrl = uploadResult.url || '';
      }

      const { error: createError } = await supabase
        .from('blog_posts')
        .insert({
          title,
          content,
          excerpt,
          thumbnail_url: thumbnailUrl,
          is_published: true,
          published_at: new Date().toISOString(),
        });

      if (createError) throw createError;

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
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
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          rows={10}
          required
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
            if (e.target.files?.[0]) {
              setThumbnail(e.target.files[0]);
            }
          }}
          className="mt-1 block w-full"
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
};
