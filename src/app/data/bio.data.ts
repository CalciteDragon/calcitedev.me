import { Bio } from '../models/bio.model';

export const bioData: Bio = {
  name: 'Tyler Hawthorn',
  alias: 'Calcite',
  title: 'Full Stack Developer & Game Enthusiast',
  tagline: 'Code · Create · Innovate',
  email: 'tyler@calcitedev.me',
  about: {
    intro: [
      { text: "Hey there! My name is Tyler, and I'm a " },
      { text: 'junior full-stack software developer', tone: 'cyan' },
      { text: " who's passionate about making projects that are " },
      { text: 'fun, creative, and useful', tone: 'pink' },
      { text: '. My style of development is centered on high-level thinking, and I like to ' },
      { text: 'plan each part of the process', tone: 'cyan' },
      { text: ' before actually starting work, and then ' },
      { text: 'test as I go', tone: 'pink' },
      { text: '.' },
    ],
    history: [
      {
        index: '01',
        id: 'source-parsing',
        title: 'SOURCE PARSING',
        tone: 'cyan',
        segments: [
          { text: 'My passion for coding and engineering started ' },
          { text: 'nearly 12 years ago', emphasis: true },
          {
            text: ', when a 10-year-old me discovered I could create nearly any simple video game I could imagine on Scratch, a visual block-based coding platform made for kids to start their programming journeys early. Throughout my youth, I would code my heart out for hours on that website, ',
          },
          { text: 'letting my creative desires run free', emphasis: true },
          {
            text: '. Believe it or not, my old account and some projects are still visible on the website to this day (',
          },
          {
            text: 'https://scratch.mit.edu/users/calcitedragon/',
            emphasis: true,
            href: 'https://scratch.mit.edu/users/calcitedragon/',
            external: true,
          },
          { text: ')!' },
        ],
      },
      {
        index: '02',
        id: 'ast-construction',
        title: 'AST CONSTRUCTION',
        tone: 'blue',
        segments: [
          { text: 'Fast forward to high school, and I decided I wanted to ' },
          { text: 'level up my game', emphasis: true },
          {
            text: '. I took my first computer science class and learned my first real programming language—',
          },
          { text: 'Java', emphasis: true },
          {
            text: '. With this tool, I could do so much, but the only thing I really wanted with it had to do with my favorite video game at the time, and thus my ',
          },
          { text: 'Minecraft plugin development era', emphasis: true },
          { text: ' began. I probably learned how to program in ' },
          { text: 'Java', emphasis: true },
          {
            text: ' more from making these plugins than I did from my actual classes. Some of the plugins I was most proud of include a ',
          },
          {
            text: 'long-running factions-style team survival game with custom items',
            emphasis: true,
          },
          { text: ' that I played with my friends, and a ' },
          {
            text: 'plugin that can turn any Minecraft map into a hide-and-seek minigame',
            emphasis: true,
          },
          {
            text: '. Most of my projects from this era are now heavily outdated and not maintained, but I left one up on GitHub in case I wanted to revisit it one day (',
          },
          { text: 'see projects section', emphasis: true, href: '#projects' },
          { text: ').' },
        ],
      },
      {
        index: '03',
        id: 'bytecode-generation',
        title: 'BYTECODE GENERATION',
        tone: 'purple',
        segments: [
          { text: 'College is where I really started to build more ' },
          { text: 'real-world skills', emphasis: true },
          {
            text: ' and broaden my knowledge. Since I participated in Running Start in high school, I was able to go straight into the ',
          },
          { text: 'computer science program at Bellevue College', emphasis: true },
          {
            text: ' shortly after graduating high school. I found the courses in the program very fun and worthwhile, and I learned everything from ',
          },
          {
            text: 'languages, syntax, algorithms, data structures, machine learning, compilers, computer architecture, and hardware',
            emphasis: true,
          },
          { text: ' to ' },
          {
            text: 'development cycles, methodologies, Git workflows, pair programming, TDD, APIs, systems architecture, software patterns, and more',
            emphasis: true,
          },
          { text: '. To finish it off, I completed my longest-running team project to date: my ' },
          { text: 'senior capstone', emphasis: true },
          { text: '. We were even ' },
          { text: 'selected to present it in Seattle', emphasis: true },
          { text: '.' },
        ],
      },
      {
        index: '04',
        id: 'jit-optimization',
        title: 'JIT OPTIMIZATION',
        tone: 'pink',
        segments: [
          { text: 'Since ' },
          { text: 'graduating in December 2025', emphasis: true },
          { text: ', I have focused on personal projects such as my ' },
          { text: 'full-stack multiplayer bingo web app', emphasis: true, href: '#projects' },
          { text: '. I also had the opportunity to help develop the ' },
          { text: 'software for a robot', emphasis: true },
          { text: ' that competed in the FIRST Robotics Competition. ' },
          {
            text: "(To clarify, it's called \"FIRST\"; we didn't place first, unfortunately, haha.)",
            emphasis: true,
            sideNote: true,
          },
          {
            text: ' These projects and experiences helped me apply what I learned in college and gain practical insight into developing real projects, ',
          },
          { text: 'both independently and as part of a team', emphasis: true },
          { text: '.' },
        ],
      },
    ],
  },
};
