import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, FileVideo, Check, Loader2, AlertTriangle } from 'lucide-react';
import { GIFEncoder, quantize, applyPalette } from 'gifenc';
import type { CanvasSource, Output, StreamTargetChunk } from 'mediabunny';
import { getVideoExportFrameCount, getVideoExportFrameTiming } from '@/domain/video-export-timing';
import { getH264CompatibleResolution } from '@/domain/video-export-resolution';
import { useEditorStore } from '@/lib/store';
import { getExportResolution } from '@/lib/factories';
import type { ExportDefaults } from '@/lib/types';
import { downloadBlob, formatBytes } from '@/lib/download';
import { saveProject } from '@/lib/db';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MAX_BUFFER_EXPORT_BYTES = 48 * 1024 * 1024;

type ExportSaveFileHandle = {
  createWritable: () => Promise<WritableStream<StreamTargetChunk>>;
};

type ExportSaveFilePicker = (options: {
  suggestedName: string;
  types: Array<{ description: string; accept: Record<string, string[]> }>;
}) => Promise<ExportSaveFileHandle>;

export function ExportModal({ open, onClose }: Props) {
  const { t } = useTranslation('editor');
  const project = useEditorStore((s) => s.project);
  const updateProjectSettings = useEditorStore((s) => s.updateProjectSettings);
  const setThumbnail = useEditorStore((s) => s.setThumbnail);
  const [step, setStep] = useState(0);
  const [format, setFormat] = useState<ExportDefaults['format']>('mp4');
  const [resolution, setResolution] = useState<ExportDefaults['resolutionPreset']>('1080p');
  const [customW, setCustomW] = useState(1920);
  const [customH, setCustomH] = useState(1080);
  const [quality, setQuality] = useState<ExportDefaults['quality']>('high');
  const [fps, setFps] = useState<24 | 30 | 60>(30);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [savedToFileSystem, setSavedToFileSystem] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelRef = useRef(false);

  const FORMATS: { value: ExportDefaults['format']; label: string; desc: string; disabled?: boolean }[] = [
    { value: 'mp4', label: t('exportModal.formats.mp4.label'), desc: t('exportModal.formats.mp4.desc') },
    { value: 'webm', label: t('exportModal.formats.webm.label'), desc: t('exportModal.formats.webm.desc') },
    { value: 'gif', label: t('exportModal.formats.gif.label'), desc: t('exportModal.formats.gif.desc') },
    { value: 'mov', label: t('exportModal.formats.mov.label'), desc: t('exportModal.formats.mov.desc'), disabled: true },
  ];

  const RESOLUTIONS: { value: ExportDefaults['resolutionPreset']; label: string }[] = [
    { value: '480p', label: t('exportModal.resolutions.480p') },
    { value: '720p', label: t('exportModal.resolutions.720p') },
    { value: '1080p', label: t('exportModal.resolutions.1080p') },
    { value: '1440p', label: t('exportModal.resolutions.1440p') },
    { value: '2160p', label: t('exportModal.resolutions.2160p') },
  ];

  const QUALITIES: { value: ExportDefaults['quality']; label: string; bitrate: number }[] = [
    { value: 'standard', label: t('exportModal.quality.standard'), bitrate: 4_000_000 },
    { value: 'high', label: t('exportModal.quality.high'), bitrate: 8_000_000 },
    { value: 'max', label: t('exportModal.quality.max'), bitrate: 16_000_000 },
  ];

  if (!open || !project) return null;

  const isGif = format === 'gif';
  const contentResolution = getExportResolution(project, resolution, customW, customH);
  const res = format === 'mp4'
    ? getH264CompatibleResolution(contentResolution.width, contentResolution.height)
    : contentResolution;
  const outputPaddingX = Math.floor((res.width - contentResolution.width) / 2);
  const outputPaddingY = Math.floor((res.height - contentResolution.height) / 2);
  const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration, 0);
  const estimatedSize = (QUALITIES.find((q) => q.value === quality)?.bitrate || 8_000_000) * totalDuration / 8;
  const isHeavy = res.width * res.height > 1920 * 1080 || project.mode === '3d';

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setProgress(0);
    setSavedToFileSystem(false);
    cancelRef.current = false;

    const store = useEditorStore.getState();
    const restoreState = {
      currentSceneId: store.currentSceneId,
      currentTime: store.currentTime,
      isPlaying: store.isPlaying,
    };

    let activeOutput: Output | null = null;
    let activeVideoSource: CanvasSource | null = null;
    let activeFileWritable: WritableStream<StreamTargetChunk> | null = null;
    let sourceCanvas: HTMLCanvasElement | null = null;
    let webglContextLossHandler: ((event: Event) => void) | null = null;
    let webglContextLost = false;

    const removeWebglContextLossListener = () => {
      if (sourceCanvas && webglContextLossHandler) {
        sourceCanvas.removeEventListener('webglcontextlost', webglContextLossHandler);
      }
      webglContextLossHandler = null;
    };

    try {
      if (format === 'mov') throw new Error(t('exportModal.movNotImplemented'));

      // Large outputs stream to a user-selected file. Smaller outputs use a
      // bounded in-memory target, avoiding unbounded media buffers.
      let fileHandlePromise: Promise<ExportSaveFileHandle> | null = null;
      if (format !== 'gif' && estimatedSize > MAX_BUFFER_EXPORT_BYTES) {
        const pickerWindow = window as Window & { showSaveFilePicker?: ExportSaveFilePicker };
        const picker = pickerWindow.showSaveFilePicker;
        if (!picker) {
          throw new Error(t('exportModal.largeExportNeedsFilePicker', {
            maxSize: formatBytes(MAX_BUFFER_EXPORT_BYTES),
          }));
        }
        const extension = format === 'mp4' ? 'mp4' : 'webm';
        const type: { description: string; accept: Record<string, string[]> } = format === 'mp4'
          ? { description: 'MP4 video', accept: { 'video/mp4': ['.mp4'] } }
          : { description: 'WebM video', accept: { 'video/webm': ['.webm'] } };
        // Invoke before the first await so browser user activation is retained.
        fileHandlePromise = picker.call(pickerWindow, {
          suggestedName: `${project.name.replace(/\s+/g, '-').toLowerCase()}.${extension}`,
          types: [type],
        });
      }
      const fileHandle = fileHandlePromise ? await fileHandlePromise : null;
      activeFileWritable = fileHandle ? await fileHandle.createWritable() : null;

      const canvases = document.querySelectorAll('canvas');
      if (canvases.length === 0) throw new Error(t('exportModal.canvasNotFound'));

      const sceneOffsets: { sceneId: string; start: number; duration: number }[] = [];
      let offset = 0;
      for (const scene of project.scenes) {
        sceneOffsets.push({ sceneId: scene.id, start: offset, duration: scene.duration });
        offset += scene.duration;
      }

      const waitForPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
      const targetCanvas = document.createElement('canvas');
      targetCanvas.width = res.width;
      targetCanvas.height = res.height;
      const ctx = targetCanvas.getContext('2d');
      if (!ctx) throw new Error(t('exportModal.canvasNotFound'));

      const totalFrames = getVideoExportFrameCount(totalDuration, fps);
      useEditorStore.setState({ isPlaying: false, isExporting: true });
      await waitForPaint();
      sourceCanvas = document.querySelector('canvas');
      if (!sourceCanvas) throw new Error(t('exportModal.canvasNotFound'));
      const renderCanvas = sourceCanvas;

      webglContextLossHandler = (event) => {
        event.preventDefault();
        webglContextLost = true;
      };
      renderCanvas.addEventListener('webglcontextlost', webglContextLossHandler);
      const webglContext = renderCanvas.getContext('webgl2') || renderCanvas.getContext('webgl');
      if (webglContext?.isContextLost()) webglContextLost = true;

      // Crop the letterboxed editor viewport to the project's actual content rect.
      const viewport = useEditorStore.getState().canvasViewport;
      let srcX = 0, srcY = 0, srcW = renderCanvas.width, srcH = renderCanvas.height;
      if (viewport && renderCanvas.clientWidth > 0 && renderCanvas.clientHeight > 0) {
        const dprX = renderCanvas.width / renderCanvas.clientWidth;
        const dprY = renderCanvas.height / renderCanvas.clientHeight;
        srcX = viewport.offsetX * dprX;
        srcY = viewport.offsetY * dprY;
        srcW = project.settings.width * viewport.scale * dprX;
        srcH = project.settings.height * viewport.scale * dprY;
      }

      const drawFrame = async (i: number) => {
        const frameTimeSeconds = i / fps;
        let active = sceneOffsets[sceneOffsets.length - 1];
        for (const sceneOffset of sceneOffsets) {
          if (frameTimeSeconds >= sceneOffset.start) active = sceneOffset;
          else break;
        }
        const localTime = Math.min(frameTimeSeconds - active.start, active.duration);
        useEditorStore.setState({ currentSceneId: active.sceneId, currentTime: localTime });
        await waitForPaint();

        if (webglContextLost || webglContext?.isContextLost()) {
          throw new Error(t('exportModal.webglContextLost'));
        }

        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, res.width, res.height);
        ctx.drawImage(
          renderCanvas,
          srcX,
          srcY,
          srcW,
          srcH,
          outputPaddingX,
          outputPaddingY,
          contentResolution.width,
          contentResolution.height,
        );
      };

      const finishExport = async (blob: Blob | null, extension: string, savedToFileSystem = false) => {
        const filename = `${project.name.replace(/\s+/g, '-').toLowerCase()}.${extension}`;
        if (blob) downloadBlob(blob, filename);

        const thumbCanvas = document.createElement('canvas');
        thumbCanvas.width = 320;
        thumbCanvas.height = 180;
        const thumbCtx = thumbCanvas.getContext('2d');
        if (thumbCtx) {
          thumbCtx.drawImage(targetCanvas, 0, 0, 320, 180);
          setThumbnail(thumbCanvas.toDataURL('image/jpeg', 0.7));
        }

        updateProjectSettings({
          exportDefaults: { format, resolutionPreset: resolution, quality, fps },
        });
        await saveProject(useEditorStore.getState().project!);

        useEditorStore.setState({ ...restoreState, isExporting: false });
        setExporting(false);
        setSavedToFileSystem(savedToFileSystem);
        setDone(true);
        setProgress(100);
      };

      if (format === 'gif') {
        const gif = GIFEncoder();
        for (let i = 0; i < totalFrames; i++) {
          if (cancelRef.current) {
            removeWebglContextLossListener();
            useEditorStore.setState({ ...restoreState, isExporting: false });
            setExporting(false);
            return;
          }

          const frameTiming = getVideoExportFrameTiming(i, totalDuration, fps);
          if (!frameTiming) continue;
          await drawFrame(i);
          const { data } = ctx.getImageData(0, 0, res.width, res.height);
          const palette = quantize(data, 256);
          const index = applyPalette(data, palette);
          gif.writeFrame(index, res.width, res.height, {
            palette,
            delay: Math.max(1, Math.round(frameTiming.durationSeconds * 1000)),
          });

          if (i % 4 === 0 || i === totalFrames - 1) setProgress(((i + 1) / totalFrames) * 100);
        }

        gif.finish();
        removeWebglContextLossListener();
        await finishExport(new Blob([new Uint8Array(gif.bytes())], { type: 'image/gif' }), 'gif');
        return;
      }

      // Keep the sizeable WebCodecs muxer out of the initial application bundle;
      // GIF export remains independent of the video encoder package.
      const {
        BufferTarget,
        CanvasSource,
        Mp4OutputFormat,
        Output,
        Quality,
        StreamTarget,
        WebMOutputFormat,
        canEncodeVideo,
      } = await import('mediabunny');

      const bitrate = QUALITIES.find((q) => q.value === quality)?.bitrate || 8_000_000;
      const codec = format === 'mp4' ? 'avc' : 'vp9';
      const videoQuality = new Quality({ bitrate });
      if (!await canEncodeVideo(codec, {
        width: res.width,
        height: res.height,
        quality: videoQuality,
        frameRate: fps,
      })) {
        throw new Error(t('exportModal.codecNotSupported', { codec: format.toUpperCase() }));
      }

      const outputTarget = activeFileWritable
        ? new StreamTarget(activeFileWritable, { chunked: true })
        : new BufferTarget();
      const outputFormat = format === 'mp4' ? new Mp4OutputFormat() : new WebMOutputFormat();
      const output = new Output({ format: outputFormat, target: outputTarget });
      const videoSource = new CanvasSource(targetCanvas, { codec, quality: videoQuality });
      activeOutput = output;
      activeVideoSource = videoSource;
      output.addVideoTrack(videoSource, { frameRate: fps });
      await output.start();

      for (let i = 0; i < totalFrames; i++) {
        if (cancelRef.current) {
          videoSource.close();
          activeVideoSource = null;
          await output.cancel();
          activeOutput = null;
          activeFileWritable = null;
          removeWebglContextLossListener();
          useEditorStore.setState({ ...restoreState, isExporting: false });
          setExporting(false);
          return;
        }

        const frameTiming = getVideoExportFrameTiming(i, totalDuration, fps);
        if (!frameTiming) continue;
        await drawFrame(i);
        await videoSource.add(frameTiming.timestampSeconds, frameTiming.durationSeconds);
        if (i % 4 === 0 || i === totalFrames - 1) setProgress(((i + 1) / totalFrames) * 100);
      }

      videoSource.close();
      activeVideoSource = null;
      if (cancelRef.current) {
        await output.cancel();
        activeOutput = null;
        activeFileWritable = null;
        removeWebglContextLossListener();
        useEditorStore.setState({ ...restoreState, isExporting: false });
        setExporting(false);
        return;
      }

      await output.finalize();
      activeFileWritable = null;
      const mimeType = await output.getMimeType();
      const blob = outputTarget instanceof BufferTarget
        ? outputTarget.buffer ? new Blob([outputTarget.buffer], { type: mimeType }) : null
        : null;
      if (outputTarget instanceof BufferTarget && !blob) {
        throw new Error(t('exportModal.genericError'));
      }

      activeOutput = null;
      removeWebglContextLossListener();
      await finishExport(blob, format, Boolean(fileHandle));
    } catch (err) {
      activeVideoSource?.close();
      if (activeOutput && activeOutput.state !== 'finalized' && activeOutput.state !== 'canceled') {
        await activeOutput.cancel().catch(() => undefined);
      }
      if (activeFileWritable) await activeFileWritable.abort(err).catch(() => undefined);
      removeWebglContextLossListener();
      useEditorStore.setState({ ...restoreState, isExporting: false });
      const pickerCanceled = err instanceof DOMException && err.name === 'AbortError';
      setError(pickerCanceled ? null : err instanceof Error ? err.message : t('exportModal.genericError'));
      setExporting(false);
    }
  };

  const handleClose = () => {
    if (exporting) {
      cancelRef.current = true;
      return;
    }
    setStep(0);
    setDone(false);
    setSavedToFileSystem(false);
    setProgress(0);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative panel w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin animate-scale-in shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-ink-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FileVideo className="w-5 h-5 text-accent-violet" />
            {isGif ? t('exportModal.titleGif') : t('exportModal.title')}
          </h2>
          <button onClick={handleClose} className="icon-btn"><X className="w-5 h-5" /></button>
        </div>

        {done ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="font-semibold text-lg mb-1">{t('exportModal.doneTitle')}</h3>
            <p className="text-sm text-ink-300 mb-4">{isGif ? t('exportModal.doneDescGif') : savedToFileSystem ? t('exportModal.doneDescSaved') : t('exportModal.doneDesc')}</p>
            <button onClick={handleClose} className="btn-primary">{t('exportModal.close')}</button>
          </div>
        ) : exporting ? (
          <div className="p-6">
            <div className="text-center mb-4">
              <Loader2 className="w-10 h-10 text-accent-violet animate-spin mx-auto mb-3" />
              <h3 className="font-semibold mb-1">{t('exportModal.renderingTitle')}</h3>
              <p className="text-sm text-ink-300">{Math.round(progress)}%</p>
            </div>
            <div className="w-full h-2 bg-ink-700 rounded-full overflow-hidden mb-4">
              <div className="h-full bg-gradient-to-r from-accent-violet to-accent-blue transition-all" style={{ width: `${progress}%` }} />
            </div>
            <button onClick={() => { cancelRef.current = true; }} className="btn-outline w-full">
              {t('exportModal.cancel')}
            </button>
          </div>
        ) : step === 0 ? (
          <>
            <div className="p-5 space-y-4">
              {/* Format */}
              <div>
                <label className="label mb-2 block">{t('exportModal.fileFormat')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {FORMATS.map((f) => (
                    <button
                      key={f.value}
                      onClick={() => setFormat(f.value)}
                      disabled={f.disabled}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${f.disabled ? 'cursor-not-allowed opacity-50 border-ink-700' : format === f.value ? 'border-accent-violet bg-accent-violet/10' : 'border-ink-600 hover:border-ink-500'}`}
                    >
                      <div className="font-medium text-sm">{f.label}</div>
                      <div className="text-xs text-ink-400 mt-0.5">{f.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution */}
              <div>
                <label className="label mb-2 block">{t('exportModal.resolution')}</label>
                <div className="flex flex-wrap gap-2">
                  {RESOLUTIONS.map((r) => (
                    <button
                      key={r.value}
                      onClick={() => setResolution(r.value)}
                      className={`px-3 py-1.5 rounded-lg border-2 text-sm transition-all ${resolution === r.value ? 'border-accent-violet bg-accent-violet/10 text-accent-violet' : 'border-ink-600 text-ink-300 hover:border-ink-500'}`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                {resolution === 'custom' && (
                  <div className="flex gap-2 mt-2">
                    <input type="number" value={customW} onChange={(e) => setCustomW(parseInt(e.target.value) || 0)} className="input text-sm" placeholder={t('exportModal.widthPlaceholder')} />
                    <input type="number" value={customH} onChange={(e) => setCustomH(parseInt(e.target.value) || 0)} className="input text-sm" placeholder={t('exportModal.heightPlaceholder')} />
                  </div>
                )}
              </div>

              {/* FPS */}
              <div>
                <label className="label mb-2 block">{t('exportModal.fps')}</label>
                <div className="flex gap-2">
                  {([24, 30, 60] as const).map((f) => (
                    <button key={f} onClick={() => setFps(f)} className={`flex-1 py-2 rounded-lg border-2 text-sm transition-all ${fps === f ? 'border-accent-violet bg-accent-violet/10 text-accent-violet' : 'border-ink-600 text-ink-300'}`}>
                      {f} fps
                    </button>
                  ))}
                </div>
              </div>

              {/* Quality: bitrate-based, not applicable to the GIF encoder */}
              {!isGif && (
                <div>
                  <label className="label mb-2 block">{t('exportModal.qualityLabel')}</label>
                  <div className="flex gap-2">
                    {QUALITIES.map((q) => (
                      <button key={q.value} onClick={() => setQuality(q.value)} className={`flex-1 py-2 rounded-lg border-2 text-sm transition-all ${quality === q.value ? 'border-accent-violet bg-accent-violet/10 text-accent-violet' : 'border-ink-600 text-ink-300'}`}>
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="p-3 bg-ink-900 rounded-lg border border-ink-600 space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-ink-400">{t('exportModal.infoResolution')}</span><span className="font-mono">{res.width}×{res.height}</span></div>
                <div className="flex justify-between"><span className="text-ink-400">{t('exportModal.infoDuration')}</span><span className="font-mono">{totalDuration.toFixed(1)}s</span></div>
                {!isGif && (
                  <div className="flex justify-between"><span className="text-ink-400">{t('exportModal.infoEstimatedSize')}</span><span className="font-mono">~{formatBytes(estimatedSize)}</span></div>
                )}
              </div>

              {isHeavy && (
                <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{t('exportModal.heavyWarning')}</span>
                </div>
              )}
            </div>
            <div className="flex justify-end p-5 border-t border-ink-700">
              <button onClick={handleExport} className="btn-primary">
                <Download className="w-4 h-4" /> {t('exportModal.exportButton')}
              </button>
            </div>
          </>
        ) : null}

        {error && (
          <div className="p-4 mx-5 mb-5 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
