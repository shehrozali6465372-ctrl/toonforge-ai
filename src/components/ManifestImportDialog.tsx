import { useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { X, FileUp, Upload, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { compileManifestImport } from '@/domain/manifest-import';
import {
  getManifestImportRequirements,
  isManifestAssetSizeAllowed,
  isManifestAggregateSizeAllowed,
  isManifestJsonSizeAllowed,
  MANIFEST_IMPORT_MAX_ASSET_BYTES,
  MANIFEST_IMPORT_MAX_JSON_BYTES,
  MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES,
  type ManifestImportIssue,
  type ManifestImportRequirements,
} from '@/domain/manifest-import-ui';
import { saveCompiledManifestImport } from '@/lib/db';
import { formatBytes } from '@/lib/download';
import { uid } from '@/lib/types';

interface ManifestImportDialogProps {
  open: boolean;
  onClose: () => void;
}

export function ManifestImportDialog({ open, onClose }: ManifestImportDialogProps) {
  const { t } = useTranslation('projects');
  const [requirements, setRequirements] = useState<ManifestImportRequirements | null>(null);
  const [assetFiles, setAssetFiles] = useState<Record<string, File>>({});
  const [error, setError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  if (!open) return null;

  const selectedBytes = Object.values(assetFiles).reduce((total, file) => total + file.size, 0);
  const unsupportedReasons = requirements?.unsupportedReasons ?? [];
  const allRequiredFilesSelected = requirements?.requiredAssets.every((asset) => Boolean(assetFiles[asset.id])) ?? false;
  const canImport = Boolean(
    requirements
    && unsupportedReasons.length === 0
    && allRequiredFilesSelected
    && isManifestAggregateSizeAllowed(selectedBytes)
    && !isImporting,
  );

  const describeUnsupported = (issue: ManifestImportIssue): string => {
    switch (issue.code) {
      case 'dialogue': return t('manifestUnsupportedDialogue', { scene: issue.sceneTitle });
      case 'audio': return t('manifestUnsupportedAudio', { scene: issue.sceneTitle });
      case 'asset_format': return t('manifestUnsupportedAssetFormat', { assetId: issue.assetId, format: issue.format });
      case 'material': return t('manifestUnsupportedMaterial', { objectId: issue.objectId });
    }
  };

  const close = () => {
    setRequirements(null);
    setAssetFiles({});
    setError(null);
    onClose();
  };

  const handleManifestFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    setRequirements(null);
    setAssetFiles({});
    setError(null);
    try {
      if (!isManifestJsonSizeAllowed(file.size)) {
        throw new Error(t('manifestJsonTooLarge', { maxSize: formatBytes(MANIFEST_IMPORT_MAX_JSON_BYTES) }));
      }
      const content: unknown = JSON.parse(await file.text());
      setRequirements(getManifestImportRequirements(content));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('invalidProjectFile'));
    } finally {
      input.value = '';
    }
  };

  const handleAssetFile = (asset: ManifestImportRequirements['requiredAssets'][number], event: ChangeEvent<HTMLInputElement>) => {
    const assetId = asset.id;
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    try {
      if (!file.name.toLowerCase().endsWith('.glb')) {
        throw new Error(t('manifestAssetMustBeGlb'));
      }
      const expectedFileName = asset.path.split('/').pop();
      if (expectedFileName && file.name.toLowerCase() !== expectedFileName.toLowerCase()) {
        throw new Error(t('manifestAssetNameMismatch', { expected: expectedFileName }));
      }
      if (!isManifestAssetSizeAllowed(file.size)) {
        throw new Error(t('manifestAssetTooLarge', { maxSize: formatBytes(MANIFEST_IMPORT_MAX_ASSET_BYTES) }));
      }
      const otherBytes = Object.entries(assetFiles)
        .filter(([selectedAssetId]) => selectedAssetId !== assetId)
        .reduce((total, [, selectedFile]) => total + selectedFile.size, 0);
      if (!isManifestAggregateSizeAllowed(otherBytes + file.size)) {
        throw new Error(t('manifestAggregateTooLarge', { maxSize: formatBytes(MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES) }));
      }
      setAssetFiles((current) => ({ ...current, [assetId]: file }));
      setError(null);
    } catch (cause) {
      setAssetFiles((current) => {
        const next = { ...current };
        delete next[assetId];
        return next;
      });
      setError(cause instanceof Error ? cause.message : t('invalidProjectFile'));
    } finally {
      input.value = '';
    }
  };

  const handleImport = async () => {
    if (!requirements || !canImport) return;
    setIsImporting(true);
    setError(null);
    try {
      const assetBytes: Record<string, ArrayBuffer> = {};
      for (const asset of requirements.requiredAssets) {
        const file = assetFiles[asset.id];
        if (!file) throw new Error(t('manifestChooseGlb'));
        if (!isManifestAssetSizeAllowed(file.size)) {
          throw new Error(t('manifestAssetTooLarge', { maxSize: formatBytes(MANIFEST_IMPORT_MAX_ASSET_BYTES) }));
        }
        assetBytes[asset.id] = await file.arrayBuffer();
      }

      const totalBytes = Object.values(assetFiles).reduce((total, file) => total + file.size, 0);
      if (!isManifestAggregateSizeAllowed(totalBytes)) {
        throw new Error(t('manifestAggregateTooLarge', { maxSize: formatBytes(MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES) }));
      }

      const manifestForImport = { ...requirements.manifest, id: `import-${uid()}` };
      const compiled = compileManifestImport(manifestForImport, {
        createdAt: Date.now(),
        maxAssetBytes: MANIFEST_IMPORT_MAX_ASSET_BYTES,
        maxTotalAssetBytes: MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES,
        assetBytes,
      });
      await saveCompiledManifestImport(compiled);
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('invalidProjectFile'));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <button
        type="button"
        aria-label={t('manifestCancel')}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={close}
        disabled={isImporting}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="manifest-import-title"
        className="relative panel w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-scale-in"
      >
        <div className="flex items-start justify-between gap-4 mb-2">
          <div>
            <h2 id="manifest-import-title" className="text-lg font-semibold">{t('manifestImportTitle')}</h2>
            <p className="text-sm text-ink-300 mt-1">{t('manifestImportDescription')}</p>
          </div>
          <button type="button" className="icon-btn" onClick={close} disabled={isImporting} aria-label={t('manifestCancel')}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-5">
          <label className="block text-sm font-medium mb-2" htmlFor="manifest-json-file">{t('manifestSelectJson')}</label>
          <label className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-ink-500 hover:border-accent-violet cursor-pointer">
            <FileUp className="w-5 h-5 text-accent-violet shrink-0" />
            <span className="text-sm">{requirements ? requirements.manifest.project.title : t('manifestNoManifest')}</span>
            <input
              id="manifest-json-file"
              type="file"
              accept=".json,application/json"
              className="sr-only"
              onChange={handleManifestFile}
              disabled={isImporting}
            />
          </label>
          <p className="text-xs text-ink-400 mt-2">
            {t('manifestJsonLimit', { maxSize: formatBytes(MANIFEST_IMPORT_MAX_JSON_BYTES) })}
          </p>
        </div>

        {requirements && (
          <div className="mt-5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h3 className="text-sm font-semibold">{t('manifestRequiredAssets')}</h3>
              <span className="text-xs text-ink-400 tabular-nums">
                {formatBytes(selectedBytes)} / {formatBytes(MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES)}
              </span>
            </div>
            <p className="text-xs text-ink-400 mb-3">
              {t('manifestAssetLimits', {
                maxAsset: formatBytes(MANIFEST_IMPORT_MAX_ASSET_BYTES),
                maxTotal: formatBytes(MANIFEST_IMPORT_MAX_TOTAL_ASSET_BYTES),
              })}
            </p>

            {unsupportedReasons.length > 0 && (
              <div role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 mb-3">
                <div className="flex items-center gap-2 text-sm font-medium text-amber-200 mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  {t('manifestUnsupportedFeatures')}
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-amber-100">
                  {unsupportedReasons.map((issue) => <li key={`${issue.code}:${'sceneTitle' in issue ? issue.sceneTitle : 'assetId' in issue ? issue.assetId : 'objectId' in issue ? issue.objectId : ''}`}>{describeUnsupported(issue)}</li>)}
                </ul>
              </div>
            )}

            {requirements.requiredAssets.length === 0 ? (
              <p className="text-sm text-ink-400">{t('manifestNoRequiredAssets')}</p>
            ) : (
              <div className="space-y-3">
                {requirements.requiredAssets.map((asset) => {
                  const selected = assetFiles[asset.id];
                  return (
                    <div key={asset.id} className="rounded-lg bg-ink-800/70 p-3">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{asset.path}</p>
                          <p className="text-xs text-ink-400">{t('manifestAssetId')}: {asset.id}</p>
                        </div>
                        {selected && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                      </div>
                      <label className="flex items-center gap-2 text-xs text-accent-violet cursor-pointer">
                        <Upload className="w-4 h-4" />
                        <span>{selected ? `${selected.name} · ${formatBytes(selected.size)}` : t('manifestChooseGlb')}</span>
                        <input
                          type="file"
                          accept=".glb,model/gltf-binary"
                          className="sr-only"
                          onChange={(event) => handleAssetFile(asset, event)}
                          disabled={isImporting || unsupportedReasons.length > 0}
                        />
                      </label>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && <p role="alert" className="text-sm text-red-400 mt-4">{error}</p>}

        <div className="flex items-center justify-end gap-2 mt-6">
          <button type="button" className="btn-ghost" onClick={close} disabled={isImporting}>{t('manifestCancel')}</button>
          <button type="button" className="btn-primary" onClick={handleImport} disabled={!canImport}>
            <Upload className="w-4 h-4" />
            {isImporting ? t('manifestImporting') : t('manifestImportAction')}
          </button>
        </div>
      </section>
    </div>
  );
}
