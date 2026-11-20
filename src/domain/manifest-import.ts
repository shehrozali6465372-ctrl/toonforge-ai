import { SceneManifestSchema } from './contracts';
import { compileSceneManifest, type CompiledSceneManifest } from './scene-manifest-compiler';
import { packageGlbAsset } from './glb-asset-packager';

export type ManifestImportErrorCode =
  | 'invalid_manifest'
  | 'invalid_options'
  | 'missing_asset_bytes'
  | 'invalid_asset_bytes'
  | 'aggregate_size_exceeded';

export class ManifestImportError extends Error {
  constructor(readonly code: ManifestImportErrorCode, message: string) {
    super(message);
    this.name = 'ManifestImportError';
  }
}

export interface ManifestImportOptions {
  createdAt: number;
  /** Caller-selected per-file limit; no default product policy is assumed. */
  maxAssetBytes: number;
  /** Caller-selected aggregate raw-byte limit across unique referenced assets. */
  maxTotalAssetBytes: number;
  /** Uploaded model bytes keyed by manifest asset ID. */
  assetBytes: Readonly<Record<string, ArrayBuffer | Uint8Array>>;
}

export interface CompiledManifestImport extends CompiledSceneManifest {
  /** Sum of raw byte lengths for unique model assets actually referenced by scene objects. */
  totalAssetBytes: number;
}

function byteLengthOf(value: unknown): number {
  if (value instanceof Uint8Array || value instanceof ArrayBuffer) return value.byteLength;
  throw new ManifestImportError('invalid_asset_bytes', 'Each referenced model asset must be an ArrayBuffer or Uint8Array');
}

/**
 * Pure orchestration boundary: validate manifest, package each referenced GLB
 * once, compile into the editor model, and return project plus metadata sidecars.
 * No database, file picker, network or provider operations occur here.
 */
export function compileManifestImport(
  input: unknown,
  options: ManifestImportOptions,
): CompiledManifestImport {
  if (!options || typeof options !== 'object' || !options.assetBytes || typeof options.assetBytes !== 'object') {
    throw new ManifestImportError('invalid_options', 'assetBytes must be an object keyed by manifest asset ID');
  }
  if (!Number.isSafeInteger(options.createdAt) || options.createdAt < 0) {
    throw new ManifestImportError('invalid_options', 'createdAt must be a non-negative safe integer timestamp in milliseconds');
  }
  if (!Number.isSafeInteger(options.maxAssetBytes) || options.maxAssetBytes <= 0) {
    throw new ManifestImportError('invalid_options', 'maxAssetBytes must be a positive safe integer');
  }
  if (!Number.isSafeInteger(options.maxTotalAssetBytes) || options.maxTotalAssetBytes <= 0) {
    throw new ManifestImportError('invalid_options', 'maxTotalAssetBytes must be a positive safe integer');
  }

  const parsed = SceneManifestSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new ManifestImportError('invalid_manifest', `Scene manifest validation failed: ${details}`);
  }

  const manifest = parsed.data;
  const assetsById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  const referencedAssetIds = new Set(manifest.scenes.flatMap((scene) => scene.objects.map((object) => object.assetId)));
  const assetSources: Record<string, string> = {};
  let totalAssetBytes = 0;

  for (const assetId of referencedAssetIds) {
    const asset = assetsById.get(assetId)!;
    // The compiler emits the explicit unsupported-format error for referenced
    // standalone glTF assets; do not try to package them as GLB here.
    if (asset.format !== 'glb') continue;

    if (!Object.prototype.hasOwnProperty.call(options.assetBytes, assetId)) {
      throw new ManifestImportError('missing_asset_bytes', `No uploaded bytes supplied for referenced asset "${assetId}"`);
    }
    const bytes = options.assetBytes[assetId];
    const byteLength = byteLengthOf(bytes);
    if (byteLength > options.maxAssetBytes) {
      throw new ManifestImportError(
        'invalid_asset_bytes',
        `Asset "${assetId}" size ${byteLength} bytes exceeds the configured limit of ${options.maxAssetBytes} bytes`,
      );
    }
    totalAssetBytes += byteLength;
    if (!Number.isSafeInteger(totalAssetBytes) || totalAssetBytes > options.maxTotalAssetBytes) {
      throw new ManifestImportError(
        'aggregate_size_exceeded',
        `Aggregate asset size ${totalAssetBytes} bytes exceeds the configured limit of ${options.maxTotalAssetBytes} bytes`,
      );
    }
    assetSources[assetId] = packageGlbAsset(bytes, { maxBytes: options.maxAssetBytes }).dataUrl;
  }

  const compiled = compileSceneManifest(manifest, {
    createdAt: options.createdAt,
    assetSources,
  });
  return { ...compiled, totalAssetBytes };
}
