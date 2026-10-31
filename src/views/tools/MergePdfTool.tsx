import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { mergePdfs, getPdfPageCount, triggerFileDownload } from '../../utils/pdfUtils';
import { ArrowUp, ArrowDown, Trash2, FileText, Download, RefreshCw, Plus } from 'lucide-react';

interface PdfFileItem {
  id: string;
  file: File;
  pageCount: number;
  sizeFormatted: string;
}

export const MergePdfTool: React.FC = () => {
  const [items, setItems] = useState<PdfFileItem[]>([]);
  const [isMerging, setIsMerging] = useState(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleFilesAdded = async (newFiles: File[]) => {
    const newItems: PdfFileItem[] = [];
    for (const f of newFiles) {
      try {
        const buffer = await f.arrayBuffer();
        const pages = await getPdfPageCount(buffer);
        newItems.push({
          id: `${f.name}_${Date.now()}_${Math.random()}`,
          file: f,
          pageCount: pages,
          sizeFormatted: formatSize(f.size)
        });
      } catch (err) {
        console.error('Error reading PDF:', err);
      }
    }
    setItems((prev) => [...prev, ...newItems]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const newArr = [...items];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;
    setItems(newArr);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleMerge = async () => {
    if (items.length < 2) return;
    setIsMerging(true);

    try {
      const buffers: ArrayBuffer[] = [];
      for (const item of items) {
        buffers.push(await item.file.arrayBuffer());
      }
      const mergedBytes = await mergePdfs(buffers);
      triggerFileDownload(mergedBytes, 'SkPDF_merged.pdf');
    } catch (err) {
      console.error('Merge error:', err);
      alert('Error merging files: ' + (err as any).message);
    } finally {
      setIsMerging(false);
    }
  };

  if (items.length === 0) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        multiple={true}
        onFilesSelected={handleFilesAdded}
        title="Select 2 or more PDF files to Merge"
        subtitle="Drag & drop multiple files, reorder pages, and assemble into one cohesive document."
        buttonLabel="Select PDF Files"
      />
    );
  }

  const totalPagesSum = items.reduce((acc, curr) => acc + curr.pageCount, 0);

  return (
    <div className="space-y-6">
      {/* Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="text-xs text-slate-600 dark:text-slate-300">
          <span className="font-bold text-slate-900 dark:text-white">{items.length} files selected</span>
          <span className="mx-2">·</span>
          <span>Total {totalPagesSum} pages</span>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5 text-rose-600" />
            <span>Add More PDFs</span>
            <input
              type="file"
              accept=".pdf"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(Array.from(e.target.files));
              }}
            />
          </label>

          <button
            onClick={handleMerge}
            disabled={items.length < 2 || isMerging}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
          >
            {isMerging ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Merge PDFs Now</span>
          </button>
        </div>
      </div>

      {/* Reorderable List */}
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/60 text-rose-600 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                0{index + 1}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {item.file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.pageCount} pages · {item.sizeFormatted}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                disabled={index === 0}
                onClick={() => moveItem(index, 'up')}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Move Up"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
              <button
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 'down')}
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white disabled:opacity-30 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Move Down"
              >
                <ArrowDown className="w-4 h-4" />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors ml-2"
                title="Remove File"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
