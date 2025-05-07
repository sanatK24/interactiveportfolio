import React, { useState } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react';

type BlogPost = {
  id: string;
  title: string;
  content: string;
  excerpt: React.ReactNode;
  thumbnail_url?: string;
  published_at: string | number | Date;
  created_at: string;
  updated_at: string;
};

interface BlogFormProps {
  post?: BlogPost | null;
  onClose: () => void;
}

const BlogForm: React.FC<BlogFormProps> = ({ post, onClose }) => {
  const [formData, setFormData] = useState({
    title: post?.title || '',
    content: post?.content || '',
    excerpt: post?.excerpt ? String(post.excerpt) : '',
    thumbnail: post?.thumbnail_url || ''
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

      const { error } = await supabase
        .from('blog_posts')
        .upsert({
          id: post?.id,
          title: formData.title,
          content: formData.content,
          excerpt: formData.excerpt,
          thumbnail_url: thumbnailUrl,
          published_at: new Date().toISOString()
        });

      if (error) throw error;
      toast.success(post ? 'Post updated successfully' : 'Post created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save post');
    }
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
            initialValue={formData.content}
            init={{
              height: 500,
              menubar: false,
              plugins: [
                'advlist autolink lists link image charmap print preview anchor',
                'searchreplace visualblocks code fullscreen',
                'insertdatetime media table paste code help wordcount'
              ],
              toolbar: 'undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help'
            }}
            onEditorChange={(content: string) => setFormData({ ...formData, content })}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Excerpt</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            rows={3}
            placeholder="Enter a brief excerpt..."
            required
          />
        </div>

        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            {post ? 'Update' : 'Create'} Post
          </button>
        </div>
      </form>
    </div>
  );
};

export default BlogForm as React.FC<BlogFormProps>;
