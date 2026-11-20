import { describe, expect, it } from 'vitest';
import { SceneManifestSchema } from './contracts';
import { compileManifestImport, ManifestImportError } from './manifest-import';

function createGlbBytes(): Uint8Array {
  const json = new TextEncoder().encode('{"asset":{"version":"2.0"}}');
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const bytes = new Uint8Array(20 + jsonLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, bytes.length, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, 0x4e4f534a, true);
  bytes.fill(0x20, 20);
  bytes.set(json, 20);
  return bytes;
}

function makeManifest(assetCount = 1) {
  const assets = Array.from({ length: assetCount }, (_, index) => ({
    id: `hero-${index + 1}`,
    kind: 'character',
    path: `assets/characters/hero-${index + 1}.glb`,
    format: 'glb',
    provenance: { source: 'generated', licenseId: 'generated-by-toonforge', commercialUse: 'allowed', verified: true },
  }));
  return SceneManifestSchema.parse({
    kind: 'toonforge.scene-manifest', schemaVersion: '1.0', id: 'import-project',
    project: { title: 'Import Test', targetDurationSeconds: 60, frameRate: 24, resolution: { width: 1280, height: 720 } },
    assets,
    scenes: [
      {
        id: 'scene-one', title: 'Scene One', durationSeconds: 60, backgroundColor: '#101820',
        camera: { shotType: 'wide', position: [0, 2, 8], rotation: [0, 0, 0], fov: 50 },
        objects: assets.map((asset, index) => ({
          id: `object-${index + 1}`, assetId: asset.id,
          transform: { position: [index, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
        })),
        animationCues: [], dialogue: [], audioCues: [],
      },
    ],
  });
}

const glb = createGlbBytes();
const options = {
  createdAt: 1_800_000_000_000,
  maxAssetBytes: 1024,
  maxTotalAssetBytes: 2048,
};

describe('compileManifestImport', () => {
  it('packages referenced GLB bytes and compiles the editor project with durable sidecars', () => {
    const result = compileManifestImport(makeManifest(), {
      ...options,
      assetBytes: { 'hero-1': glb },
    });

    expect(result.project.id).toBe('import-project');
    expect(result.project.scenes[0].layers[0]).toMatchObject({
      id: 'object-1', type: 'mesh', mesh: 'imported',
      src: expect.stringMatching(/^data:model\/gltf-binary;base64,/),
    });
    expect(result.assetMetadata['hero-1'].provenance.verified).toBe(true);
    expect(result.sceneMetadata['scene-one'].shotType).toBe('wide');
    expect(result.totalAssetBytes).toBe(glb.byteLength);
  });

  it('packages a shared asset only once even when several scene objects reference it', () => {
    const manifest = makeManifest();
    manifest.scenes[0].objects.push({
      id: 'object-two', assetId: 'hero-1',
      transform: { position: [2, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    });
    const result = compileManifestImport(manifest, { ...options, assetBytes: { 'hero-1': glb } });

    expect(result.totalAssetBytes).toBe(glb.byteLength);
    const [firstLayer, secondLayer] = result.project.scenes[0].layers;
    if (firstLayer.type !== 'mesh' || secondLayer.type !== 'mesh') throw new Error('Expected compiled mesh layers');
    expect(firstLayer.src).toBe(secondLayer.src);
  });

  it('rejects a referenced asset when its uploaded bytes are missing', () => {
    expect(() => compileManifestImport(makeManifest(), { ...options, assetBytes: {} }))
      .toThrowError(new ManifestImportError('missing_asset_bytes', 'No uploaded bytes supplied for referenced asset "hero-1"'));
  });

  it('enforces both per-asset and aggregate byte limits before compiling', () => {
    expect(() => compileManifestImport(makeManifest(), {
      ...options, maxAssetBytes: glb.byteLength - 1, assetBytes: { 'hero-1': glb },
    })).toThrowError(/exceeds the configured limit/);

    expect(() => compileManifestImport(makeManifest(2), {
      ...options, maxTotalAssetBytes: glb.byteLength, assetBytes: { 'hero-1': glb, 'hero-2': glb },
    })).toThrowError(/Aggregate asset size/);
  });

  it('rejects invalid manifests before reading or packaging asset bytes', () => {
    expect(() => compileManifestImport({ kind: 'wrong' }, { ...options, assetBytes: {} }))
      .toThrowError(ManifestImportError);
  });

  it('rejects invalid timestamps before packaging uploaded model bytes', () => {
    expect(() => compileManifestImport(makeManifest(), {
      ...options, createdAt: -1, assetBytes: { 'hero-1': glb },
    })).toThrowError(/createdAt/);
  });

  it('rejects invalid byte-limit options rather than selecting an implicit cap', () => {
    expect(() => compileManifestImport(makeManifest(), {
      ...options, maxTotalAssetBytes: 0, assetBytes: { 'hero-1': glb },
    })).toThrowError(/maxTotalAssetBytes/);
  });
});
