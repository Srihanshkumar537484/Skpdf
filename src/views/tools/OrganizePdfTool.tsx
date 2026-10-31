import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { organizePdfPages, getPdfPageCount, triggerFileDownload, renderPdfPage } from '../../utils/pdfUtils';
import { RotateCw, Trash2, ArrowLeft, ArrowRight, Download, RefreshCw, Copy } from 'lucide-react';

interface PageCard {
  id: string;
  originalIndex: number;
  rotation: number;
  previewUrl: string;
}

export const OrganizePdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [pages, setPages] = useState<PageCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsLoading(true);

    try {
      const buffer = await f.arrayBuffer();
      setPdfBytes(buffer);
      const count = await getPdfPageCount(buffer);

      const loadedPages: PageCard[] = [];
      for (let p = 1; p <= count; p++) {
        const info = await renderPdfPage(buffer, p, 0.4);
        loadedPages.push({
          id: `page_${p}_${Date.now()}`,
          originalIndex: p - 1,
          rotation: 0,
          previewUrl: info.canvas.toDataURL('image/jpeg', 0.8)
        });
      }
      setPages(loadedPages);
    } catch (err) {
      console.error('Error organizing PDF:', err);
      alert('Error loading PDF: ' + (err as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  const rotatePage = (index: number) => {
    setPages((prev) =>
      prev.map((p, i) => (i === index ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  const deletePage = (index: number) => {
    if (pages.length <= 1) {
      alert('A PDF must contain at least 1 page.');
      return;
    }
    setPages((prev) => prev.filter((_, i) => i !== index));
  };

  const duplicatePage = (index: number) => {
    const pageToDup = pages[index];
    const newPage: PageCard = {
      ...pageToDup,
      id: `dup_${Date.now()}_${Math.random()}`
    };
    const newPages = [...pages];
    newPages.splice(index + 1, 0, newPage);
    setPages(newPages);
  };

  const movePage = (index: number, direction: 'left' | 'right') => {
    const target = direction === 'left' ? index - 1 : index + 1;
    if (target < 0 || target >= pages.length) return;
    const newArr = [...pages];
    const temp = newArr[index];
    newArr[index] = newArr[target];
    newArr[target] = temp;
    setPages(newArr);
  };

  const handleSave = async () => {
    if (!pdfBytes || pages.length === 0) return;
    setIsSaving(true);

    try {
      const order = pages.map((p) => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation
      }));
      const updatedPdf = await organizePdfPages(pdfBytes, order);
      const outName = file ? file.name.replace('.pdf', '_organized.pdf') : 'SkPDF_organized.pdf';
      triggerFileDownload(updatedPdf, outName);
    } catch (err) {
      console.error('Failed to save organized PDF:', err);
      alert('Error saving PDF: ' + (err as any).message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Organize, Rotate & Rearrange Pages"
        subtitle="Visual drag-and-drop page manager: rotate 90°, delete, duplicate, and reorder sheets."
        buttonLabel="Select PDF File"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">{pages.length} pages total</span>
          <span className="mx-2">·</span>
          <span>Click arrows or rotate buttons to modify pages</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })));
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate All 90°</span>
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Save Organized PDF</span>
          </button>
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
          <span>Generating visual page previews...</span>
        </div>
      )}

      {/* Pages Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {pages.map((page, index) => (
          <div
            key={page.id}
            className="border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-slate-900 shadow-2xs hover:shadow-md transition-shadow group flex flex-col justify-between"
          >
            {/* Header info & delete */}
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
                #{index + 1}
              </span>
              <button
                onClick={() => deletePage(index)}
                className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                title="Delete Page"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Thumbnail with rotation */}
            <div className="overflow-hidden rounded-lg bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 min-h-[140px]">
              <img
                src={page.previewUrl}
                alt={`Page ${index + 1}`}
                style={{
                  transform: `rotate(${page.rotation}deg)`,
                  transition: 'transform 0.2s ease-in-out'
                }}
                className="max-h-[120px] w-auto shadow-xs"
              />
            </div>

            {/* Action buttons */}
            <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={index === 0}
                onClick={() => movePage(index, 'left')}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                title="Move Left"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => rotatePage(index)}
                className="p-1 text-slate-600 dark:text-slate-300 hover:text-rose-600"
                title="Rotate 90°"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => duplicatePage(index)}
                className="p-1 text-slate-600 dark:text-slate-300 hover:text-rose-600"
                title="Duplicate Page"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                disabled={index === pages.length - 1}
                onClick={() => movePage(index, 'right')}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white disabled:opacity-20"
                title="Move Right"
              >
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
