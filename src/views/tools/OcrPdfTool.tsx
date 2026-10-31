import React, { useState } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { runOcrRecognition, OcrJobResult } from '../../utils/ocrUtils';
import { renderPdfPage } from '../../utils/pdfUtils';
import { createWordDocumentFromText } from '../../utils/docxUtils';
import { triggerFileDownload } from '../../utils/pdfUtils';
import { Globe, RefreshCw, Copy, Check, FileDown, Sparkles } from 'lucide-react';

export const OcrPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'eng' | 'hin' | 'hin+eng'>('hin+eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [result, setResult] = useState<OcrJobResult | null>(null);
  const [copied, setCopied] = useState(false);

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
      setProgressPercent(0);
      setProgressStatus('');
    }
  };

  const handleRunOcr = async () => {
    if (!file) return;
    setIsProcessing(true);
    setProgressStatus('Preparing document for OCR...');
    setProgressPercent(10);

    try {
      let imageSource: string | HTMLCanvasElement = '';

      if (file.name.toLowerCase().endsWith('.pdf')) {
        const buffer = await file.arrayBuffer();
        const info = await renderPdfPage(buffer, 1, 2.0); // High-res 2x scale for maximum OCR accuracy
        imageSource = info.canvas;
      } else {
        // Image file
        imageSource = URL.createObjectURL(file);
      }

      const ocrData = await runOcrRecognition(imageSource, language, (p) => {
        setProgressStatus(p.status);
        setProgressPercent(p.percent);
      });

      setResult(ocrData);
    } catch (err) {
      console.error('OCR Error:', err);
      alert('OCR Failed: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadTxt = () => {
    if (!result || !file) return;
    const blob = new Blob([result.fullText], { type: 'text/plain;charset=utf-8' });
    triggerFileDownload(blob, file.name.replace(/\.[^/.]+$/, '_ocr.txt'), 'text/plain');
  };

  const handleDownloadDocx = async () => {
    if (!result || !file) return;
    const paragraphs = result.fullText.split('\n').filter((l) => l.trim().length > 0);
    const docBlob = await createWordDocumentFromText(file.name.replace(/\.[^/.]+$/, ''), paragraphs);
    triggerFileDownload(docBlob, file.name.replace(/\.[^/.]+$/, '_ocr.docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf,image/*"
        onFilesSelected={handleFile}
        title="Upload Scanned PDF or Image for OCR Recognition"
        subtitle="Detects English and Hindi (Devanagari) characters with high confidence and exports to Word."
        buttonLabel="Choose Scanned Document"
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* File & Language Settings Bar */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{file.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Language:</span>
          <div className="flex p-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
            <button
              onClick={() => setLanguage('hin+eng')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                language === 'hin+eng' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Hindi + English
            </button>
            <button
              onClick={() => setLanguage('hin')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                language === 'hin' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              Hindi Only
            </button>
            <button
              onClick={() => setLanguage('eng')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                language === 'eng' ? 'bg-rose-600 text-white' : 'text-slate-600 dark:text-slate-300'
              }`}
            >
              English Only
            </button>
          </div>
        </div>
      </div>

      {/* Run Action */}
      {!result && (
        <div>
          <button
            onClick={handleRunOcr}
            disabled={isProcessing}
            className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isProcessing ? progressStatus || 'Running OCR Model...' : 'Start OCR Text Recognition'}</span>
          </button>

          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-rose-600 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-center text-xs text-slate-500">{progressStatus}</p>
            </div>
          )}
        </div>
      )}

      {/* Result Display */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <div>
              <h4 className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">OCR Recognition Complete</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Model confidence score: <span className="font-bold text-emerald-700 dark:text-emerald-400">{result.confidence}%</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>

              <button
                onClick={handleDownloadDocx}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Export Word (.docx)</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>Save .TXT</span>
              </button>
            </div>
          </div>

          {/* Editable text textarea */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 p-4">
            <textarea
              rows={12}
              value={result.fullText}
              onChange={(e) => setResult({ ...result, fullText: e.target.value })}
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none resize-y font-sans"
              placeholder="Extracted text will appear here..."
            />
          </div>

          <div className="text-center">
            <button
              onClick={() => {
                setFile(null);
                setResult(null);
              }}
              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            >
              ← Process another document
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
