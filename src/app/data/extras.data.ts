import { ExtraTopic } from '../models/extra.model';

export const extrasData: readonly ExtraTopic[] = [
  {
    id: 'capstone',
    shortLabel: 'Capstone',
    islandLabel: 'Capstone Summit',
    title: 'Pineapple Expense in Seattle',
    description: 'Photos from presenting my senior capstone and the full-stack receipt workflow behind it.',
    accent: 'gold',
    media: [
      {
        type: 'image',
        alt: 'Pineapple Expense team presenting the project to an audience',
        caption: 'Prototype demo',
        imageUrl: 'assets/images/extras/pineapple-expense-01.jpg',
      },
      {
        type: 'image',
        alt: 'Pineapple Expense team members posing together beside their project poster',
        caption: 'The team and the build',
        imageUrl: 'assets/images/extras/pineapple-expense-02.jpg',
      },
      {
        type: 'image',
        alt: 'Pineapple Expense project poster showing the receipt workflow and AWS architecture',
        caption: 'Project poster',
        imageUrl: 'assets/images/extras/pineapple-expense-03.jpg',
      },
      {
        type: 'image',
        alt: 'Pineapple Expense presentation showing the software design and AWS cloud workflow',
        caption: 'Software design presentation',
        imageUrl: 'assets/images/extras/pineapple-expense-04.jpg',
      },
      {
        type: 'image',
        alt: 'Pineapple Expense presentation showing the AWS Step Functions technology stack',
        caption: 'AWS workflow presentation',
        imageUrl: 'assets/images/extras/pineapple-expense-05.jpg',
      },
    ],
  },
  {
    id: 'keyboard',
    shortLabel: 'Keyboard',
    islandLabel: 'Keyboard Cove',
    title: 'A Custom Keyboard Build',
    description: 'A tiny hardware side quest with a custom board, a build montage, and one very important duck.',
    accent: 'cyan',
    externalUrl: 'https://www.youtube.com/watch?v=xph8DTsWbxM',
    externalLabel: 'Watch on YouTube',
    media: [
      {
        type: 'youtube',
        youtubeId: 'xph8DTsWbxM',
        alt: 'Made a keyboard video player',
        caption: 'Made a keyboard :) · 4:28',
      },
    ],
  },
  {
    id: 'robotics',
    shortLabel: 'Robotics',
    islandLabel: 'Robotics Outpost',
    title: 'Mochi at Competition',
    description: 'Pit photos, match clips, and field-side moments from Ramen Robotics 9036 and Mochi 2026.',
    accent: 'pink',
    media: [
      {
        type: 'image',
        alt: 'Mochi robot 9036 positioned under the red field structure during competition',
        caption: 'Match in progress',
        imageUrl: 'assets/images/extras/mochi-competition-04.jpg',
      },
      {
        type: 'image',
        alt: 'Three Ramen Robotics team members posing together in lavender team apparel and safety glasses',
        caption: 'Competition crew',
        imageUrl: 'assets/images/extras/mochi-competition-01.jpg',
      },
      {
        type: 'youtube',
        youtubeId: 'XcQ8EndxcuM',
        youtubeStartSeconds: 11016,
        alt: 'Ramen Robotics competition video player',
        caption: 'Competition match clip',
      },
      {
        type: 'image',
        alt: 'The Ramen Robotics competition pit beneath a large team and sponsor banner',
        caption: 'Ramen Robotics pit',
        imageUrl: 'assets/images/extras/mochi-competition-02.jpg',
      },
      {
        type: 'image',
        alt: 'Mochi robot 9036 competing on the field among yellow game balls',
        caption: 'Mochi on the field',
        imageUrl: 'assets/images/extras/mochi-competition-03.jpg',
      },
    ],
  },
];
