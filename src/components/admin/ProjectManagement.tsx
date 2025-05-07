import React, { useState } from 'react';
import { useProjects } from '../../hooks/useProjects';
import { useFileUpload } from '../../hooks/useFileUpload';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Database } from '../../types/database.types';

type Project = Database['public']['Tables']['projects']['Row'];

interface ProjectFormProps {
  project?: Project | null;
  onClose: () => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onClose }) => {
  const [formData, setFormData] = useState({
    title: project?.title || '',
    description: project?.description || '',
    technologies: project?.technologies?.join(',') || '',
    github_url: project?.github_url || '',
    live_url: project?.live_url || '',
    thumbnail: project?.thumbnail_url || ''
  });
  const { uploadFile } = useFileUpload();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      const thumbnailInput = e.currentTarget.querySelector('input[name="thumbnail"]') as HTMLInputElement;
      const thumbnailFile = thumbnailInput?.files?.[0];
      
      let thumbnailUrl = formData.thumbnail;
      if (thumbnailFile) {
        const result = await uploadFile(thumbnailFile, 'projects');
        if (result.error) throw result.error;
        thumbnailUrl = result.url!;
      }

      const technologies = formData.technologies.split(',').map(tech => tech.trim());
      
      const { error } = await supabase
        .from('projects')
        .upsert({
          id: project?.id,
          title: formData.title,
          description: formData.description,
          technologies: technologies.map((tech: string) => ({ technology: tech })),
          github_url: formData.github_url,
          live_url: formData.live_url,
          thumbnail_url: thumbnailUrl
        });

      if (error) throw error;
      toast.success(project ? 'Project updated successfully' : 'Project created successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to save project');
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
        <label>Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label>Technologies (comma separated)</label>
        <input
          type="text"
          value={formData.technologies}
          onChange={(e) => setFormData({ ...formData, technologies: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label>GitHub URL</label>
        <input
          type="url"
          value={formData.github_url}
          onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
          className="w-full p-2 border rounded"
          required
        />
      </div>
      <div>
        <label>Live URL</label>
        <input
          type="url"
          value={formData.live_url}
          onChange={(e) => setFormData({ ...formData, live_url: e.target.value })}
          className="w-full p-2 border rounded"
        />
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
          {project ? 'Update' : 'Create'} Project
        </button>
      </div>
    </form>
  );
};

const ProjectManagement = () => {
  const { projects, error } = useProjects();
  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState<{
    id: string;
    title: string;
    description: string;
    technologies: string[];
    github_url: string;
    live_url: string;
    thumbnail_url: string;
    created_at: string;
    updated_at: string;
  } | null>(null);

  if (error) return <div>Error loading projects</div>;

  const handleDelete = async (projectId: string) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      toast.success('Project deleted successfully');
    } catch (error) {
      toast.error('Failed to delete project');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Project Management</h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProject(null);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Project
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <ProjectForm
              project={editingProject}
              onClose={() => {
                setShowForm(false);
                setEditingProject(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects?.map((project) => (
          project && (
            <div key={project.id} className="bg-white rounded-lg p-4 shadow">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold">{project.title}</h3>
                  <p className="text-gray-600">{project.description}</p>
                  <div className="mt-2">
                    <span className="text-sm">Technologies:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {project.technologies?.map((tech: string) => (
                        <span
                          key={tech}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowForm(true);
                      setEditingProject({
                        id: project.id,
                        title: project.title,
                        description: project.description,
                        technologies: project.technologies || [],
                        github_url: project.github_url,
                        live_url: project.live_url || '',
                        thumbnail_url: project.thumbnail_url || '',
                        created_at: project.created_at,
                        updated_at: project.updated_at
                      });
                    }}
                    className="px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(project.id)}
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

export default ProjectManagement;
