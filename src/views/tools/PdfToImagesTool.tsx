import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { renderPdfPage, getPdfPageCount, triggerFileDownload } from '../../utils/pdfUtils';
import JSZip from 'jszip';
import { Image, Download, RefreshCw, FileArchive } from 'lucide-react';

interface ExtractedImagePage {
  pageNumber: number;
  dataUrl: string;
}

export const PdfToImagesTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [isProcessing, setIsProcessing] = useState(false);
  const [images, setImages] = useState<ExtractedImagePage[]>([]);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setImages([]);
    setIsProcessing(true);

    try {
      const buffer = await f.arrayBuffer();
      const count = await getPdfPageCount(buffer);
      const generated: ExtractedImagePage[] = [];

      for (let p = 1; p <= count; p++) {
        const info = await renderPdfPage(buffer, p, 1.5);
        generated.push({
          pageNumber: p,
          dataUrl: info.canvas.toDataURL(format, 0.9)
        });
      }
      setImages(generated);
    } catch (err) {
      console.error('Error extracting images:', err);
      alert('Error rendering PDF: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadSingle = (img: ExtractedImagePage) => {
    if (!file) return;
    const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';
    const link = document.createElement('a');
    link.href = img.dataUrl;
    link.download = `${file.name.replace('.pdf', '')}_page_${img.pageNumber}.${ext}`;
    link.click();
  };

  const handleDownloadZip = async () => {
    if (!file || images.length === 0) return;
    setIsProcessing(true);

    try {
      const zip = new JSZip();
      const ext = format === 'image/png' ? 'png' : format === 'image/webp' ? 'webp' : 'jpg';

      images.forEach((img) => {
        const base64Data = img.dataUrl.split(',')[1];
        zip.file(`Page_${img.pageNumber}.${ext}`, base64Data, { base64: true });
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      triggerFileDownload(zipBlob, `${file.name.replace('.pdf', '')}_images.zip`, 'application/zip');
    } catch (err) {
      console.error('Error generating ZIP:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Convert Pages to JPG / PNG Images"
        subtitle="Extract crisp high-resolution images page by page or download all in a ZIP file."
        buttonLabel="Select PDF Document"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{images.length} pages converted</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setFile(null);
              setImages([]);
            }}
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
          >
            Change File
          </button>

          <button
            onClick={handleDownloadZip}
            disabled={images.length === 0 || isProcessing}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileArchive className="w-4 h-4" />}
            <span>Download All Images (ZIP)</span>
          </button>
        </div>
      </div>

      {isProcessing && images.length === 0 && (
        <div className="p-12 text-center text-xs text-slate-500">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
          <span>Rendering high-resolution images...</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {images.map((img) => (
          <div
            key={img.pageNumber}
            className="border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-slate-900 shadow-2xs group flex flex-col justify-between"
          >
            <div className="overflow-hidden rounded-lg bg-slate-50 dark:bg-slate-950 p-2 flex items-center justify-center min-h-[140px]">
              <img src={img.dataUrl} alt={`Page ${img.pageNumber}`} className="max-h-[130px] w-auto shadow-2xs rounded" />
            </div>

            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-mono text-slate-500 text-[11px]">Page {img.pageNumber}</span>
              <button
                onClick={() => handleDownloadSingle(img)}
                className="flex items-center gap-1 text-rose-600 hover:text-rose-700 font-semibold text-[11px]"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
