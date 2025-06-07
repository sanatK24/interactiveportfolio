import { useState, useEffect } from 'react';
import { Octokit } from '@octokit/core';
import { Project } from '../types';
import { renderReadme } from '../utils/readmeViewer';

// GitHub username to fetch repositories from
const GITHUB_USERNAME = 'sanatK24'; // Replace with actual GitHub username

interface GitHubRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
    node_id: string;
    avatar_url: string;
    url: string;
    html_url: string;
    type: string;
    site_admin: boolean;
  };
  html_url: string;
  description: string | null;
  fork: boolean;
  url: string;
  created_at: string;
  updated_at: string;
  pushed_at: string;
  git_url: string;
  ssh_url: string;
  clone_url: string;
  svn_url: string;
  homepage: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  language: string | null;
  has_issues: boolean;
  has_projects: boolean;
  has_downloads: boolean;
  has_wiki: boolean;
  has_pages: boolean;
  has_discussions: boolean;
  forks_count: number;
  mirror_url: string | null;
  archived: boolean;
  disabled: boolean;
  open_issues_count: number;
  license: {
    key: string;
    name: string;
    spdx_id: string;
    url: string | null;
    node_id: string;
  } | null;
  allow_forking: boolean;
  is_template: boolean;
  web_commit_signoff_required: boolean;
  topics: string[];
  visibility: string;
  forks: number;
  open_issues: number;
  watchers: number;
  default_branch: string;
  permissions?: {
    admin: boolean;
    maintain?: boolean;
    push: boolean;
    triage?: boolean;
    pull: boolean;
  };
}

async function fetchReadme(repoName: string): Promise<string | null> {
  try {
    const octokit = new Octokit();
    const response = await octokit.request('GET /repos/{owner}/{repo}/readme', {
      owner: GITHUB_USERNAME,
      repo: repoName,
      headers: {
        'Accept': 'application/vnd.github.v3.raw'
      }
    });
    
    if (response.status === 200) {
      return response.data as unknown as string;
    }
    return null;
  } catch (error) {
    console.warn(`Could not fetch README for ${repoName}:`, error);
    return null;
  }
}

export function useGitHubProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        
        // Create an Octokit instance without a token for public repositories
        const octokit = new Octokit();
        
        // Fetch public repositories for the user
        const reposResponse = await octokit.request('GET /users/{username}/repos', {
          username: GITHUB_USERNAME,
          sort: 'updated',
          per_page: 10,
        });
        
        // Transform GitHub repos to Project type and fetch READMEs
        const projectsData: Project[] = await Promise.all(
          (reposResponse.data as unknown as GitHubRepo[]).map(async (repo) => {
            const readmeContent = await fetchReadme(repo.name);
            let readmeHtml = '';
            
            if (readmeContent) {
              try {
                // Use renderReadme directly to get the HTML content
                readmeHtml = await renderReadme(readmeContent);
              } catch (err) {
                console.error('Error rendering README:', err);
                readmeHtml = '<p>Error loading README content</p>';
              }
            }
            
            return {
              id: repo.id.toString(),
              name: repo.name,
              description: repo.description || 'No description',
              html_url: repo.html_url,
              homepage: repo.homepage || '',
              language: repo.language,
              stargazers_count: repo.stargazers_count,
              forks_count: repo.forks_count,
              topics: repo.topics || [],
              readme_content: readmeHtml,
              is_visible: true,
              display_order: 0,
              created_at: repo.created_at,
              updated_at: repo.updated_at,
              github_url: repo.html_url,
              live_url: repo.homepage || '',
              thumbnail_url: `https://raw.githubusercontent.com/${GITHUB_USERNAME}/${repo.name}/${repo.default_branch}/.github/thumbnail.png`,
              size: 0,
              license: '',
              private: repo.private,
              has_issues: false,
              open_issues_count: 0,
              default_branch: repo.default_branch,
              title: repo.name.replace(/-/g, ' ').replace(/(^|\s)\S/g, l => l.toUpperCase())
            };
          })
        );
        
        setProjects(projectsData);
      } catch (err) {
        console.error('Error fetching GitHub projects:', err);
        setError('Failed to fetch projects from GitHub');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProjects();
  }, []);
  
  return { projects, loading, error };
}