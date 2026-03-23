import { SkillGroup } from '../models/skill.model';

export const skillsData: readonly SkillGroup[] = [
  {
    category: 'Languages',
    color: 'cyan',
    skills: [
      { name: 'TypeScript' },
      { name: 'JavaScript' },
      { name: 'Java' },
    ],
  },
  {
    category: 'Frontend',
    color: 'blue',
    skills: [
      { name: 'Angular' },
      { name: 'React' },
      { name: 'RxJS' },
      { name: 'SCSS' },
    ],
  },
  {
    category: 'Backend',
    color: 'purple',
    skills: [
      { name: 'Node.js' },
      { name: 'Express.js' },
      { name: 'REST APIs' },
      { name: 'WebSockets' },
      { name: 'Authentication' },
    ],
  },
  {
    category: 'Databases',
    color: 'pink',
    skills: [
      { name: 'PostgreSQL' },
    ],
  },
  {
    category: 'DevOps',
    color: 'gold',
    skills: [
      { name: 'Docker' },
      { name: 'CI/CD Pipelines' },
      { name: 'Render' },
      { name: 'AWS' },
    ],
  },
  {
    category: 'Testing & Quality',
    color: 'cyan',
    skills: [
      { name: 'TDD' },
      { name: 'Unit Testing' },
      { name: 'Integration Testing' },
    ],
  },
  {
    category: 'Git & Version Control',
    color: 'blue',
    skills: [
      { name: 'Git' },
      { name: 'GitHub' },
      { name: 'Branching Strategies' },
      { name: 'Code Reviews' },
    ],
  },
  {
    category: 'Architecture & Concepts',
    color: 'purple',
    skills: [
      { name: 'Full-Stack Development' },
      { name: 'RESTful APIs' },
      { name: 'Client-Server Architecture' },
      { name: 'Responsive Design' },
    ],
  },
];
