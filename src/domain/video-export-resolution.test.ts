import { describe, expect, it } from 'vitest';
import { getH264CompatibleResolution } from './video-export-resolution';

describe('H.264 export dimensions', () => {
  it('pads odd dimensions to the next even pixel without shrinking the content', () => {
    expect(getH264CompatibleResolution(853, 480)).toEqual({ width: 854, height: 480 });
    expect(getH264CompatibleResolution(1920, 1080)).toEqual({ width: 1920, height: 1080 });
    expect(getH264CompatibleResolution(1919, 1079)).toEqual({ width: 1920, height: 1080 });
  });

  it('rejects non-positive or non-integer dimensions', () => {
    expect(() => getH264CompatibleResolution(0, 480)).toThrow(RangeError);
    expect(() => getH264CompatibleResolution(853, -1)).toThrow(RangeError);
    expect(() => getH264CompatibleResolution(853.5, 480)).toThrow(RangeError);
  });
});
