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
        alt: 'Placeholder for a senior capstone presentation photo',
        caption: 'Presentation day',
        placeholderLabel: 'CAPSTONE PHOTO 01',
      },
      {
        type: 'image',
        alt: 'Placeholder for the Pineapple Expense team presentation',
        caption: 'The team and the build',
        placeholderLabel: 'CAPSTONE PHOTO 02',
      },
      {
        type: 'image',
        alt: 'Placeholder for a Pineapple Expense demo photo',
        caption: 'Demo in progress',
        placeholderLabel: 'CAPSTONE PHOTO 03',
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
        alt: 'Placeholder for a Mochi 2026 competition photo',
        caption: 'Mochi on the field',
        placeholderLabel: 'ROBOTICS PHOTO 01',
      },
      {
        type: 'youtube',
        alt: 'Placeholder for a robotics competition video',
        caption: 'Competition match clip',
        placeholderLabel: 'ROBOTICS VIDEO 01',
      },
      {
        type: 'image',
        alt: 'Placeholder for a Ramen Robotics pit photo',
        caption: 'Behind the scenes in the pit',
        placeholderLabel: 'ROBOTICS PHOTO 02',
      },
    ],
  },
];
