import { describe, expect, it } from 'vitest';
import {
  createCamera3DLayer,
  createImageLayer,
  createImportedMeshLayer,
  createLightLayer,
  createMeshLayer,
  createProject,
  createShapeLayer,
  createText3DLayer,
  createTextLayer,
} from '@/lib/factories';
import type { ProjectManifestMetadata } from './metadata';
import {
  createProjectFileEnvelope,
  isProjectImportSizeAllowed,
  parseProjectImport,
  parseProjectImportBundle,
  ProjectImportError,
  rekeyProjectImportBundle,
  PROJECT_IMPORT_MAX_BYTES,
} from './project-import';

function makeMetadata(project: ReturnType<typeof createProject>): ProjectManifestMetadata {
  return {
    projectId: project.id,
    manifest: { id: project.id, schemaVersion: '1.0' },
    assetMetadata: {
      hero: {
        kind: 'character', path: 'assets/characters/hero.glb', format: 'glb',
        provenance: { source: 'generated', licenseId: 'generated', commercialUse: 'allowed', verified: true },
      },
    },
    sceneMetadata: { [project.scenes[0].id]: { shotType: 'wide' } },
    updatedAt: project.updatedAt,
  };
}

describe('parseProjectImport', () => {
  it('accepts a valid legacy raw Project export without changing optional fields', () => {
    const legacy = createProject('Legacy project', '3d', '16:9');
    delete (legacy.scenes[0] as { background?: unknown }).background;

    expect(parseProjectImport(legacy)).toEqual(legacy);
  });

  it('accepts the current versioned ToonForge project envelope', () => {
    const project = createProject('Versioned project', '2d', '9:16');
    expect(parseProjectImport({
      kind: 'toonforge.project',
      schemaVersion: '1.0',
      project,
    })).toEqual(project);
  });

  it('accepts every existing editor layer variant and embedded imported assets', () => {
    const project = createProject('All layer types', '3d', '16:9');
    project.scenes[0].layers = [
      createShapeLayer(),
      createTextLayer(),
      createImageLayer('data:image/png;base64,AAAA'),
      createMeshLayer('sphere'),
      createImportedMeshLayer('Imported model', 'data:model/gltf-binary;base64,AAAA', 'gltf'),
      createLightLayer('point'),
      createCamera3DLayer(),
      createText3DLayer(),
      {
        id: 'group-1', name: 'Group', type: 'group', x: 0, y: 0, rotation: 0, opacity: 1,
        visible: true, locked: false, keyframes: [], parentId: null,
      },
    ];

    expect(parseProjectImport(project)).toEqual(project);
  });

  it('round-trips manifest/provenance sidecar metadata in the versioned envelope', () => {
    const project = createProject('Project with provenance', '3d', '16:9');
    // Editor-generated scene IDs may begin with a digit; metadata must preserve them.
    project.scenes[0].id = '1scene';
    const metadata = makeMetadata(project);
    const envelope = createProjectFileEnvelope(project, metadata);

    expect(parseProjectImportBundle(envelope)).toEqual({ project, metadata });
    expect(parseProjectImport(envelope)).toEqual(project);
  });

  it('rejects metadata identity mismatches and preserves sidecars for scenes later removed from the editor', () => {
    const project = createProject('Mismatched metadata', '3d', '16:9');
    const metadata = makeMetadata(project);
    expect(() => parseProjectImportBundle({
      ...createProjectFileEnvelope(project),
      metadata: { ...metadata, manifest: { ...metadata.manifest, id: 'another-project' } },
    })).toThrowError(ProjectImportError);
    const staleSceneMetadata = { 'missing-scene': { shotType: 'wide' as const } };
    const parsed = parseProjectImportBundle({
      ...createProjectFileEnvelope(project),
      metadata: { ...metadata, sceneMetadata: staleSceneMetadata },
    });
    expect(parsed.metadata?.sceneMetadata).toEqual(staleSceneMetadata);
  });

  it('rekeys imported Projects without losing or mutating manifest sidecars', () => {
    const project = createProject('Rekey project', '3d', '16:9');
    const metadata = makeMetadata(project);
    const bundle = parseProjectImportBundle(createProjectFileEnvelope(project, metadata));
    const importedAt = 1_800_000_000_123;
    const rekeyed = rekeyProjectImportBundle(bundle, 'import-new-project', importedAt);

    expect(rekeyed.project.id).toBe('import-new-project');
    expect(rekeyed.project.createdAt).toBe(importedAt);
    expect(rekeyed.project.updatedAt).toBe(importedAt);
    expect(rekeyed.metadata?.projectId).toBe('import-new-project');
    expect(rekeyed.metadata?.manifest.id).toBe('import-new-project');
    expect(rekeyed.metadata?.assetMetadata).toEqual(metadata.assetMetadata);
    expect(rekeyed.metadata?.sceneMetadata).toEqual(metadata.sceneMetadata);
    expect(project.id).not.toBe(rekeyed.project.id);
    expect(metadata.manifest.id).toBe(project.id);
  });

  it('rejects unsupported project file schema versions explicitly', () => {
    const project = createProject('Future project', '2d', '16:9');
    expect(() => parseProjectImport({ kind: 'toonforge.project', schemaVersion: '2.0', project }))
      .toThrowError(ProjectImportError);
    try {
      parseProjectImport({ kind: 'toonforge.project', schemaVersion: '2.0', project });
    } catch (error) {
      expect(error).toMatchObject({ code: 'unsupported_version' });
    }
  });

  it('rejects external image and model URLs instead of allowing network fetches during project load', () => {
    const project = createProject('External assets', '3d', '16:9');
    project.scenes[0].layers = [
      createImageLayer('https://tracker.example/image.png'),
      createImportedMeshLayer('Remote model', 'https://tracker.example/model.glb', 'gltf'),
    ];
    expect(() => parseProjectImport(project)).toThrowError(ProjectImportError);
  });

  it('rejects malformed projects rather than trusting a TypeScript cast', () => {
    const project = createProject('Malformed project', '2d', '16:9');
    const malformed = { ...project, settings: { ...project.settings, fps: 25 } };
    expect(() => parseProjectImport(malformed)).toThrowError(ProjectImportError);
  });

  it('rejects unknown fields in project data instead of persisting unvalidated payloads', () => {
    const project = createProject('Unexpected data', '2d', '16:9');
    expect(() => parseProjectImport({ ...project, unexpectedExecutableField: 'not allowed' }))
      .toThrowError(ProjectImportError);
  });

  it('rejects non-object JSON roots', () => {
    expect(() => parseProjectImport(null)).toThrowError(ProjectImportError);
    expect(() => parseProjectImport(['not', 'a', 'project'])).toThrowError(ProjectImportError);
  });

  it('enforces the explicit file-size policy before reading the file', () => {
    expect(isProjectImportSizeAllowed(PROJECT_IMPORT_MAX_BYTES)).toBe(true);
    expect(isProjectImportSizeAllowed(PROJECT_IMPORT_MAX_BYTES + 1)).toBe(false);
    expect(isProjectImportSizeAllowed(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
