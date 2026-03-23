import { Project } from '../models/project.model';

export const projectsData: readonly Project[] = [
  {
    title: 'Pixel Quest',
    slug: 'pixel-quest',
    description:
      'A retro-style 2D platformer with hand-crafted pixel art, procedural level generation, and local co-op support.',
    longDescription:
      'Pixel Quest is a passion project combining a love of classic platformers with modern game development techniques. Built with TypeScript and the Canvas API, it features a custom physics engine, procedurally generated dungeons, and a pixel-art rendering pipeline. Supports local two-player co-op and a daily challenge mode.',
    tags: ['TypeScript', 'Canvas API', 'Game Dev', 'Pixel Art'],
    imageUrl: 'assets/images/project-pixel-quest.svg',
    githubUrl: 'https://github.com/CalciteDragon/pixel-quest',
    featured: true,
    category: 'game',
    glowColor: 'cyan',
  },
  {
    title: 'DevBoard',
    slug: 'devboard',
    description:
      'A full-stack developer productivity dashboard — task tracking, GitHub activity, and live metrics in one place.',
    longDescription:
      'DevBoard is a unified workspace for developers who want to stay in flow. It aggregates GitHub activity, tracks personal tasks, and surfaces key project metrics. Built with Angular on the frontend and Node.js/Express on the backend, with a PostgreSQL database and real-time WebSocket updates.',
    tags: ['Angular', 'Node.js', 'PostgreSQL', 'WebSockets', 'REST API'],
    imageUrl: 'assets/images/project-devboard.svg',
    liveUrl: 'https://devboard.calcitedev.me',
    githubUrl: 'https://github.com/CalciteDragon/devboard',
    featured: true,
    category: 'web-app',
    glowColor: 'blue',
  },
  {
    title: 'NeonChat',
    slug: 'neonchat',
    description:
      'A real-time group chat app with room-based messaging, presence indicators, and a cyberpunk UI theme.',
    longDescription:
      'NeonChat delivers real-time messaging via WebSockets with a latency-first architecture. Features include room creation, user presence indicators, message history persistence in PostgreSQL, and JWT-based authentication. The UI is built in React with a neon cyberpunk aesthetic.',
    tags: ['React', 'Node.js', 'WebSockets', 'PostgreSQL', 'Authentication'],
    imageUrl: 'assets/images/project-neonchat.svg',
    githubUrl: 'https://github.com/CalciteDragon/neonchat',
    featured: false,
    category: 'web-app',
    glowColor: 'purple',
  },
  {
    title: 'CodeCraft API',
    slug: 'codecraft-api',
    description:
      'A RESTful API platform for managing code snippets — tagging, search, versioning, and team sharing.',
    longDescription:
      'CodeCraft API is a developer utility for organizing reusable code snippets across projects and teams. It provides full CRUD operations, tag-based search, snippet versioning, and team workspaces. Built as a containerized Node.js/Express service with Docker, PostgreSQL, and JWT authentication.',
    tags: ['Node.js', 'Express.js', 'REST API', 'Docker', 'PostgreSQL'],
    imageUrl: 'assets/images/project-codecraft.svg',
    githubUrl: 'https://github.com/CalciteDragon/codecraft-api',
    featured: false,
    category: 'api',
    glowColor: 'pink',
  },
  {
    title: 'StarMapper',
    slug: 'starmapper',
    description:
      'An interactive star map visualization — browse the night sky, search constellations, and save personal observations.',
    longDescription:
      'StarMapper renders a real-time interactive star map in the browser using the Canvas API and real astronomical data. Users can rotate the view, search for constellations, and log personal sky observations with timestamps and notes. A clean, minimal Angular UI keeps the focus on the stars.',
    tags: ['TypeScript', 'Canvas API', 'Angular', 'SCSS'],
    imageUrl: 'assets/images/project-starmapper.svg',
    liveUrl: 'https://starmapper.calcitedev.me',
    githubUrl: 'https://github.com/CalciteDragon/starmapper',
    featured: true,
    category: 'tool',
    glowColor: 'gold',
  },
];
