import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { convertDocxToPdf } from '../../utils/docxUtils';
import { triggerFileDownload } from '../../utils/pdfUtils';
import { FileDown, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export const WordToPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setIsComplete(false);
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);

    try {
      const buffer = await file.arrayBuffer();
      const docTitle = file.name.replace(/\.[^/.]+$/, '');
      const pdfBytes = await convertDocxToPdf(buffer, docTitle);

      const outName = `${docTitle}.pdf`;
      triggerFileDownload(pdfBytes, outName);
      setIsComplete(true);
    } catch (err) {
      console.error('Word to PDF Error:', err);
      alert('Error converting Word document: ' + (err as any).message);
    } finally {
      setIsConverting(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".docx"
        onFilesSelected={handleFile}
        title="Upload Microsoft Word (DOCX) to Convert to PDF"
        subtitle="Preserves typography, line breaks, and page layouts into an ISO-standard PDF document."
        buttonLabel="Select Word Document"
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <button
          onClick={() => {
            setFile(null);
            setIsComplete(false);
          }}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
        >
          Change File
        </button>
      </div>

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-4">
        <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 mx-auto flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">Convert to Standard PDF</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Generates a clean, print-ready PDF ready for email sharing, legal verification, and document archives.
        </p>

        {isComplete && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>PDF created & downloaded successfully!</span>
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={isConverting}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isConverting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          <span>{isConverting ? 'Generating PDF Document...' : 'Convert to PDF Now'}</span>
        </button>
      </div>
    </div>
  );
};
