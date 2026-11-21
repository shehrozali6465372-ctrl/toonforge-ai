export interface VideoExportFrameTiming {
  timestampSeconds: number;
  durationSeconds: number;
}

function validateTimeline(totalDurationSeconds: number, fps: number): void {
  if (!Number.isFinite(totalDurationSeconds) || totalDurationSeconds <= 0) {
    throw new RangeError('Video export duration must be a positive finite number');
  }
  if (!Number.isSafeInteger(fps) || fps <= 0) {
    throw new RangeError('Video export frame rate must be a positive safe integer');
  }
}

export function getVideoExportFrameCount(totalDurationSeconds: number, fps: number): number {
  validateTimeline(totalDurationSeconds, fps);
  return Math.ceil(totalDurationSeconds * fps);
}

export function getVideoExportFrameTiming(
  frameIndex: number,
  totalDurationSeconds: number,
  fps: number,
): VideoExportFrameTiming | null {
  validateTimeline(totalDurationSeconds, fps);
  if (!Number.isSafeInteger(frameIndex) || frameIndex < 0) {
    throw new RangeError('Video export frame index must be a non-negative safe integer');
  }

  const timestampSeconds = frameIndex / fps;
  if (timestampSeconds >= totalDurationSeconds) return null;

  return {
    timestampSeconds,
    durationSeconds: Math.min(1 / fps, totalDurationSeconds - timestampSeconds),
  };
}
