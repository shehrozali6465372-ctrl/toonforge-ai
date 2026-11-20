export type GlbAssetPackagingErrorCode =
  | 'invalid_limit'
  | 'too_large'
  | 'invalid_input'
  | 'malformed_glb'
  | 'invalid_json'
  | 'invalid_asset_version'
  | 'external_resource_uri';

export class GlbAssetPackagingError extends Error {
  constructor(readonly code: GlbAssetPackagingErrorCode, message: string) {
    super(message);
    this.name = 'GlbAssetPackagingError';
  }
}

export interface GlbAssetPackagingOptions {
  /** Required caller policy; no implicit product limit is selected here. */
  maxBytes: number;
}

export interface PackagedGlbAsset {
  dataUrl: string;
  byteLength: number;
}

const GLB_MAGIC = 0x46546c67;
const GLB_VERSION = 2;
const JSON_CHUNK_TYPE = 0x4e4f534a;

function fail(code: GlbAssetPackagingErrorCode, message: string): never {
  throw new GlbAssetPackagingError(code, message);
}

function rejectExternalUris(value: unknown, path = '<root>'): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => rejectExternalUris(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}.${key}`;
    if (key === 'uri' && (typeof child !== 'string' || !child.startsWith('data:'))) {
      fail('external_resource_uri', `GLB resource URI at ${childPath} must be an embedded data URI`);
    }
    rejectExternalUris(child, childPath);
  }
}

function encodeBase64(bytes: Uint8Array): string {
  const chunks: string[] = [];
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + chunkSize)));
  }
  return btoa(chunks.join(''));
}

/**
 * Validate and package a GLB v2 byte sequence as the data URL consumed by
 * `compileSceneManifest`. Every buffer/image URI must be embedded as a data URI;
 * network and relative file references are rejected. The caller must choose
 * `maxBytes` based on the application's storage and memory budget.
 */
export function packageGlbAsset(
  input: ArrayBuffer | Uint8Array,
  options: GlbAssetPackagingOptions,
): PackagedGlbAsset {
  if (!options || !Number.isSafeInteger(options.maxBytes) || options.maxBytes <= 0) {
    fail('invalid_limit', 'maxBytes must be a positive safe integer supplied by the caller');
  }

  if (!(input instanceof ArrayBuffer) && !(input instanceof Uint8Array)) {
    fail('invalid_input', 'GLB input must be an ArrayBuffer or Uint8Array');
  }
  const bytes = input instanceof Uint8Array
    ? new Uint8Array(input.buffer, input.byteOffset, input.byteLength)
    : new Uint8Array(input);

  if (bytes.byteLength > options.maxBytes) {
    fail('too_large', `GLB file size ${bytes.byteLength} bytes exceeds the configured limit of ${options.maxBytes} bytes`);
  }
  if (bytes.byteLength < 20 || bytes.byteLength % 4 !== 0) {
    fail('malformed_glb', 'GLB file is truncated or its total length is not 4-byte aligned');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (view.getUint32(0, true) !== GLB_MAGIC) {
    fail('malformed_glb', 'GLB header has an invalid magic value');
  }
  if (view.getUint32(4, true) !== GLB_VERSION) {
    fail('malformed_glb', 'Only GLB version 2 files are supported');
  }
  if (view.getUint32(8, true) !== bytes.byteLength) {
    fail('malformed_glb', 'GLB header declared length does not match the supplied byte length');
  }

  let offset = 12;
  let chunkIndex = 0;
  let jsonDocument: unknown;
  while (offset < bytes.byteLength) {
    if (offset + 8 > bytes.byteLength) {
      fail('malformed_glb', 'GLB contains a truncated chunk header');
    }
    const chunkLength = view.getUint32(offset, true);
    const chunkType = view.getUint32(offset + 4, true);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + chunkLength;

    if (chunkLength % 4 !== 0 || chunkEnd > bytes.byteLength) {
      fail('malformed_glb', 'GLB chunk length is misaligned or exceeds the file boundary');
    }
    if (chunkIndex === 0 && chunkType !== JSON_CHUNK_TYPE) {
      fail('malformed_glb', 'The GLB JSON chunk must be first');
    }

    if (chunkType === JSON_CHUNK_TYPE) {
      if (chunkIndex !== 0 || jsonDocument !== undefined) {
        fail('malformed_glb', 'GLB must contain exactly one JSON chunk and it must be first');
      }
      try {
        const jsonText = new TextDecoder('utf-8', { fatal: true }).decode(bytes.subarray(chunkStart, chunkEnd));
        jsonDocument = JSON.parse(jsonText) as unknown;
      } catch {
        fail('invalid_json', 'GLB JSON chunk is not valid UTF-8 JSON');
      }
      if (!jsonDocument || typeof jsonDocument !== 'object' || Array.isArray(jsonDocument)) {
        fail('invalid_json', 'GLB JSON chunk must contain a JSON object');
      }
      const asset = (jsonDocument as { asset?: { version?: unknown } }).asset;
      if (!asset || asset.version !== '2.0') {
        fail('invalid_asset_version', 'GLB JSON asset.version must be "2.0"');
      }
      rejectExternalUris(jsonDocument);
    }

    offset = chunkEnd;
    chunkIndex += 1;
  }

  if (offset !== bytes.byteLength || jsonDocument === undefined) {
    fail('malformed_glb', 'GLB is missing its required first JSON chunk or has trailing incomplete data');
  }

  return {
    dataUrl: `data:model/gltf-binary;base64,${encodeBase64(bytes)}`,
    byteLength: bytes.byteLength,
  };
}
