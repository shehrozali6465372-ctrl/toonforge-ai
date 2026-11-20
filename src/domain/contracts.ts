import * as z from 'zod';

export const STORY_PLAN_SCHEMA_VERSION = '1.0' as const;
export const SCENE_MANIFEST_SCHEMA_VERSION = '1.0' as const;

const IdSchema = z.string().min(1).max(64).regex(/^[a-z][a-z0-9_-]*$/);
const TitleSchema = z.string().trim().min(1).max(120);
const DescriptionSchema = z.string().trim().min(1).max(1_000);
const FiniteNumberSchema = z.number().finite();
const HexColorSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const Vector3Schema = z.tuple([FiniteNumberSchema, FiniteNumberSchema, FiniteNumberSchema]);
const Scale3Schema = z.tuple([
  z.number().finite().positive().max(100),
  z.number().finite().positive().max(100),
  z.number().finite().positive().max(100),
]);

const LanguageSchema = z.string().min(2).max(35).regex(/^[A-Za-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$/);
const TargetDurationSchema = z.number().finite().min(60).max(180);
const SceneDurationSchema = z.number().finite().min(1).max(60);

const StoryCharacterSchema = z.strictObject({
  id: IdSchema,
  name: z.string().trim().min(1).max(80),
  role: z.enum(['protagonist', 'antagonist', 'supporting', 'narrator']),
  description: z.string().trim().min(1).max(500),
  visualDescription: z.string().trim().min(1).max(500),
});

const StoryLocationSchema = z.strictObject({
  id: IdSchema,
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(500),
});

const StoryDialogueSchema = z.strictObject({
  id: IdSchema,
  characterId: IdSchema,
  text: z.string().trim().min(1).max(500),
  startSeconds: FiniteNumberSchema.min(0).max(60),
  durationSeconds: FiniteNumberSchema.positive().max(30),
  emotion: z.enum(['neutral', 'happy', 'sad', 'afraid', 'angry', 'surprised', 'curious']).optional(),
});

const StorySceneSchema = z.strictObject({
  id: IdSchema,
  title: z.string().trim().min(1).max(100),
  summary: DescriptionSchema,
  locationId: IdSchema,
  characterIds: z.array(IdSchema).min(1).max(12),
  durationSeconds: SceneDurationSchema,
  dialogue: z.array(StoryDialogueSchema).max(30),
});

const StoryBeatSchema = z.strictObject({
  id: IdSchema,
  type: z.enum(['setup', 'inciting_incident', 'rising_action', 'climax', 'resolution']),
  summary: z.string().trim().min(1).max(500),
  sceneIds: z.array(IdSchema).min(1).max(30),
});

const StoryPlanStructureSchema = z.strictObject({
  kind: z.literal('toonforge.story-plan'),
  schemaVersion: z.literal(STORY_PLAN_SCHEMA_VERSION),
  id: IdSchema,
  project: z.strictObject({
    title: TitleSchema,
    logline: z.string().trim().min(1).max(500),
    targetDurationSeconds: TargetDurationSchema,
    language: LanguageSchema,
    tone: z.enum(['adventure', 'comedy', 'fantasy', 'mystery', 'heartwarming', 'educational', 'slice_of_life']),
  }),
  characters: z.array(StoryCharacterSchema).min(1).max(12),
  locations: z.array(StoryLocationSchema).min(1).max(12),
  beats: z.array(StoryBeatSchema).min(3).max(5),
  scenes: z.array(StorySceneSchema).min(1).max(30),
});

export const StoryPlanJsonSchema = z.toJSONSchema(StoryPlanStructureSchema);

export const StoryPlanSchema = StoryPlanStructureSchema.superRefine((plan, ctx) => {
  const uniqueGroups: Array<{ label: string; ids: string[]; path: (string | number)[] }> = [
    { label: 'character', ids: plan.characters.map((item) => item.id), path: ['characters'] },
    { label: 'location', ids: plan.locations.map((item) => item.id), path: ['locations'] },
    { label: 'scene', ids: plan.scenes.map((item) => item.id), path: ['scenes'] },
    { label: 'story beat', ids: plan.beats.map((item) => item.id), path: ['beats'] },
  ];
  for (const group of uniqueGroups) {
    if (new Set(group.ids).size !== group.ids.length) {
      ctx.addIssue({ code: 'custom', path: group.path, message: `Duplicate ${group.label} IDs are not allowed` });
    }
  }

  const sceneIds = new Set(plan.scenes.map((scene) => scene.id));
  const characterIds = new Set(plan.characters.map((character) => character.id));
  const locationIds = new Set(plan.locations.map((location) => location.id));
  const totalDuration = plan.scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
  if (Math.abs(totalDuration - plan.project.targetDurationSeconds) > 0.01) {
    ctx.addIssue({ code: 'custom', path: ['scenes'], message: 'Scene durations must add up to project.targetDurationSeconds' });
  }

  const beatOrder = ['setup', 'inciting_incident', 'rising_action', 'climax', 'resolution'];
  const observedBeatOrder = plan.beats.map((beat) => beatOrder.indexOf(beat.type));
  if (!['setup', 'climax', 'resolution'].every((type) => plan.beats.some((beat) => beat.type === type))) {
    ctx.addIssue({ code: 'custom', path: ['beats'], message: 'A story plan requires setup, climax and resolution beats' });
  }
  if (observedBeatOrder.some((order, index) => index > 0 && order < observedBeatOrder[index - 1])) {
    ctx.addIssue({ code: 'custom', path: ['beats'], message: 'Story beats must be in narrative order' });
  }

  plan.scenes.forEach((scene, sceneIndex) => {
    if (new Set(scene.characterIds).size !== scene.characterIds.length) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'characterIds'], message: 'Character IDs must be unique within a scene' });
    }
    if (new Set(scene.dialogue.map((line) => line.id)).size !== scene.dialogue.length) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'dialogue'], message: 'Dialogue IDs must be unique within a scene' });
    }
    if (!locationIds.has(scene.locationId)) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'locationId'], message: `Unknown location ID: ${scene.locationId}` });
    }
    scene.characterIds.forEach((characterId, characterIndex) => {
      if (!characterIds.has(characterId)) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'characterIds', characterIndex], message: `Unknown character ID: ${characterId}` });
      }
    });
    scene.dialogue.forEach((line, lineIndex) => {
      if (!characterIds.has(line.characterId)) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'dialogue', lineIndex, 'characterId'], message: `Unknown dialogue character ID: ${line.characterId}` });
      }
      if (line.startSeconds + line.durationSeconds > scene.durationSeconds + 0.01) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'dialogue', lineIndex], message: 'Dialogue must finish within its scene duration' });
      }
    });
  });

  const referencedSceneIds = new Set<string>();
  plan.beats.forEach((beat, beatIndex) => {
    if (new Set(beat.sceneIds).size !== beat.sceneIds.length) {
      ctx.addIssue({ code: 'custom', path: ['beats', beatIndex, 'sceneIds'], message: 'A beat cannot reference the same scene more than once' });
    }
    beat.sceneIds.forEach((sceneId, sceneIndex) => {
      if (!sceneIds.has(sceneId)) {
        ctx.addIssue({ code: 'custom', path: ['beats', beatIndex, 'sceneIds', sceneIndex], message: `Unknown story scene ID: ${sceneId}` });
      }
      referencedSceneIds.add(sceneId);
    });
  });
  plan.scenes.forEach((scene, sceneIndex) => {
    if (!referencedSceneIds.has(scene.id)) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'id'], message: 'Every story scene must belong to at least one story beat' });
    }
  });
});

const AssetKindSchema = z.enum(['character', 'environment', 'prop', 'audio']);
const AssetFormatSchema = z.enum(['glb', 'gltf', 'wav', 'mp3', 'ogg']);
const AudioFormatSet = new Set(['wav', 'mp3', 'ogg']);
const AssetPathSchema = z.string().min(1).max(240)
  .refine((path) => {
    const segments = path.split('/');
    return segments[0] === 'assets'
      && segments.length >= 3
      && segments.slice(1).every((segment) => /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(segment));
  }, 'Asset paths must be safe, relative paths beneath assets/')
  .refine((path) => /\.(?:glb|gltf|wav|mp3|ogg)$/i.test(path), 'Asset path extension is unsupported');

const AssetProvenanceSchema = z.strictObject({
  source: z.enum(['generated', 'user-uploaded', 'licensed-catalog']),
  licenseId: z.string().trim().min(1).max(100),
  sourceUrl: z.string().url().refine((url) => url.startsWith('https://'), 'Provenance URLs must use HTTPS').optional(),
  attribution: z.string().trim().min(1).max(500).optional(),
  commercialUse: z.enum(['allowed', 'restricted', 'unknown']),
  verified: z.boolean(),
});

const AssetSchema = z.strictObject({
  id: IdSchema,
  kind: AssetKindSchema,
  path: AssetPathSchema,
  format: AssetFormatSchema,
  provenance: AssetProvenanceSchema,
});

const CameraSchema = z.strictObject({
  shotType: z.enum(['establishing', 'wide', 'medium', 'close_up', 'over_the_shoulder']),
  position: Vector3Schema,
  rotation: Vector3Schema,
  fov: FiniteNumberSchema.min(20).max(100),
});

const TransformSchema = z.strictObject({
  position: Vector3Schema,
  rotation: Vector3Schema,
  scale: Scale3Schema,
});

const MaterialSchema = z.strictObject({
  color: HexColorSchema.optional(),
  roughness: FiniteNumberSchema.min(0).max(1).optional(),
  metalness: FiniteNumberSchema.min(0).max(1).optional(),
  opacity: FiniteNumberSchema.min(0).max(1).optional(),
});

const SceneObjectSchema = z.strictObject({
  id: IdSchema,
  assetId: IdSchema,
  transform: TransformSchema,
  material: MaterialSchema.optional(),
});

const AnimationKeyframeSchema = z.strictObject({
  timeSeconds: FiniteNumberSchema.min(0).max(180),
  value: z.union([Vector3Schema, FiniteNumberSchema]),
  easing: z.enum(['linear', 'ease_in', 'ease_out', 'ease_in_out']),
});

const AnimationCueSchema = z.strictObject({
  id: IdSchema,
  targetObjectId: IdSchema,
  property: z.enum(['position', 'rotation', 'scale', 'opacity']),
  keyframes: z.array(AnimationKeyframeSchema).min(2).max(120),
});

const DialogueCueSchema = z.strictObject({
  id: IdSchema,
  speakerAssetId: IdSchema,
  text: z.string().trim().min(1).max(500),
  startSeconds: FiniteNumberSchema.min(0).max(180),
  durationSeconds: FiniteNumberSchema.positive().max(30),
  emotion: z.enum(['neutral', 'happy', 'sad', 'afraid', 'angry', 'surprised', 'curious']).optional(),
  voiceStyle: z.string().trim().min(1).max(80).optional(),
});

const AudioCueSchema = z.strictObject({
  id: IdSchema,
  assetId: IdSchema,
  startSeconds: FiniteNumberSchema.min(0).max(180),
  durationSeconds: FiniteNumberSchema.positive().max(180),
  volume: FiniteNumberSchema.min(0).max(1),
  fadeInSeconds: FiniteNumberSchema.min(0).max(30),
  fadeOutSeconds: FiniteNumberSchema.min(0).max(30),
  loop: z.boolean().optional(),
});

const SceneManifestSceneSchema = z.strictObject({
  id: IdSchema,
  storySceneId: IdSchema.optional(),
  title: z.string().trim().min(1).max(100),
  durationSeconds: SceneDurationSchema,
  backgroundColor: HexColorSchema,
  camera: CameraSchema,
  objects: z.array(SceneObjectSchema).min(1).max(100),
  animationCues: z.array(AnimationCueSchema).max(100),
  dialogue: z.array(DialogueCueSchema).max(50),
  audioCues: z.array(AudioCueSchema).max(50),
});

const ResolutionSchema = z.union([
  z.strictObject({ width: z.literal(1280), height: z.literal(720) }),
  z.strictObject({ width: z.literal(1920), height: z.literal(1080) }),
]);

const SceneManifestStructureSchema = z.strictObject({
  kind: z.literal('toonforge.scene-manifest'),
  schemaVersion: z.literal(SCENE_MANIFEST_SCHEMA_VERSION),
  id: IdSchema,
  project: z.strictObject({
    title: TitleSchema,
    targetDurationSeconds: TargetDurationSchema,
    frameRate: z.union([z.literal(24), z.literal(30)]),
    resolution: ResolutionSchema,
  }),
  assets: z.array(AssetSchema).min(1).max(100),
  scenes: z.array(SceneManifestSceneSchema).min(1).max(30),
});

export const SceneManifestJsonSchema = z.toJSONSchema(SceneManifestStructureSchema);

export const SceneManifestSchema = SceneManifestStructureSchema.superRefine((manifest, ctx) => {
  const assetIds = manifest.assets.map((asset) => asset.id);
  const sceneIds = manifest.scenes.map((scene) => scene.id);
  if (new Set(assetIds).size !== assetIds.length) {
    ctx.addIssue({ code: 'custom', path: ['assets'], message: 'Asset IDs must be unique' });
  }
  const assetPaths = manifest.assets.map((asset) => asset.path);
  if (new Set(assetPaths).size !== assetPaths.length) {
    ctx.addIssue({ code: 'custom', path: ['assets'], message: 'Asset paths must be unique within a manifest' });
  }
  if (new Set(sceneIds).size !== sceneIds.length) {
    ctx.addIssue({ code: 'custom', path: ['scenes'], message: 'Scene IDs must be unique' });
  }

  const storySceneIds = manifest.scenes.flatMap((scene) => scene.storySceneId ? [scene.storySceneId] : []);
  if (new Set(storySceneIds).size !== storySceneIds.length) {
    ctx.addIssue({ code: 'custom', path: ['scenes'], message: 'A story scene can map to only one render scene' });
  }
  const assetsById = new Map(manifest.assets.map((asset) => [asset.id, asset]));
  const frameTolerance = 1 / manifest.project.frameRate;
  const totalDuration = manifest.scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
  if (Math.abs(totalDuration - manifest.project.targetDurationSeconds) > frameTolerance) {
    ctx.addIssue({ code: 'custom', path: ['scenes'], message: 'Scene durations must add up to project.targetDurationSeconds within one frame' });
  }

  manifest.assets.forEach((asset, assetIndex) => {
    const extension = asset.path.split('.').pop()?.toLowerCase();
    if (extension !== asset.format) {
      ctx.addIssue({ code: 'custom', path: ['assets', assetIndex, 'format'], message: 'Asset format must match its path extension' });
    }
    const isAudioKind = asset.kind === 'audio';
    const isAudioFormat = AudioFormatSet.has(asset.format);
    if (isAudioKind !== isAudioFormat) {
      ctx.addIssue({ code: 'custom', path: ['assets', assetIndex, 'kind'], message: 'Audio assets must use audio formats and non-audio assets must not' });
    }
    const expectedDirectory = {
      character: 'characters', environment: 'environments', prop: 'props', audio: 'audio',
    }[asset.kind];
    if (!asset.path.startsWith(`assets/${expectedDirectory}/`)) {
      ctx.addIssue({ code: 'custom', path: ['assets', assetIndex, 'path'], message: `Asset kind ${asset.kind} must use the assets/${expectedDirectory}/ directory` });
    }
    if (asset.provenance.source === 'licensed-catalog' && !asset.provenance.sourceUrl) {
      ctx.addIssue({ code: 'custom', path: ['assets', assetIndex, 'provenance', 'sourceUrl'], message: 'Licensed catalogue assets require a source URL' });
    }
  });

  manifest.scenes.forEach((scene, sceneIndex) => {
    const objectIds = scene.objects.map((object) => object.id);
    if (new Set(objectIds).size !== objectIds.length) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'objects'], message: 'Object IDs must be unique within a scene' });
    }
    const objectIdSet = new Set(objectIds);

    scene.objects.forEach((object, objectIndex) => {
      const asset = assetsById.get(object.assetId);
      if (!asset) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'objects', objectIndex, 'assetId'], message: `Unknown object asset ID: ${object.assetId}` });
      } else if (asset.kind === 'audio') {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'objects', objectIndex, 'assetId'], message: 'Scene objects cannot reference audio assets' });
      }
    });

    if (new Set(scene.animationCues.map((cue) => cue.id)).size !== scene.animationCues.length) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'animationCues'], message: 'Animation cue IDs must be unique within a scene' });
    }
    if (new Set(scene.dialogue.map((line) => line.id)).size !== scene.dialogue.length) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'dialogue'], message: 'Dialogue IDs must be unique within a scene' });
    }
    if (new Set(scene.audioCues.map((cue) => cue.id)).size !== scene.audioCues.length) {
      ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'audioCues'], message: 'Audio cue IDs must be unique within a scene' });
    }

    scene.animationCues.forEach((cue, cueIndex) => {
      if (!objectIdSet.has(cue.targetObjectId)) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'animationCues', cueIndex, 'targetObjectId'], message: `Unknown animation target object ID: ${cue.targetObjectId}` });
      }
      const vectorProperty = cue.property !== 'opacity';
      let previousTime = -Infinity;
      cue.keyframes.forEach((keyframe, keyframeIndex) => {
        if (keyframe.timeSeconds > scene.durationSeconds) {
          ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'animationCues', cueIndex, 'keyframes', keyframeIndex, 'timeSeconds'], message: 'Keyframes must fall within their scene duration' });
        }
        if (keyframe.timeSeconds <= previousTime) {
          ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'animationCues', cueIndex, 'keyframes', keyframeIndex, 'timeSeconds'], message: 'Keyframes must be strictly ordered by time' });
        }
        previousTime = keyframe.timeSeconds;
        if (vectorProperty !== Array.isArray(keyframe.value)) {
          ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'animationCues', cueIndex, 'keyframes', keyframeIndex, 'value'], message: `Animation property ${cue.property} has an incompatible keyframe value` });
        }
        if (cue.property === 'opacity' && typeof keyframe.value === 'number' && (keyframe.value < 0 || keyframe.value > 1)) {
          ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'animationCues', cueIndex, 'keyframes', keyframeIndex, 'value'], message: 'Opacity keyframes must be between 0 and 1' });
        }
        if (cue.property === 'scale' && Array.isArray(keyframe.value) && keyframe.value.some((component) => component <= 0)) {
          ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'animationCues', cueIndex, 'keyframes', keyframeIndex, 'value'], message: 'Scale keyframes must use positive values' });
        }
      });
    });

    scene.dialogue.forEach((line, lineIndex) => {
      const speaker = assetsById.get(line.speakerAssetId);
      if (!speaker || speaker.kind !== 'character') {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'dialogue', lineIndex, 'speakerAssetId'], message: 'Dialogue speakers must reference a character asset' });
      }
      if (line.startSeconds + line.durationSeconds > scene.durationSeconds + frameTolerance) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'dialogue', lineIndex], message: 'Dialogue must finish within its scene duration' });
      }
    });

    scene.audioCues.forEach((cue, cueIndex) => {
      const audioAsset = assetsById.get(cue.assetId);
      if (!audioAsset || audioAsset.kind !== 'audio') {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'audioCues', cueIndex, 'assetId'], message: 'Audio cues must reference an audio asset' });
      }
      if (cue.startSeconds + cue.durationSeconds > scene.durationSeconds + frameTolerance) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'audioCues', cueIndex], message: 'Audio cues must finish within their scene duration' });
      }
      if (cue.fadeInSeconds + cue.fadeOutSeconds > cue.durationSeconds) {
        ctx.addIssue({ code: 'custom', path: ['scenes', sceneIndex, 'audioCues', cueIndex], message: 'Audio fade durations cannot exceed the cue duration' });
      }
    });
  });
});

export type StoryPlan = z.infer<typeof StoryPlanSchema>;
export type SceneManifest = z.infer<typeof SceneManifestSchema>;

export function getProductionReadinessIssues(manifest: SceneManifest): string[] {
  const issues: string[] = [];
  for (const asset of manifest.assets) {
    if (!asset.provenance.verified) {
      issues.push(`${asset.id}: asset provenance is not verified`);
    }
    if (asset.provenance.commercialUse !== 'allowed') {
      issues.push(`${asset.id}: commercial use is not explicitly allowed`);
    }
    if (asset.provenance.licenseId.toLowerCase() === 'unknown') {
      issues.push(`${asset.id}: license identifier is unknown`);
    }
  }
  return issues;
}
