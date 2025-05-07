import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '../../components/ui/ToastContext';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../../context/AuthContext';

// Get Supabase URL and anon key from environment variables
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface Project {
  id: string;
  title: string;
  name: string;
  description: string;
  technologies: string[];
  html_url: string;
  language: string;
  homepage?: string | null;
  stars?: number | null;
  forks?: number | null;
  license?: string | null;
  size?: number | null;
  created_at: string;
  updated_at: string;
  is_visible?: boolean;
  display_order?: number;
}

interface GitHubRepo {
  id: number;
  name: string;
  description: string | null;
  topics: string[];
  html_url: string;
  language: string | null;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  license: { name: string } | null;
  size: number;
  created_at: string;
  updated_at: string;
}

interface ProjectFormData {
  id: string;
  title: string;
  name: string;
  description: string;
  technologies: string[];
  html_url: string;
  language: string;
  homepage: string;
  stars: number;
  forks: number;
  license: string;
  size: number;
  is_visible: boolean;
  display_order: number;
}

const AdminProjects: React.FC = () => {
  const { addToast } = useToast();
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editMode, setEditMode] = useState(false);

  useEffect(() => {
    if (!user) {
      setError('Please log in to view projects');
      addToast({
        message: 'Please log in to view projects',
        type: 'error',
      });
      return;
    }

    // Check if user has admin role in meta data
    const isAdmin = user.user_metadata?.role === 'admin';
    if (!isAdmin) {
      setError('You must be an admin to view projects');
      addToast({
        message: 'You must be an admin to view projects',
        type: 'error',
      });
      return;
    }

    fetchProjects();
  }, [user]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First fetch existing projects from Supabase
      const { data: existingProjects, error: fetchError } = await supabase
        .from('projects')
        .select('name');
      
      if (fetchError) throw fetchError;

      // Get existing project names
      const existingNames = existingProjects?.map(p => p.name) || [];

      // Fetch from GitHub
      const githubResponse = await fetch('https://api.github.com/users/sanatk24/repos');
      if (!githubResponse.ok) {
        throw new Error('Failed to fetch GitHub repositories');
      }

      const githubRepos = await githubResponse.json();
      
      // Transform GitHub repos to our Project interface
      const newProjects = githubRepos
        .filter((repo: GitHubRepo) => !existingNames.includes(repo.name)) // Only include new repos
        .map((repo: GitHubRepo) => ({
          id: uuidv4(),
          title: repo.name, 
          name: repo.name,
          description: repo.description || 'No description provided',
          technologies: repo.topics || [],
          html_url: repo.html_url,
          language: repo.language || 'N/A',
          homepage: repo.homepage,
          stars: repo.stargazers_count,
          forks: repo.forks_count,
          license: repo.license?.name,
          size: repo.size,
          created_at: repo.created_at,
          updated_at: repo.updated_at,
          is_visible: true,
          display_order: 0
        }));

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('projects')
        .insert(newProjects);

      if (saveError) throw saveError;
      
      // Get all projects after insert
      const { data: allProjects, error: finalError } = await supabase
        .from('projects')
        .select('*');

      if (finalError) throw finalError;
      
      console.log('Fetched and saved projects:', allProjects);
      setProjects(allProjects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to fetch projects. Please try again.');
      addToast({
        message: 'Failed to fetch projects. Please try again.',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
    setEditMode(true);
  };

  const saveProject = async (updatedProject: Project) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update(updatedProject)
        .eq('id', updatedProject.id);

      if (error) throw error;

      // Update local state
      setProjects(prev => 
        prev.map(p => p.id === updatedProject.id ? updatedProject : p)
      );
      
      addToast({
        message: 'Project updated successfully',
        type: 'success',
      });
      
      // Close edit mode
      setEditMode(false);
      setSelectedProject(null);
    } catch (err) {
      console.error('Error updating project:', err);
      addToast({
        message: 'Failed to update project. Please try again.',
        type: 'error',
      });
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(project => project.id !== projectId));
      addToast({
        message: 'Project deleted successfully',
        type: 'success',
      });
    } catch (err) {
      console.error('Error deleting project:', err);
      addToast({
        message: 'Failed to delete project. Please try again.',
        type: 'error',
      });
    }
  };

  const EditModal = ({ onClose }: { onClose: () => void }) => {
    const [formData, setFormData] = useState<ProjectFormData>({
      id: selectedProject?.id || '',
      title: selectedProject?.title || '',
      name: selectedProject?.name || '',
      description: selectedProject?.description || '',
      technologies: selectedProject?.technologies || [],
      html_url: selectedProject?.html_url || '',
      language: selectedProject?.language || '',
      homepage: selectedProject?.homepage || '',
      stars: selectedProject?.stars || 0,
      forks: selectedProject?.forks || 0,
      license: selectedProject?.license || '',
      size: selectedProject?.size || 0,
      is_visible: selectedProject?.is_visible || true,
      display_order: selectedProject?.display_order || 0
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!selectedProject) return;

      const updatedProject = { ...selectedProject, ...formData };
      await saveProject(updatedProject);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-4">Edit Project</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Technologies</label>
              <input
                type="text"
                value={formData.technologies.join(', ')}
                onChange={(e) => setFormData({ ...formData, technologies: e.target.value.split(',').map(t => t.trim()) })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
                placeholder="Enter technologies separated by commas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">HTML URL</label>
              <input
                type="text"
                value={formData.html_url}
                onChange={(e) => setFormData({ ...formData, html_url: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Language</label>
              <input
                type="text"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Homepage</label>
              <input
                type="text"
                value={formData.homepage}
                onChange={(e) => setFormData({ ...formData, homepage: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stars</label>
              <input
                type="number"
                value={formData.stars}
                onChange={(e) => setFormData({ ...formData, stars: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Forks</label>
              <input
                type="number"
                value={formData.forks}
                onChange={(e) => setFormData({ ...formData, forks: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">License</label>
              <input
                type="text"
                value={formData.license}
                onChange={(e) => setFormData({ ...formData, license: e.target.value })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Size</label>
              <input
                type="number"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Is Visible</label>
              <select
                value={formData.is_visible ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, is_visible: e.target.value === 'true' })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              >
                <option value="true">Visible</option>
                <option value="false">Hidden</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Display Order</label>
              <input
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2"
              />
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="py-12">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-4">
            Projects
          </h1>

          {error && (
            <div className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 p-4 rounded mb-6">
              {error}
            </div>
          )}

          {editMode && selectedProject && (
            <EditModal onClose={() => setEditMode(false)} />
          )}

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.length === 0 ? (
                <div className="col-span-3 text-center py-12">
                  <p className="text-gray-600 dark:text-gray-400">
                    No projects found. Add your first project by clicking the Add Project button.
                  </p>
                </div>
              ) : (
                projects.map((project) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white dark:bg-gray-800 rounded-lg p-4 mb-4 shadow-md"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        <div className="max-w-[200px] truncate">
                          {project.name}
                        </div>
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleProjectClick(project)}
                          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteProject(project.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      <div className="max-w-[400px] truncate">
                        {project.description}
                      </div>
                    </p>
                    <div className="flex flex-wrap gap-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                      {project.technologies.map((tech) => (
                        <span
                          key={tech}
                          className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <a
                        href={project.html_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:text-blue-700"
                      >
                        GitHub
                      </a>
                      {project.homepage && (
                        <a
                          href={project.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          Live Demo
                        </a>
                      )}
                      <span>
                        Language: {project.language}
                      </span>
                      {project.stars && (
                        <span>
                          Stars: {project.stars}
                        </span>
                      )}
                      {project.forks && (
                        <span>
                          Forks: {project.forks}
                        </span>
                      )}
                      {project.license && (
                        <span>
                          License: {project.license}
                        </span>
                      )}
                      {project.size && (
                        <span>
                          Size: {Math.round(project.size / 1000)} KB
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjects;