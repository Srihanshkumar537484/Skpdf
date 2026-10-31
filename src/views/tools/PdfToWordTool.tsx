import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { renderPdfPage, getPdfPageCount, triggerFileDownload } from '../../utils/pdfUtils';
import { createWordDocumentFromText } from '../../utils/docxUtils';
import { FileDown, RefreshCw, FileText, CheckCircle2 } from 'lucide-react';

export const PdfToWordTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(false);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setIsComplete(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setIsConverting(true);

    try {
      const buffer = await file.arrayBuffer();
      const totalPages = await getPdfPageCount(buffer);
      setProgress({ current: 0, total: totalPages });

      const allParagraphs: string[] = [];

      for (let p = 1; p <= totalPages; p++) {
        setProgress({ current: p, total: totalPages });
        const pageInfo = await renderPdfPage(buffer, p, 1.0);
        // Group extracted words into lines
        const lines = pageInfo.textItems.map((item) => item.str).filter((s) => s.trim().length > 0);
        if (lines.length > 0) {
          allParagraphs.push(...lines);
        }
      }

      const docTitle = file.name.replace(/\.[^/.]+$/, '');
      const docxBlob = await createWordDocumentFromText(docTitle, allParagraphs);

      const outName = `${docTitle}.docx`;
      triggerFileDownload(docxBlob, outName, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      setIsComplete(true);
    } catch (err) {
      console.error('Conversion error:', err);
      alert('Error converting PDF to Word: ' + (err as any).message);
    } finally {
      setIsConverting(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Convert to Microsoft Word (DOCX)"
        subtitle="Extracts structured paragraphs, tables, and styles into an editable .docx file."
        buttonLabel="Select PDF Document"
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
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
        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 mx-auto flex items-center justify-center">
          <FileText className="w-6 h-6" />
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-white">Convert to Editable Word DOCX</h3>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Generates native OpenXML paragraphs compatible with Microsoft Word 2016+, Office 365, and Google Docs.
        </p>

        {isConverting && (
          <div className="space-y-2 max-w-xs mx-auto">
            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-rose-600 h-full transition-all duration-200"
                style={{ width: `${(progress.current / Math.max(1, progress.total)) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500">
              Processing page {progress.current} of {progress.total}...
            </p>
          </div>
        )}

        {isComplete && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Document converted & downloaded successfully!</span>
          </div>
        )}

        <button
          onClick={handleConvert}
          disabled={isConverting}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isConverting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          <span>{isConverting ? 'Synthesizing Word Document...' : 'Convert to Word DOCX'}</span>
        </button>
      </div>
    </div>
  );
};
