import { SceneManifestSchema, type SceneManifest } from './contracts';
import type {
  Camera3DLayer,
  EasingType,
  Keyframe,
  Layer,
  MeshLayer,
  Project,
  Scene,
  Vec3,
} from '@/lib/types';

export type SceneManifestCompileErrorCode =
  | 'invalid_manifest'
  | 'invalid_options'
  | 'missing_asset_source'
  | 'invalid_asset_source'
  | 'unsupported_feature'
  | 'layer_id_collision'
  | 'duplicate_animation_channel';

export class SceneManifestCompileError extends Error {
  constructor(
    readonly code: SceneManifestCompileErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'SceneManifestCompileError';
  }
}

export interface SceneManifestCompilerOptions {
  /** Stable millisecond timestamp used for both Project timestamps. */
  createdAt: number;
  /**
   * Self-contained GLB v2 data URLs keyed by manifest asset ID. The upstream
   * packager must verify that GLB JSON has no external buffer/image URI refs;
   * this compiler validates the container/header but does not fetch resources.
   */
  assetSources: Readonly<Record<string, string>>;
}

export interface CompiledSceneManifest {
  project: Project;
  manifest: { id: string; schemaVersion: string };
  /** Metadata retained outside the legacy Project type, keyed by manifest asset ID. */
  assetMetadata: Record<string, {
    kind: SceneManifest['assets'][number]['kind'];
    path: string;
    format: SceneManifest['assets'][number]['format'];
    provenance: SceneManifest['assets'][number]['provenance'];
  }>;
  /** Manifest-only camera/story intent that the legacy editor model cannot represent. */
  sceneMetadata: Record<string, {
    storySceneId?: string;
    shotType: SceneManifest['scenes'][number]['camera']['shotType'];
  }>;
}

const MODEL_DATA_URL_PATTERN = /^data:model\/(gltf-binary|gltf\+json);base64,(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
const GLB_DATA_URL_PREFIX = 'data:model/gltf-binary;base64,';

function isValidGlbDataUrl(source: string): boolean {
  if (!source.startsWith(GLB_DATA_URL_PREFIX) || !MODEL_DATA_URL_PATTERN.test(source)) return false;
  const payload = source.slice(GLB_DATA_URL_PREFIX.length);
  const padding = payload.endsWith('==') ? 2 : payload.endsWith('=') ? 1 : 0;
  const byteLength = (payload.length / 4) * 3 - padding;
  if (!Number.isInteger(byteLength) || byteLength < 20) return false;

  try {
    // Decode only the prefix containing the GLB and JSON chunk headers.
    const prefix = atob(payload.slice(0, 28));
    if (prefix.length < 20) return false;
    const headerBytes = Uint8Array.from(prefix, (character) => character.charCodeAt(0));
    const header = new DataView(headerBytes.buffer);
    return header.getUint32(0, true) === 0x46546c67
      && header.getUint32(4, true) === 2
      && header.getUint32(8, true) === byteLength
      && header.getUint32(16, true) === 0x4e4f534a
      && header.getUint32(12, true) >= 4
      && header.getUint32(12, true) % 4 === 0
      && 20 + header.getUint32(12, true) <= byteLength;
  } catch {
    return false;
  }
}

function toVec3(value: readonly [number, number, number]): Vec3 {
  return { x: value[0], y: value[1], z: value[2] };
}

function toEasing(value: 'linear' | 'ease_in' | 'ease_out' | 'ease_in_out'): EasingType {
  switch (value) {
    case 'ease_in': return 'easeIn';
    case 'ease_out': return 'easeOut';
    case 'ease_in_out': return 'easeInOut';
    default: return 'linear';
  }
}

function toKeyframeValue(value: number | readonly [number, number, number]): Keyframe['value'] {
  return typeof value === 'number' ? value : toVec3(value);
}

function createCameraLayer(scene: SceneManifest['scenes'][number]): Camera3DLayer {
  const { camera } = scene;
  return {
    id: `${scene.id}-camera`,
    name: `${scene.title} Camera`,
    type: 'camera3d',
    position: toVec3(camera.position),
    rotation: toVec3(camera.rotation),
    fov: camera.fov,
    near: 0.1,
    far: 1000,
    orthographic: false,
    visible: true,
    locked: false,
    keyframes: [],
    parentId: null,
  };
}

function compileObjectLayer(
  object: SceneManifest['scenes'][number]['objects'][number],
  asset: SceneManifest['assets'][number],
  source: string,
  keyframes: Keyframe[],
): MeshLayer {
  const pathSegments = asset.path.split('/');
  const fileName = pathSegments[pathSegments.length - 1];
  const name = fileName.replace(/\.(?:glb|gltf)$/i, '');
  return {
    id: object.id,
    name,
    type: 'mesh',
    mesh: 'imported',
    position: toVec3(object.transform.position),
    rotation: toVec3(object.transform.rotation),
    scale: toVec3(object.transform.scale),
    color: '#8b5cf6',
    metalness: 0.3,
    roughness: 0.5,
    opacity: object.material?.opacity ?? 1,
    castShadow: true,
    src: source,
    importedFormat: 'gltf',
    visible: true,
    locked: false,
    keyframes,
    parentId: null,
  };
}

/**
 * Compile a validated, provider-independent scene manifest into the existing
 * editor Project model. This function is deterministic: callers provide the
 * timestamp and already-packaged model data URLs; it performs no I/O.
 * Unsupported audio/dialogue/material features are rejected, never dropped.
 */
export function compileSceneManifest(
  input: unknown,
  options: SceneManifestCompilerOptions,
): CompiledSceneManifest {
  if (!options || typeof options !== 'object' || !options.assetSources || typeof options.assetSources !== 'object') {
    throw new SceneManifestCompileError('invalid_options', 'assetSources must be an object keyed by manifest asset ID');
  }
  if (!Number.isSafeInteger(options.createdAt) || options.createdAt < 0) {
    throw new SceneManifestCompileError('invalid_options', 'createdAt must be a non-negative safe integer timestamp in milliseconds');
  }

  const parsed = SceneManifestSchema.safeParse(input);
  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ');
    throw new SceneManifestCompileError('invalid_manifest', `Scene manifest validation failed: ${details}`);
  }
  const manifest = parsed.data;
  const assetsById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  const resolvedSources = new Map<string, string>();

  for (const scene of manifest.scenes) {
    if (scene.dialogue.length > 0 || scene.audioCues.length > 0) {
      throw new SceneManifestCompileError(
        'unsupported_feature',
        `Scene "${scene.id}" contains dialogue/audio cues, but the current editor has no dialogue/voice track or audio renderer`,
      );
    }
    for (const object of scene.objects) {
      const asset = assetsById.get(object.assetId)!;
      if (asset.format !== 'glb') {
        throw new SceneManifestCompileError('unsupported_feature', `Object "${object.id}" uses ${asset.format}; only packaged GLB assets are supported because standalone glTF external-resource dependencies are not represented by the current asset resolver`);
      }
      if (object.material && (object.material.color !== undefined
        || object.material.roughness !== undefined
        || object.material.metalness !== undefined)) {
        throw new SceneManifestCompileError(
          'unsupported_feature',
          `Object "${object.id}" requests material color/roughness/metalness that the current imported-mesh renderer cannot apply`,
        );
      }
      const hasOwnSource = Object.prototype.hasOwnProperty.call(options.assetSources, asset.id);
      const source = hasOwnSource ? options.assetSources[asset.id] : undefined;
      if (typeof source !== 'string' || source.length === 0) {
        throw new SceneManifestCompileError('missing_asset_source', `No packaged model data URL supplied for asset "${asset.id}"`);
      }
      if (!isValidGlbDataUrl(source)) {
        throw new SceneManifestCompileError(
          'invalid_asset_source',
          `Asset "${asset.id}" must resolve to a valid GLB v2 base64 data URL with a JSON chunk; remote source URLs and malformed GLB headers are not accepted`,
        );
      }
      resolvedSources.set(asset.id, source);
    }
  }

  const assetMetadata: CompiledSceneManifest['assetMetadata'] = {};
  for (const asset of manifest.assets) {
    assetMetadata[asset.id] = {
      kind: asset.kind,
      path: asset.path,
      format: asset.format,
      provenance: { ...asset.provenance },
    };
  }

  const sceneMetadata: CompiledSceneManifest['sceneMetadata'] = {};
  const scenes: Scene[] = manifest.scenes.map((scene, order) => {
    const cameraId = `${scene.id}-camera`;
    if (scene.objects.some((object) => object.id === cameraId)) {
      throw new SceneManifestCompileError(
        'layer_id_collision',
        `Scene "${scene.id}" camera layer ID collides with an object layer ID: "${cameraId}"`,
      );
    }

    const animationChannels = new Set<string>();
    const keyframesByObject = new Map<string, Keyframe[]>();
    for (const cue of scene.animationCues) {
      const channel = `${cue.targetObjectId}:${cue.property}`;
      if (animationChannels.has(channel)) {
        throw new SceneManifestCompileError(
          'duplicate_animation_channel',
          `Scene "${scene.id}" has a duplicate animation channel for ${channel}`,
        );
      }
      animationChannels.add(channel);
      const frames = cue.keyframes.map((frame, index): Keyframe => ({
        id: `${cue.id}-kf-${index + 1}`,
        time: frame.timeSeconds,
        property: cue.property,
        value: toKeyframeValue(frame.value),
        easing: toEasing(frame.easing),
      }));
      keyframesByObject.set(cue.targetObjectId, [
        ...(keyframesByObject.get(cue.targetObjectId) ?? []),
        ...frames,
      ]);
    }

    const layers: Layer[] = scene.objects.map((object) => {
      const asset = assetsById.get(object.assetId)!;
      return compileObjectLayer(
        object,
        asset,
        resolvedSources.get(asset.id)!,
        keyframesByObject.get(object.id) ?? [],
      );
    });
    layers.push(createCameraLayer(scene));

    sceneMetadata[scene.id] = {
      ...(scene.storySceneId ? { storySceneId: scene.storySceneId } : {}),
      shotType: scene.camera.shotType,
    };

    return {
      id: scene.id,
      name: scene.title,
      duration: scene.durationSeconds,
      order,
      layers,
      transitionToNext: null,
      background: { type: 'solid', color: scene.backgroundColor },
    };
  });

  const firstSceneColor = scenes[0]?.background?.type === 'solid'
    ? scenes[0].background.color
    : '#0f0f12';
  const { resolution, frameRate } = manifest.project;
  const project: Project = {
    id: manifest.id,
    name: manifest.project.title,
    mode: '3d',
    createdAt: options.createdAt,
    updatedAt: options.createdAt,
    thumbnail: null,
    settings: {
      width: resolution.width,
      height: resolution.height,
      aspectRatioPreset: '16:9',
      fps: frameRate,
      backgroundColor: firstSceneColor,
      environment: 'color',
      shadows: true,
      defaultSceneDuration: scenes[0]?.duration ?? 3,
      exportDefaults: {
        format: 'mp4',
        resolutionPreset: resolution.height === 720 ? '720p' : '1080p',
        quality: 'high',
        fps: frameRate,
      },
    },
    scenes,
  };

  return {
    project,
    manifest: { id: manifest.id, schemaVersion: manifest.schemaVersion },
    assetMetadata,
    sceneMetadata,
  };
}
