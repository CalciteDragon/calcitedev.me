import { ExtrasLevelConfig } from '../models/extra-level.model';

export const extrasLevelData = {
  "schemaVersion": 1,
  "revision": 3,
  "world": {
    "width": 1880,
    "height": 820
  },
  "spawn": {
    "elementId": "keyboard-island",
    "offsetX": 58
  },
  "elements": [
    {
      "kind": "island",
      "id": "capstone-island",
      "topicId": "capstone",
      "x": 0,
      "y": 180,
      "width": 556,
      "height": 350
    },
    {
      "kind": "island",
      "id": "keyboard-island",
      "topicId": "keyboard",
      "x": 660,
      "y": 360,
      "width": 556,
      "height": 365
    },
    {
      "kind": "island",
      "id": "robotics-island",
      "topicId": "robotics",
      "x": 1320,
      "y": 170,
      "width": 556,
      "height": 350
    },
    {
      "kind": "platform",
      "id": "platform-1",
      "x": 850,
      "y": 110,
      "width": 180,
      "height": 20
    },
    {
      "kind": "platform",
      "id": "platform-2",
      "x": 590,
      "y": 250,
      "width": 60,
      "height": 20
    },
    {
      "kind": "platform",
      "id": "platform-3",
      "x": 1230,
      "y": 250,
      "width": 60,
      "height": 20
    },
    {
      "kind": "platform",
      "id": "platform-4",
      "x": 650,
      "y": 80,
      "width": 30,
      "height": 20
    },
    {
      "kind": "platform",
      "id": "platform-5",
      "x": 1200,
      "y": 80,
      "width": 30,
      "height": 20
    },
    {
      "kind": "platform",
      "id": "platform-6",
      "x": 850,
      "y": 770,
      "width": 180,
      "height": 20
    },
    {
      "kind": "platform",
      "id": "platform-7",
      "x": 690,
      "y": 790,
      "width": 30,
      "height": 20
    },
    {
      "kind": "platform",
      "id": "platform-8",
      "x": 1150,
      "y": 790,
      "width": 30,
      "height": 20
    }
  ]
} as const satisfies ExtrasLevelConfig;
