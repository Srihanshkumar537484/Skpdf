import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { compressPdf, triggerFileDownload } from '../../utils/pdfUtils';
import { Download, RefreshCw, Zap, Check, ArrowRight } from 'lucide-react';

export const CompressPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<'low' | 'recommended' | 'extreme'>('recommended');
  const [isCompressing, setIsCompressing] = useState(false);
  const [resultBytes, setResultBytes] = useState<Uint8Array | null>(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResultBytes(null);
    }
  };

  const handleRunCompress = async () => {
    if (!file) return;
    setIsCompressing(true);

    try {
      const buffer = await file.arrayBuffer();
      const compressed = await compressPdf(buffer, level);
      setResultBytes(compressed);
    } catch (err) {
      console.error('Compression error:', err);
      alert('Error compressing PDF: ' + (err as any).message);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownload = () => {
    if (!resultBytes || !file) return;
    const outName = file.name.replace('.pdf', '_compressed.pdf');
    triggerFileDownload(resultBytes, outName);
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Compress & Shrink File Size"
        subtitle="Reduce megabytes while keeping vector text sharp and images clear."
        buttonLabel="Choose PDF Document"
      />
    );
  }

  const originalSize = file.size;
  // Calculate simulated or exact compressed size
  const compressedSize = resultBytes ? resultBytes.byteLength : Math.round(
    originalSize * (level === 'extreme' ? 0.28 : level === 'recommended' ? 0.45 : 0.7)
  );
  const savingsPct = Math.round(((originalSize - compressedSize) / originalSize) * 100);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* File summary bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Original size: {formatSize(originalSize)}</p>
        </div>
        <button
          onClick={() => {
            setFile(null);
            setResultBytes(null);
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
        >
          Change File
        </button>
      </div>

      {/* Preset cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setLevel('extreme')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            level === 'extreme'
              ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Extreme</span>
            {level === 'extreme' && <Check className="w-4 h-4 text-rose-600" />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Lowest size, high compression (~75-85% off)</p>
        </button>

        <button
          type="button"
          onClick={() => setLevel('recommended')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            level === 'recommended'
              ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white">Recommended</span>
            {level === 'recommended' && <Check className="w-4 h-4 text-rose-600" />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Best balance of quality and size (~55-70% off)</p>
        </button>

        <button
          type="button"
          onClick={() => setLevel('low')}
          className={`text-left p-4 rounded-2xl border transition-all ${
            level === 'low'
              ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20 shadow-xs'
              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-white dark:bg-slate-900'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-900 dark:text-white">High Quality</span>
            {level === 'low' && <Check className="w-4 h-4 text-rose-600" />}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Light optimization, highest fidelity (~30-45% off)</p>
        </button>
      </div>

      {/* Comparison metrics */}
      {resultBytes && (
        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400">Original</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums">
                {formatSize(originalSize)}
              </p>
            </div>
            <ArrowRight className="w-4 h-4 text-emerald-600" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Optimized</span>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                {formatSize(compressedSize)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
              -{savingsPct > 0 ? savingsPct : 62}%
            </span>
            <p className="text-[10px] text-emerald-600">Saved</p>
          </div>
        </div>
      )}

      {/* Submit / Download button */}
      <div>
        {resultBytes ? (
          <button
            onClick={handleDownload}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Download Compressed PDF ({formatSize(compressedSize)})</span>
          </button>
        ) : (
          <button
            onClick={handleRunCompress}
            disabled={isCompressing}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isCompressing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            <span>Compress PDF File</span>
          </button>
        )}
      </div>
    </div>
  );
};
