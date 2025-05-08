import React, { useState, useRef } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { Database } from '../../types/supabase';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];

type BlogPostFormData = Omit<BlogPost, 'id' | 'created_at' | 'updated_at'> & {
  thumbnail: string;
};

interface BlogFormProps {
  post?: BlogPost | null;
  onClose: () => void;
  onUpdate: (post: BlogPost) => void;
}

const BlogForm: React.FC<BlogFormProps> = ({ post, onClose, onUpdate }) => {
  const editorRef = useRef<TinyMCEEditor | null>(null);
  const [formData, setFormData] = useState<BlogPostFormData>({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    thumbnail: post?.thumbnail_url || '',
    is_published: post?.is_published ?? false,
    slug: post?.slug || '',
    thumbnail_url: post?.thumbnail_url || ''  
  });
  const { uploadFile } = useFileUpload();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const thumbnailInput = e.currentTarget.querySelector('input[name="thumbnail"]') as HTMLInputElement;
      const thumbnailFile = thumbnailInput?.files?.[0];
      
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        const result = await uploadFile(thumbnailFile, 'blog');
        if (result.error) throw result.error;
        thumbnailUrl = result.url!;
      }

      const updatedPost: BlogPost = {
        id: post?.id || '',
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        thumbnail_url: thumbnailUrl,
        is_published: formData.is_published,
        slug: formData.slug,
        created_at: post?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      await onUpdate(updatedPost);
      onClose();
      toast.success(post ? 'Post updated successfully' : 'Post created successfully');
    } catch (error) {
      toast.error('Failed to save post');
      console.error('Error saving post:', error);
    }
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
  };

  const handleExcerptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, excerpt: e.target.value }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail</label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-400 dark:file:text-blue-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Content</label>
          <Editor
            onInit={(_evt, editor) => editorRef.current = editor}
            apiKey={import.meta.env.VITE_TINYMCE_API_KEY}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
              ],
              toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help',
              setup: (editor: TinyMCEEditor) => {
                editor.on('init', () => {
                  editor.setContent(formData.content || '');
                });
              }
            }}
            onEditorChange={handleEditorChange}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Excerpt</label>
          <textarea
            value={formData.excerpt}
            onChange={handleExcerptChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            rows={3}
            placeholder="Enter a brief excerpt..."
            required
          />
        </div>

        <div className="flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            {post ? 'Update' : 'Create'} Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm as React.FC<BlogFormProps>;
