import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { imagesToPdf, triggerFileDownload } from '../../utils/pdfUtils';
import { ArrowUp, ArrowDown, Trash2, Download, RefreshCw, Plus, Image } from 'lucide-react';

interface ImageItem {
  id: string;
  name: string;
  dataUrl: string;
}

export const ImagesToPdfTool: React.FC = () => {
  const [items, setItems] = useState<ImageItem[]>([]);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('auto');
  const [margin, setMargin] = useState<number>(20);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleFilesAdded = async (files: File[]) => {
    const newItems: ImageItem[] = [];
    for (const f of files) {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve) => {
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(f);
      });

      newItems.push({
        id: `${f.name}_${Date.now()}_${Math.random()}`,
        name: f.name,
        dataUrl
      });
    }
    setItems((prev) => [...prev, ...newItems]);
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= items.length) return;
    const newArr = [...items];
    const temp = newArr[index];
    newArr[index] = newArr[target];
    newArr[target] = temp;
    setItems(newArr);
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleGeneratePdf = async () => {
    if (items.length === 0) return;
    setIsGenerating(true);

    try {
      const pdfBytes = await imagesToPdf(items, { margin, orientation });
      triggerFileDownload(pdfBytes, 'SkPDF_images.pdf');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error creating PDF: ' + (err as any).message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (items.length === 0) {
    return (
      <Dropzone
        acceptedTypes="image/*"
        multiple={true}
        onFilesSelected={handleFilesAdded}
        title="Upload Images (JPG, PNG, WebP) to Convert to PDF"
        subtitle="Combine smartphone photos, receipts, or scans into a single organized PDF document."
        buttonLabel="Select Images"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Settings bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div>
            <label className="text-slate-500 block mb-1">Orientation:</label>
            <select
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as any)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
            >
              <option value="auto">Auto (Match Image)</option>
              <option value="portrait">Portrait</option>
              <option value="landscape">Landscape</option>
            </select>
          </div>

          <div>
            <label className="text-slate-500 block mb-1">Margins:</label>
            <select
              value={margin}
              onChange={(e) => setMargin(parseInt(e.target.value, 10))}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-200"
            >
              <option value="0">None (Full bleed)</option>
              <option value="20">Small (20px)</option>
              <option value="40">Standard (40px)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl transition-colors">
            <Plus className="w-3.5 h-3.5 text-rose-600" />
            <span>Add More</span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) handleFilesAdded(Array.from(e.target.files));
              }}
            />
          </label>

          <button
            onClick={handleGeneratePdf}
            disabled={isGenerating}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Generate PDF Document</span>
          </button>
        </div>
      </div>

      {/* Reorderable image cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-slate-900 shadow-2xs group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between mb-1 px-1">
              <span className="text-[10px] font-mono text-slate-400">#{index + 1}</span>
              <button
                onClick={() => removeItem(item.id)}
                className="text-slate-400 hover:text-red-600"
                title="Remove"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="h-28 flex items-center justify-center overflow-hidden rounded bg-slate-50 dark:bg-slate-950 p-1">
              <img src={item.dataUrl} alt={item.name} className="max-h-full max-w-full object-contain" />
            </div>

            <div className="mt-2 pt-1 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                disabled={index === 0}
                onClick={() => moveItem(index, 'up')}
                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] text-slate-400 truncate max-w-[60px]">{item.name}</span>
              <button
                disabled={index === items.length - 1}
                onClick={() => moveItem(index, 'down')}
                className="p-1 text-slate-400 hover:text-slate-800 disabled:opacity-20"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
