import type { CompiledSceneManifest } from './scene-manifest-compiler';

/** IndexedDB sidecar for manifest fields that the legacy Project model cannot represent. */
export interface ProjectManifestMetadata {
  projectId: string;
  manifest: CompiledSceneManifest['manifest'];
  assetMetadata: CompiledSceneManifest['assetMetadata'];
  sceneMetadata: CompiledSceneManifest['sceneMetadata'];
  updatedAt: number;
}
