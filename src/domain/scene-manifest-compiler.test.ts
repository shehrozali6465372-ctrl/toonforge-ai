import { describe, expect, it } from 'vitest';
import { compileSceneManifest, SceneManifestCompileError } from './scene-manifest-compiler';
import { SceneManifestSchema } from './contracts';

function createGlbDataUrl() {
  const json = new TextEncoder().encode('{"asset":{"version":"2.0"}}');
  const jsonChunkLength = Math.ceil(json.length / 4) * 4;
  const bytes = new Uint8Array(20 + jsonChunkLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, jsonChunkLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20);
  bytes.set(json, 20);
  return `data:model/gltf-binary;base64,${btoa(String.fromCharCode(...bytes))}`;
}

const modelDataUrl = createGlbDataUrl();

function makeManifest() {
  return SceneManifestSchema.parse({
    kind: 'toonforge.scene-manifest',
    schemaVersion: '1.0',
    id: 'lost-star',
    project: {
      title: 'The Lost Star',
      targetDurationSeconds: 60,
      frameRate: 24,
      resolution: { width: 1280, height: 720 },
    },
    assets: [
      {
        id: 'hero', kind: 'character', path: 'assets/characters/hero.glb', format: 'glb',
        provenance: { source: 'generated', licenseId: 'generated-by-toonforge', commercialUse: 'allowed', verified: true },
      },
      {
        id: 'tree', kind: 'prop', path: 'assets/props/tree.glb', format: 'glb',
        provenance: { source: 'licensed-catalog', licenseId: 'CC0-1.0', sourceUrl: 'https://assets.example/tree', attribution: 'Example creator', commercialUse: 'allowed', verified: true },
      },
    ],
    scenes: [
      {
        id: 'forest', storySceneId: 'story-forest', title: 'Moonlit Forest', durationSeconds: 60,
        backgroundColor: '#101820',
        camera: { shotType: 'wide', position: [0, 2, 8], rotation: [0, 0, 0], fov: 50 },
        objects: [
          { id: 'hero-instance', assetId: 'hero', transform: { position: [1, 2, 3], rotation: [0, 0.5, 0], scale: [1, 1, 1] } },
          { id: 'tree-instance', assetId: 'tree', transform: { position: [4, 0, -2], rotation: [0, 0, 0], scale: [2, 2, 2] }, material: { opacity: 0.8 } },
        ],
        animationCues: [
          {
            id: 'hero-walk', targetObjectId: 'hero-instance', property: 'position',
            keyframes: [
              { timeSeconds: 0, value: [1, 2, 3], easing: 'linear' },
              { timeSeconds: 10, value: [5, 2, 3], easing: 'ease_in_out' },
            ],
          },
          {
            id: 'tree-fade', targetObjectId: 'tree-instance', property: 'opacity',
            keyframes: [
              { timeSeconds: 0, value: 1, easing: 'ease_out' },
              { timeSeconds: 12, value: 0.5, easing: 'linear' },
            ],
          },
        ],
        dialogue: [],
        audioCues: [],
      },
    ],
  });
}

const sources = { hero: modelDataUrl, tree: modelDataUrl };
const options = { createdAt: 1_800_000_000_000, assetSources: sources };

describe('compileSceneManifest', () => {
  it('compiles a validated manifest into the existing 3D Project and Scene model', () => {
    const result = compileSceneManifest(makeManifest(), options);

    expect(result.project).toMatchObject({
      id: 'lost-star', name: 'The Lost Star', mode: '3d',
      createdAt: options.createdAt, updatedAt: options.createdAt,
      settings: { width: 1280, height: 720, fps: 24 },
    });
    expect(result.project.scenes).toHaveLength(1);
    expect(result.project.scenes[0]).toMatchObject({
      id: 'forest', name: 'Moonlit Forest', duration: 60, order: 0,
      background: { type: 'solid', color: '#101820' }, transitionToNext: null,
    });
  });

  it('uses stable source IDs and produces byte-for-byte equivalent output for the same inputs', () => {
    const first = compileSceneManifest(makeManifest(), options);
    const second = compileSceneManifest(makeManifest(), options);

    expect(first).toEqual(second);
    expect(first.project.scenes[0].layers.map((layer) => layer.id)).toEqual([
      'hero-instance', 'tree-instance', 'forest-camera',
    ]);
  });

  it('resolves imported model sources and preserves transforms and supported material opacity', () => {
    const result = compileSceneManifest(makeManifest(), options);
    const [hero, tree] = result.project.scenes[0].layers;

    expect(hero).toMatchObject({
      id: 'hero-instance', type: 'mesh', mesh: 'imported', src: modelDataUrl,
      importedFormat: 'gltf', position: { x: 1, y: 2, z: 3 },
      rotation: { x: 0, y: 0.5, z: 0 }, scale: { x: 1, y: 1, z: 1 },
    });
    expect(tree).toMatchObject({ opacity: 0.8, scale: { x: 2, y: 2, z: 2 } });
  });

  it('compiles the camera intent to the existing camera3d layer and preserves shot metadata', () => {
    const result = compileSceneManifest(makeManifest(), options);
    const camera = result.project.scenes[0].layers[2];

    expect(camera).toMatchObject({
      id: 'forest-camera', type: 'camera3d', position: { x: 0, y: 2, z: 8 },
      rotation: { x: 0, y: 0, z: 0 }, fov: 50, near: 0.1, far: 1000,
    });
    expect(result.sceneMetadata.forest).toEqual({ storySceneId: 'story-forest', shotType: 'wide' });
  });

  it('converts animation cue seconds, vectors, numeric values and easing into editor keyframes', () => {
    const result = compileSceneManifest(makeManifest(), options);
    const hero = result.project.scenes[0].layers[0];
    const tree = result.project.scenes[0].layers[1];

    expect(hero.keyframes).toEqual([
      { id: 'hero-walk-kf-1', time: 0, property: 'position', value: { x: 1, y: 2, z: 3 }, easing: 'linear' },
      { id: 'hero-walk-kf-2', time: 10, property: 'position', value: { x: 5, y: 2, z: 3 }, easing: 'easeInOut' },
    ]);
    expect(tree.keyframes[0]).toMatchObject({ property: 'opacity', value: 1, easing: 'easeOut' });
  });

  it('preserves asset provenance and manifest identity outside the legacy Project model', () => {
    const result = compileSceneManifest(makeManifest(), options);

    expect(result.manifest).toEqual({ id: 'lost-star', schemaVersion: '1.0' });
    expect(result.assetMetadata.hero).toMatchObject({
      kind: 'character', path: 'assets/characters/hero.glb', format: 'glb',
      provenance: { source: 'generated', licenseId: 'generated-by-toonforge', commercialUse: 'allowed', verified: true },
    });
    expect(result.assetMetadata.tree.provenance.attribution).toBe('Example creator');
  });

  it('rejects a missing resolved source instead of creating a broken imported mesh', () => {
    expect(() => compileSceneManifest(makeManifest(), {
      createdAt: options.createdAt,
      assetSources: { hero: modelDataUrl },
    })).toThrowError(new SceneManifestCompileError('missing_asset_source', 'No packaged model data URL supplied for asset "tree"'));
  });

  it('rejects remote URLs and non-model data URLs for imported assets', () => {
    expect(() => compileSceneManifest(makeManifest(), {
      createdAt: options.createdAt,
      assetSources: { hero: 'https://assets.example/hero.glb', tree: modelDataUrl },
    })).toThrowError(SceneManifestCompileError);
  });

  it('rejects malformed GLB data URLs even when the MIME type and base64 shape look valid', () => {
    expect(() => compileSceneManifest(makeManifest(), {
      createdAt: options.createdAt,
      assetSources: { hero: 'data:model/gltf-binary;base64,AA==', tree: modelDataUrl },
    })).toThrowError(/valid GLB v2 base64 data URL/);
  });

  it('does not accept inherited asset-source entries from an object prototype', () => {
    const inheritedSources = Object.create({ hero: modelDataUrl, tree: modelDataUrl }) as Record<string, string>;
    expect(() => compileSceneManifest(makeManifest(), {
      createdAt: options.createdAt,
      assetSources: inheritedSources,
    })).toThrowError(/No packaged model data URL supplied for asset "hero"/);
  });

  it('rejects dialogue and audio cues because the editor has no audio or voice track', () => {
    const manifest = makeManifest();
    manifest.scenes[0].dialogue.push({
      id: 'spoken-line', speakerAssetId: 'hero', text: 'Hello', startSeconds: 1,
      durationSeconds: 2, emotion: 'happy',
    });

    expect(() => compileSceneManifest(manifest, options)).toThrowError(/dialogue\/voice track/);
  });

  it('rejects material properties the current imported-mesh renderer cannot apply', () => {
    const manifest = makeManifest();
    manifest.scenes[0].objects[0].material = { color: '#ff0000' };

    expect(() => compileSceneManifest(manifest, options)).toThrowError(/material color/);
  });

  it('rejects colliding camera and object layer IDs', () => {
    const manifest = makeManifest();
    manifest.scenes[0].objects[0].id = 'forest-camera';
    manifest.scenes[0].animationCues[0].targetObjectId = 'forest-camera';

    expect(() => compileSceneManifest(manifest, options)).toThrowError(/camera layer ID collides/);
  });

  it('rejects duplicate animation channels targeting the same object property', () => {
    const manifest = makeManifest();
    manifest.scenes[0].animationCues.push({
      id: 'hero-walk-again', targetObjectId: 'hero-instance', property: 'position',
      keyframes: [
        { timeSeconds: 20, value: [5, 2, 3], easing: 'linear' },
        { timeSeconds: 30, value: [8, 2, 3], easing: 'linear' },
      ],
    });

    expect(() => compileSceneManifest(manifest, options)).toThrowError(/duplicate animation channel/);
  });

  it('rejects standalone glTF files until external buffer and texture packaging is implemented', () => {
    const manifest = makeManifest();
    manifest.assets[0].format = 'gltf';
    manifest.assets[0].path = 'assets/characters/hero.gltf';

    expect(() => compileSceneManifest(manifest, options)).toThrowError(/only packaged GLB assets are supported/);
  });

  it('rejects invalid timestamps and invalid manifest input at the compiler boundary', () => {
    expect(() => compileSceneManifest(makeManifest(), { ...options, createdAt: -1 })).toThrowError(/createdAt/);
    expect(() => compileSceneManifest({ kind: 'wrong' }, options)).toThrowError(SceneManifestCompileError);
  });
});
