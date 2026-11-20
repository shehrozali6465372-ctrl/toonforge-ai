import { describe, expect, it } from 'vitest';
import { GlbAssetPackagingError, packageGlbAsset } from './glb-asset-packager';

const JSON_CHUNK_TYPE = 0x4e4f534a;
const BIN_CHUNK_TYPE = 0x004e4942;

function makeGlb(document: Record<string, unknown>, binaryChunk?: Uint8Array): Uint8Array {
  const json = new TextEncoder().encode(JSON.stringify(document));
  const jsonLength = Math.ceil(json.length / 4) * 4;
  const binLength = binaryChunk ? Math.ceil(binaryChunk.length / 4) * 4 : 0;
  const totalLength = 12 + 8 + jsonLength + (binaryChunk ? 8 + binLength : 0);
  const bytes = new Uint8Array(totalLength);
  const view = new DataView(bytes.buffer);
  view.setUint32(0, 0x46546c67, true);
  view.setUint32(4, 2, true);
  view.setUint32(8, totalLength, true);
  view.setUint32(12, jsonLength, true);
  view.setUint32(16, JSON_CHUNK_TYPE, true);
  bytes.fill(0x20, 20, 20 + jsonLength);
  bytes.set(json, 20);
  if (binaryChunk) {
    const binHeaderOffset = 20 + jsonLength;
    view.setUint32(binHeaderOffset, binLength, true);
    view.setUint32(binHeaderOffset + 4, BIN_CHUNK_TYPE, true);
    bytes.set(binaryChunk, binHeaderOffset + 8);
  }
  return bytes;
}

const minimalDocument = { asset: { version: '2.0', generator: 'ToonForge test' } };
const packagingOptions = { maxBytes: 1024 * 1024 };

describe('packageGlbAsset', () => {
  it('packages a valid GLB v2 file into the compiler data-URL format', () => {
    const bytes = makeGlb(minimalDocument, new Uint8Array([1, 2, 3, 4]));
    const result = packageGlbAsset(bytes, packagingOptions);

    expect(result.byteLength).toBe(bytes.byteLength);
    expect(result.dataUrl).toBe(`data:model/gltf-binary;base64,${btoa(String.fromCharCode(...bytes))}`);
  });

  it('packages only the selected bytes when given a subarray view', () => {
    const bytes = makeGlb(minimalDocument);
    const padded = new Uint8Array(bytes.length + 8);
    padded.set([9, 9, 9, 9]);
    padded.set(bytes, 4);
    padded.set([8, 8, 8, 8], 4 + bytes.length);

    const result = packageGlbAsset(padded.subarray(4, 4 + bytes.length), packagingOptions);
    expect(result.byteLength).toBe(bytes.length);
    expect(result.dataUrl).toContain(btoa(String.fromCharCode(...bytes)));
  });

  it('requires an explicit positive safe-integer size limit', () => {
    const bytes = makeGlb(minimalDocument);
    expect(() => packageGlbAsset(bytes, { maxBytes: 0 })).toThrowError(GlbAssetPackagingError);
    expect(() => packageGlbAsset(bytes, { maxBytes: Number.POSITIVE_INFINITY })).toThrowError(/maxBytes/);
  });

  it('rejects files larger than the caller-supplied size limit before packaging', () => {
    const bytes = makeGlb(minimalDocument);
    expect(() => packageGlbAsset(bytes, { maxBytes: bytes.byteLength - 1 })).toThrowError(/exceeds the configured limit/);
  });

  it('rejects invalid GLB magic, unsupported versions and mismatched declared lengths', () => {
    const invalidMagic = makeGlb(minimalDocument);
    new DataView(invalidMagic.buffer).setUint32(0, 0x12345678, true);
    expect(() => packageGlbAsset(invalidMagic, packagingOptions)).toThrowError(/magic/);

    const invalidVersion = makeGlb(minimalDocument);
    new DataView(invalidVersion.buffer).setUint32(4, 1, true);
    expect(() => packageGlbAsset(invalidVersion, packagingOptions)).toThrowError(/version 2/);

    const invalidLength = makeGlb(minimalDocument);
    new DataView(invalidLength.buffer).setUint32(8, invalidLength.byteLength + 4, true);
    expect(() => packageGlbAsset(invalidLength, packagingOptions)).toThrowError(/declared length/);
  });

  it('rejects truncated chunk headers, overflowing chunk lengths and a non-JSON first chunk', () => {
    const truncated = makeGlb(minimalDocument).subarray(0, 16);
    expect(() => packageGlbAsset(truncated, packagingOptions)).toThrowError(/4-byte aligned|chunk header/);

    const overflow = makeGlb(minimalDocument);
    new DataView(overflow.buffer).setUint32(12, overflow.byteLength, true);
    expect(() => packageGlbAsset(overflow, packagingOptions)).toThrowError(/chunk length/);

    const wrongFirstChunk = makeGlb(minimalDocument);
    new DataView(wrongFirstChunk.buffer).setUint32(16, BIN_CHUNK_TYPE, true);
    expect(() => packageGlbAsset(wrongFirstChunk, packagingOptions)).toThrowError(/JSON chunk must be first/);
  });

  it('rejects malformed JSON chunks and documents that are not glTF 2.0', () => {
    const invalidJson = makeGlb(minimalDocument);
    invalidJson.fill(0x20, 20);
    invalidJson.set(new TextEncoder().encode('{invalid json'), 20);
    expect(() => packageGlbAsset(invalidJson, packagingOptions)).toThrowError(/JSON chunk/);

    const wrongAssetVersion = makeGlb({ asset: { version: '1.0' } });
    expect(() => packageGlbAsset(wrongAssetVersion, packagingOptions)).toThrowError(/asset.version/);
  });

  it('rejects external buffer URIs', () => {
    const bytes = makeGlb({
      asset: { version: '2.0' },
      buffers: [{ uri: 'https://cdn.example/model.bin', byteLength: 4 }],
    });
    expect(() => packageGlbAsset(bytes, packagingOptions)).toThrowError(/must be an embedded data URI/);
  });

  it('rejects external image URIs and nested extension URIs', () => {
    const image = makeGlb({ asset: { version: '2.0' }, images: [{ uri: '../textures/hero.png' }] });
    expect(() => packageGlbAsset(image, packagingOptions)).toThrowError(/must be an embedded data URI/);

    const extension = makeGlb({
      asset: { version: '2.0' },
      extensions: { EXT_external_asset: { uri: 'https://example.org/asset' } },
    });
    expect(() => packageGlbAsset(extension, packagingOptions)).toThrowError(/must be an embedded data URI/);
  });

  it('rejects non-string URI values instead of treating them as embedded resources', () => {
    const bytes = makeGlb({ asset: { version: '2.0' }, buffers: [{ uri: 123, byteLength: 4 }] });
    expect(() => packageGlbAsset(bytes, packagingOptions)).toThrowError(/must be an embedded data URI/);
  });

  it('allows embedded data URIs for buffers and images', () => {
    const bytes = makeGlb({
      asset: { version: '2.0' },
      buffers: [{ uri: 'data:application/octet-stream;base64,AQIDBA==', byteLength: 4 }],
      images: [{ uri: 'data:image/png;base64,AQIDBA==' }],
    });
    expect(() => packageGlbAsset(bytes, packagingOptions)).not.toThrow();
  });

  it('rejects duplicate JSON chunks and trailing incomplete bytes', () => {
    const bytes = makeGlb(minimalDocument);
    const duplicate = new Uint8Array(bytes.length + 8 + bytes.length - 20);
    duplicate.set(bytes);
    const view = new DataView(duplicate.buffer);
    view.setUint32(8, duplicate.byteLength, true);
    const duplicateChunk = bytes.subarray(20);
    const secondHeader = bytes.byteLength;
    view.setUint32(secondHeader, duplicateChunk.byteLength, true);
    view.setUint32(secondHeader + 4, JSON_CHUNK_TYPE, true);
    duplicate.set(duplicateChunk, secondHeader + 8);
    expect(() => packageGlbAsset(duplicate, packagingOptions)).toThrowError(/exactly one JSON chunk/);

    const trailing = new Uint8Array(bytes.length + 1);
    trailing.set(bytes);
    new DataView(trailing.buffer).setUint32(8, trailing.byteLength, true);
    expect(() => packageGlbAsset(trailing, packagingOptions)).toThrowError(/4-byte aligned|chunk header/);
  });
});
