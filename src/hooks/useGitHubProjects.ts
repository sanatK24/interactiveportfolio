import { useState, useEffect } from 'react';
import { Octokit } from '@octokit/core';
import { Project } from '../types';

// GitHub username to fetch repositories from
const GITHUB_USERNAME = 'sanatK24'; // Replace with actual GitHub username

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
        
        // Transform the response into our Project type
        const projectsData: Project[] = await Promise.all(
          reposResponse.data.map(async (repo) => {
            let readmeContent = null;
            
            // Try to fetch the README content as a string
            try {
              const readmeResponse = await octokit.request('GET /repos/{owner}/{repo}/readme', {
                owner: GITHUB_USERNAME,
                repo: repo.name,
              });
              
              // The content is base64 encoded, so we need to decode it
              readmeContent = atob(readmeResponse.data.content);
            } catch (err) {
              // README not found or error fetching it
              console.warn(`Couldn't fetch README for ${repo.name}`);
            }
            
            return {
              id: repo.id.toString(),
              name: repo.name,
              description: repo.description || 'No description provided',
              html_url: repo.html_url,
              homepage: repo.homepage || '',
              language: repo.language,
              stargazers_count: repo.stargazers_count,
              forks_count: repo.forks_count,
              topics: repo.topics || [],
              readmeContent,
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