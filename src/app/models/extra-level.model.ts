export interface ExtraLevelWorld {
  readonly width: number;
  readonly height: number;
}

export interface ExtraLevelSpawn {
  readonly elementId: string;
  readonly offsetX: number;
}

interface ExtraLevelElementBase {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ExtraLevelIsland extends ExtraLevelElementBase {
  readonly kind: 'island';
  readonly topicId: string;
}

export interface ExtraLevelPlatform extends ExtraLevelElementBase {
  readonly kind: 'platform';
}

export type ExtraLevelElement = ExtraLevelIsland | ExtraLevelPlatform;

export interface ExtrasLevelConfig {
  readonly schemaVersion: 1;
  readonly revision: number;
  readonly world: ExtraLevelWorld;
  readonly spawn: ExtraLevelSpawn;
  readonly elements: readonly ExtraLevelElement[];
}
