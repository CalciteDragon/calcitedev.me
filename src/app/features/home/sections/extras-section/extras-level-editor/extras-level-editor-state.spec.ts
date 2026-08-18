import { extrasLevelData } from '../../../../../data/extras-level.data';
import { ExtraLevelElement, ExtrasLevelConfig } from '../../../../../models/extra-level.model';
import {
  EXTRAS_LEVEL_DRAFT_STORAGE_PREFIX,
  clampElementToWorld,
  clearExtrasLevelDraft,
  cloneExtrasLevel,
  extrasLevelDraftStorageKey,
  extrasLevelEditorEnabled,
  loadExtrasLevelDraft,
  nextPlatformId,
  parseExtrasLevelDraft,
  saveExtrasLevelDraft,
  serializeExtrasLevelSource,
  snapCoordinate,
  validateExtrasLevel,
} from './extras-level-editor-state';

const topicIds = ['capstone', 'keyboard', 'robotics'];

describe('Extras level editor state', () => {
  afterEach(() => window.localStorage.clear());

  it('accepts and clones the canonical level without pinning editable geometry', () => {
    const result = validateExtrasLevel(extrasLevelData, topicIds);

    expect(result.valid).toBe(true);
    if (!result.valid) return;
    expect(result.config).toEqual(extrasLevelData);
    expect(result.config).not.toBe(extrasLevelData);
    expect(
      result.config.elements
        .filter(element => element.kind === 'island')
        .map(island => island.topicId),
    ).toEqual(topicIds);
  });

  it('deep-clones every mutable level branch', () => {
    const clone = cloneExtrasLevel(extrasLevelData);

    expect(clone).toEqual(extrasLevelData);
    expect(clone).not.toBe(extrasLevelData);
    expect(clone.world).not.toBe(extrasLevelData.world);
    expect(clone.spawn).not.toBe(extrasLevelData.spawn);
    expect(clone.elements).not.toBe(extrasLevelData.elements);
    expect(clone.elements[0]).not.toBe(extrasLevelData.elements[0]);
  });

  it('rejects stale schemas, invalid geometry, duplicate ids, and incomplete topic islands', () => {
    const invalid = cloneExtrasLevel(extrasLevelData) as unknown as {
      schemaVersion: number;
      elements: ExtraLevelElement[];
    };
    invalid.schemaVersion = 2;
    invalid.elements = [
      { ...invalid.elements[0]!, width: 2000 },
      { ...invalid.elements[0]!, kind: 'platform' },
    ];

    const result = validateExtrasLevel(invalid, topicIds);

    expect(result.valid).toBe(false);
    if (result.valid) return;
    expect(result.errors).toContain('schemaVersion must be 1.');
    expect(result.errors).toContain('elements[0] extends beyond world.width.');
    expect(result.errors).toContain('Duplicate element id "capstone-island".');
    expect(result.errors).toContain('Missing island for topic "keyboard".');
    expect(result.errors).toContain('Missing island for topic "robotics".');
  });

  it('serializes a complete deterministic TypeScript data source', () => {
    const reordered = {
      elements: cloneExtrasLevel(extrasLevelData).elements,
      spawn: {
        offsetX: extrasLevelData.spawn.offsetX,
        elementId: extrasLevelData.spawn.elementId,
      },
      world: {
        height: extrasLevelData.world.height,
        width: extrasLevelData.world.width,
      },
      revision: extrasLevelData.revision,
      schemaVersion: 1,
    } as ExtrasLevelConfig;

    const source = serializeExtrasLevelSource(reordered);

    expect(source).toBe(serializeExtrasLevelSource(extrasLevelData));
    expect(source).toContain("import { ExtrasLevelConfig } from '../models/extra-level.model';");
    expect(source).toContain('export const extrasLevelData = {');
    expect(source).toContain(`"elementId": "${extrasLevelData.spawn.elementId}"`);
    expect(source).toContain('as const satisfies ExtrasLevelConfig;');
    expect(source.endsWith('\n')).toBe(true);
  });

  it('activates only for the exact extrasDebug query value', () => {
    expect(extrasLevelEditorEnabled('?extrasDebug=level')).toBe(true);
    expect(extrasLevelEditorEnabled('?foo=1&extrasDebug=level')).toBe(true);
    expect(extrasLevelEditorEnabled('?extrasDebug=Level')).toBe(false);
    expect(extrasLevelEditorEnabled('?extrasDebug=level-editor')).toBe(false);
    expect(extrasLevelEditorEnabled('')).toBe(false);
  });

  it('stores, loads, and clears revision-keyed draft envelopes', () => {
    const baseRevision = extrasLevelData.revision;
    const saved = saveExtrasLevelDraft(
      window.localStorage,
      extrasLevelData,
      baseRevision,
      '2026-08-14T12:00:00.000Z',
    );

    expect(saved).toBe(true);
    expect(extrasLevelDraftStorageKey(baseRevision)).toBe(
      `${EXTRAS_LEVEL_DRAFT_STORAGE_PREFIX}:${baseRevision}`,
    );
    expect(loadExtrasLevelDraft(window.localStorage, baseRevision + 1, topicIds)).toBeNull();
    expect(loadExtrasLevelDraft(window.localStorage, baseRevision, topicIds)).toEqual({
      draftSchemaVersion: 1,
      baseRevision,
      savedAt: '2026-08-14T12:00:00.000Z',
      level: cloneExtrasLevel(extrasLevelData),
    });
    expect(clearExtrasLevelDraft(window.localStorage, baseRevision)).toBe(true);
    expect(loadExtrasLevelDraft(window.localStorage, baseRevision, topicIds)).toBeNull();
  });

  it('rejects malformed or revision-mismatched draft envelopes', () => {
    expect(parseExtrasLevelDraft('{', 1, topicIds)).toBeNull();
    expect(
      parseExtrasLevelDraft(
        JSON.stringify({
          draftSchemaVersion: 1,
          baseRevision: 2,
          savedAt: '2026-08-14T12:00:00.000Z',
          level: extrasLevelData,
        }),
        1,
        topicIds,
      ),
    ).toBeNull();
  });

  it('fails safely when browser storage is unavailable', () => {
    const throwingStorage = {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
      removeItem: () => { throw new Error('blocked'); },
    };

    expect(saveExtrasLevelDraft(throwingStorage, extrasLevelData, 1)).toBe(false);
    expect(loadExtrasLevelDraft(throwingStorage, 1, topicIds)).toBeNull();
    expect(clearExtrasLevelDraft(throwingStorage, 1)).toBe(false);
  });

  it('snaps and clamps element geometry inside the world', () => {
    const element: ExtraLevelElement = {
      kind: 'platform',
      id: 'platform-1',
      x: 177,
      y: -9,
      width: 38,
      height: 17,
    };

    expect(snapCoordinate(17, 8)).toBe(16);
    expect(snapCoordinate(Number.NaN, 8)).toBe(0);
    expect(clampElementToWorld(element, { width: 200, height: 100 }, 8)).toEqual({
      ...element,
      x: 160,
      y: 0,
      width: 40,
      height: 16,
    });
  });

  it('creates deterministic unique platform ids across every element kind', () => {
    const elements: readonly ExtraLevelElement[] = [
      {
        kind: 'island',
        id: 'platform-1',
        topicId: 'keyboard',
        x: 0,
        y: 40,
        width: 100,
        height: 100,
      },
      { kind: 'platform', id: 'platform-3', x: 0, y: 0, width: 100, height: 20 },
    ];

    expect(nextPlatformId(elements)).toBe('platform-2');
    expect(nextPlatformId(elements, 'Jump Pad')).toBe('jump-pad-1');
  });
});
