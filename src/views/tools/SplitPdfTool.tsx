import React, { useState, useEffect } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { extractPdfPages, getPdfPageCount, triggerFileDownload, renderPdfPage } from '../../utils/pdfUtils';
import JSZip from 'jszip';
import { Split, Download, RefreshCw, Layers } from 'lucide-react';

export const SplitPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [mode, setMode] = useState<'range' | 'all'>('range');
  const [rangeStr, setRangeStr] = useState<string>('1-2');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsProcessing(true);

    try {
      const buffer = await f.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      setTotalPages(count);
      setRangeStr(count > 1 ? `1-${Math.min(3, count)}` : '1');

      // Generate thumbnails for first 6 pages
      const thumbUrls: string[] = [];
      const renderCount = Math.min(count, 6);
      for (let p = 1; p <= renderCount; p++) {
        const info = await renderPdfPage(buffer, p, 0.4);
        thumbUrls.push(info.canvas.toDataURL('image/jpeg', 0.8));
      }
      setPreviews(thumbUrls);
    } catch (err) {
      console.error('Error loading PDF:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const parsePageNumbers = (str: string, max: number): number[] => {
    const pages = new Set<number>();
    const parts = str.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [start, end] = trimmed.split('-').map((n) => parseInt(n.trim(), 10));
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(max, end); i++) {
            pages.add(i);
          }
        }
      } else {
        const num = parseInt(trimmed, 10);
        if (!isNaN(num) && num >= 1 && num <= max) {
          pages.add(num);
        }
      }
    }

    return Array.from(pages).sort((a, b) => a - b);
  };

  const handleSplit = async () => {
    if (!file) return;
    setIsProcessing(true);

    try {
      const buffer = await file.arrayBuffer();

      if (mode === 'range') {
        const pageNumbers = parsePageNumbers(rangeStr, totalPages);
        if (pageNumbers.length === 0) {
          alert('Please enter valid page numbers within the document range (1 to ' + totalPages + ').');
          setIsProcessing(false);
          return;
        }

        const extractedBytes = await extractPdfPages(buffer, pageNumbers);
        const outName = file.name.replace('.pdf', `_pages_${rangeStr.replace(/[^0-9-]/g, '_')}.pdf`);
        triggerFileDownload(extractedBytes, outName);
      } else {
        // Split every page into separate individual PDF and package into ZIP
        const zip = new JSZip();
        for (let p = 1; p <= totalPages; p++) {
          const singlePageBytes = await extractPdfPages(buffer, [p]);
          zip.file(`Page_${p}.pdf`, singlePageBytes);
        }

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerFileDownload(zipBlob, file.name.replace('.pdf', '_all_pages.zip'), 'application/zip');
      }
    } catch (err) {
      console.error('Split error:', err);
      alert('Error splitting PDF: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Split or Extract Pages"
        subtitle="Extract custom page ranges or break entire PDF into separate single-page files."
        buttonLabel="Choose PDF Document"
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">Total {totalPages} pages available</p>
        </div>
        <button
          onClick={() => {
            setFile(null);
            setPreviews([]);
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
        >
          Change File
        </button>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setMode('range')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            mode === 'range'
              ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Extract Specific Ranges</h4>
          <p className="text-[11px] text-slate-500">Extract selected pages (e.g., 1-3, 5) into one PDF</p>
        </button>

        <button
          onClick={() => setMode('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            mode === 'all'
              ? 'border-rose-600 bg-rose-50/40 dark:bg-rose-950/20'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
          }`}
        >
          <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Split Every Page</h4>
          <p className="text-[11px] text-slate-500">Convert each page to a separate PDF in a ZIP</p>
        </button>
      </div>

      {mode === 'range' && (
        <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
          <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block">
            Enter Page Range (e.g. 1-2, 4, 7-9):
          </label>
          <input
            type="text"
            value={rangeStr}
            onChange={(e) => setRangeStr(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-rose-500"
            placeholder="1-3, 5"
          />
        </div>
      )}

      {/* Page Thumbnails preview */}
      {previews.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-slate-500 mb-2">Page Previews:</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {previews.map((url, idx) => (
              <div
                key={idx}
                className="border border-slate-200 dark:border-slate-700 rounded-lg p-1 bg-white text-center shadow-2xs"
              >
                <img src={url} alt={`Page ${idx + 1}`} className="w-full h-auto rounded" />
                <span className="text-[10px] text-slate-400 mt-1 block">Page {idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleSplit}
        disabled={isProcessing}
        className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
      >
        {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Split className="w-4 h-4" />}
        <span>{mode === 'range' ? 'Extract Selected Pages' : 'Split All Pages (ZIP)'}</span>
      </button>
    </div>
  );
};
