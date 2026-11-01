import React, { useState, useMemo } from 'react';
import {
  detectFileFormat,
  getCompatibleTargets,
  FileFormat,
  SUPPORTED_FORMATS
} from '../services/conversionRegistry';
import {
  executeUniversalConversion,
  bundleResultsIntoZip,
  ConversionResult,
  ConversionOptions
} from '../services/universalConverter';
import { triggerFileDownload } from '../utils/pdfUtils';
import { trackToolUsage, trackDownload } from '../utils/analytics';
import {
  Upload,
  ArrowRight,
  FileCheck,
  RefreshCw,
  Download,
  Archive,
  Layers,
  Settings,
  AlertCircle,
  FileText,
  Sliders,
  CheckCircle2,
  Trash2,
  Table,
  Eye
} from 'lucide-react';

interface BatchItem {
  id: string;
  file: File;
  sourceFormat: FileFormat | null;
  targetFormat: string;
  status: 'idle' | 'converting' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: ConversionResult;
}

export const UniversalConverterView: React.FC<{ onNavigate: (path: string) => void }> = ({ onNavigate }) => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [globalTarget, setGlobalTarget] = useState<string>('');
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [activePreviewItem, setActivePreviewItem] = useState<BatchItem | null>(null);

  // Conversion settings
  const [options, setOptions] = useState<ConversionOptions>({
    imageQuality: 0.92,
    csvDelimiter: ',',
    pdfPageSize: 'A4'
  });
  const [showOptions, setShowOptions] = useState(false);

  // Handle file drop/upload
  const handleFiles = (fileList: FileList | File[]) => {
    const newItems: BatchItem[] = [];
    const filesArray = Array.from(fileList);

    for (const f of filesArray) {
      const detected = detectFileFormat(f);
      const compatible = detected ? getCompatibleTargets(detected.ext) : [];
      const defaultTarget = compatible.length > 0 ? compatible[0].ext : '';

      newItems.push({
        id: Math.random().toString(36).substring(2, 9),
        file: f,
        sourceFormat: detected,
        targetFormat: defaultTarget,
        status: 'idle',
        progress: 0
      });
    }

    setItems((prev) => [...prev, ...newItems]);
  };

  // Available common targets if all items share same format
  const commonTargets = useMemo(() => {
    if (items.length === 0) return [];
    const firstItem = items[0];
    if (!firstItem.sourceFormat) return [];
    return getCompatibleTargets(firstItem.sourceFormat.ext);
  }, [items]);

  // Apply target to all items
  const handleApplyGlobalTarget = (target: string) => {
    setGlobalTarget(target);
    setItems((prev) =>
      prev.map((it) => {
        const comp = it.sourceFormat ? getCompatibleTargets(it.sourceFormat.ext) : [];
        if (comp.some((c) => c.ext === target)) {
          return { ...it, targetFormat: target };
        }
        return it;
      })
    );
  };

  // Convert single item
  const convertSingleItem = async (item: BatchItem): Promise<ConversionResult | null> => {
    if (!item.targetFormat) return null;

    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, status: 'converting', progress: 30 } : i))
    );

    try {
      const res = await executeUniversalConversion(item.file, item.targetFormat, options);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'success', progress: 100, result: res } : i
        )
      );

      trackToolUsage('universal-converter', 'success');
      return res;
    } catch (err: any) {
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, status: 'error', progress: 0, error: err.message || 'Conversion failed' } : i
        )
      );
      return null;
    }
  };

  // Convert all items
  const handleConvertAll = async () => {
    setIsProcessingAll(true);
    for (const item of items) {
      if (item.status !== 'success') {
        await convertSingleItem(item);
      }
    }
    setIsProcessingAll(false);
  };

  // Download all as ZIP
  const handleDownloadAllZip = async () => {
    const successful = items.filter((i) => i.status === 'success' && i.result).map((i) => i.result!);
    if (successful.length === 0) return;

    const zipBlob = await bundleResultsIntoZip(successful, 'skpdf_converted_bundle.zip');
    triggerFileDownload(zipBlob, 'skpdf_converted_bundle.zip', 'application/zip');
    trackDownload('skpdf_converted_bundle.zip', 'application/zip');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Introduction */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
          <span>⚡ Client-Side WebAssembly Engine</span>
          <span className="text-slate-400">•</span>
          <span>100% Free & Private</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          Universal File Converter
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300">
          Convert Images, Spreadsheets, Microsoft Word, PowerPoint, Text, and Data files instantly.
          Files stay in your browser with zero cloud storage.
        </p>
      </div>

      {/* Main Upload Dropzone */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 dark:hover:border-rose-500 rounded-3xl p-8 sm:p-12 text-center bg-white dark:bg-slate-900/60 transition-colors shadow-sm"
      >
        <input
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          title="Drop files or browse"
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500/10 to-amber-500/10 dark:from-rose-500/20 dark:to-amber-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-inner">
            <Upload className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              Drop files here, or <span className="text-rose-600 dark:text-rose-400 underline underline-offset-4">browse</span>
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Supports Images (JPG, PNG, WebP, BMP, SVG, ICO), Spreadsheets (XLSX, CSV, TSV), Documents (DOCX, PDF, TXT, MD), PPTX, JSON & XML
            </p>
          </div>
        </div>
      </div>

      {/* Quick Category Directory Link */}
      <div className="flex items-center justify-between p-4 bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <Layers className="w-5 h-5 text-rose-600 shrink-0" />
          <div>
            <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
              Looking for a specific conversion pair?
            </p>
            <p className="text-xs text-slate-500">
              Browse our full catalog of 40+ verified client-side conversion pairs.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('/all-conversions')}
          className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline shrink-0 whitespace-nowrap"
        >
          View Full Directory →
        </button>
      </div>

      {/* Batch Processing Table */}
      {items.length > 0 && (
        <div className="space-y-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
          {/* Header Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Queue ({items.length} {items.length === 1 ? 'file' : 'files'})
              </span>
              <button
                onClick={() => setItems([])}
                className="text-xs text-slate-500 hover:text-rose-600 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>

            {/* Global Settings & Target Quick-Pick */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setShowOptions(!showOptions)}
                className={`p-2 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                  showOptions
                    ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 text-rose-600'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                }`}
                title="Conversion settings"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Options</span>
              </button>

              {commonTargets.length > 0 && (
                <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                  <span className="text-slate-500 pl-2">Convert all to:</span>
                  <select
                    value={globalTarget}
                    onChange={(e) => handleApplyGlobalTarget(e.target.value)}
                    className="bg-transparent font-semibold text-rose-600 dark:text-rose-400 focus:outline-none pr-2 cursor-pointer"
                  >
                    <option value="">Select target...</option>
                    {commonTargets.map((t) => (
                      <option key={t.ext} value={t.ext} className="text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900">
                        {t.ext.toUpperCase()} – {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleConvertAll}
                disabled={isProcessingAll}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                {isProcessingAll ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileCheck className="w-3.5 h-3.5" />}
                <span>{isProcessingAll ? 'Converting...' : 'Convert All'}</span>
              </button>

              {items.some((i) => i.status === 'success') && (
                <button
                  onClick={handleDownloadAllZip}
                  className="px-4 py-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>Download All (ZIP)</span>
                </button>
              )}
            </div>
          </div>

          {/* Options Drawer */}
          {showOptions && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Image Quality: {Math.round((options.imageQuality || 0.92) * 100)}%
                </label>
                <input
                  type="range"
                  min="0.4"
                  max="1.0"
                  step="0.05"
                  value={options.imageQuality || 0.92}
                  onChange={(e) => setOptions({ ...options, imageQuality: parseFloat(e.target.value) })}
                  className="w-full accent-rose-600"
                />
                <p className="text-[11px] text-slate-500 mt-1">Applies to JPG and WebP conversions.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  CSV Separator:
                </label>
                <select
                  value={options.csvDelimiter || ','}
                  onChange={(e) => setOptions({ ...options, csvDelimiter: e.target.value })}
                  className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200"
                >
                  <option value=",">Comma (,)</option>
                  <option value=";">Semicolon (;)</option>
                  <option value="&#9;">Tab (\t)</option>
                  <option value="|">Pipe (|)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Used when converting spreadsheets to CSV.</p>
              </div>
            </div>
          )}

          {/* Item Rows */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => {
              const compatible = item.sourceFormat ? getCompatibleTargets(item.sourceFormat.ext) : [];

              return (
                <div key={item.id} className="py-3 flex flex-wrap items-center justify-between gap-4">
                  {/* Left: File info */}
                  <div className="flex items-center gap-3 min-w-0 max-w-xs sm:max-w-md">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {item.file.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-500">
                          {(item.file.size / 1024).toFixed(1)} KB
                        </span>
                        {item.sourceFormat ? (
                          <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {item.sourceFormat.ext}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                            Unrecognized format
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Middle: Target selection */}
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                    {compatible.length > 0 ? (
                      <select
                        value={item.targetFormat}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItems((prev) =>
                            prev.map((i) => (i.id === item.id ? { ...i, targetFormat: val } : i))
                          );
                        }}
                        className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
                      >
                        {compatible.map((c) => (
                          <option key={c.ext} value={c.ext}>
                            {c.ext.toUpperCase()} ({c.name})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs text-slate-400">No genuine target</span>
                    )}
                  </div>

                  {/* Right: Actions & Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {item.status === 'idle' && (
                      <button
                        onClick={() => convertSingleItem(item)}
                        disabled={!item.targetFormat}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        Convert
                      </button>
                    )}

                    {item.status === 'converting' && (
                      <div className="flex items-center gap-2 text-rose-600 text-xs font-medium">
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Converting...</span>
                      </div>
                    )}

                    {item.status === 'success' && item.result && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-600 flex items-center gap-1 text-xs font-semibold mr-1">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Done</span>
                        </span>

                        {(item.result.previewUrl || item.result.textPreview || item.result.tableData) && (
                          <button
                            onClick={() => setActivePreviewItem(item)}
                            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-100 dark:bg-slate-800 rounded-lg text-xs"
                            title="Preview converted file"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (item.result) {
                              triggerFileDownload(item.result.blob, item.result.fileName, item.result.mimeType);
                              trackDownload(item.result.fileName, item.result.mimeType);
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download</span>
                        </button>
                      </div>
                    )}

                    {item.status === 'error' && (
                      <span className="text-rose-600 text-xs flex items-center gap-1" title={item.error}>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed</span>
                      </span>
                    )}

                    <button
                      onClick={() => setItems((prev) => prev.filter((i) => i.id !== item.id))}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Visual Preview Modal */}
      {activePreviewItem && activePreviewItem.result && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Preview: {activePreviewItem.result.fileName}
                </h3>
                <p className="text-xs text-slate-500">
                  Size: {(activePreviewItem.result.blob.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <button
                onClick={() => setActivePreviewItem(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-white px-2 py-1 rounded"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {activePreviewItem.result.previewUrl ? (
                <div className="flex justify-center bg-slate-100 dark:bg-slate-950 p-4 rounded-xl">
                  <img
                    src={activePreviewItem.result.previewUrl}
                    alt="Converted output"
                    className="max-h-80 object-contain rounded-lg shadow-sm"
                  />
                </div>
              ) : activePreviewItem.result.tableData ? (
                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-xs text-left">
                    <tbody>
                      {activePreviewItem.result.tableData.map((row, rIdx) => (
                        <tr
                          key={rIdx}
                          className={rIdx === 0 ? 'bg-slate-100 dark:bg-slate-800 font-bold' : 'border-t border-slate-200 dark:border-slate-800'}
                        >
                          {row.map((cell, cIdx) => (
                            <td key={cIdx} className="p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0">
                              {String(cell ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <pre className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono text-slate-800 dark:text-slate-200 whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {activePreviewItem.result.textPreview || 'No text preview available.'}
                </pre>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2 bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => {
                  if (activePreviewItem.result) {
                    triggerFileDownload(
                      activePreviewItem.result.blob,
                      activePreviewItem.result.fileName,
                      activePreviewItem.result.mimeType
                    );
                    trackDownload(activePreviewItem.result.fileName, activePreviewItem.result.mimeType);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Converted File</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
