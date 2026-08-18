import {
  ExtraLevelElement,
  ExtraLevelWorld,
  ExtrasLevelConfig,
} from '../../../../../models/extra-level.model';

export const EXTRAS_LEVEL_DRAFT_STORAGE_PREFIX = 'calcite.extras-level-editor.draft.v1';
export const EXTRAS_LEVEL_MAX_WORLD_SIZE = 10_000;
export const EXTRAS_LEVEL_MAX_ELEMENTS = 64;

const ELEMENT_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export interface ExtrasLevelValidationSuccess {
  readonly valid: true;
  readonly config: ExtrasLevelConfig;
  readonly errors: readonly [];
}

export interface ExtrasLevelValidationFailure {
  readonly valid: false;
  readonly config: null;
  readonly errors: readonly string[];
}

export type ExtrasLevelValidationResult =
  | ExtrasLevelValidationSuccess
  | ExtrasLevelValidationFailure;

export interface ExtrasLevelDraftEnvelope {
  readonly draftSchemaVersion: 1;
  readonly baseRevision: number;
  readonly savedAt: string;
  readonly level: ExtrasLevelConfig;
}

export function extrasLevelEditorEnabled(search: string): boolean {
  return new URLSearchParams(search).get('extrasDebug') === 'level';
}

export function cloneExtrasLevel(config: ExtrasLevelConfig): ExtrasLevelConfig {
  return {
    schemaVersion: 1,
    revision: config.revision,
    world: { ...config.world },
    spawn: { ...config.spawn },
    elements: config.elements.map(element => ({ ...element })),
  };
}

export function validateExtrasLevel(
  value: unknown,
  knownTopicIds: readonly string[] = [],
): ExtrasLevelValidationResult {
  const errors: string[] = [];
  if (!isRecord(value)) {
    return validationFailure('Level config must be an object.');
  }

  addUnknownKeyErrors(
    value,
    ['schemaVersion', 'revision', 'world', 'spawn', 'elements'],
    'Level config',
    errors,
  );
  if (value['schemaVersion'] !== 1) errors.push('schemaVersion must be 1.');
  validatePositiveInteger(value['revision'], 'revision', errors);

  const world = value['world'];
  validateWorld(world, errors);
  const spawn = value['spawn'];
  validateSpawn(spawn, errors);

  const elements = value['elements'];
  const topicIds = new Set<string>();
  const elementIds = new Set<string>();
  if (!Array.isArray(elements)) {
    errors.push('elements must be an array.');
  } else {
    if (elements.length === 0) errors.push('elements must contain at least one element.');
    if (elements.length > EXTRAS_LEVEL_MAX_ELEMENTS) {
      errors.push(`elements cannot contain more than ${EXTRAS_LEVEL_MAX_ELEMENTS} entries.`);
    }

    elements.forEach((element, index) => {
      validateElement(element, index, world, knownTopicIds, elementIds, topicIds, errors);
    });
  }

  if (knownTopicIds.length > 0) {
    for (const topicId of new Set(knownTopicIds)) {
      if (!topicIds.has(topicId)) errors.push(`Missing island for topic "${topicId}".`);
    }
  }

  if (isRecord(spawn) && typeof spawn['elementId'] === 'string' && Array.isArray(elements)) {
    const spawnElement = elements.find(
      element => isRecord(element) && element['id'] === spawn['elementId'],
    );
    if (!spawnElement) {
      errors.push(`spawn.elementId references unknown element "${spawn['elementId']}".`);
    } else if (
      isSafeInteger(spawn['offsetX']) &&
      isSafeInteger(spawnElement['width']) &&
      spawn['offsetX'] >= spawnElement['width']
    ) {
      errors.push('spawn.offsetX must be smaller than the spawn element width.');
    }
  }

  if (errors.length > 0) return { valid: false, config: null, errors };
  return {
    valid: true,
    config: cloneExtrasLevel(value as unknown as ExtrasLevelConfig),
    errors: [],
  };
}

export function serializeExtrasLevelSource(config: ExtrasLevelConfig): string {
  const orderedConfig = {
    schemaVersion: 1,
    revision: config.revision,
    world: {
      width: config.world.width,
      height: config.world.height,
    },
    spawn: {
      elementId: config.spawn.elementId,
      offsetX: config.spawn.offsetX,
    },
    elements: config.elements.map(element =>
      element.kind === 'island'
        ? {
            kind: element.kind,
            id: element.id,
            topicId: element.topicId,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          }
        : {
            kind: element.kind,
            id: element.id,
            x: element.x,
            y: element.y,
            width: element.width,
            height: element.height,
          },
    ),
  };
  const serialized = JSON.stringify(orderedConfig, null, 2);
  return [
    "import { ExtrasLevelConfig } from '../models/extra-level.model';",
    '',
    `export const extrasLevelData = ${serialized} as const satisfies ExtrasLevelConfig;`,
    '',
  ].join('\n');
}

export function extrasLevelDraftStorageKey(baseRevision: number): string {
  return `${EXTRAS_LEVEL_DRAFT_STORAGE_PREFIX}:${baseRevision}`;
}

export function createExtrasLevelDraftEnvelope(
  level: ExtrasLevelConfig,
  baseRevision: number,
  savedAt = new Date().toISOString(),
): ExtrasLevelDraftEnvelope {
  return {
    draftSchemaVersion: 1,
    baseRevision,
    savedAt,
    level: cloneExtrasLevel(level),
  };
}

export function serializeExtrasLevelDraft(
  level: ExtrasLevelConfig,
  baseRevision: number,
  savedAt?: string,
): string {
  return JSON.stringify(createExtrasLevelDraftEnvelope(level, baseRevision, savedAt));
}

export function parseExtrasLevelDraft(
  serialized: string,
  expectedBaseRevision: number,
  knownTopicIds: readonly string[] = [],
): ExtrasLevelDraftEnvelope | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized) as unknown;
  } catch {
    return null;
  }

  if (!isRecord(parsed)) return null;
  if (parsed['draftSchemaVersion'] !== 1 || parsed['baseRevision'] !== expectedBaseRevision) {
    return null;
  }
  if (typeof parsed['savedAt'] !== 'string' || !Number.isFinite(Date.parse(parsed['savedAt']))) {
    return null;
  }

  const validation = validateExtrasLevel(parsed['level'], knownTopicIds);
  if (!validation.valid) return null;
  return {
    draftSchemaVersion: 1,
    baseRevision: expectedBaseRevision,
    savedAt: parsed['savedAt'],
    level: validation.config,
  };
}

export function saveExtrasLevelDraft(
  storage: Pick<Storage, 'setItem'>,
  level: ExtrasLevelConfig,
  baseRevision: number,
  savedAt?: string,
): boolean {
  try {
    storage.setItem(
      extrasLevelDraftStorageKey(baseRevision),
      serializeExtrasLevelDraft(level, baseRevision, savedAt),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadExtrasLevelDraft(
  storage: Pick<Storage, 'getItem'>,
  baseRevision: number,
  knownTopicIds: readonly string[] = [],
): ExtrasLevelDraftEnvelope | null {
  try {
    const serialized = storage.getItem(extrasLevelDraftStorageKey(baseRevision));
    return serialized === null
      ? null
      : parseExtrasLevelDraft(serialized, baseRevision, knownTopicIds);
  } catch {
    return null;
  }
}

export function clearExtrasLevelDraft(
  storage: Pick<Storage, 'removeItem'>,
  baseRevision: number,
): boolean {
  try {
    storage.removeItem(extrasLevelDraftStorageKey(baseRevision));
    return true;
  } catch {
    return false;
  }
}

export function snapCoordinate(value: number, gridSize = 1): number {
  if (!Number.isFinite(value)) return 0;
  const safeGridSize = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 1;
  const snapped = Math.round(value / safeGridSize) * safeGridSize;
  return Object.is(snapped, -0) ? 0 : snapped;
}

export function clampElementToWorld(
  element: ExtraLevelElement,
  world: ExtraLevelWorld,
  gridSize = 1,
): ExtraLevelElement {
  const worldWidth = Math.max(1, snapCoordinate(world.width));
  const worldHeight = Math.max(1, snapCoordinate(world.height));
  const width = Math.min(worldWidth, Math.max(1, snapCoordinate(element.width, gridSize)));
  const height = Math.min(worldHeight, Math.max(1, snapCoordinate(element.height, gridSize)));
  const x = clamp(snapCoordinate(element.x, gridSize), 0, worldWidth - width);
  const y = clamp(snapCoordinate(element.y, gridSize), 0, worldHeight - height);
  return { ...element, x, y, width, height };
}

export function nextPlatformId(
  elements: readonly ExtraLevelElement[],
  prefix = 'platform',
): string {
  const normalizedPrefix = prefix
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'platform';
  const usedIds = new Set(elements.map(element => element.id));
  let index = 1;
  while (usedIds.has(`${normalizedPrefix}-${index}`)) index += 1;
  return `${normalizedPrefix}-${index}`;
}

function validateWorld(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('world must be an object.');
    return;
  }
  addUnknownKeyErrors(value, ['width', 'height'], 'world', errors);
  validateBoundedPositiveInteger(
    value['width'],
    'world.width',
    errors,
    EXTRAS_LEVEL_MAX_WORLD_SIZE,
  );
  validateBoundedPositiveInteger(
    value['height'],
    'world.height',
    errors,
    EXTRAS_LEVEL_MAX_WORLD_SIZE,
  );
}

function validateSpawn(value: unknown, errors: string[]): void {
  if (!isRecord(value)) {
    errors.push('spawn must be an object.');
    return;
  }
  addUnknownKeyErrors(value, ['elementId', 'offsetX'], 'spawn', errors);
  validateId(value['elementId'], 'spawn.elementId', errors);
  validateNonNegativeInteger(value['offsetX'], 'spawn.offsetX', errors);
}

function validateElement(
  value: unknown,
  index: number,
  world: unknown,
  knownTopicIds: readonly string[],
  elementIds: Set<string>,
  topicIds: Set<string>,
  errors: string[],
): void {
  const path = `elements[${index}]`;
  if (!isRecord(value)) {
    errors.push(`${path} must be an object.`);
    return;
  }

  const kind = value['kind'];
  if (kind !== 'island' && kind !== 'platform') {
    errors.push(`${path}.kind must be "island" or "platform".`);
    return;
  }
  const allowedKeys = kind === 'island'
    ? ['kind', 'id', 'topicId', 'x', 'y', 'width', 'height']
    : ['kind', 'id', 'x', 'y', 'width', 'height'];
  addUnknownKeyErrors(value, allowedKeys, path, errors);

  validateId(value['id'], `${path}.id`, errors);
  if (typeof value['id'] === 'string') {
    if (elementIds.has(value['id'])) errors.push(`Duplicate element id "${value['id']}".`);
    elementIds.add(value['id']);
  }

  validateNonNegativeInteger(value['x'], `${path}.x`, errors);
  validateNonNegativeInteger(value['y'], `${path}.y`, errors);
  validatePositiveInteger(value['width'], `${path}.width`, errors);
  validatePositiveInteger(value['height'], `${path}.height`, errors);

  if (isRecord(world) && isSafeInteger(world['width']) && isSafeInteger(world['height'])) {
    if (
      isSafeInteger(value['x']) &&
      isSafeInteger(value['width']) &&
      value['x'] + value['width'] > world['width']
    ) {
      errors.push(`${path} extends beyond world.width.`);
    }
    if (
      isSafeInteger(value['y']) &&
      isSafeInteger(value['height']) &&
      value['y'] + value['height'] > world['height']
    ) {
      errors.push(`${path} extends beyond world.height.`);
    }
  }

  if (kind !== 'island') return;
  validateId(value['topicId'], `${path}.topicId`, errors);
  if (typeof value['topicId'] !== 'string') return;
  if (knownTopicIds.length > 0 && !knownTopicIds.includes(value['topicId'])) {
    errors.push(`${path}.topicId references unknown topic "${value['topicId']}".`);
  }
  if (topicIds.has(value['topicId'])) {
    errors.push(`Duplicate island topicId "${value['topicId']}".`);
  }
  topicIds.add(value['topicId']);
}

function validationFailure(error: string): ExtrasLevelValidationFailure {
  return { valid: false, config: null, errors: [error] };
}

function validateId(value: unknown, path: string, errors: string[]): void {
  if (typeof value !== 'string' || !ELEMENT_ID_PATTERN.test(value)) {
    errors.push(`${path} must be a lowercase slug no longer than 64 characters.`);
  }
}

function validatePositiveInteger(value: unknown, path: string, errors: string[]): void {
  if (!isSafeInteger(value) || value <= 0) errors.push(`${path} must be a positive safe integer.`);
}

function validateBoundedPositiveInteger(
  value: unknown,
  path: string,
  errors: string[],
  maximum: number,
): void {
  validatePositiveInteger(value, path, errors);
  if (isSafeInteger(value) && value > maximum) errors.push(`${path} cannot exceed ${maximum}.`);
}

function validateNonNegativeInteger(value: unknown, path: string, errors: string[]): void {
  if (!isSafeInteger(value) || value < 0) {
    errors.push(`${path} must be a non-negative safe integer.`);
  }
}

function isSafeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addUnknownKeyErrors(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  errors: string[],
): void {
  for (const key of Object.keys(value)) {
    if (!allowedKeys.includes(key)) errors.push(`${path} contains unknown property "${key}".`);
  }
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value));
}
