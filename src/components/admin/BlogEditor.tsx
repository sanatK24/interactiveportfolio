import React, { useState, useRef } from 'react';
import { useFileUpload } from '../../hooks/useFileUpload';
import { toast } from 'react-toastify';
import { Editor } from '@tinymce/tinymce-react';
import type { Editor as TinyMCEEditor } from 'tinymce';
import type { Database } from '../../types/supabase';
import { supabase } from '../../context/AuthContext';

type BlogPost = Database['public']['Tables']['blog_posts']['Row'];

interface BlogPostFormData {
  title: string;
  content: string;
  excerpt: string;
  is_published: boolean;
  thumbnail: string;
  thumbnail_url: string;
}

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
    is_published: post?.is_published ?? false,
    thumbnail: post?.thumbnail_url || '',
    thumbnail_url: post?.thumbnail_url || ''
  });
  const { uploadFile } = useFileUpload();

  const handleThumbnailUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await uploadFile(file, 'blog_thumbnails');
      if (result.error) {
        throw result.error;
      }
      setFormData(prev => ({
        ...prev,
        thumbnail: result.url || '',
        thumbnail_url: result.url || ''
      }));
    } catch (error) {
      toast.error('Failed to upload thumbnail');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const editor = editorRef.current;
      if (!editor) throw new Error('Editor not initialized');

      // Get HTML content with all formatting from TinyMCE
      const content = editor.getContent();
      
      // Generate slug from title
      const generateSlug = async (title: string): Promise<string> => {
        const baseSlug = title
          .toLowerCase()
          .replace(/[\s\W-]+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        // Check if slug exists and add timestamp if needed
        const { data: existingPosts } = await supabase
          .from('blog_posts')
          .select('slug')
          .eq('slug', baseSlug);

        if (existingPosts && existingPosts.length > 0) {
          return `${baseSlug}-${Date.now()}`;
        }
        return baseSlug;
      };

      // Create the base post data without id
      const postBase: Omit<BlogPost, 'id'> = {
        title: formData.title,
        content: content,
        excerpt: formData.excerpt,
        is_published: formData.is_published,
        thumbnail_url: formData.thumbnail_url,
        created_at: post?.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        slug: post?.slug ?? await generateSlug(formData.title)
      };

      if (post) {
        // For update, we need to include the id
        const updateData: BlogPost = { 
          id: post.id, 
          ...postBase 
        };
        
        // Update existing post
        const { error: updateError } = await supabase
          .from('blog_posts')
          .update(postBase)
          .eq('id', post.id);

        if (updateError) throw updateError;
        
        // Call onUpdate with the complete post data
        onUpdate(updateData);
      } else {
        // For insert, we need to generate a unique slug
        
        // Create new post
        const { error: insertError } = await supabase
          .from('blog_posts')
          .insert([postBase]);

        if (insertError) throw insertError;
        
        // For the new post, we'll need to fetch it to get the generated id
        const { data: createdPost } = await supabase
          .from('blog_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!createdPost) throw new Error('Failed to fetch created post');
        
        // Call onUpdate with the complete post data
        onUpdate(createdPost);
      }

      toast.success('Blog post saved successfully');
      onClose();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error('Failed to save blog post');
    }
  };

  const handleEditorChange = (content: string) => {
    setFormData(prev => ({ ...prev, content }));
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Excerpt</label>
          <textarea
            value={formData.excerpt}
            onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
            rows={3}
            placeholder="Enter a brief excerpt of the post (max 200 characters)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Thumbnail</label>
          <input
            type="file"
            name="thumbnail"
            accept="image/*"
            onChange={handleThumbnailUpload}
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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Publish Status</label>
          <select
            value={formData.is_published ? 'published' : 'draft'}
            onChange={(e) => setFormData({ ...formData, is_published: e.target.value === 'published' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="draft">Save as Draft</option>
            <option value="published">Publish</option>
          </select>
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
