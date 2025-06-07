import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, ExternalLink, Maximize2, Minimize2, Loader2 } from 'lucide-react';
import { loadAndRenderReadme } from '../../utils/readmeViewer';
import { Project } from '../../types';

interface ProjectPreviewProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectPreview: React.FC<ProjectPreviewProps> = ({ project, onClose }) => {
  const [previewMode, setPreviewMode] = useState<'readme' | 'live' | 'youtube'>('readme');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);
  const readmeContainerRef = useRef<HTMLDivElement>(null);

  // Extract YouTube URL from README content only if it exists
  useEffect(() => {
    if (project?.readme_content) {
      const youtubeRegex = /https?:\/\/(?:www\.|)youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
      const match = project.readme_content.match(youtubeRegex);
      if (match) {
        setYoutubeUrl(`https://www.youtube.com/embed/${match[1]}`);
      } else {
        setYoutubeUrl(null);
      }
    } else {
      setYoutubeUrl(null);
    }
  }, [project?.readme_content]);

  // Handle README rendering when tab changes or project changes
  useEffect(() => {
    if (previewMode === 'readme' && project?.readme_content && readmeContainerRef.current) {
      const container = readmeContainerRef.current;
      container.innerHTML = ''; // Clear previous content
      container.id = `readme-${project.id}`;
      loadAndRenderReadme(project.readme_content, container.id);
    }
  }, [previewMode, project?.id, project?.readme_content]);

  if (!project) return null;

  // Get display values with fallbacks
  const displayName = project.name || project.title || 'Untitled Project';
  const topics = project.topics || project.technologies || [];
  const homepage = project.homepage || project.live_url || null;
  const githubUrl = project.html_url || project.github_url || null;

  // Only show video preview tab if there's a valid YouTube URL
  const hasVideoPreview = youtubeUrl !== null;

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 md:p-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0 }}
        onClick={handleClose}
      >
        <motion.div
          className={`bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden w-full ${
            isFullscreen ? 'fixed inset-0 rounded-none' : 'max-w-6xl max-h-[90vh]'
          }`}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0 }}
          layoutId={`project-${project.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              {displayName}
            </h2>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1.5 text-sm bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Github size={16} className="mr-1.5" />
                    GitHub
                  </a>
                )}
                {homepage && (
                  <a
                    href={homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink size={16} className="mr-1.5" />
                    Live Demo
                  </a>
                )}
              </div>
              
              <div className="h-6 border-l border-gray-300 dark:border-gray-600 mx-1"></div>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
              </button>
              
              <button
                onClick={handleClose}
                className="p-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          
          <div className="flex border-b border-gray-200 dark:border-gray-800">
            <button
              className={`px-4 py-2 font-medium text-sm ${
                previewMode === 'readme'
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              onClick={() => setPreviewMode('readme')}
            >
              README
            </button>
            
            {project.homepage && (
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  previewMode === 'live'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                onClick={() => setPreviewMode('live')}
              >
                Live Preview
              </button>
            )}

            {hasVideoPreview && (
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  previewMode === 'youtube'
                    ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                onClick={() => setPreviewMode('youtube')}
              >
                Video Preview
              </button>
            )}
          </div>
          
          <div className={`overflow-hidden ${isFullscreen ? 'h-[calc(100vh-112px)]' : 'max-h-[calc(90vh-112px)]'}`} style={{ height: '100%' }}>
            {previewMode === 'readme' ? (
              <div className="p-6 prose dark:prose-invert prose-blue max-w-none">
                <div className="overflow-y-auto h-full max-h-[calc(100vh-200px)]">
                  {project.readme_content ? (
                    <>
                      {topics.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {topics.map((topic: string) => (
                            <span
                              key={topic}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs rounded-full"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      )}
                      <div 
                        ref={readmeContainerRef}
                        className="prose dark:prose-invert max-w-none"
                      >
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="animate-spin h-8 w-8 text-blue-500" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-500 dark:text-gray-400 text-center py-12">
                      No README available for this project.
                    </div>
                  )}
                </div>
              </div>
            ) : previewMode === 'live' ? (
              <div className="w-full h-full min-h-[500px] overflow-hidden">
                {project.homepage && (
                  <iframe
                    src={project.homepage}
                    title={`${project.name} preview`}
                    className="w-full h-full min-h-[500px] border-0"
                    sandbox="allow-scripts allow-same-origin allow-forms"
                    loading="lazy"
                  />
                )}
              </div>
            ) : previewMode === 'youtube' && hasVideoPreview ? (
              <div className="w-full h-full min-h-[500px] p-6 overflow-hidden">
                <iframe
                  src={youtubeUrl}
                  title={`${project.name} YouTube preview`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  loading="lazy"
                  style={{
                    height: 'calc(100% - 1rem)', // Subtract padding
                    maxHeight: '100%',
                    minHeight: '500px'
                  }}
                />
              </div>
            ) : null}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ProjectPreview;