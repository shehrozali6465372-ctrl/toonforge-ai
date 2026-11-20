import { describe, expect, it } from 'vitest';
import { SceneManifestSchema } from './contracts';
import {
  getManifestImportRequirements,
  isManifestJsonSizeAllowed,
  isManifestAssetSizeAllowed,
  isManifestAggregateSizeAllowed,
  MANIFEST_IMPORT_MAX_JSON_BYTES,
  MANIFEST_IMPORT_MAX_ASSET_BYTES,
  MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES,
} from './manifest-import-ui';

function makeManifest() {
  return SceneManifestSchema.parse({
    kind: 'toonforge.scene-manifest', schemaVersion: '1.0', id: 'manifest-ui-test',
    project: { title: 'UI Test', targetDurationSeconds: 60, frameRate: 24, resolution: { width: 1280, height: 720 } },
    assets: [
      { id: 'hero', kind: 'character', path: 'assets/characters/hero.glb', format: 'glb', provenance: { source: 'generated', licenseId: 'generated', commercialUse: 'allowed', verified: true } },
      { id: 'unused-prop', kind: 'prop', path: 'assets/props/unused.glb', format: 'glb', provenance: { source: 'generated', licenseId: 'generated', commercialUse: 'allowed', verified: true } },
      { id: 'audio-track', kind: 'audio', path: 'assets/audio/ambience.wav', format: 'wav', provenance: { source: 'generated', licenseId: 'generated', commercialUse: 'allowed', verified: true } },
    ],
    scenes: [{
      id: 'scene-one', title: 'Scene One', durationSeconds: 60, backgroundColor: '#101820',
      camera: { shotType: 'wide', position: [0, 2, 8], rotation: [0, 0, 0], fov: 50 },
      objects: [
        { id: 'object-one', assetId: 'hero', transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
        { id: 'object-two', assetId: 'hero', transform: { position: [1, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] } },
      ],
      animationCues: [], dialogue: [], audioCues: [],
    }],
  });
}

describe('manifest import UI requirements', () => {
  it('returns each referenced GLB asset once and omits unused manifest assets', () => {
    const requirements = getManifestImportRequirements(makeManifest());
    expect(requirements.requiredAssets.map((asset) => asset.id)).toEqual(['hero']);
    expect(requirements.unsupportedReasons).toEqual([]);
  });

  it('surfaces unsupported audio/dialogue features before asking for model files', () => {
    const manifest = makeManifest();
    manifest.scenes[0].dialogue.push({
      id: 'dialogue-one', speakerAssetId: 'hero', text: 'Hello', startSeconds: 0, durationSeconds: 2,
    });
    manifest.scenes[0].audioCues.push({
      id: 'audio-one', assetId: 'audio-track', startSeconds: 0, durationSeconds: 2, volume: 1, fadeInSeconds: 0, fadeOutSeconds: 0,
    });
    const requirements = getManifestImportRequirements(manifest);
    expect(requirements.unsupportedReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'dialogue', sceneTitle: 'Scene One' }),
      expect.objectContaining({ code: 'audio', sceneTitle: 'Scene One' }),
    ]));
  });

  it('surfaces unsupported glTF and PBR material features', () => {
    const manifest = makeManifest();
    manifest.assets[0].format = 'gltf';
    manifest.assets[0].path = 'assets/characters/hero.gltf';
    manifest.scenes[0].objects[0].material = { color: '#ffffff', roughness: 0.5 };
    const requirements = getManifestImportRequirements(manifest);
    expect(requirements.unsupportedReasons).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'asset_format', assetId: 'hero', format: 'gltf' }),
      expect.objectContaining({ code: 'material', objectId: 'object-one' }),
    ]));
  });

  it('rejects manifests that do not pass the runtime schema', () => {
    expect(() => getManifestImportRequirements({ kind: 'wrong' })).toThrow(/manifest/i);
  });

  it('enforces explicit JSON, per-asset and aggregate file-size limits', () => {
    expect(isManifestJsonSizeAllowed(MANIFEST_IMPORT_MAX_JSON_BYTES)).toBe(true);
    expect(isManifestJsonSizeAllowed(MANIFEST_IMPORT_MAX_JSON_BYTES + 1)).toBe(false);
    expect(isManifestAssetSizeAllowed(MANIFEST_IMPORT_MAX_ASSET_BYTES)).toBe(true);
    expect(isManifestAssetSizeAllowed(MANIFEST_IMPORT_MAX_ASSET_BYTES + 1)).toBe(false);
    expect(isManifestAggregateSizeAllowed(MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES)).toBe(true);
    expect(isManifestAggregateSizeAllowed(MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES + 1)).toBe(false);
  });
});
