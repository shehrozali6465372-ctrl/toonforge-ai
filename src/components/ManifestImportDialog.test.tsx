import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ManifestImportDialog } from './ManifestImportDialog';
import { saveCompiledManifestImport } from '@/lib/db';
import type { SceneManifest } from '@/domain/contracts';

vi.mock('@/lib/db', () => ({
  saveCompiledManifestImport: vi.fn().mockResolvedValue(undefined),
}));

function createManifest(): SceneManifest {
  return {
    kind: 'toonforge.scene-manifest',
    schemaVersion: '1.0',
    id: 'manifest-ui-component',
    project: {
      title: 'UI Component Test',
      targetDurationSeconds: 60,
      frameRate: 24,
      resolution: { width: 1280, height: 720 },
    },
    assets: [{
      id: 'hero',
      kind: 'character',
      path: 'assets/characters/hero.glb',
      format: 'glb',
      provenance: {
        source: 'generated',
        licenseId: 'generated',
        commercialUse: 'allowed',
        verified: true,
      },
    }],
    scenes: [{
      id: 'scene-one',
      title: 'Scene One',
      durationSeconds: 60,
      backgroundColor: '#101820',
      camera: { shotType: 'wide', position: [0, 2, 8], rotation: [0, 0, 0], fov: 50 },
      objects: [{
        id: 'object-one',
        assetId: 'hero',
        transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
      }],
      animationCues: [],
      dialogue: [],
      audioCues: [],
    }],
  };
}

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

describe('ManifestImportDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates a manifest, maps a selected GLB file to its asset ID and persists the compiled import', async () => {
    const onClose = vi.fn();
    render(<ManifestImportDialog open onClose={onClose} />);

    const manifestFile = new File([JSON.stringify(createManifest())], 'scene-manifest.json', { type: 'application/json' });
    Object.defineProperty(manifestFile, 'text', { value: async () => JSON.stringify(createManifest()) });
    fireEvent.change(screen.getByLabelText('Manifeste de scène (.json)'), { target: { files: [manifestFile] } });

    expect(await screen.findByText('UI Component Test')).toBeInTheDocument();
    const glbBytes = createGlbBytes();
    const glbBuffer = glbBytes.buffer.slice(glbBytes.byteOffset, glbBytes.byteOffset + glbBytes.byteLength) as ArrayBuffer;
    const glbFile = new File([glbBuffer], 'hero.glb', { type: 'model/gltf-binary' });
    Object.defineProperty(glbFile, 'arrayBuffer', {
      value: async () => glbBytes.buffer.slice(glbBytes.byteOffset, glbBytes.byteOffset + glbBytes.byteLength),
    });
    fireEvent.change(screen.getByLabelText('Choisir un fichier GLB'), { target: { files: [glbFile] } });

    const importButton = screen.getByRole('button', { name: 'Importer le projet' });
    await waitFor(() => expect(importButton).toBeEnabled());
    fireEvent.click(importButton);

    await waitFor(() => expect(saveCompiledManifestImport).toHaveBeenCalledTimes(1));
    expect(saveCompiledManifestImport).toHaveBeenCalledWith(expect.objectContaining({
      project: expect.objectContaining({ id: expect.stringMatching(/^import-/), name: 'UI Component Test' }),
      assetMetadata: expect.objectContaining({ hero: expect.any(Object) }),
      sceneMetadata: expect.objectContaining({ 'scene-one': expect.any(Object) }),
      totalAssetBytes: glbBytes.byteLength,
    }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('rejects a GLB filename that does not match the manifest asset path', async () => {
    render(<ManifestImportDialog open onClose={vi.fn()} />);
    const manifest = createManifest();
    const manifestFile = new File([JSON.stringify(manifest)], 'scene-manifest.json', { type: 'application/json' });
    Object.defineProperty(manifestFile, 'text', { value: async () => JSON.stringify(manifest) });
    fireEvent.change(screen.getByLabelText('Manifeste de scène (.json)'), { target: { files: [manifestFile] } });
    expect(await screen.findByText('UI Component Test')).toBeInTheDocument();

    const wrongFile = new File([new ArrayBuffer(32)], 'other.glb', { type: 'model/gltf-binary' });
    fireEvent.change(screen.getByLabelText('Choisir un fichier GLB'), { target: { files: [wrongFile] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('hero.glb');
    expect(screen.getByRole('button', { name: 'Importer le projet' })).toBeDisabled();
    expect(saveCompiledManifestImport).not.toHaveBeenCalled();
  });

  it('shows unsupported manifest features and prevents import instead of silently dropping them', async () => {
    const manifest = createManifest();
    manifest.scenes[0].dialogue.push({
      id: 'line-one',
      speakerAssetId: 'hero',
      text: 'Hello',
      startSeconds: 0,
      durationSeconds: 2,
    });
    const onClose = vi.fn();
    render(<ManifestImportDialog open onClose={onClose} />);

    const manifestFile = new File([JSON.stringify(manifest)], 'unsupported.json', { type: 'application/json' });
    Object.defineProperty(manifestFile, 'text', { value: async () => JSON.stringify(manifest) });
    fireEvent.change(screen.getByLabelText('Manifeste de scène (.json)'), { target: { files: [manifestFile] } });

    expect(await screen.findByText(/Fonctionnalités non prises en charge/)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('dialogues');
    expect(screen.getByRole('button', { name: 'Importer le projet' })).toBeDisabled();
    expect(saveCompiledManifestImport).not.toHaveBeenCalled();
  });
});
