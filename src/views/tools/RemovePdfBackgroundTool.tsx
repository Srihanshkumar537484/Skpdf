import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { applyPdfPageBackground, getPdfPageCount, triggerFileDownload } from '../../utils/pdfUtils';
import { Paintbrush, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

export const RemovePdfBackgroundTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [bgColor, setBgColor] = useState<string>('#ffffff');
  const [targetScope, setTargetScope] = useState<'all' | 'first' | 'custom'>('all');
  const [customRange, setCustomRange] = useState<string>('1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsSuccess(false);

    try {
      const buffer = await f.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setTotalPages(count);
    } catch (err) {
      console.error('Error reading PDF:', err);
    }
  };

  const handleApply = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();
      let pagesToApply: 'all' | 'first' | number[] = 'all';

      if (targetScope === 'first') {
        pagesToApply = 'first';
      } else if (targetScope === 'custom') {
        const parsed = customRange
          .split(',')
          .map((n) => parseInt(n.trim(), 10) - 1)
          .filter((n) => !isNaN(n) && n >= 0 && n < totalPages);
        pagesToApply = parsed;
      }

      const updatedBytes = await applyPdfPageBackground(buffer, bgColor, pagesToApply);
      const outName = file.name.replace('.pdf', '_bg_modified.pdf');
      triggerFileDownload(updatedBytes, outName);
      setIsSuccess(true);
    } catch (err) {
      console.error('Background modification error:', err);
      alert('Error updating background: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Change Page Background Color"
        subtitle="Apply crisp white tint, modern ivory, warm sepia, or brand colors to pages."
        buttonLabel="Choose PDF File"
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{totalPages} pages total</p>
        </div>
        <button
          onClick={() => {
            setFile(null);
            setIsSuccess(false);
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
        >
          Change File
        </button>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
            Select Background Color:
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {[
              { label: 'Clean White', color: '#ffffff' },
              { label: 'Soft Ivory', color: '#fffbeb' },
              { label: 'Cool Slate', color: '#f8fafc' },
              { label: 'Warm Sepia', color: '#fef3c7' },
              { label: 'Night Slate', color: '#1e293b' }
            ].map((preset) => (
              <button
                key={preset.color}
                onClick={() => setBgColor(preset.color)}
                className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all ${
                  bgColor.toLowerCase() === preset.color.toLowerCase()
                    ? 'border-rose-600 ring-2 ring-rose-500/20'
                    : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full border border-slate-300"
                  style={{ backgroundColor: preset.color }}
                />
                <span>{preset.label}</span>
              </button>
            ))}

            <div className="flex items-center gap-1.5 ml-auto">
              <span className="text-xs text-slate-500">Custom:</span>
              <input
                type="color"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-2">
            Target Pages:
          </label>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => setTargetScope('all')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                targetScope === 'all'
                  ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/20 text-rose-600 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              All Pages
            </button>
            <button
              onClick={() => setTargetScope('first')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                targetScope === 'first'
                  ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/20 text-rose-600 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              First Page Only
            </button>
            <button
              onClick={() => setTargetScope('custom')}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                targetScope === 'custom'
                  ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/20 text-rose-600 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              Custom Pages
            </button>
          </div>

          {targetScope === 'custom' && (
            <div className="mt-3">
              <input
                type="text"
                value={customRange}
                onChange={(e) => setCustomRange(e.target.value)}
                placeholder="e.g. 1, 3, 5"
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              />
            </div>
          )}
        </div>

        {isSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Background updated and downloaded!</span>
          </div>
        )}

        <button
          onClick={handleApply}
          disabled={isProcessing}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Paintbrush className="w-4 h-4" />}
          <span>Apply Background & Download</span>
        </button>
      </div>
    </div>
  );
};
