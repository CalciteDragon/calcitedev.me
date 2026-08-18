import { Project } from '../models/project.model';

export const projectsData: readonly Project[] = [
  {
    title: 'Live Bingo',
    slug: 'live-bingo',
    eyebrow: 'Realtime multiplayer · Full stack',
    status: 'SHIPPED',
    description:
      'A solo-built online race that turns Minecraft challenge goals into a live, shared bingo board.',
    longDescription:
      'Up to four players join a private lobby from an invite link, ready up, and race to claim a seeded 5×5 goal board in real time. The backend is fully server-authoritative — clients submit intents; the server validates, applies, persists, and broadcasts match state — with reconnect recovery, rematches, and multiple win conditions. The monorepo pairs an Angular client with a pure TypeScript match engine, Zod-validated contracts, WebSockets, PostgreSQL persistence, and GitHub Actions CI running engine, integration, and UI test suites.',
    tags: ['Angular', 'TypeScript', 'WebSockets', 'Node.js', 'PostgreSQL', 'CI/CD'],
    imageUrl: 'assets/images/project-live-bingo.png',
    imageAlt:
      'A live Live Bingo match: a five-by-five board of Minecraft goals with blue and red claimed tiles, a match timer, and both players tied on the leaderboard',
    liveUrl: 'https://live-bingo-1.onrender.com/',
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
      'On our team of four, I was the front-end developer and owned integration and integration testing. The Kotlin and Jetpack Compose client supports receipt capture, editing, user and approver workflows, cloud record keeping, and CSV exports; behind it, an AWS serverless pipeline uses S3, Lambda, Step Functions, Textract, Bedrock, and RDS to extract, categorize, and store expense data. We were selected to present the finished product at the North Seattle & Bellevue College Senior Capstone Showcase, hosted at Northeastern University’s Seattle campus.',
    tags: ['Kotlin', 'Jetpack Compose', 'AWS Lambda', 'Receipt OCR', 'Bedrock AI', 'Auth0'],
    imageUrl: 'assets/images/project-pineapple-expense.png',
    imageAlt:
      'The Pineapple Expense architecture diagram: a user authenticates through Auth0 into the Android app, which calls an AWS API Gateway fronting Lambdas, a receipt S3 bucket, and a Step Function that runs Textract and Bedrock before writing to the report, receipt, and prediction result databases',
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
    imageUrl: 'assets/images/project-calcite-portfolio.jpg',
    imageAlt:
      'Screenshot of this portfolio’s Projects section, whose Calcite Portfolio detail view shows the same section again, three levels deep',
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
      'I built subsystem control for Ramen Robotics 9036’s command-based Java and WPILib codebase — intake-arm homing, climber travel limits and encoder handling, safety logic, and simulation support — running across competition and practice hardware. The robot combines CTRE swerve drive, Limelight and AprilTag odometry, PathPlanner autonomous routines, hardware abstraction, subsystem simulation, and an extensive automated test suite.',
    tags: ['FRC Robotics', 'Java', 'WPILib', 'Swerve Drive', 'Computer Vision', 'PathPlanner'],
    imageUrl: 'assets/images/project-mochi-2026.jpg',
    imageAlt:
      'The competition robot mid-build on the shop floor: an aluminium chassis with NEO Vortex and Talon FX motors on geared drive modules, a REV power distribution hub reading 12.6 volts, a team battery, and a yellow game piece resting on the frame',
    githubUrl: 'https://github.com/RamenRobotics9036/Mochi2026',
    glowColor: 'pink',
  },
  {
    title: 'It’s Never Just Black and White',
    slug: 'black-and-white',
    eyebrow: 'Engine-free game dev · Browser game',
    status: 'EXPERIMENT',
    description:
      'A two-color momentum platformer where a single button flips gravity and the color palette at once.',
    longDescription:
      'Everything is hand-rolled in TypeScript on the raw Canvas API with zero runtime dependencies — the fonts, sounds, and levels are all code. The player square is a true rigid body with corner-based collisions, the ground-recharged flip move swaps ink and paper while reversing gravity, and a synthesized WebAudio techno track layers up as you gain speed. Ships with an in-browser level editor.',
    tags: ['TypeScript', 'Canvas API', 'Rigid-Body Physics', 'WebAudio', 'Level Editor'],
    imageUrl: 'assets/images/project-black-and-white.png',
    imageAlt:
      'In-game capture of the level “FIRST STEPS” at 0:13.01: a white diamond player character falling between stark white platforms on a black background, with chromatic-aberration edges, scanline grain, and a small cyan particle burst above a dark chevron spike',
    githubUrl: 'https://github.com/CalciteDragon/its-never-just-black-and-white',
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
    imageUrl: 'assets/images/project-hide-and-seek.jpg',
    imageAlt:
      'Rendered Minecraft scene in a torch- and lantern-lit library: a player in a black hoodie and cyan-lensed goggles crouches against a wall of bookshelves while two diamond-helmeted players holding diamond swords close in from either side',
    githubUrl: 'https://github.com/CalciteDragon/Hide-and-Seek-Plugin',
    glowColor: 'blue',
  },
  {
    title: 'WIP Roblox PvP Game',
    slug: 'roblox-pvp-world',
    eyebrow: 'Work in progress · Multiplayer game',
    status: 'IN DEVELOPMENT',
    description:
      'A community-driven open-world PvP game built for a persistent experience across multiple Roblox servers.',
    longDescription:
      'This in-progress Roblox project explores a shared world where player choices, rivalries, and community activity persist beyond a single server session. The build includes original environments and custom assets alongside the multiplayer systems needed to keep a large, evolving PvP space coherent.',
    tags: [
      'Luau',
      'Roblox Studio',
      'Multiplayer',
      'Persistent Data',
      'Game Design',
      'Custom Assets',
    ],
    imageUrl: 'assets/images/project-roblox-pvp-world.jpg',
    imageAlt:
      'Roblox Studio viewport showing an in-progress obstacle course of floating platforms, pillars, and hazard markers',
    glowColor: 'purple',
  },
];
