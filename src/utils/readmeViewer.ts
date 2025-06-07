import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import 'highlight.js/styles/github.css';
import DOMPurify from 'dompurify';

// Configure markdown-it with GitHub-Flavored Markdown
const md = new MarkdownIt({
  // Enable HTML tags in source
  html: true,
  // Auto-convert URL-like text to links
  linkify: true,
  // Enable some language-neutral replacement + quotes beautification
  typographer: true,
  // Convert '\n' in paragraphs into <br>
  breaks: true,
  // Use '/' to close single tags (<br />)
  xhtmlOut: true,
  // Enable some GFM features (tables, task lists, etc.)
  // These are built into markdown-it but need to be enabled
  // by setting the corresponding options to true
});

// Configure syntax highlighting
const highlight = (str: string, lang: string): string => {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang, ignoreIllegals: true }).value}</code></pre>`;
    } catch (__) {
      // Fall through to default handling
    }
  }
  return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`;
};

md.set({ highlight });

// Use DOMPurify in the browser environment
const purify = DOMPurify.sanitize;

// Allowed HTML tags and attributes for GitHub-style markdown
const ALLOWED_TAGS = [
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'p', 'a', 'ul', 'ol', 'li',
  'blockquote', 'code', 'pre', 'hr',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td',
  'strong', 'em', 'del', 'ins', 'img', 'br', 'div', 'span',
  'input', 'details', 'summary', 'abbr', 'b', 'i', 'u', 's', 'strike',
  'sub', 'sup', 'kbd', 'mark', 'small', 'var', 'samp', 'time', 'wbr'
];

const ALLOWED_ATTR = [
  'href', 'src', 'alt', 'title', 'class', 'id', 'name',
  'align', 'width', 'height', 'target', 'rel', 'start',
  'checked', 'disabled', 'type', 'for', 'tabindex',
  'aria-hidden', 'aria-label', 'data-*', 'role',
  'colspan', 'rowspan', 'headers', 'scope', 'span'
];

// Add target="_blank" and rel="noopener noreferrer" to external links
const transformLink = (href: string, text: string): string => {
  if (href.startsWith('http')) {
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
  }
  return `<a href="${href}">${text}</a>`;
};

/**
 * Renders markdown content to sanitized HTML with syntax highlighting
 * @param markdownContent Raw markdown content
 * @returns Sanitized HTML string ready for safe insertion into the DOM
 */
export async function renderReadme(markdownContent: string): Promise<string> {
  try {
    // Convert markdown to HTML
    const html = md.render(markdownContent);
    
    // Transform links before sanitization
    let transformedHtml = html;
    
    // Transform markdown links and images
    transformedHtml = transformedHtml.replace(
      /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1([^>]*)>([\s\S]*?)<\/a>/g,
      (_, _quote, href, _attrs, text) => transformLink(href, text)
    );
    
    // Sanitize the HTML with our allowed tags and attributes
    const cleanHtml = purify(transformedHtml, {
      ALLOWED_TAGS,
      ALLOWED_ATTR,
      FORBID_ATTR: ['style', 'on*'],
      ADD_TAGS: [],
      ADD_URI_SAFE_ATTR: ['target', 'rel'],
      // Allow data-* attributes for custom elements
      ALLOW_DATA_ATTR: true,
      // Allow ARIA attributes
      ALLOW_ARIA_ATTR: true,
      // Allow custom data attributes
      CUSTOM_ELEMENT_HANDLING: {
        tagNameCheck: /^[a-z][a-z0-9-]*$/,
        attributeNameCheck: /^[a-zA-Z_:][a-zA-Z0-9\-_:.]*$/,
        allowCustomizedBuiltInElements: true,
      } as const,
    });

    // Add GitHub-like classes and styles
    const processedHtml = cleanHtml
      // Fix any remaining links that might have been missed
      .replace(
        /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1([^>]*)>/g,
        (match, _quote, href, attrs) => {
          if (href.startsWith('http') && !attrs.includes('rel=')) {
            return match.replace('>', ' rel="noopener noreferrer" target="_blank">');
          }
          return match;
        }
      )
      // Apply GitHub-like styling
      .replace(/<pre><code/g, '<pre class="p-3 bg-gray-800 rounded-md overflow-x-auto"><code')
      .replace(/<table/g, '<div class="overflow-x-auto"><table class="min-w-full divide-y divide-gray-200"')
      .replace(/<\/table>/g, '</table></div>')
      .replace(/<th/g, '<th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"')
      .replace(/<td/g, '<td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900"')
      .replace(/<h1/g, '<h1 class="text-3xl font-bold mb-4 pb-2 border-b border-gray-200"')
      .replace(/<h2/g, '<h2 class="text-2xl font-bold mt-6 mb-3 pb-2 border-b border-gray-200"')
      .replace(/<h3/g, '<h3 class="text-xl font-semibold mt-5 mb-2"')
      .replace(/<ul/g, '<ul class="list-disc pl-6 space-y-1 my-4"')
      .replace(/<ol/g, '<ol class="list-decimal pl-6 space-y-1 my-4"')
      .replace(/<blockquote/g, '<blockquote class="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-4"')
      .replace(/<img/g, '<img class="max-w-full h-auto my-4 rounded-md border border-gray-200"')
      // Fix code blocks with language specifiers
      .replace(/<div class="language-(\w+)">/g, '<div class="language-$1">\n```$1\n')
      .replace(/<\/div>\s*<pre>/g, '\n```\n</div><pre>');

    return processedHtml;
  } catch (error) {
    console.error('Error rendering README:', error);
    return '<div class="p-4 bg-red-50 text-red-700 rounded-md">Error rendering README content</div>';
  }
}

/**
 * Loads and renders a README file into a specified container
 * @param markdownContent The markdown content to render
 * @param containerId ID of the container element to render into
 */
/**
 * Loads and renders markdown content into a specified container
 * @param markdownContent The markdown content to render
 * @param containerId ID of the container element to render into
 */
/**
 * Loads and renders markdown content into a specified container
 * @param markdownContent The markdown content to render
 * @param containerId ID of the container element to render into
 * @param options Additional rendering options
 */
export async function loadAndRenderReadme(
  markdownContent: string, 
  containerId: string,
  options: {
    /** Whether to show a loading state */
    showLoading?: boolean;
    /** Callback when rendering is complete */
    onComplete?: () => void;
    /** Callback when an error occurs */
    onError?: (error: Error) => void;
  } = {}
): Promise<void> {
  const { 
    showLoading = true,
    onComplete,
    onError 
  } = options;

  try {
    if (typeof document === 'undefined') {
      throw new Error('This function can only be called in a browser environment');
    }
    
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with ID '${containerId}' not found`);
    }

    // Show loading state if enabled
    if (showLoading) {
      container.innerHTML = `
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      `;
    }

    // Clean up any raw HTML attributes that might be in the markdown
    const cleanedMarkdown = markdownContent
      // Remove raw rel and target attributes
      .replace(/\s*rel=["']noopener noreferrer["']/gi, '')
      .replace(/\s*target=["']_blank["']/gi, '')
      // Fix any malformed HTML tags
      .replace(/<\s*\/\s*\w+\s*>/g, match => match.replace(/\s+/g, ''));

    // Render the markdown
    const html = await renderReadme(cleanedMarkdown);
    
    // Update the container
    container.innerHTML = html;
    
    // Apply syntax highlighting to any code blocks
    document.querySelectorAll('pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
    
    // Call the completion callback if provided
    onComplete?.();
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error loading README:', error);
    
    // Call the error callback if provided
    onError?.(error instanceof Error ? error : new Error(errorMessage));
    
    const container = document.getElementById(containerId);
    if (container) {
      container.innerHTML = `
        <div class="p-4 bg-red-50 text-red-700 rounded-md">
          <p class="font-semibold">Failed to load README</p>
          <p class="mt-1 text-sm">${errorMessage}</p>
          <p class="mt-2 text-xs text-red-600">
            If this is a markdown formatting issue, please check the README for any raw HTML attributes.
          </p>
        </div>
      `;
    }
  }
}

// Example usage in a React component:
/*
import { useEffect, useRef } from 'react';
import { loadAndRenderReadme } from '../utils/readmeViewer';

function ReadmeViewer({ filePath }: { filePath: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      const containerId = 'readme-container';
      containerRef.current.id = containerId;
      loadAndRenderReadme(filePath, containerId);
    }
  }, [filePath]);

  return <div ref={containerRef} className="prose max-w-none p-4" />;
}
*/
