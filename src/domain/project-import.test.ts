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
import { isProjectImportSizeAllowed, parseProjectImport, ProjectImportError, PROJECT_IMPORT_MAX_BYTES } from './project-import';

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
