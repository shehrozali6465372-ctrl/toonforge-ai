export interface VideoExportResolution {
  width: number;
  height: number;
}

/** H.264 4:2:0 encoders commonly require even frame dimensions. */
export function getH264CompatibleResolution(width: number, height: number): VideoExportResolution {
  if (!Number.isSafeInteger(width) || width <= 0 || !Number.isSafeInteger(height) || height <= 0) {
    throw new RangeError('Video export dimensions must be positive safe integers');
  }

  return {
    width: width + (width % 2),
    height: height + (height % 2),
  };
}
