import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Github, Loader } from 'lucide-react';
import ProjectCard from '../components/ui/ProjectCard';
import ProjectPreview from '../components/ui/ProjectPreview';
import { useGitHubProjects } from '../hooks/useGitHubProjects';
import { Project } from '../types';

const Projects: React.FC = () => {
  const { projects, loading, error } = useGitHubProjects();
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  
  // Handle project preview
  const handlePreview = (project: Project) => {
    setSelectedProject(project);
  };
  
  // Close project preview
  const handleClosePreview = () => {
    setSelectedProject(null);
  };

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="container mx-auto px-4">
        <div className="py-12">
          <motion.h1
            className="text-4xl font-bold text-gray-800 dark:text-white mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Projects
          </motion.h1>
          
          <motion.p
            className="text-lg text-gray-600 dark:text-gray-300 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Explore my GitHub projects with live previews and documentation
          </motion.p>
          
          {/* GitHub Connection */}
          <motion.div
            className="mb-10 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 flex items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Github size={24} className="mr-3 text-gray-700 dark:text-gray-300" />
            <div>
              <h2 className="text-lg font-medium text-gray-800 dark:text-white">GitHub Integration</h2>
              <p className="text-gray-600 dark:text-gray-300">
                These projects are automatically fetched from my GitHub repositories.
                Click on a project to view its README and preview.
              </p>
            </div>
          </motion.div>
          
          {/* Projects Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader size={32} className="animate-spin text-blue-600 dark:text-blue-400" />
              <span className="ml-3 text-gray-600 dark:text-gray-300">
                Loading projects from GitHub...
              </span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 dark:text-red-400 mb-4">{error}</p>
              <p className="text-gray-600 dark:text-gray-300">
                Please try again later or check the GitHub username in the configuration.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * Number(project.id) % 10, duration: 0.6 }}
                >
                  <ProjectCard project={project} onPreview={handlePreview} />
                </motion.div>
              ))}
            </div>
          )}
          
          {projects.length === 0 && !loading && !error && (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No projects found. Make sure to update the GitHub username in the configuration.
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* Project Preview Modal */}
      <ProjectPreview project={selectedProject} onClose={handleClosePreview} />
    </div>
  );
};

export default Projects;