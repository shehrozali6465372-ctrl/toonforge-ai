import Dexie, { type Table } from 'dexie';
import type { CompiledSceneManifest } from '@/domain/scene-manifest-compiler';
import type { ProjectManifestMetadata } from '@/domain/metadata';
import type { Project } from './types';
import { uid } from './types';

export class MotionStudioDB extends Dexie {
  projects!: Table<Project, string>;
  projectMetadata!: Table<ProjectManifestMetadata, string>;

  constructor(databaseName = 'MotionStudioDB') {
    super(databaseName);
    this.version(1).stores({
      projects: 'id, name, mode, updatedAt, createdAt',
    });
    // Additive migration: preserve the existing projects table and introduce
    // a sidecar table for manifest metadata the legacy Project type cannot hold.
    this.version(2).stores({
      projects: 'id, name, mode, updatedAt, createdAt',
      projectMetadata: 'projectId, updatedAt',
    });
  }
}

export const db = new MotionStudioDB();

export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('updatedAt').reverse().toArray();
}

export async function getProject(id: string): Promise<Project | undefined> {
  return db.projects.get(id);
}

export async function getProjectManifestMetadata(projectId: string): Promise<ProjectManifestMetadata | undefined> {
  return db.projectMetadata.get(projectId);
}

export async function saveProject(project: Project): Promise<void> {
  project.updatedAt = Date.now();
  await db.projects.put(project);
}

/** Save the editor Project and its manifest/provenance sidecars atomically. */
export async function saveCompiledManifestImport(compiled: CompiledSceneManifest): Promise<void> {
  if (compiled.manifest.id !== compiled.project.id) {
    throw new Error('Scene manifest ID must match the compiled Project ID');
  }
  const metadata: ProjectManifestMetadata = {
    projectId: compiled.project.id,
    manifest: { ...compiled.manifest },
    assetMetadata: structuredClone(compiled.assetMetadata),
    sceneMetadata: structuredClone(compiled.sceneMetadata),
    updatedAt: compiled.project.updatedAt,
  };

  await db.transaction('rw', db.projects, db.projectMetadata, async () => {
    await db.projects.put(compiled.project);
    await db.projectMetadata.put(metadata);
  });
}

export async function deleteProject(id: string): Promise<void> {
  await db.transaction('rw', db.projects, db.projectMetadata, async () => {
    await db.projects.delete(id);
    await db.projectMetadata.delete(id);
  });
}

export async function resetDatabase(): Promise<void> {
  await db.transaction('rw', db.projects, db.projectMetadata, async () => {
    await db.projects.clear();
    await db.projectMetadata.clear();
  });
}

export async function duplicateProject(id: string): Promise<Project | undefined> {
  return db.transaction('rw', db.projects, db.projectMetadata, async () => {
    const original = await db.projects.get(id);
    if (!original) return undefined;

    const sceneIdMap = new Map<string, string>();
    const copyScenes = original.scenes.map((scene) => {
      const newSceneId = uid();
      sceneIdMap.set(scene.id, newSceneId);
      return {
        ...scene,
        id: newSceneId,
        layers: scene.layers.map((layer) => ({
          ...layer,
          id: uid(),
          keyframes: layer.keyframes.map((keyframe) => ({ ...keyframe, id: uid() })),
        })),
      };
    });

    const copy: Project = {
      ...original,
      id: uid(),
      name: `${original.name} (copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      thumbnail: original.thumbnail,
      scenes: copyScenes,
    };

    await db.projects.put(copy);
    const originalMetadata = await db.projectMetadata.get(id);
    if (originalMetadata) {
      const sceneMetadata: ProjectManifestMetadata['sceneMetadata'] = {};
      for (const [oldSceneId, metadata] of Object.entries(originalMetadata.sceneMetadata)) {
        const newSceneId = sceneIdMap.get(oldSceneId);
        if (newSceneId) sceneMetadata[newSceneId] = { ...metadata };
      }
      await db.projectMetadata.put({
        ...originalMetadata,
        projectId: copy.id,
        manifest: { ...originalMetadata.manifest, id: copy.id },
        assetMetadata: structuredClone(originalMetadata.assetMetadata),
        sceneMetadata,
        updatedAt: copy.updatedAt,
      });
    }

    return copy;
  });
}
