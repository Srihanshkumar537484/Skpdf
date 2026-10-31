import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { extractPdfMetadata, updatePdfMetadata, triggerFileDownload } from '../../utils/pdfUtils';
import { FileSearch, Trash2, Download, RefreshCw, CheckCircle2 } from 'lucide-react';

export const MetadataPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [producer, setProducer] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [pageCount, setPageCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleFile = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsSuccess(false);

    try {
      const buffer = await f.arrayBuffer();
      setPdfBytes(buffer);
      const meta = await extractPdfMetadata(buffer);
      setTitle(meta.title);
      setAuthor(meta.author);
      setSubject(meta.subject);
      setKeywords(meta.keywords);
      setProducer(meta.producer);
      setCreationDate(meta.creationDate);
      setPageCount(meta.pageCount);
    } catch (err) {
      console.error('Metadata read error:', err);
    }
  };

  const handleSave = async (clearAll = false) => {
    if (!pdfBytes) return;
    setIsProcessing(true);

    try {
      const updated = await updatePdfMetadata(pdfBytes, {
        title,
        author,
        subject,
        keywords,
        producer,
        clearAll
      });

      const outName = file ? file.name.replace('.pdf', clearAll ? '_sanitized.pdf' : '_updated.pdf') : 'SkPDF_meta.pdf';
      triggerFileDownload(updated, outName);
      setIsSuccess(true);
      if (clearAll) {
        setTitle('');
        setAuthor('');
        setSubject('');
        setKeywords('');
        setProducer('');
      }
    } catch (err) {
      console.error('Metadata update error:', err);
      alert('Error updating metadata: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to View, Edit or Strip Hidden Metadata"
        subtitle="Clean author details, software producers, creation dates, and keywords before public sharing."
        buttonLabel="Choose PDF File"
      />
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <div className="min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{pageCount} pages · Created: {creationDate || 'Unknown'}</p>
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

      <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Document Properties & Metadata</h3>
          <button
            onClick={() => handleSave(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wipe All Metadata</span>
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Title:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Author / Creator Name:</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Subject / Summary:</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Keywords (Comma separated):</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Producer Software:</label>
            <input
              type="text"
              value={producer}
              onChange={(e) => setProducer(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
        </div>

        {isSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>PDF metadata saved and downloaded!</span>
          </div>
        )}

        <button
          onClick={() => handleSave(false)}
          disabled={isProcessing}
          className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          <span>Save Metadata & Download PDF</span>
        </button>
      </div>
    </div>
  );
};
