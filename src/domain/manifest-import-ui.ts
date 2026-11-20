import { SceneManifestSchema, type SceneManifest } from './contracts';

export const MANIFEST_IMPORT_MAX_JSON_BYTES = 2 * 1024 * 1024;
export const MANIFEST_IMPORT_MAX_ASSET_BYTES = 5 * 1024 * 1024;
export const MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES = 10 * 1024 * 1024;

export type ManifestImportIssue =
  | { code: 'dialogue'; sceneTitle: string }
  | { code: 'audio'; sceneTitle: string }
  | { code: 'asset_format'; assetId: string; format: string }
  | { code: 'material'; objectId: string };

export interface ManifestImportRequirements {
  manifest: SceneManifest;
  /** Unique, referenced GLB assets only; unused assets need no file upload. */
  requiredAssets: SceneManifest['assets'];
  /** Features that the current editor compiler cannot represent without data loss. */
  unsupportedReasons: ManifestImportIssue[];
}

export function getManifestImportRequirements(input: unknown): ManifestImportRequirements {
  const parsed = SceneManifestSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Scene manifest validation failed: ${details}`);
  }

  const manifest = parsed.data;
  const referencedAssetIds = new Set(
    manifest.scenes.flatMap((scene) => scene.objects.map((object) => object.assetId)),
  );
  const requiredAssets = manifest.assets.filter(
    (asset) => referencedAssetIds.has(asset.id) && asset.format === 'glb',
  );
  const unsupported = new Map<string, ManifestImportIssue>();

  for (const scene of manifest.scenes) {
    if (scene.dialogue.length > 0) {
      unsupported.set(`dialogue:${scene.id}`, { code: 'dialogue', sceneTitle: scene.title });
    }
    if (scene.audioCues.length > 0) {
      unsupported.set(`audio:${scene.id}`, { code: 'audio', sceneTitle: scene.title });
    }
    for (const object of scene.objects) {
      const asset = manifest.assets.find((candidate) => candidate.id === object.assetId);
      if (asset && asset.format !== 'glb') {
        unsupported.set(`asset_format:${asset.id}`, { code: 'asset_format', assetId: asset.id, format: asset.format });
      }
      if (object.material && (
        object.material.color !== undefined
        || object.material.roughness !== undefined
        || object.material.metalness !== undefined
      )) {
        unsupported.set(`material:${object.id}`, { code: 'material', objectId: object.id });
      }
    }
  }

  return {
    manifest,
    requiredAssets,
    unsupportedReasons: [...unsupported.values()],
  };
}

function isValidFileSize(size: number, maximum: number): boolean {
  return Number.isSafeInteger(size) && size >= 0 && size <= maximum;
}

export function isManifestJsonSizeAllowed(size: number): boolean {
  return isValidFileSize(size, MANIFEST_IMPORT_MAX_JSON_BYTES);
}

export function isManifestAssetSizeAllowed(size: number): boolean {
  return isValidFileSize(size, MANIFEST_IMPORT_MAX_ASSET_BYTES);
}

export function isManifestAggregateSizeAllowed(size: number): boolean {
  return isValidFileSize(size, MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES);
}
