import { describe, expect, it } from 'vitest';
import {
  getVideoExportFrameCount,
  getVideoExportFrameTiming,
} from './video-export-timing';

describe('video export frame timing', () => {
  it('maps a one-second 30 fps timeline to exactly 30 timestamped frames', () => {
    expect(getVideoExportFrameCount(1, 30)).toBe(30);
    expect(getVideoExportFrameTiming(0, 1, 30)).toEqual({
      timestampSeconds: 0,
      durationSeconds: 1 / 30,
    });
    const lastFrame = getVideoExportFrameTiming(29, 1, 30)!;
    expect(lastFrame.timestampSeconds).toBe(29 / 30);
    expect(lastFrame.durationSeconds).toBeCloseTo(1 / 30, 14);
  });

  it('shortens the final frame so fractional timeline durations are not extended', () => {
    expect(getVideoExportFrameCount(1.01, 30)).toBe(31);
    const lastFrame = getVideoExportFrameTiming(30, 1.01, 30)!;
    expect(lastFrame.timestampSeconds).toBe(1);
    expect(lastFrame.durationSeconds).toBeCloseTo(0.01, 14);
  });

  it('rejects frame indexes outside the timeline', () => {
    expect(getVideoExportFrameTiming(30, 1, 30)).toBeNull();
  });

  it('rejects invalid timeline durations and frame rates', () => {
    expect(() => getVideoExportFrameCount(0, 30)).toThrow(RangeError);
    expect(() => getVideoExportFrameCount(1, 0)).toThrow(RangeError);
    expect(() => getVideoExportFrameTiming(-1, 1, 30)).toThrow(RangeError);
    expect(() => getVideoExportFrameTiming(0.5, 1, 30)).toThrow(RangeError);
  });

  it('produces frame durations whose sum equals the exact timeline duration', () => {
    const duration = 1.013;
    const fps = 24;
    const count = getVideoExportFrameCount(duration, fps);
    const total = Array.from({ length: count }, (_, index) =>
      getVideoExportFrameTiming(index, duration, fps)!.durationSeconds,
    ).reduce((sum, frameDuration) => sum + frameDuration, 0);

    expect(total).toBeCloseTo(duration, 12);
  });
});
