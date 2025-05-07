import { Skill, SkillCategory } from '../types';

// This is a placeholder for the icons
// In a real application, you would import the actual icons from lucide-react
const skillIcons = {
  React: '⚛️',
  JavaScript: '📜',
  TypeScript: '💪',
  HTML: '🌐',
  CSS: '🎨',
  'Node.js': '🟢',
  'Express.js': '🚂',
  MongoDB: '🍃',
  PostgreSQL: '🐘',
  Git: '📝',
  Docker: '🐳',
  AWS: '☁️',
  'UI/UX': '🎭',
  Figma: '🖌️',
  Python: '🐍',
  Java: '☕',
  'C++': '⚙️',
  Rust: '🦀',
};

const skills: Skill[] = [
  {
    name: 'React',
    icon: skillIcons.React,
    category: 'Frontend',
    proficiency: 5,
  },
  {
    name: 'TypeScript',
    icon: skillIcons.TypeScript,
    category: 'Languages',
    proficiency: 4,
  },
  {
    name: 'JavaScript',
    icon: skillIcons.JavaScript,
    category: 'Languages',
    proficiency: 5,
  },
  {
    name: 'HTML',
    icon: skillIcons.HTML,
    category: 'Frontend',
    proficiency: 5,
  },
  {
    name: 'CSS',
    icon: skillIcons.CSS,
    category: 'Frontend',
    proficiency: 4,
  },
  {
    name: 'Node.js',
    icon: skillIcons['Node.js'],
    category: 'Backend',
    proficiency: 4,
  },
  {
    name: 'Express.js',
    icon: skillIcons['Express.js'],
    category: 'Backend',
    proficiency: 3,
  },
  {
    name: 'MongoDB',
    icon: skillIcons.MongoDB,
    category: 'Backend',
    proficiency: 3,
  },
  {
    name: 'PostgreSQL',
    icon: skillIcons.PostgreSQL,
    category: 'Backend',
    proficiency: 3,
  },
  {
    name: 'Git',
    icon: skillIcons.Git,
    category: 'Tools',
    proficiency: 4,
  },
  {
    name: 'Docker',
    icon: skillIcons.Docker,
    category: 'Tools',
    proficiency: 3,
  },
  {
    name: 'AWS',
    icon: skillIcons.AWS,
    category: 'Tools',
    proficiency: 2,
  },
  {
    name: 'UI/UX',
    icon: skillIcons['UI/UX'],
    category: 'Other',
    proficiency: 4,
  },
  {
    name: 'Figma',
    icon: skillIcons.Figma,
    category: 'Tools',
    proficiency: 3,
  },
  {
    name: 'Python',
    icon: skillIcons.Python,
    category: 'Languages',
    proficiency: 3,
  },
  {
    name: 'Java',
    icon: skillIcons.Java,
    category: 'Languages',
    proficiency: 3,
  },
  {
    name: 'C++',
    icon: skillIcons['C++'],
    category: 'Languages',
    proficiency: 4,
  },
  {
    name: 'Rust',
    icon: skillIcons.Rust,
    category: 'Languages',
    proficiency: 2,
  },
];

export default skills;

export const skillCategories: SkillCategory[] = [
  'Frontend',
  'Backend',
  'Languages',
  'Tools',
  'Other',
];