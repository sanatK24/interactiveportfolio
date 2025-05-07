import React, { useState } from 'react';
import { useBlogPosts } from '../../hooks/useBlogPosts';
import { useFileUpload } from '../../hooks/useFileUpload';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';

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
      toast.success(post ? 'Blog post updated successfully' : 'Blog post created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save blog post');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label>Title</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label>Excerpt</label>
        <textarea
          value={formData.excerpt}
          onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
          className="w-full p-2 border rounded"
          rows={3}
          required
        />
      </div>
      <div>
        <label>Content</label>
        <div className="w-full">
          <textarea
            value={formData.content}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border rounded"
            rows={10}
            required
          />
        </div>
      </div>
      <div>
        <label>Thumbnail</label>
        <input
          type="file"
          name="thumbnail"
          accept="image/*"
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {post ? 'Update' : 'Create'} Post
        </button>
      </div>
    </form>
  );
};

const BlogEditor = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<{
    id: string;
    title: string;
    content: string;
    excerpt: React.ReactNode;
    thumbnail_url?: string;
    published_at: string | number | Date;
    created_at: string;
    updated_at: string;
  } | null>(null);

  const { posts, error } = useBlogPosts();

  if (error) return <div>Error loading blog posts</div>;

  const handleDelete = async (postId: string) => {
    if (!window.confirm('Are you sure you want to delete this blog post?')) return;

    try {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;
      toast.success('Blog post deleted successfully');
    } catch (error) {
      toast.error('Failed to delete blog post');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Blog Editor</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingPost(null);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Blog Post
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-3xl">
            <BlogForm
              post={editingPost}
              onClose={() => {
                setShowForm(false);
                setEditingPost(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post) => (
          post && (
            <div key={post.id} className="bg-white rounded-lg p-4 shadow">
              <div className="flex justify-between items-start">
                <div>   
                  <h3 className="text-lg font-semibold">{post.title}</h3>
                  <p className="text-gray-600">{post.excerpt}</p>
                  <div className="mt-2">
                    <span className="text-sm">Published:</span>
                    <span className="ml-2 text-gray-500">
                      {new Date(post.published_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingPost({
                        id: post.id,
                        title: post.title,
                        content: post.content,
                        excerpt: post.excerpt,
                        thumbnail_url: post.thumbnail_url,
                        published_at: post.published_at,
                        created_at: post.created_at,
                        updated_at: post.updated_at
                      });
                    }}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(post.id)}
                    className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
};

export default BlogEditor;
