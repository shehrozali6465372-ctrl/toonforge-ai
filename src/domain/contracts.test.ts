import { describe, expect, it } from 'vitest';
import {
  SceneManifestSchema,
  SceneManifestJsonSchema,
  StoryPlanSchema,
  StoryPlanJsonSchema,
  getProductionReadinessIssues,
} from './contracts';

const validStoryPlan = {
  kind: 'toonforge.story-plan',
  schemaVersion: '1.0',
  id: 'story-one',
  project: {
    title: 'The Lost Star',
    logline: 'A young fox helps a fallen star find its way home.',
    targetDurationSeconds: 90,
    language: 'en',
    tone: 'adventure',
  },
  characters: [
    {
      id: 'milo',
      name: 'Milo',
      role: 'protagonist',
      description: 'A curious young fox.',
      visualDescription: 'An orange fox with a small blue satchel.',
    },
  ],
  locations: [
    { id: 'forest', name: 'Moonlit Forest', description: 'A quiet forest at night.' },
  ],
  beats: [
    { id: 'setup', type: 'setup', summary: 'Milo discovers a fallen star.', sceneIds: ['scene-one'] },
    { id: 'climax', type: 'climax', summary: 'Milo climbs the hill to return the star.', sceneIds: ['scene-two'] },
    { id: 'resolution', type: 'resolution', summary: 'The star returns to the sky.', sceneIds: ['scene-three'] },
  ],
  scenes: [
    {
      id: 'scene-one', title: 'A Strange Light', summary: 'Milo finds the fallen star.',
      locationId: 'forest', characterIds: ['milo'], durationSeconds: 30,
      dialogue: [{ id: 'line-one', characterId: 'milo', text: 'Are you lost?', startSeconds: 2, durationSeconds: 2 }],
    },
    {
      id: 'scene-two', title: 'The Hill', summary: 'Milo carries the star uphill.',
      locationId: 'forest', characterIds: ['milo'], durationSeconds: 30, dialogue: [],
    },
    {
      id: 'scene-three', title: 'Home Again', summary: 'The star returns to the sky.',
      locationId: 'forest', characterIds: ['milo'], durationSeconds: 30, dialogue: [],
    },
  ],
};

const validSceneManifest = {
  kind: 'toonforge.scene-manifest',
  schemaVersion: '1.0',
  id: 'manifest-one',
  project: {
    title: 'The Lost Star',
    targetDurationSeconds: 60,
    frameRate: 24,
    resolution: { width: 1280, height: 720 },
  },
  assets: [
    {
      id: 'hero-model', kind: 'character', path: 'assets/characters/hero.glb', format: 'glb',
      provenance: { source: 'generated', licenseId: 'toonforge-generated', commercialUse: 'allowed', verified: true },
    },
    {
      id: 'tree-model', kind: 'prop', path: 'assets/props/tree.glb', format: 'glb',
      provenance: { source: 'licensed-catalog', licenseId: 'CC0-1.0', sourceUrl: 'https://example.org/tree', attribution: 'Example asset', commercialUse: 'allowed', verified: true },
    },
    {
      id: 'theme-audio', kind: 'audio', path: 'assets/audio/theme.wav', format: 'wav',
      provenance: { source: 'user-uploaded', licenseId: 'user-owned', commercialUse: 'allowed', verified: true },
    },
  ],
  scenes: [
    {
      id: 'scene-one', storySceneId: 'scene-one', title: 'A Strange Light', durationSeconds: 30,
      backgroundColor: '#101820',
      camera: { shotType: 'wide', position: [0, 2, 8], rotation: [0, 0, 0], fov: 50 },
      objects: [
        { id: 'milo-instance', assetId: 'hero-model', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
        { id: 'tree-instance', assetId: 'tree-model', transform: { position: [2, 0, -1], rotation: [0, 0.5, 0], scale: [1, 1, 1] } },
      ],
      animationCues: [
        {
          id: 'milo-walk', targetObjectId: 'milo-instance', property: 'position',
          keyframes: [
            { timeSeconds: 0, value: [0, 0, 0], easing: 'linear' },
            { timeSeconds: 10, value: [1, 0, 0], easing: 'ease_in_out' },
          ],
        },
      ],
      dialogue: [{ id: 'line-one', speakerAssetId: 'hero-model', text: 'Are you lost?', startSeconds: 2, durationSeconds: 2 }],
      audioCues: [{ id: 'theme-one', assetId: 'theme-audio', startSeconds: 0, durationSeconds: 30, volume: 0.5, fadeInSeconds: 1, fadeOutSeconds: 1 }],
    },
    {
      id: 'scene-two', storySceneId: 'scene-two', title: 'The Hill', durationSeconds: 30,
      backgroundColor: '#172536',
      camera: { shotType: 'medium', position: [0, 2, 7], rotation: [0, 0, 0], fov: 45 },
      objects: [
        { id: 'milo-instance-two', assetId: 'hero-model', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
      ],
      animationCues: [], dialogue: [], audioCues: [],
    },
  ],
};

describe('StoryPlanSchema', () => {
  it('accepts a valid, versioned story plan with resolved references', () => {
    const result = StoryPlanSchema.safeParse(validStoryPlan);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.project.targetDurationSeconds).toBe(90);
  });

  it('rejects unsupported schema versions', () => {
    const result = StoryPlanSchema.safeParse({ ...validStoryPlan, schemaVersion: '2.0' });
    expect(result.success).toBe(false);
  });

  it('rejects scene durations that do not add up to the target duration', () => {
    const input = { ...validStoryPlan, scenes: validStoryPlan.scenes.slice(1) };
    expect(StoryPlanSchema.safeParse(input).success).toBe(false);
  });

  it('rejects unknown character and location references', () => {
    const input = {
      ...validStoryPlan,
      scenes: validStoryPlan.scenes.map((scene, index) => index === 0
        ? { ...scene, locationId: 'missing-location', characterIds: ['missing-character'] }
        : scene),
    };
    expect(StoryPlanSchema.safeParse(input).success).toBe(false);
  });

  it('rejects dialogue that extends beyond its scene duration', () => {
    const input = {
      ...validStoryPlan,
      scenes: validStoryPlan.scenes.map((scene, index) => index === 0
        ? { ...scene, dialogue: [{ id: 'late-line', characterId: 'milo', text: 'Too late', startSeconds: 29, durationSeconds: 5 }] }
        : scene),
    };
    expect(StoryPlanSchema.safeParse(input).success).toBe(false);
  });

  it('requires setup, climax and resolution beats in narrative order', () => {
    const missingResolution = { ...validStoryPlan, beats: validStoryPlan.beats.map((beat) => beat.type === 'resolution' ? { ...beat, type: 'rising_action' } : beat) };
    const wrongOrder = { ...validStoryPlan, beats: [validStoryPlan.beats[1], validStoryPlan.beats[0], validStoryPlan.beats[2]] };
    expect(StoryPlanSchema.safeParse(missingResolution).success).toBe(false);
    expect(StoryPlanSchema.safeParse(wrongOrder).success).toBe(false);
  });

  it('rejects duplicate character and dialogue IDs within a scene', () => {
    const input = {
      ...validStoryPlan,
      scenes: validStoryPlan.scenes.map((scene, index) => index === 0
        ? { ...scene, characterIds: ['milo', 'milo'], dialogue: [scene.dialogue[0], { ...scene.dialogue[0], text: 'Duplicate line' }] }
        : scene),
    };
    expect(StoryPlanSchema.safeParse(input).success).toBe(false);
  });
});

describe('SceneManifestSchema', () => {
  it('accepts a valid versioned 3D manifest with asset, camera and timeline references', () => {
    const result = SceneManifestSchema.safeParse(validSceneManifest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.scenes).toHaveLength(2);
  });

  it.each(['https://cdn.example.org/hero.glb', 'assets/../private/hero.glb', 'assets/characters/hero.exe'])('rejects unsafe or unsupported asset paths: %s', (path) => {
    const input = {
      ...validSceneManifest,
      assets: validSceneManifest.assets.map((asset, index) => index === 0 ? { ...asset, path } : asset),
    };
    expect(SceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('requires asset paths to use the directory assigned to their asset kind', () => {
    const input = {
      ...validSceneManifest,
      assets: validSceneManifest.assets.map((asset, index) => index === 0 ? { ...asset, path: 'assets/props/hero.glb' } : asset),
    };
    expect(SceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects duplicate asset paths and duplicate story-scene mappings', () => {
    const duplicatePath = {
      ...validSceneManifest,
      assets: validSceneManifest.assets.map((asset, index) => index === 1 ? { ...asset, path: 'assets/characters/hero.glb' } : asset),
    };
    const duplicateStoryScene = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 1 ? { ...scene, storySceneId: 'scene-one' } : scene),
    };
    expect(SceneManifestSchema.safeParse(duplicatePath).success).toBe(false);
    expect(SceneManifestSchema.safeParse(duplicateStoryScene).success).toBe(false);
  });

  it('rejects asset references that do not exist', () => {
    const input = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, objects: scene.objects.map((object, objectIndex) => objectIndex === 0 ? { ...object, assetId: 'missing-asset' } : object) }
        : scene),
    };
    expect(SceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects audio cues that reference a non-audio asset', () => {
    const input = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, audioCues: [{ id: 'bad-audio', assetId: 'hero-model', startSeconds: 0, durationSeconds: 5, volume: 1, fadeInSeconds: 0, fadeOutSeconds: 0 }] }
        : scene),
    };
    expect(SceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects animation cues that target an object outside the scene', () => {
    const input = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, animationCues: [{ ...scene.animationCues[0], targetObjectId: 'missing-object' }] }
        : scene),
    };
    expect(SceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects keyframes outside scene duration and keyframes that are not time ordered', () => {
    const cue = validSceneManifest.scenes[0].animationCues[0];
    const outside = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, animationCues: [{ ...cue, keyframes: [...cue.keyframes, { timeSeconds: 31, value: [2, 0, 0], easing: 'linear' }] }] }
        : scene),
    };
    const unordered = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, animationCues: [{ ...cue, keyframes: [...cue.keyframes].reverse() }] }
        : scene),
    };
    expect(SceneManifestSchema.safeParse(outside).success).toBe(false);
    expect(SceneManifestSchema.safeParse(unordered).success).toBe(false);
  });

  it('rejects duplicate animation cue IDs and non-positive scale keyframes', () => {
    const cue = validSceneManifest.scenes[0].animationCues[0];
    const duplicateCue = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, animationCues: [cue, { ...cue, targetObjectId: 'tree-instance' }] }
        : scene),
    };
    const negativeScale = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, animationCues: [{ ...cue, property: 'scale', keyframes: [{ timeSeconds: 0, value: [1, 1, 1], easing: 'linear' }, { timeSeconds: 1, value: [-1, 1, 1], easing: 'linear' }] }] }
        : scene),
    };
    expect(SceneManifestSchema.safeParse(duplicateCue).success).toBe(false);
    expect(SceneManifestSchema.safeParse(negativeScale).success).toBe(false);
  });

  it('rejects keyframe values that do not match the animated property', () => {
    const cue = validSceneManifest.scenes[0].animationCues[0];
    const input = {
      ...validSceneManifest,
      scenes: validSceneManifest.scenes.map((scene, index) => index === 0
        ? { ...scene, animationCues: [{ ...cue, property: 'opacity', keyframes: [{ timeSeconds: 0, value: [0, 0, 0], easing: 'linear' }, { timeSeconds: 1, value: [1, 1, 1], easing: 'linear' }] }] }
        : scene),
    };
    expect(SceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('rejects scene durations that do not add up to the project duration', () => {
    const input = { ...validSceneManifest, project: { ...validSceneManifest.project, targetDurationSeconds: 90 } };
    expect(SceneManifestSchema.safeParse(input).success).toBe(false);
  });

  it('exports strict structural JSON Schemas for provider interoperability', () => {
    expect(StoryPlanJsonSchema).toMatchObject({ type: 'object', additionalProperties: false });
    expect(SceneManifestJsonSchema).toMatchObject({ type: 'object', additionalProperties: false });
  });
});

describe('getProductionReadinessIssues', () => {
  it('blocks unverified assets and assets without commercial-use permission', () => {
    const input = {
      ...validSceneManifest,
      assets: validSceneManifest.assets.map((asset, index) => index === 1
        ? { ...asset, provenance: { ...asset.provenance, verified: false, commercialUse: 'unknown' } }
        : asset),
    };
    const parsed = SceneManifestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(getProductionReadinessIssues(parsed.data)).toHaveLength(2);
  });

  it('blocks assets with an unknown license identifier', () => {
    const input = {
      ...validSceneManifest,
      assets: validSceneManifest.assets.map((asset, index) => index === 0
        ? { ...asset, provenance: { ...asset.provenance, licenseId: 'unknown' } }
        : asset),
    };
    const parsed = SceneManifestSchema.safeParse(input);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(getProductionReadinessIssues(parsed.data)).toHaveLength(1);
  });

  it('returns no issues when every asset is verified for commercial use', () => {
    const parsed = SceneManifestSchema.safeParse(validSceneManifest);
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(getProductionReadinessIssues(parsed.data)).toEqual([]);
  });
});
