import { Project } from '../models/project.model';

export const projectsData: readonly Project[] = [
  {
    title: 'Live Bingo',
    slug: 'live-bingo',
    eyebrow: 'Realtime multiplayer · Full stack',
    status: 'SHIPPED',
    description:
      'A head-to-head online race that turns Minecraft challenge goals into a live, shared bingo board.',
    longDescription:
      'Players create or join a private 1v1 lobby, ready up, and claim a shared 5×5 board while a server-authoritative backend enforces ownership, timers, reconnects, rematches, and multiple win conditions. An Angular client, pure TypeScript match engine, WebSockets, and PostgreSQL persistence keep both sides synchronized.',
    tags: ['Angular', 'TypeScript', 'WebSockets', 'Node.js', 'PostgreSQL', 'Multiplayer'],
    imageUrl: 'assets/images/project-live-bingo.svg',
    imageAlt: 'A glowing five-by-five bingo board between two connected player panels',
    githubUrl: 'https://github.com/CalciteDragon/Live-Bingo',
    glowColor: 'blue',
  },
  {
    title: 'Pineapple Expense',
    slug: 'pineapple-expense',
    eyebrow: 'Senior capstone · Android & cloud',
    status: 'CAPSTONE',
    description:
      'A full-stack Android expense workflow that turns receipt photos into structured reports ready for approval.',
    longDescription:
      'The Kotlin and Jetpack Compose client supports receipt capture, editing, user and approver workflows, cloud record keeping, and CSV exports. Behind it, an AWS serverless pipeline uses S3, Lambda, Step Functions, Textract, Bedrock, and RDS to extract, categorize, and store expense data.',
    tags: ['Kotlin', 'Jetpack Compose', 'AWS Lambda', 'Receipt OCR', 'Bedrock AI', 'Auth0'],
    imageUrl: 'assets/images/project-pineapple-expense.svg',
    imageAlt: 'A mobile receipt scanner sending expense fields through a cloud processing pipeline',
    githubUrl: 'https://github.com/pineapple-expense/Pineapple-Expense',
    glowColor: 'gold',
  },
  {
    title: 'Calcite Portfolio',
    slug: 'calcite-portfolio',
    eyebrow: 'This site · Angular portfolio',
    status: 'YOU ARE HERE',
    description:
      'The portfolio you are browsing: a playful, statically rendered showcase wrapped in neon and pixel-art details.',
    longDescription:
      'Built with Angular 21, strict TypeScript, SCSS, static prerendering, and a two-canvas background scene, this site balances a cyberpunk identity with accessible, responsive UI. This tile is deliberately recursive: a portfolio project inside the Projects section of the portfolio project inside the Projects section…',
    tags: ['Angular', 'TypeScript', 'SCSS', 'Canvas', 'Accessibility', 'Static SSR'],
    imageUrl: 'assets/images/project-calcite-portfolio.svg',
    imageAlt: 'Recursive neon browser windows showing this portfolio inside itself',
    githubUrl: 'https://github.com/CalciteDragon/calcitedev.me',
    glowColor: 'purple',
  },
  {
    title: 'Mochi 2026',
    slug: 'mochi-2026',
    eyebrow: 'FRC team engineering · Robotics',
    status: 'TEAM BUILD',
    description:
      'Competition robot software combining swerve drive, multi-camera vision, autonomous paths, and simulation.',
    longDescription:
      'I contributed to Ramen Robotics 9036’s command-based Java and WPILib codebase, built to run across competition and practice hardware. It combines CTRE swerve drive, Limelight and AprilTag odometry, PathPlanner autonomous routines, hardware abstraction, subsystem simulation, and an extensive automated test suite.',
    tags: ['FRC Robotics', 'Java', 'WPILib', 'Swerve Drive', 'Computer Vision', 'PathPlanner'],
    imageUrl: 'assets/images/project-mochi-2026.svg',
    imageAlt: 'Top-down competition robot following a curved autonomous path through vision targets',
    githubUrl: 'https://github.com/RamenRobotics9036/Mochi2026',
    glowColor: 'pink',
  },
  {
    title: 'Pixel Quest',
    slug: 'pixel-quest',
    eyebrow: 'Vibe-coded experiment · Browser game',
    status: 'EXPERIMENT',
    description:
      'A retro-style 2D platformer with hand-crafted pixel art, procedural level generation, and local co-op support.',
    longDescription:
      'Pixel Quest is a passion project combining a love of classic platformers with modern game development techniques. Built with TypeScript and the Canvas API, it features a custom physics engine, procedurally generated dungeons, and a pixel-art rendering pipeline. Supports local two-player co-op and a daily challenge mode.',
    tags: ['TypeScript', 'Canvas API', 'Game Dev', 'Pixel Art'],
    imageUrl: 'assets/images/project-pixel-quest.svg',
    imageAlt: 'Pixel-art platform scene with a tiny cyan character climbing toward coins',
    githubUrl: 'https://github.com/CalciteDragon/pixel-quest',
    glowColor: 'cyan',
  },
  {
    title: 'Minecraft Hide & Seek',
    slug: 'minecraft-hide-and-seek',
    eyebrow: 'Minecraft minigame · Java plugin',
    status: 'ARCHIVED',
    description:
      'A custom Minecraft 1.21 server plugin that turns a hand-built world into a complete hide-and-seek match.',
    longDescription:
      'One player is randomly selected as seeker, hiders get a 30-second head start, and a live scoreboard runs the ten-minute hunt. Java and Paper event handlers manage teams, deaths, respawns, win states, and seven playful power-ups including invisibility, healing, reveals, knockback, fire, bows, and returnable wormholes.',
    tags: ['Java', 'Paper API', 'Minecraft', 'Bukkit', 'Game Systems', 'Power-ups'],
    imageUrl: 'assets/images/project-hide-and-seek.svg',
    imageAlt: 'Voxel maze with green hiders, a red seeker, and glowing power-up blocks',
    githubUrl: 'https://github.com/CalciteDragon/Hide-and-Seek-Plugin',
    glowColor: 'blue',
  },
  {
    title: 'Untitled Roblox PvP World',
    slug: 'roblox-pvp-world',
    eyebrow: 'Work in progress · Multiplayer game',
    status: 'IN DEVELOPMENT',
    description:
      'A community-driven open-world PvP game built for a persistent experience across multiple Roblox servers.',
    longDescription:
      'This in-progress Roblox project explores a shared world where player choices, rivalries, and community activity persist beyond a single server session. The build includes original environments and custom assets alongside the multiplayer systems needed to keep a large, evolving PvP space coherent.',
    tags: ['Luau', 'Roblox Studio', 'Multiplayer', 'Persistent Data', 'Game Design', 'Custom Assets'],
    imageUrl: 'assets/images/project-roblox-pvp-world.svg',
    imageAlt: 'A holographic open-world map connecting several multiplayer server regions',
    glowColor: 'purple',
  },
];
