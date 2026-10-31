import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { renderPdfPage, getPdfPageCount, triggerFileDownload, ExtractedTextItem } from '../../utils/pdfUtils';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
import {
  Type,
  Highlighter,
  Square,
  PenTool,
  Download,
  RotateCw,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Check,
  RefreshCw,
  Stamp
} from 'lucide-react';

interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'shape' | 'signature' | 'watermark';
  pageNumber: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  color?: string;
  fontSize?: number;
  dataUrl?: string;
}

interface ModifiedTextItem extends ExtractedTextItem {
  id: string;
  pageNumber: number;
  originalStr: string;
  newStr: string;
  isDeleted: boolean;
  color: string;
  fontSize: number;
}

export const EditPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Text modification states
  const [editableTexts, setEditableTexts] = useState<ModifiedTextItem[]>([]);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'addText' | 'highlight' | 'shape' | 'signature' | 'watermark'>('select');

  // Text formatting controls
  const [selectedFontSize, setSelectedFontSize] = useState<number>(14);
  const [selectedColor, setSelectedColor] = useState<string>('#000000');
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');

  // Signature modal
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    setIsLoading(true);

    try {
      const buffer = await f.arrayBuffer();
      setPdfBytes(buffer);
      const total = await getPdfPageCount(buffer);
      setTotalPages(total);
      setCurrentPage(1);
      setEditableTexts([]);
      setAnnotations([]);
    } catch (err) {
      console.error('Failed to load PDF:', err);
      alert('Could not load PDF. The document may be corrupted or encrypted.');
    } finally {
      setIsLoading(false);
    }
  };

  // Render current page canvas and extract text items
  useEffect(() => {
    if (!pdfBytes) return;

    let isSubscribed = true;
    const render = async () => {
      setIsLoading(true);
      try {
        const info = await renderPdfPage(pdfBytes, currentPage, scale);
        if (!isSubscribed) return;

        // Populate canvas
        if (canvasRef.current) {
          const mainCanvas = canvasRef.current;
          mainCanvas.width = info.width;
          mainCanvas.height = info.height;
          const ctx = mainCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(info.canvas, 0, 0);
          }
        }

        // Initialize editable texts if not already extracted for this page
        setEditableTexts((prev) => {
          const hasPage = prev.some((t) => t.pageNumber === currentPage);
          if (hasPage) return prev;

          const newItems: ModifiedTextItem[] = info.textItems.map((item, index) => ({
            ...item,
            id: `p${currentPage}_t${index}`,
            pageNumber: currentPage,
            originalStr: item.str,
            newStr: item.str,
            isDeleted: false,
            color: '#000000',
            fontSize: item.fontSize
          }));
          return [...prev, ...newItems];
        });
      } catch (err) {
        console.error('Error rendering page:', err);
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    };

    render();
    return () => {
      isSubscribed = false;
    };
  }, [pdfBytes, currentPage, scale]);

  const currentPageTexts = editableTexts.filter((t) => t.pageNumber === currentPage);
  const currentPageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);

  // Handle Canvas Click for adding Annotations
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'addText') {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'text',
        pageNumber: currentPage,
        x,
        y,
        text: 'Type new text here',
        color: selectedColor,
        fontSize: selectedFontSize
      };
      setAnnotations([...annotations, newAnnotation]);
      setActiveTool('select');
    } else if (activeTool === 'highlight') {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'highlight',
        pageNumber: currentPage,
        x,
        y: y - 10,
        width: 140,
        height: 24,
        color: 'rgba(254, 240, 138, 0.5)' // soft yellow
      };
      setAnnotations([...annotations, newAnnotation]);
      setActiveTool('select');
    } else if (activeTool === 'shape') {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'shape',
        pageNumber: currentPage,
        x,
        y,
        width: 160,
        height: 60,
        color: selectedColor
      };
      setAnnotations([...annotations, newAnnotation]);
      setActiveTool('select');
    } else if (activeTool === 'watermark') {
      const newAnnotation: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'watermark',
        pageNumber: currentPage,
        x: rect.width / 2,
        y: rect.height / 2,
        text: watermarkText,
        fontSize: 48,
        color: 'rgba(150, 150, 150, 0.25)'
      };
      setAnnotations([...annotations, newAnnotation]);
      setActiveTool('select');
    }
  };

  // Export modified PDF
  const handleExportPdf = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageCount = pdfDoc.getPageCount();

      for (let pIdx = 0; pIdx < pageCount; pIdx++) {
        const pageNum = pIdx + 1;
        const page = pdfDoc.getPage(pIdx);
        const { height: pdfHeight, width: pdfWidth } = page.getSize();

        // 1. Process Modified Existing Text
        const textsToModify = editableTexts.filter((t) => t.pageNumber === pageNum && (t.newStr !== t.originalStr || t.isDeleted));

        for (const item of textsToModify) {
          // Normalize coordinates from canvas scale to PDF coordinate system (PDF origin is bottom-left)
          const normX = item.x / scale;
          const normY = pdfHeight - (item.y / scale) - (item.fontSize / scale);
          const normW = item.width / scale;
          const normH = item.height / scale;

          // Paint white redaction/cover-up rectangle over old text
          page.drawRectangle({
            x: normX - 2,
            y: normY - 2,
            width: normW + 6,
            height: normH + 4,
            color: rgb(1, 1, 1),
            opacity: 1
          });

          // Draw new text if not deleted
          if (!item.isDeleted && item.newStr.trim()) {
            page.drawText(item.newStr, {
              x: normX,
              y: normY + 2,
              size: Math.max(8, item.fontSize / scale),
              font: helvetica,
              color: rgb(0, 0, 0)
            });
          }
        }

        // 2. Process Annotations for this page
        const pageAnns = annotations.filter((a) => a.pageNumber === pageNum);
        for (const ann of pageAnns) {
          const normX = ann.x / scale;
          const normY = pdfHeight - (ann.y / scale);

          if (ann.type === 'text' && ann.text) {
            page.drawText(ann.text, {
              x: normX,
              y: normY,
              size: (ann.fontSize || 14) / scale,
              font: helveticaBold,
              color: rgb(0, 0, 0)
            });
          } else if (ann.type === 'highlight') {
            const w = (ann.width || 100) / scale;
            const h = (ann.height || 20) / scale;
            page.drawRectangle({
              x: normX,
              y: normY - h,
              width: w,
              height: h,
              color: rgb(1, 0.9, 0.3),
              opacity: 0.4
            });
          } else if (ann.type === 'shape') {
            const w = (ann.width || 100) / scale;
            const h = (ann.height || 50) / scale;
            page.drawRectangle({
              x: normX,
              y: normY - h,
              width: w,
              height: h,
              borderColor: rgb(0.2, 0.2, 0.2),
              borderWidth: 1.5,
              opacity: 0
            });
          } else if (ann.type === 'watermark' && ann.text) {
            page.drawText(ann.text, {
              x: pdfWidth / 4,
              y: pdfHeight / 2,
              size: 50,
              font: helveticaBold,
              color: rgb(0.7, 0.7, 0.7),
              rotate: degrees(45),
              opacity: 0.3
            });
          } else if (ann.type === 'signature' && ann.dataUrl) {
            const sigPng = await pdfDoc.embedPng(ann.dataUrl);
            const sigW = 120;
            const sigH = (sigPng.height / sigPng.width) * sigW;
            page.drawImage(sigPng, {
              x: normX,
              y: normY - sigH,
              width: sigW,
              height: sigH
            });
          }
        }
      }

      const modifiedPdfBytes = await pdfDoc.save();
      const outputName = file ? file.name.replace('.pdf', '_edited.pdf') : 'SkPDF_edited.pdf';
      triggerFileDownload(modifiedPdfBytes, outputName);
    } catch (err) {
      console.error('Failed to export PDF:', err);
      alert('Error exporting PDF: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Signature drawing functions
  const startDrawingSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.beginPath();
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawingSig(true);
  };

  const drawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  };

  const endDrawingSig = () => {
    setIsDrawingSig(false);
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const newAnnotation: Annotation = {
      id: `sig_${Date.now()}`,
      type: 'signature',
      pageNumber: currentPage,
      x: 100,
      y: 100,
      dataUrl
    };
    setAnnotations([...annotations, newAnnotation]);
    setShowSignatureModal(false);
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFileSelect}
        title="Upload PDF to Edit Existing Text & Add Signatures"
        subtitle="Click words to edit directly, replace sentences, add text boxes, draw signatures, or highlight content."
        buttonLabel="Select PDF File"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Workspace Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        {/* Tool modes */}
        <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTool('select')}
            title="Select & Edit Existing Text"
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'select'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Edit Text</span>
          </button>

          <button
            onClick={() => setActiveTool('addText')}
            title="Add New Text Box"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'addText'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => setActiveTool('highlight')}
            title="Highlight Text Area"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'highlight'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlight</span>
          </button>

          <button
            onClick={() => setActiveTool('shape')}
            title="Add Rectangle / Shape"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'shape'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Shape</span>
          </button>

          <button
            onClick={() => setShowSignatureModal(true)}
            title="Draw or Insert Signature"
            className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Signature</span>
          </button>

          <button
            onClick={() => setActiveTool('watermark')}
            title="Stamp Watermark"
            className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'watermark'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>Watermark</span>
          </button>
        </div>

        {/* Page navigation & Zoom controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 disabled:opacity-40 hover:text-rose-600"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono tabular-nums px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 disabled:opacity-40 hover:text-rose-600"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-1.5 py-1 text-xs">
            <button onClick={() => setScale((s) => Math.max(0.8, s - 0.2))} className="p-1 hover:text-rose-600">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono tabular-nums text-[11px] px-1">{Math.round(scale * 100)}%</span>
            <button onClick={() => setScale((s) => Math.min(2.0, s + 0.2))} className="p-1 hover:text-rose-600">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export Action */}
          <button
            onClick={handleExportPdf}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-colors whitespace-nowrap"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export & Download PDF</span>
          </button>
        </div>
      </div>

      {/* Editing Workspace Hint */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-xl px-4 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
        <span>
          💡 <strong>Click any text span on the page</strong> to edit existing words in place. Hit Enter or click outside to confirm.
        </span>
        <button
          onClick={() => {
            setFile(null);
            setPdfBytes(null);
          }}
          className="underline hover:text-amber-900 dark:hover:text-amber-200 font-medium"
        >
          Change File
        </button>
      </div>

      {/* Main Canvas with Overlay Container */}
      <div className="relative overflow-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100 dark:bg-slate-950 p-4 min-h-[600px] flex justify-center">
        {isLoading && (
          <div className="absolute inset-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Rendering high-resolution vector page...</span>
            </div>
          </div>
        )}

        <div
          onClick={handleCanvasClick}
          className="relative inline-block shadow-xl rounded-sm bg-white cursor-crosshair select-none"
        >
          {/* Base PDF Canvas Layer */}
          <canvas ref={canvasRef} className="block" />

          {/* Clickable & Editable Existing Text Layer */}
          {currentPageTexts.map((item) => {
            const isEditing = activeEditingId === item.id;
            const isModified = item.newStr !== item.originalStr;

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: item.x,
                  top: item.y,
                  minWidth: Math.max(item.width, 20),
                  height: item.height
                }}
                className={`group cursor-text transition-all ${
                  isModified ? 'bg-amber-100/70 text-slate-900 outline-1 outline-amber-400' : 'hover:bg-sky-100/50 hover:outline-1 hover:outline-sky-400'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveEditingId(item.id);
                }}
              >
                {isEditing ? (
                  <input
                    type="text"
                    autoFocus
                    value={item.newStr}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEditableTexts((prev) =>
                        prev.map((t) => (t.id === item.id ? { ...t, newStr: val } : t))
                      );
                    }}
                    onBlur={() => setActiveEditingId(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setActiveEditingId(null);
                    }}
                    style={{
                      fontSize: `${item.fontSize}px`,
                      lineHeight: `${item.height}px`
                    }}
                    className="w-full h-full bg-white text-slate-900 border border-rose-500 rounded px-1 outline-none font-sans"
                  />
                ) : (
                  <span
                    style={{
                      fontSize: `${item.fontSize}px`,
                      lineHeight: `${item.height}px`,
                      display: 'block'
                    }}
                    className={`font-sans ${item.isDeleted ? 'line-through text-red-500' : ''}`}
                  >
                    {isModified ? item.newStr : ''}
                  </span>
                )}
              </div>
            );
          })}

          {/* Annotations Layer (New Text, Highlighting, Shapes, Signatures) */}
          {currentPageAnnotations.map((ann) => (
            <div
              key={ann.id}
              style={{
                position: 'absolute',
                left: ann.x,
                top: ann.y
              }}
              className="group cursor-move select-none"
            >
              {ann.type === 'text' && (
                <div className="relative">
                  <input
                    type="text"
                    value={ann.text}
                    onChange={(e) => {
                      const val = e.target.value;
                      setAnnotations((prev) =>
                        prev.map((a) => (a.id === ann.id ? { ...a, text: val } : a))
                      );
                    }}
                    style={{
                      fontSize: `${ann.fontSize || 14}px`,
                      color: ann.color || '#000000'
                    }}
                    className="bg-transparent border border-dashed border-rose-400 px-1 py-0.5 rounded outline-none font-semibold"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
                    }}
                    className="absolute -top-3 -right-3 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {ann.type === 'highlight' && (
                <div
                  style={{
                    width: ann.width,
                    height: ann.height,
                    backgroundColor: ann.color
                  }}
                  className="relative rounded-xs border border-yellow-300"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
                    }}
                    className="absolute -top-2 -right-2 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {ann.type === 'shape' && (
                <div
                  style={{
                    width: ann.width,
                    height: ann.height,
                    borderColor: ann.color
                  }}
                  className="relative border-2 border-slate-900 rounded-sm"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
                    }}
                    className="absolute -top-2 -right-2 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}

              {ann.type === 'watermark' && (
                <div className="relative pointer-events-none transform -rotate-45">
                  <span className="text-4xl sm:text-6xl font-black text-slate-300/40 tracking-widest uppercase">
                    {ann.text}
                  </span>
                </div>
              )}

              {ann.type === 'signature' && ann.dataUrl && (
                <div className="relative">
                  <img src={ann.dataUrl} alt="Signature" className="w-36 h-auto pointer-events-none" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setAnnotations((prev) => prev.filter((a) => a.id !== ann.id));
                    }}
                    className="absolute -top-2 -right-2 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="w-2.5 h-2.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Signature Draw Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Draw Your Signature</h3>
            <p className="text-xs text-slate-500 mb-4">Use mouse or finger on touch screens to sign below.</p>

            <div className="border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden mb-4">
              <canvas
                ref={sigCanvasRef}
                width={380}
                height={160}
                onMouseDown={startDrawingSig}
                onMouseMove={drawSig}
                onMouseUp={endDrawingSig}
                onMouseLeave={endDrawingSig}
                className="w-full cursor-crosshair block"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => {
                  const canvas = sigCanvasRef.current;
                  if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx?.clearRect(0, 0, canvas.width, canvas.height);
                  }
                }}
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Clear Pad
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveSignature}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
                >
                  Apply Signature
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
