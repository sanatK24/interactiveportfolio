export type Theme = 'light' | 'dark';

export interface Project {
  // Core fields
  id: string;
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  language: string | null;
  
  // GitHub specific fields
  title?: string;
  stars?: number | null;
  forks?: number | null;
  technologies?: string[] | null;
  stargazers_count?: number | null;
  forks_count?: number | null;
  topics?: string[] | null;
  
  // Common fields
  readme_content: string | null;
  is_visible: boolean;
  display_order: number | null;
  created_at: string | null;
  updated_at: string | null;
  
  // Optional fields
  github_url?: string | null;
  live_url?: string | null;
  thumbnail_url?: string | null;
  size?: number | null;
  license?: string | null;
  position?: { x: number; y: number };
  
  // Backward compatibility
  [key: string]: any; // Allow additional properties
}

export interface Skill {
  name: string;
  icon: string;
  category: SkillCategory;
  proficiency: number; // 1-5
}

export type SkillCategory = 'Frontend' | 'Backend' | 'Tools' | 'Languages' | 'Other';