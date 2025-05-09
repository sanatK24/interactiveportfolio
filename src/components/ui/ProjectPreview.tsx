import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Github, ExternalLink, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Project } from '../../types';

interface ProjectPreviewProps {
  project: Project | null;
  onClose: () => void;
}

const ProjectPreview: React.FC<ProjectPreviewProps> = ({ project, onClose }) => {
  const [previewMode, setPreviewMode] = useState<'readme' | 'live' | 'youtube'>('readme');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState<string | null>(null);

  // Extract YouTube URL from README content only if it exists
  useEffect(() => {
    if (project?.readmeContent) {
      const youtubeRegex = /https?:\/\/(?:www\.|)youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/;
      const match = project.readmeContent.match(youtubeRegex);
      if (match) {
        setYoutubeUrl(`https://www.youtube.com/embed/${match[1]}`);
      } else {
        setYoutubeUrl(null);
      }
    } else {
      setYoutubeUrl(null);
    }
  }, [project?.readmeContent]);

  if (!project) return null;

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
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              {project.name}
            </h2>
            
            <div className="flex items-center space-x-2">
              <a
                href={project.html_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                aria-label="View repository"
              >
                <Github size={20} />
              </a>
              
              {project.homepage && (
                <a
                  href={project.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Visit live site"
                >
                  <ExternalLink size={20} />
                </a>
              )}
              
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
                  {project.readmeContent ? (
                    <ReactMarkdown 
                      remarkPlugins={[remarkGfm]}
                      rehypePlugins={[rehypeRaw]}
                    >
                      {project.readmeContent}
                    </ReactMarkdown>
                  ) : (
                    <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                      <p>No README content available</p>
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