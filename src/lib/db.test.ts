import { describe, it, expect, afterEach } from 'vitest';
import { db, getAllProjects, getProject, getProjectManifestMetadata, saveProject, saveCompiledManifestImport, deleteProject, duplicateProject, resetDatabase } from './db';
import type { CompiledSceneManifest } from '@/domain/scene-manifest-compiler';
import { createProject } from './factories';

afterEach(async () => {
  await db.transaction('rw', db.projects, db.projectMetadata, async () => {
    await db.projects.clear();
    await db.projectMetadata.clear();
  });
});

function project(name = 'Test project') {
  return createProject(name, '2d', '16:9');
}

function compiledImport(p = project()): CompiledSceneManifest {
  return {
    project: p,
    manifest: { id: p.id, schemaVersion: '1.0' },
    assetMetadata: {
      hero: {
        kind: 'character', path: 'assets/characters/hero.glb', format: 'glb',
        provenance: { source: 'generated', licenseId: 'generated-by-toonforge', commercialUse: 'allowed', verified: true },
      },
    },
    sceneMetadata: { [p.scenes[0].id]: { shotType: 'wide' } },
  };
}

describe('saveProject / getProject / getAllProjects', () => {
  it('persists a project and reads it back by id', async () => {
    const p = project();
    await saveProject(p);
    const loaded = await getProject(p.id);
    expect(loaded?.id).toBe(p.id);
    expect(loaded?.name).toBe('Test project');
  });

  it('stamps updatedAt on every save', async () => {
    const p = project();
    p.updatedAt = 0;
    await saveProject(p);
    const loaded = await getProject(p.id);
    expect(loaded!.updatedAt).toBeGreaterThan(0);
  });

  it('getProject returns undefined for an unknown id', async () => {
    expect(await getProject('does-not-exist')).toBeUndefined();
  });

  it('getAllProjects returns every stored project, newest updatedAt first', async () => {
    const older = project('Older');
    older.updatedAt = 1000;
    const newer = project('Newer');
    newer.updatedAt = 2000;
    await db.projects.bulkPut([older, newer]);

    const all = await getAllProjects();
    expect(all.map((p) => p.name)).toEqual(['Newer', 'Older']);
  });
});

describe('compiled manifest persistence', () => {
  it('atomically persists the editor project and its manifest provenance sidecars', async () => {
    const compiled = compiledImport();
    await saveCompiledManifestImport(compiled);

    expect(await getProject(compiled.project.id)).toEqual(compiled.project);
    expect(await getProjectManifestMetadata(compiled.project.id)).toMatchObject({
      projectId: compiled.project.id,
      manifest: compiled.manifest,
      assetMetadata: compiled.assetMetadata,
      sceneMetadata: compiled.sceneMetadata,
    });
  });

  it('rejects a manifest/project identity mismatch before writing either record', async () => {
    const compiled = compiledImport();
    compiled.manifest.id = 'different-project';

    await expect(saveCompiledManifestImport(compiled)).rejects.toThrow(/manifest ID must match the compiled Project ID/);
    expect(await getProject(compiled.project.id)).toBeUndefined();
    expect(await getProjectManifestMetadata(compiled.project.id)).toBeUndefined();
  });
});

describe('deleteProject', () => {
  it('removes the project and its manifest metadata atomically', async () => {
    const compiled = compiledImport();
    await saveCompiledManifestImport(compiled);
    await deleteProject(compiled.project.id);
    expect(await getProject(compiled.project.id)).toBeUndefined();
    expect(await getProjectManifestMetadata(compiled.project.id)).toBeUndefined();
    expect(await getAllProjects()).toHaveLength(0);
  });
});

describe('duplicateProject', () => {
  it('creates an independent copy with new ids for the project, scenes, layers, and keyframes', async () => {
    const original = project('Original');
    original.scenes[0].layers.push({
      id: 'layer-1', name: 'Rect', type: 'shape', shape: 'rectangle',
      x: 0, y: 0, width: 10, height: 10, rotation: 0, opacity: 1,
      fill: '#fff', stroke: '#000', strokeWidth: 0, cornerRadius: 0, sides: 4,
      visible: true, locked: false, parentId: null,
      keyframes: [{ id: 'kf-1', time: 0, property: 'x', value: 0, easing: 'linear' }],
    });
    await saveCompiledManifestImport(compiledImport(original));

    const copy = await duplicateProject(original.id);
    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe(original.id);
    expect(copy!.name).toBe('Original (copy)');
    expect(copy!.scenes[0].id).not.toBe(original.scenes[0].id);
    expect(copy!.scenes[0].layers[0].id).not.toBe('layer-1');
    expect(copy!.scenes[0].layers[0].keyframes[0].id).not.toBe('kf-1');
    const copiedMetadata = await getProjectManifestMetadata(copy!.id);
    expect(copiedMetadata?.manifest.id).toBe(copy!.id);
    expect(Object.keys(copiedMetadata!.sceneMetadata)).toEqual([copy!.scenes[0].id]);
    expect(copiedMetadata!.sceneMetadata[copy!.scenes[0].id].shotType).toBe('wide');

    // Both the original and the copy should now exist independently.
    expect(await getAllProjects()).toHaveLength(2);
  });

  it('returns undefined when the source project does not exist', async () => {
    expect(await duplicateProject('does-not-exist')).toBeUndefined();
  });
});

describe('resetDatabase', () => {
  it('clears every stored project and manifest sidecar', async () => {
    const compiled = compiledImport(project('A'));
    await saveCompiledManifestImport(compiled);
    await saveProject(project('B'));
    expect(await getAllProjects()).toHaveLength(2);
    expect(await getProjectManifestMetadata(compiled.project.id)).toBeDefined();

    await resetDatabase();
    expect(await getAllProjects()).toHaveLength(0);
    expect(await getProjectManifestMetadata(compiled.project.id)).toBeUndefined();
  });
});
