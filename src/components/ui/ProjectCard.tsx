import React from 'react';
import { motion } from 'framer-motion';
import { Project } from '../../types';
import { Github, ExternalLink, Star, GitFork } from 'lucide-react';

interface ProjectCardProps {
  project: Project;
  onPreview: (project: Project) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onPreview }) => {
  // Generate a gradient for project card based on language
  const getLanguageColor = (language: string | null) => {
    const colors: Record<string, string> = {
      TypeScript: 'from-blue-500 to-blue-600',
      JavaScript: 'from-yellow-400 to-yellow-500',
      Python: 'from-blue-600 to-green-500',
      Java: 'from-orange-500 to-red-500',
      C: 'from-blue-700 to-blue-800',
      'C++': 'from-indigo-600 to-purple-600',
      'C#': 'from-purple-600 to-purple-700',
      HTML: 'from-orange-500 to-red-500',
      CSS: 'from-blue-400 to-indigo-500',
      PHP: 'from-indigo-500 to-indigo-600',
      Ruby: 'from-red-600 to-red-700',
      Go: 'from-blue-400 to-blue-500',
      Rust: 'from-orange-600 to-red-600',
      Swift: 'from-orange-500 to-red-500',
      Kotlin: 'from-purple-500 to-purple-600',
    };
    
    return language && colors[language] ? colors[language] : 'from-gray-600 to-gray-700';
  };

  // Use title if name is not available
  const displayName = project.name || project.title || 'Untitled Project';
  const languageColor = getLanguageColor(project.language || null);
  const stars = project.stars || project.stargazers_count || 0;
  const forks = project.forks || project.forks_count || 0;
  const topics = project.topics || project.technologies || [];

  return (
    <motion.div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transform transition-all duration-300 hover:shadow-xl h-full flex flex-col"
      whileHover={{ scale: 1.02, y: -5 }}
      layoutId={`project-${project.id}`}
    >
      <div className={`h-2 bg-gradient-to-r ${languageColor}`}></div>
      
      <div className="p-6 flex-1 flex flex-col">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
          {displayName}
        </h3>
        
        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3 flex-1">
          {project.description || 'No description available'}
        </p>
        
        {topics.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {topics.slice(0, 3).map((topic: string) => (
              <span 
                key={topic} 
                className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full"
              >
                {topic}
              </span>
            ))}
            {topics.length > 3 && (
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 rounded-full">
                +{topics.length - 3} more
              </span>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Star className="w-4 h-4 mr-1" />
              <span>{stars}</span>
              <GitFork className="w-4 h-4 ml-3 mr-1" />
              <span>{forks}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <a
              href={project.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
              aria-label="View repository"
            >
              <Github size={18} />
            </a>
            
            {project.homepage && (
              <a
                href={project.homepage}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Visit live site"
              >
                <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onPreview(project)}
          className="w-full mt-4 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors duration-300"
        >
          Preview Project
        </button>
      </div>
    </motion.div>
  );
};

export default ProjectCard;