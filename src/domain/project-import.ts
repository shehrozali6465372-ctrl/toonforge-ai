import * as z from 'zod';
import type { Project } from '@/lib/types';
import type { ProjectManifestMetadata } from './metadata';

export const PROJECT_FILE_KIND = 'toonforge.project' as const;
export const PROJECT_FILE_SCHEMA_VERSION = '1.0' as const;
export const PROJECT_IMPORT_MAX_BYTES = 20 * 1024 * 1024;

const FiniteNumber = z.number().finite();
const NonNegativeNumber = FiniteNumber.nonnegative();
const PositiveNumber = FiniteNumber.positive();
const PositiveInteger = z.number().int().positive();
const Opacity = FiniteNumber.min(0).max(1);
const EmbeddedDataUrl = z.string().refine((value) => value.startsWith('data:') && value.indexOf(',') > 5, 'Imported assets must be embedded data URLs');
const Vec2Schema = z.strictObject({ x: FiniteNumber, y: FiniteNumber });
const Vec3Schema = z.strictObject({ x: FiniteNumber, y: FiniteNumber, z: FiniteNumber });

const EasingSchema = z.enum(['linear', 'easeIn', 'easeOut', 'easeInOut', 'spring', 'bezier']);
const KeyframeSchema = z.strictObject({
  id: z.string().min(1),
  time: NonNegativeNumber,
  property: z.string().min(1),
  value: z.union([FiniteNumber, z.string(), Vec2Schema, Vec3Schema]),
  easing: EasingSchema,
});

const BaseLayerFields = {
  id: z.string().min(1),
  name: z.string().min(1),
  visible: z.boolean(),
  locked: z.boolean(),
  keyframes: z.array(KeyframeSchema),
  parentId: z.string().min(1).nullable(),
};

const ShapeLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('shape'),
  shape: z.enum(['rectangle', 'ellipse', 'line', 'polygon', 'star']),
  x: FiniteNumber,
  y: FiniteNumber,
  width: NonNegativeNumber,
  height: NonNegativeNumber,
  rotation: FiniteNumber,
  opacity: Opacity,
  fill: z.string().min(1),
  stroke: z.string().min(1),
  strokeWidth: NonNegativeNumber,
  cornerRadius: NonNegativeNumber,
  sides: z.number().int().min(3),
});

const TextLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('text'),
  x: FiniteNumber,
  y: FiniteNumber,
  text: z.string(),
  fontSize: PositiveNumber,
  fontFamily: z.string().min(1),
  fontWeight: FiniteNumber,
  fill: z.string().min(1),
  rotation: FiniteNumber,
  opacity: Opacity,
  align: z.enum(['left', 'center', 'right']),
});

const ImageLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('image'),
  x: FiniteNumber,
  y: FiniteNumber,
  width: NonNegativeNumber,
  height: NonNegativeNumber,
  rotation: FiniteNumber,
  opacity: Opacity,
  src: EmbeddedDataUrl,
});

const GroupLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('group'),
  x: FiniteNumber,
  y: FiniteNumber,
  rotation: FiniteNumber,
  opacity: Opacity,
});

const MeshLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('mesh'),
  mesh: z.enum(['box', 'sphere', 'cone', 'cylinder', 'plane', 'torus', 'imported']),
  position: Vec3Schema,
  rotation: Vec3Schema,
  scale: Vec3Schema,
  color: z.string().min(1),
  metalness: FiniteNumber.min(0).max(1),
  roughness: FiniteNumber.min(0).max(1),
  opacity: Opacity,
  castShadow: z.boolean(),
  src: EmbeddedDataUrl.optional(),
  importedFormat: z.enum(['gltf', 'obj']).optional(),
});

const LightLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('light'),
  light: z.enum(['directional', 'point', 'spot', 'ambient']),
  position: Vec3Schema,
  color: z.string().min(1),
  intensity: NonNegativeNumber,
  distance: NonNegativeNumber,
  angle: NonNegativeNumber,
});

const Camera3DLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('camera3d'),
  position: Vec3Schema,
  rotation: Vec3Schema,
  fov: PositiveNumber,
  near: PositiveNumber,
  far: PositiveNumber,
  orthographic: z.boolean(),
});

const Text3DLayerSchema = z.strictObject({
  ...BaseLayerFields,
  type: z.literal('text3d'),
  text: z.string(),
  position: Vec3Schema,
  rotation: Vec3Schema,
  scale: Vec3Schema,
  color: z.string().min(1),
  fontSize: PositiveNumber,
  height: PositiveNumber,
  opacity: Opacity,
});

const LayerSchema = z.discriminatedUnion('type', [
  ShapeLayerSchema,
  TextLayerSchema,
  ImageLayerSchema,
  GroupLayerSchema,
  MeshLayerSchema,
  LightLayerSchema,
  Camera3DLayerSchema,
  Text3DLayerSchema,
]);

const TransitionSchema = z.strictObject({
  type: z.enum(['none', 'fade', 'slide', 'zoom', 'dissolve', 'wipe']),
  duration: NonNegativeNumber,
  easing: EasingSchema,
});

const BackgroundSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('solid'), color: z.string().min(1) }),
  z.strictObject({ type: z.literal('gradient'), from: z.string().min(1), to: z.string().min(1), angle: FiniteNumber }),
  z.strictObject({
    type: z.literal('spots'),
    base: z.string().min(1),
    spots: z.array(z.strictObject({
      color: z.string().min(1),
      x: FiniteNumber,
      y: FiniteNumber,
      radius: NonNegativeNumber,
      opacity: Opacity,
    })),
  }),
]);

const SceneSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  duration: PositiveNumber,
  order: NonNegativeNumber,
  layers: z.array(LayerSchema),
  transitionToNext: TransitionSchema.nullable(),
  // Older editor exports predate scene-level backgrounds.
  background: BackgroundSchema.optional(),
});

const ExportDefaultsSchema = z.strictObject({
  format: z.enum(['mp4', 'webm', 'gif', 'mov']),
  resolutionPreset: z.enum(['480p', '720p', '1080p', '1440p', '2160p', 'custom']),
  quality: z.enum(['standard', 'high', 'max']),
  fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
  customWidth: PositiveInteger.optional(),
  customHeight: PositiveInteger.optional(),
});

const ProjectSchema = z.strictObject({
  id: z.string().min(1),
  name: z.string().min(1),
  mode: z.enum(['2d', '3d']),
  createdAt: z.number().int().nonnegative().safe(),
  updatedAt: z.number().int().nonnegative().safe(),
  thumbnail: EmbeddedDataUrl.nullable(),
  settings: z.strictObject({
    width: PositiveInteger,
    height: PositiveInteger,
    aspectRatioPreset: z.enum(['16:9', '9:16', '1:1', '4:5', '4:3', '3:4', '16:10', '21:9', 'custom']),
    fps: z.union([z.literal(24), z.literal(30), z.literal(60)]),
    backgroundColor: z.string().min(1),
    environment: z.enum(['color', 'gradient', 'hdri']),
    shadows: z.boolean(),
    defaultSceneDuration: PositiveNumber,
    exportDefaults: ExportDefaultsSchema,
  }),
  scenes: z.array(SceneSchema),
}).superRefine((project, ctx) => {
  const sceneIds = project.scenes.map((scene) => scene.id);
  if (new Set(sceneIds).size !== sceneIds.length) {
    ctx.addIssue({ code: 'custom', path: ['scenes'], message: 'Scene IDs must be unique' });
  }

  project.scenes.forEach((scene, sceneIndex) => {
    const layerIds = scene.layers.map((layer) => layer.id);
    const layerIdSet = new Set(layerIds);
    if (layerIdSet.size !== layerIds.length) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'layers'], message: 'Layer IDs must be unique within a scene' });
    }
    scene.layers.forEach((layer, layerIndex) => {
      if (layer.parentId !== null && !layerIdSet.has(layer.parentId)) {
        ctx.addIssue({
          code: 'custom',
          path: ['scenes', sceneIndex, 'layers', layerIndex, 'parentId'],
          message: `Unknown parent layer ID: ${layer.parentId}`,
        });
      }
      const keyframeIds = layer.keyframes.map((keyframe) => keyframe.id);
      if (new Set(keyframeIds).size !== keyframeIds.length) {
        ctx.addIssue({
          code: 'custom',
          path: ['scenes', sceneIndex, 'layers', layerIndex, 'keyframes'],
          message: 'Keyframe IDs must be unique within a layer',
        });
      }
    });
  });
});

const MetadataAssetIdSchema = z.string().regex(/^[a-z][a-z0-9_-]*$/);
const MetadataAssetPathSchema = z.string().min(1).max(240).refine((path) => {
  const segments = path.split('/');
  return segments[0] === 'assets'
    && segments.length >= 3
    && segments.slice(1).every((segment) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment));
}, 'Asset metadata paths must be safe relative paths beneath assets/');

const ProjectManifestMetadataSchema = z.strictObject({
  projectId: z.string().min(1),
  manifest: z.strictObject({ id: z.string().min(1), schemaVersion: z.literal('1.0') }),
  assetMetadata: z.record(MetadataAssetIdSchema, z.strictObject({
    kind: z.enum(['character', 'environment', 'prop', 'audio']),
    path: MetadataAssetPathSchema,
    format: z.enum(['glb', 'gltf', 'wav', 'mp3', 'ogg']),
    provenance: z.strictObject({
      source: z.enum(['generated', 'user-uploaded', 'licensed-catalog']),
      licenseId: z.string().min(1),
      sourceUrl: z.string().url().refine((url) => url.startsWith('https://')).optional(),
      attribution: z.string().min(1).optional(),
      commercialUse: z.enum(['allowed', 'restricted', 'unknown']),
      verified: z.boolean(),
    }),
  })),
  // Scene keys are existing editor scene IDs (uid()), not manifest asset IDs.
  // The editor's uid() may begin with a digit, so do not apply MetadataAssetIdSchema here.
  sceneMetadata: z.record(z.string().min(1).max(128), z.strictObject({
    storySceneId: MetadataAssetIdSchema.optional(),
    shotType: z.enum(['establishing', 'wide', 'medium', 'close_up', 'over_the_shoulder']),
  })),
  updatedAt: z.number().int().nonnegative().safe(),
});

const ProjectFileEnvelopeSchema = z.strictObject({
  kind: z.literal(PROJECT_FILE_KIND),
  schemaVersion: z.literal(PROJECT_FILE_SCHEMA_VERSION),
  project: ProjectSchema,
  metadata: ProjectManifestMetadataSchema.optional(),
});

export interface ProjectFileEnvelope {
  kind: typeof PROJECT_FILE_KIND;
  schemaVersion: typeof PROJECT_FILE_SCHEMA_VERSION;
  project: Project;
  metadata?: ProjectManifestMetadata;
}

export interface ProjectImportBundle {
  project: Project;
  metadata?: ProjectManifestMetadata;
}

export type ProjectImportErrorCode = 'invalid_project' | 'unsupported_version';

export class ProjectImportError extends Error {
  constructor(readonly code: ProjectImportErrorCode, message: string) {
    super(message);
    this.name = 'ProjectImportError';
  }
}

/** Accepts legacy raw Project exports and the current explicitly versioned envelope. */
export function parseProjectImportBundle(input: unknown): ProjectImportBundle {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new ProjectImportError('invalid_project', 'Project file must contain a JSON object');
  }

  const record = input as Record<string, unknown>;
  if ('kind' in record || 'schemaVersion' in record || 'project' in record) {
    if (record.kind !== PROJECT_FILE_KIND || record.schemaVersion !== PROJECT_FILE_SCHEMA_VERSION) {
      throw new ProjectImportError('unsupported_version', 'Project file type or schema version is not supported');
    }
    const envelope = ProjectFileEnvelopeSchema.safeParse(input);
    if (!envelope.success) {
      throw new ProjectImportError('invalid_project', 'Versioned project file failed validation');
    }
    const { project, metadata } = envelope.data;
    if (metadata) {
      if (metadata.projectId !== project.id || metadata.manifest.id !== project.id) {
        throw new ProjectImportError('invalid_project', 'Manifest metadata identity must match the Project ID');
      }
    }
    return { project, ...(metadata ? { metadata } : {}) };
  }

  const legacy = ProjectSchema.safeParse(input);
  if (!legacy.success) {
    throw new ProjectImportError('invalid_project', 'Legacy project file failed validation');
  }
  return { project: legacy.data };
}

export function parseProjectImport(input: unknown): Project {
  return parseProjectImportBundle(input).project;
}

/** Assign a fresh local Project identity while keeping manifest/scene provenance attached. */
export function rekeyProjectImportBundle(
  bundle: ProjectImportBundle,
  projectId: string,
  importedAt: number,
): ProjectImportBundle {
  if (!bundle || !bundle.project || typeof projectId !== 'string' || projectId.length === 0) {
    throw new ProjectImportError('invalid_project', 'Imported Project and new Project ID are required');
  }
  if (!Number.isSafeInteger(importedAt) || importedAt < 0) {
    throw new ProjectImportError('invalid_project', 'Import timestamp must be a non-negative safe integer');
  }
  const project: Project = {
    ...bundle.project,
    id: projectId,
    createdAt: importedAt,
    updatedAt: importedAt,
  };
  const metadata = bundle.metadata ? {
    ...bundle.metadata,
    projectId,
    manifest: { ...bundle.metadata.manifest, id: projectId },
    assetMetadata: structuredClone(bundle.metadata.assetMetadata),
    sceneMetadata: structuredClone(bundle.metadata.sceneMetadata),
    updatedAt: importedAt,
  } : undefined;
  return { project, ...(metadata ? { metadata } : {}) };
}

export function createProjectFileEnvelope(
  project: Project,
  metadata?: ProjectManifestMetadata,
): ProjectFileEnvelope {
  return {
    kind: PROJECT_FILE_KIND,
    schemaVersion: PROJECT_FILE_SCHEMA_VERSION,
    project,
    ...(metadata ? { metadata } : {}),
  };
}

export function isProjectImportSizeAllowed(fileSize: number): boolean {
  return Number.isSafeInteger(fileSize) && fileSize >= 0 && fileSize <= PROJECT_IMPORT_MAX_BYTES;
}
