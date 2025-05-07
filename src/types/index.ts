export type Theme = 'light' | 'dark';

export interface Project {
  id: string;
  name: string;
  description: string;
  html_url: string;
  homepage?: string;
  language?: string | null;
  stargazers_count: number;
  forks_count: number;
  topics: string[];
  readmeContent?: string;
  position?: { x: number; y: number };
}

export interface Skill {
  name: string;
  icon: string;
  category: SkillCategory;
  proficiency: number; // 1-5
}

export type SkillCategory = 'Frontend' | 'Backend' | 'Tools' | 'Languages' | 'Other';