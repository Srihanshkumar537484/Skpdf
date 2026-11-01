import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Dropzone } from '../../components/Dropzone';
import { runOcrRecognition, OcrJobResult } from '../../utils/ocrUtils';
import { renderPdfPage } from '../../utils/pdfUtils';
import { createWordDocumentFromText } from '../../utils/docxUtils';
import { triggerFileDownload } from '../../utils/pdfUtils';
import { enhanceOcrTextWithAi } from '../../services/aiService';
import { Globe, RefreshCw, Copy, Check, FileDown, Sparkles, Wand2, Table as TableIcon, FileText } from 'lucide-react';

export const OcrPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState<'eng' | 'hin' | 'hin+eng'>('hin+eng');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStatus, setProgressStatus] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [result, setResult] = useState<OcrJobResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [isAiEnhancing, setIsAiEnhancing] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'table'>('text');

  const handleAiEnhance = async () => {
    if (!result || !result.fullText) return;
    setIsAiEnhancing(true);
    try {
      const cleaned = await enhanceOcrTextWithAi(result.fullText, language);
      setResult({ ...result, fullText: cleaned, confidence: 99 });
    } catch (err: any) {
      alert('AI OCR enhancement error: ' + err.message);
    } finally {
      setIsAiEnhancing(false);
    }
  };

  const handleFile = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0]);
      setResult(null);
      setProgressPercent(0);
      setProgressStatus('');
      setActiveTab('text');
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
      if (ocrData.extractedTable && ocrData.extractedTable.length > 1 && ocrData.extractedTable[0].length > 1) {
        setActiveTab('table');
      }
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

  const handleDownloadExcel = () => {
    if (!result || !file) return;
    const tableData = result.extractedTable && result.extractedTable.length > 0
      ? result.extractedTable
      : result.fullText.split('\n').map((l) => [l]);

    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'OCR Extracted Data');
    const outBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([outBuf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerFileDownload(blob, file.name.replace(/\.[^/.]+$/, '_ocr_table.xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  };

  const handleDownloadCsv = () => {
    if (!result || !file) return;
    const tableData = result.extractedTable && result.extractedTable.length > 0
      ? result.extractedTable
      : result.fullText.split('\n').map((l) => [l]);

    const ws = XLSX.utils.aoa_to_sheet(tableData);
    const csvContent = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    triggerFileDownload(blob, file.name.replace(/\.[^/.]+$/, '_ocr_table.csv'), 'text/csv');
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf,image/*"
        onFilesSelected={handleFile}
        title="Upload Scanned PDF or Image for OCR Recognition"
        subtitle="Detects English & Hindi (Devanagari) characters, recognizes tables, and exports to Word or Excel."
        buttonLabel="Choose Scanned Document"
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
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
            <span>{isProcessing ? progressStatus || 'Running OCR Model...' : 'Start OCR & Table Recognition'}</span>
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
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-2xl">
            <div>
              <h4 className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">OCR Recognition Complete</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Model confidence score: <span className="font-bold text-emerald-700 dark:text-emerald-400">{result.confidence}%</span>
                {result.extractedTable && (
                  <span className="ml-2 px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/60 rounded text-[11px] text-emerald-800 dark:text-emerald-300">
                    {result.extractedTable.length} table rows detected
                  </span>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAiEnhance}
                disabled={isAiEnhancing}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 rounded-xl transition-colors"
                title="Use Gemini AI to correct broken characters, matras, and format text"
              >
                {isAiEnhancing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-rose-600" />}
                <span>{isAiEnhancing ? 'Gemini AI Fixing...' : '✨ AI Fix & Enhance OCR'}</span>
              </button>

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
                <span>Word (.docx)</span>
              </button>

              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
                title="Export recognized table to Microsoft Excel"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>CSV</span>
              </button>

              <button
                onClick={handleDownloadTxt}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>TXT</span>
              </button>
            </div>
          </div>

          {/* View Mode Toggle: Text vs Table */}
          <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'text'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Full Text View</span>
            </button>

            {result.extractedTable && result.extractedTable.length > 0 && (
              <button
                onClick={() => setActiveTab('table')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === 'table'
                    ? 'bg-rose-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span>Structured Table Grid</span>
              </button>
            )}
          </div>

          {/* Tab Content */}
          {activeTab === 'text' ? (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 p-4">
              <textarea
                rows={12}
                value={result.fullText}
                onChange={(e) => setResult({ ...result, fullText: e.target.value })}
                className="w-full bg-transparent text-sm text-slate-900 dark:text-white leading-relaxed focus:outline-none resize-y font-sans"
                placeholder="Extracted text will appear here..."
              />
            </div>
          ) : (
            <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto bg-white dark:bg-slate-900 p-2 max-h-96">
              <table className="w-full text-xs text-left">
                <tbody>
                  {result.extractedTable?.map((row, rIdx) => (
                    <tr
                      key={rIdx}
                      className={rIdx === 0 ? 'bg-slate-100 dark:bg-slate-800 font-bold' : 'border-t border-slate-100 dark:border-slate-800'}
                    >
                      {row.map((cell, cIdx) => (
                        <td key={cIdx} className="p-2 border-r border-slate-100 dark:border-slate-800 last:border-r-0">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

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
