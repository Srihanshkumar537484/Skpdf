import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { renderPdfPage, getPdfPageCount, triggerFileDownload } from '../../utils/pdfUtils';
import {
  matchFontFamily,
  sampleTextColorFromCanvas,
  IntelligentTextElement,
  DetectedFontInfo
} from '../../utils/documentUnderstanding';
import { reconstructBackgroundPatch } from '../../utils/backgroundInpainting';
import {
  PageBackgroundConfig,
  applyBackgroundToPdfDocPage,
  SOLID_COLOR_PRESETS,
  GRADIENT_PRESETS,
  hexToRgb01
} from '../../utils/pageBackgroundManager';
import { calculateIntelligentTextFit } from '../../utils/textFitting';
import { runOcrRecognition } from '../../utils/ocrUtils';
import { enhanceTextWithAi } from '../../services/aiService';
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
  Stamp,
  Sparkles,
  Layers,
  Palette,
  Undo2,
  Redo2,
  Sliders,
  Eye,
  EyeOff,
  Copy,
  Clipboard,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Wand2,
  AlertCircle,
  HelpCircle,
  SplitSquareVertical,
  Maximize2
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

export const EditPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Left sidebar tab: 'thumbnails' | 'backgrounds' | 'layers'
  const [leftTab, setLeftTab] = useState<'thumbnails' | 'backgrounds' | 'layers'>('thumbnails');
  const [thumbnailUrls, setThumbnailUrls] = useState<string[]>([]);

  // Toggles required by prompt
  const [matchFormatting, setMatchFormatting] = useState<boolean>(true);
  const [autoFitText, setAutoFitText] = useState<boolean>(true);
  const [showBeforeAfter, setShowBeforeAfter] = useState<boolean>(false); // original vs edited view
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);

  // Text modification & document understanding elements
  const [textElements, setTextElements] = useState<IntelligentTextElement[]>([]);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [activeTool, setActiveTool] = useState<'select' | 'addText' | 'highlight' | 'shape' | 'signature' | 'watermark'>('select');

  // Page-wise background configuration
  const [pageBackgrounds, setPageBackgrounds] = useState<Record<number, PageBackgroundConfig>>({});
  const [copiedBgConfig, setCopiedBgConfig] = useState<PageBackgroundConfig | null>(null);

  // History stack for Undo / Redo
  const [history, setHistory] = useState<{
    texts: IntelligentTextElement[];
    annotations: Annotation[];
    backgrounds: Record<number, PageBackgroundConfig>;
  }[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Watermark text
  const [watermarkText, setWatermarkText] = useState<string>('CONFIDENTIAL');

  // Signature modal
  const [showSignatureModal, setShowSignatureModal] = useState<boolean>(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState<boolean>(false);

  // Canvases
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null); // for before/after comparison

  // AI Assistant states inside properties panel
  const [aiActionLoading, setAiActionLoading] = useState<boolean>(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);

  // Record history snapshot
  const pushHistoryState = (
    newTexts: IntelligentTextElement[],
    newAnns: Annotation[],
    newBgs: Record<number, PageBackgroundConfig>
  ) => {
    const nextState = {
      texts: JSON.parse(JSON.stringify(newTexts)),
      annotations: JSON.parse(JSON.stringify(newAnns)),
      backgrounds: JSON.parse(JSON.stringify(newBgs))
    };
    const updatedHistory = history.slice(0, historyIndex + 1);
    updatedHistory.push(nextState);
    if (updatedHistory.length > 25) updatedHistory.shift(); // keep last 25 operations
    setHistory(updatedHistory);
    setHistoryIndex(updatedHistory.length - 1);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setTextElements(JSON.parse(JSON.stringify(prev.texts)));
      setAnnotations(JSON.parse(JSON.stringify(prev.annotations)));
      setPageBackgrounds(JSON.parse(JSON.stringify(prev.backgrounds)));
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setTextElements(JSON.parse(JSON.stringify(next.texts)));
      setAnnotations(JSON.parse(JSON.stringify(next.annotations)));
      setPageBackgrounds(JSON.parse(JSON.stringify(next.backgrounds)));
      setHistoryIndex(historyIndex + 1);
    }
  };

  // Handle PDF upload
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
      setTextElements([]);
      setAnnotations([]);
      setPageBackgrounds({});
      setHistory([]);
      setHistoryIndex(-1);

      // Render thumbnail previews in background
      const thumbs: string[] = [];
      const previewCount = Math.min(total, 12);
      for (let p = 1; p <= previewCount; p++) {
        const info = await renderPdfPage(buffer, p, 0.25);
        thumbs.push(info.canvas.toDataURL('image/jpeg', 0.8));
      }
      setThumbnailUrls(thumbs);
    } catch (err) {
      console.error('Failed to load PDF:', err);
      alert('Could not load PDF document: ' + (err as any).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Render current page canvas and perform document understanding
  useEffect(() => {
    if (!pdfBytes) return;

    let isSubscribed = true;
    const render = async () => {
      setIsLoading(true);
      try {
        const info = await renderPdfPage(pdfBytes, currentPage, scale);
        if (!isSubscribed) return;

        // Render to main interactive canvas
        if (canvasRef.current) {
          const mainCanvas = canvasRef.current;
          mainCanvas.width = info.width;
          mainCanvas.height = info.height;
          const ctx = mainCanvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(info.canvas, 0, 0);
          }
        }

        // Keep pristine copy for Before/After compare
        if (originalCanvasRef.current) {
          const origCanvas = originalCanvasRef.current;
          origCanvas.width = info.width;
          origCanvas.height = info.height;
          const oCtx = origCanvas.getContext('2d');
          if (oCtx) {
            oCtx.drawImage(info.canvas, 0, 0);
          }
        }

        // Document Understanding: Extract text items or run OCR if scanned
        setTextElements((prev) => {
          const hasPage = prev.some((t) => t.pageNumber === currentPage);
          if (hasPage) return prev;

          const ctx = canvasRef.current?.getContext('2d');
          let detectedItems: IntelligentTextElement[] = [];

          if (info.textItems && info.textItems.length > 0) {
            // Normal Digital PDF text extraction
            detectedItems = info.textItems.map((item, index) => {
              const fontInfo = matchFontFamily(item.fontName, item.str);
              const colorInfo = ctx
                ? sampleTextColorFromCanvas(ctx, item.x, item.y, item.width, item.height)
                : { textColor: '#000000', bgColor: '#ffffff' };

              return {
                id: `p${currentPage}_t${index}`,
                pageNumber: currentPage,
                str: item.str,
                originalStr: item.str,
                x: item.x,
                y: item.y,
                width: item.width,
                height: item.height,
                fontSize: item.fontSize,
                lineHeight: item.height * 1.1,
                letterSpacing: 0,
                color: colorInfo.textColor,
                bgColor: colorInfo.bgColor,
                alignment: 'left',
                fontInfo,
                isScannedText: false,
                isDeleted: false
              };
            });
          }

          const combined = [...prev, ...detectedItems];
          pushHistoryState(combined, annotations, pageBackgrounds);
          return combined;
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

  const currentPageTexts = textElements.filter((t) => t.pageNumber === currentPage);
  const currentPageAnnotations = annotations.filter((a) => a.pageNumber === currentPage);
  const currentBgConfig = pageBackgrounds[currentPage] || { type: 'none' };
  const selectedElement = textElements.find((t) => t.id === selectedElementId);

  // Inpaint background patch behind modified text on canvas
  const applyInpaintingOverModifiedText = (item: IntelligentTextElement) => {
    if (!canvasRef.current || !originalCanvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Use smart inpainting algorithm sampling neighboring perimeter pixels
    const patch = reconstructBackgroundPatch(originalCanvasRef.current, {
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height
    });

    ctx.drawImage(patch.patchCanvas, item.x - 4, item.y - 4);
  };

  // Text modification handler with auto-fit and font matching
  const handleTextChange = (id: string, newString: string) => {
    setTextElements((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;

        // Auto-fit calculations
        const fit = calculateIntelligentTextFit(
          item.width,
          item.height,
          item.fontSize,
          item.originalStr,
          newString,
          autoFitText,
          matchFormatting
        );

        const updated: IntelligentTextElement = {
          ...item,
          str: newString,
          fontSize: fit.fittedFontSize,
          letterSpacing: fit.letterSpacing
        };

        // Reconstruct background behind old text on canvas
        applyInpaintingOverModifiedText(item);

        return updated;
      });

      return next;
    });
  };

  // Apply AI assistant action on selected text block
  const handleAiAssist = async (action: 'proofread' | 'professional' | 'translate-hindi' | 'translate-english' | 'shorten') => {
    if (!selectedElement || !selectedElement.str.trim()) return;
    setAiActionLoading(true);
    setAiMessage(null);

    try {
      const enhanced = await enhanceTextWithAi(selectedElement.str, action);
      handleTextChange(selectedElement.id, enhanced);
      setAiMessage('AI enhancement applied successfully.');
    } catch (err: any) {
      setAiMessage('AI error: ' + err.message);
    } finally {
      setAiActionLoading(false);
    }
  };

  // Background management functions
  const updatePageBg = (pageNum: number, config: PageBackgroundConfig) => {
    const updated = { ...pageBackgrounds, [pageNum]: config };
    setPageBackgrounds(updated);
    pushHistoryState(textElements, annotations, updated);
  };

  const applyBgToScope = (scope: 'current' | 'all' | 'odd' | 'even') => {
    const nextBgs = { ...pageBackgrounds };
    const configToApply = currentBgConfig;

    for (let p = 1; p <= totalPages; p++) {
      if (scope === 'all') {
        nextBgs[p] = configToApply;
      } else if (scope === 'odd' && p % 2 !== 0) {
        nextBgs[p] = configToApply;
      } else if (scope === 'even' && p % 2 === 0) {
        nextBgs[p] = configToApply;
      }
    }

    setPageBackgrounds(nextBgs);
    pushHistoryState(textElements, annotations, nextBgs);
  };

  // Export & Download PDF with page backgrounds and smart inpainting
  const handleExportPdf = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);

    try {
      const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const courier = await pdfDoc.embedFont(StandardFonts.Courier);

      const pageCount = pdfDoc.getPageCount();

      for (let pIdx = 0; pIdx < pageCount; pIdx++) {
        const pageNum = pIdx + 1;
        const page = pdfDoc.getPage(pIdx);
        const { height: pdfHeight } = page.getSize();

        // 1. Apply Page-Wise Background layer FIRST (underneath text)
        const bgConfig = pageBackgrounds[pageNum];
        if (bgConfig && bgConfig.type !== 'none') {
          await applyBackgroundToPdfDocPage(page, bgConfig, async (url) => {
            if (url.startsWith('data:image/png')) return await pdfDoc.embedPng(url);
            return await pdfDoc.embedJpg(url);
          });
        }

        // 2. Process Modified Text Items with Smart Inpainting Colors
        const pageTexts = textElements.filter(
          (t) => t.pageNumber === pageNum && (t.str !== t.originalStr || t.isDeleted)
        );

        for (const item of pageTexts) {
          const normX = item.x / scale;
          const normY = pdfHeight - (item.y / scale) - (item.fontSize / scale);
          const normW = item.width / scale;
          const normH = item.height / scale;

          // Compute exact background inpainting color
          const sampledRgb = hexToRgb01(item.bgColor || '#ffffff');

          // Paint sampled background inpainting rectangle (preserves cream, yellow, gray paper tint)
          page.drawRectangle({
            x: normX - 2,
            y: normY - 2,
            width: normW + 4,
            height: normH + 4,
            color: rgb(sampledRgb.r, sampledRgb.g, sampledRgb.b),
            opacity: 1
          });

          // Draw replacement text using matched font family
          if (!item.isDeleted && item.str.trim()) {
            let targetFont = helvetica;
            if (item.fontInfo.category.includes('serif')) {
              targetFont = item.fontInfo.isBold ? timesBold : timesRoman;
            } else if (item.fontInfo.category === 'monospace') {
              targetFont = courier;
            } else if (item.fontInfo.isBold) {
              targetFont = helveticaBold;
            }

            const textRgb = hexToRgb01(item.color || '#000000');

            page.drawText(item.str, {
              x: normX,
              y: normY + 2,
              size: Math.max(7, item.fontSize / scale),
              font: targetFont,
              color: rgb(textRgb.r, textRgb.g, textRgb.b)
            });
          }
        }

        // 3. Process Annotations
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
              x: page.getSize().width / 4,
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

  // Canvas click to add annotations
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select') {
      setSelectedElementId(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (activeTool === 'addText') {
      const newAnn: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'text',
        pageNumber: currentPage,
        x,
        y,
        text: 'Type new text here',
        color: '#000000',
        fontSize: 14
      };
      setAnnotations([...annotations, newAnn]);
      setActiveTool('select');
    } else if (activeTool === 'highlight') {
      const newAnn: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'highlight',
        pageNumber: currentPage,
        x,
        y: y - 10,
        width: 140,
        height: 24,
        color: 'rgba(254, 240, 138, 0.5)'
      };
      setAnnotations([...annotations, newAnn]);
      setActiveTool('select');
    } else if (activeTool === 'shape') {
      const newAnn: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'shape',
        pageNumber: currentPage,
        x,
        y,
        width: 160,
        height: 60,
        color: '#000000'
      };
      setAnnotations([...annotations, newAnn]);
      setActiveTool('select');
    } else if (activeTool === 'watermark') {
      const newAnn: Annotation = {
        id: `ann_${Date.now()}`,
        type: 'watermark',
        pageNumber: currentPage,
        x: rect.width / 2,
        y: rect.height / 2,
        text: watermarkText,
        fontSize: 48,
        color: 'rgba(150, 150, 150, 0.25)'
      };
      setAnnotations([...annotations, newAnn]);
      setActiveTool('select');
    }
  };

  // Signature pad methods
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
        title="Upload PDF for Intelligent Text Editing & Background Reconstruction"
        subtitle="Intelligently detects original fonts, weights, colors, and layout. Reconstructs scanned text backgrounds seamlessly."
        buttonLabel="Select PDF File"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Hidden canvas for Before/After comparison */}
      <canvas ref={originalCanvasRef} className="hidden" />

      {/* TOP TOOLBAR */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
        {/* Tool modes */}
        <div className="flex items-center gap-1 p-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs">
          <button
            onClick={() => setActiveTool('select')}
            className={`px-3 py-1.5 font-semibold rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'select' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Edit Text</span>
          </button>

          <button
            onClick={() => setActiveTool('addText')}
            className={`px-2.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'addText' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Add Text</span>
          </button>

          <button
            onClick={() => setActiveTool('highlight')}
            className={`px-2.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'highlight' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Highlighter className="w-3.5 h-3.5" />
            <span>Highlight</span>
          </button>

          <button
            onClick={() => setActiveTool('shape')}
            className={`px-2.5 py-1.5 font-medium rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTool === 'shape' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Square className="w-3.5 h-3.5" />
            <span>Shape</span>
          </button>

          <button
            onClick={() => setShowSignatureModal(true)}
            className="px-2.5 py-1.5 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Sign</span>
          </button>
        </div>

        {/* Intelligence Toggles */}
        <div className="flex items-center gap-2">
          {/* Match Formatting Toggle */}
          <button
            onClick={() => setMatchFormatting(!matchFormatting)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              matchFormatting
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
            title="Automatically detect original font family, size, weight, and color"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Match Formatting: {matchFormatting ? 'ON' : 'OFF'}</span>
          </button>

          {/* Auto Fit Text Toggle */}
          <button
            onClick={() => setAutoFitText(!autoFitText)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              autoFitText
                ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-700 dark:text-blue-300'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500'
            }`}
            title="Automatically adjust tracking and font scale so text fits without layout collisions"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Auto Fit: {autoFitText ? 'ON' : 'OFF'}</span>
          </button>

          {/* Compare Before/After Toggle */}
          <button
            onClick={() => setShowBeforeAfter(!showBeforeAfter)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
              showBeforeAfter
                ? 'bg-amber-500 text-white border-amber-600'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-amber-400'
            }`}
            title="Inspect pristine original document vs edited changes"
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span>{showBeforeAfter ? 'Original View' : 'Edited View'}</span>
          </button>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-800 pl-2">
            <button
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-1.5 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-1.5 text-slate-600 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Page Nav, Zoom & Export */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs">
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

          <button
            onClick={handleExportPdf}
            disabled={isProcessing}
            className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors whitespace-nowrap"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Export & Download PDF</span>
          </button>
        </div>
      </div>

      {/* THREE-PANEL EDITOR WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* LEFT PANEL (Page Thumbnails & Page-wise Background Manager) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 space-y-3 h-[680px] flex flex-col">
          {/* Left panel tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold shrink-0">
            <button
              onClick={() => setLeftTab('thumbnails')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                leftTab === 'thumbnails' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Pages ({totalPages})
            </button>
            <button
              onClick={() => setLeftTab('backgrounds')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                leftTab === 'backgrounds' ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs' : 'text-slate-500'
              }`}
            >
              Backgrounds
            </button>
          </div>

          {/* Subtab 1: Thumbnails */}
          {leftTab === 'thumbnails' && (
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <div
                  key={pNum}
                  onClick={() => setCurrentPage(pNum)}
                  className={`p-2 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    currentPage === pNum
                      ? 'border-rose-600 bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-500'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 bg-slate-50/50 dark:bg-slate-950'
                  }`}
                >
                  <span className="text-xs font-mono font-bold text-slate-500 w-5 text-right">{pNum}</span>
                  <div className="w-16 h-20 bg-white border border-slate-200 rounded flex items-center justify-center overflow-hidden">
                    {thumbnailUrls[pNum - 1] ? (
                      <img src={thumbnailUrls[pNum - 1]} alt={`P${pNum}`} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[10px] text-slate-400">P.{pNum}</span>
                    )}
                  </div>
                  <div className="min-w-0 text-xs">
                    <p className="font-semibold text-slate-800 dark:text-slate-200">Page {pNum}</p>
                    <p className="text-[11px] text-slate-400">
                      {pageBackgrounds[pNum]?.type && pageBackgrounds[pNum]?.type !== 'none'
                        ? `Custom ${pageBackgrounds[pNum].type}`
                        : 'Default background'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Subtab 2: Page-Wise Background Editor */}
          {leftTab === 'backgrounds' && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Active Page: <span className="text-rose-600">Page {currentPage}</span>
                </span>
                <p className="text-[11px] text-slate-500">
                  Every page supports its own independent background without altering foreground text.
                </p>
              </div>

              {/* Solid Color Presets */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Solid Color Tint:
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {SOLID_COLOR_PRESETS.map((color) => (
                    <button
                      key={color.hex}
                      onClick={() => updatePageBg(currentPage, { type: 'solid', solidColor: color.hex })}
                      title={color.name}
                      style={{ backgroundColor: color.hex }}
                      className={`h-7 rounded-lg border border-slate-300 dark:border-slate-700 transition-transform hover:scale-105 ${
                        currentBgConfig.type === 'solid' && currentBgConfig.solidColor === color.hex
                          ? 'ring-2 ring-rose-500'
                          : ''
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Gradient Presets */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Modern Gradients:
                </label>
                <div className="space-y-1.5">
                  {GRADIENT_PRESETS.map((grad) => (
                    <button
                      key={grad.name}
                      onClick={() =>
                        updatePageBg(currentPage, {
                          type: 'gradient',
                          gradientStart: grad.start,
                          gradientEnd: grad.end
                        })
                      }
                      style={{
                        background: `linear-gradient(to right, ${grad.start}, ${grad.end})`
                      }}
                      className="w-full h-7 rounded-lg border border-slate-200 text-[11px] font-semibold text-slate-800 text-left px-2"
                    >
                      {grad.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Image Background */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Custom Backdrop Image:
                </label>
                <label className="cursor-pointer block text-center p-2 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 hover:border-rose-500 transition-colors">
                  <span className="text-[11px] text-rose-600 font-semibold">Upload Image for Page {currentPage}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          updatePageBg(currentPage, {
                            type: 'image',
                            imageUrl: ev.target?.result as string,
                            imageOpacity: 0.85
                          });
                        };
                        reader.readAsDataURL(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>

              {/* Scope buttons */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Apply Background To:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => applyBgToScope('all')}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]"
                  >
                    All Pages
                  </button>
                  <button
                    onClick={() => applyBgToScope('odd')}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]"
                  >
                    Odd Pages
                  </button>
                  <button
                    onClick={() => applyBgToScope('even')}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-lg text-slate-700 dark:text-slate-300 text-[11px]"
                  >
                    Even Pages
                  </button>
                  <button
                    onClick={() => updatePageBg(currentPage, { type: 'none' })}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg text-[11px]"
                  >
                    Reset Page {currentPage}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CENTER VIEWPORT (High-DPI PDF Page Preview with Smart Inpainting & Text Overlays) */}
        <div className="lg:col-span-6 border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100 dark:bg-slate-950 p-4 min-h-[680px] overflow-auto flex justify-center relative">
          {isLoading && (
            <div className="absolute inset-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Analyzing document layout and vector streams...</span>
              </div>
            </div>
          )}

          {/* Active Canvas wrapper */}
          <div
            onClick={handleCanvasClick}
            className="relative inline-block shadow-xl rounded-sm bg-white cursor-crosshair select-none"
            style={{
              backgroundColor: currentBgConfig.type === 'solid' ? currentBgConfig.solidColor : '#ffffff',
              backgroundImage:
                currentBgConfig.type === 'gradient'
                  ? `linear-gradient(to bottom, ${currentBgConfig.gradientStart}, ${currentBgConfig.gradientEnd})`
                  : undefined
            }}
          >
            {/* Base Page Canvas */}
            <canvas ref={canvasRef} className="block pointer-events-none" />

            {/* Clickable & Editable Text Overlays */}
            {!showBeforeAfter &&
              currentPageTexts.map((item) => {
                const isSelected = selectedElementId === item.id;
                const isEditing = activeEditingId === item.id;
                const isModified = item.str !== item.originalStr;

                return (
                  <div
                    key={item.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedElementId(item.id);
                      setActiveEditingId(item.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: item.x,
                      top: item.y,
                      minWidth: Math.max(item.width, 16),
                      height: item.height,
                      letterSpacing: `${item.letterSpacing}px`
                    }}
                    className={`group cursor-text transition-all ${
                      isSelected
                        ? 'ring-2 ring-rose-500 bg-rose-50/40 z-20'
                        : isModified
                        ? 'outline-1 outline-amber-400 bg-amber-50/40 z-10'
                        : 'hover:outline-1 hover:outline-sky-400 hover:bg-sky-50/30'
                    }`}
                  >
                    {isEditing ? (
                      <input
                        type="text"
                        autoFocus
                        value={item.str}
                        onChange={(e) => handleTextChange(item.id, e.target.value)}
                        onBlur={() => setActiveEditingId(null)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') setActiveEditingId(null);
                        }}
                        style={{
                          fontSize: `${item.fontSize}px`,
                          lineHeight: `${item.height}px`,
                          color: item.color,
                          fontFamily: item.fontInfo.matchedFamily,
                          fontWeight: item.fontInfo.estimatedWeight,
                          fontStyle: item.fontInfo.isItalic ? 'italic' : 'normal',
                          backgroundColor: item.bgColor || 'transparent'
                        }}
                        className="w-full h-full border border-rose-500 rounded px-1 outline-none shadow-xs"
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: `${item.fontSize}px`,
                          lineHeight: `${item.height}px`,
                          color: isModified ? item.color : 'transparent',
                          fontFamily: item.fontInfo.matchedFamily,
                          fontWeight: item.fontInfo.estimatedWeight,
                          fontStyle: item.fontInfo.isItalic ? 'italic' : 'normal',
                          display: 'block'
                        }}
                        className="truncate"
                      >
                        {isModified ? item.str : ''}
                      </span>
                    )}

                    {/* Detected font badge on hover */}
                    <div className="absolute -top-5 left-0 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap pointer-events-none z-30 font-mono">
                      {item.fontInfo.matchedFamily.split(',')[0].replace(/'/g, '')} · {Math.round(item.fontSize)}px
                    </div>
                  </div>
                );
              })}

            {/* Annotations Layer */}
            {!showBeforeAfter &&
              currentPageAnnotations.map((ann) => (
                <div
                  key={ann.id}
                  style={{ position: 'absolute', left: ann.x, top: ann.y }}
                  className="group cursor-move select-none"
                >
                  {ann.type === 'text' && (
                    <input
                      type="text"
                      value={ann.text}
                      onChange={(e) => {
                        const val = e.target.value;
                        setAnnotations((prev) =>
                          prev.map((a) => (a.id === ann.id ? { ...a, text: val } : a))
                        );
                      }}
                      style={{ fontSize: `${ann.fontSize || 14}px`, color: ann.color || '#000000' }}
                      className="bg-transparent border border-dashed border-rose-400 px-1 py-0.5 rounded outline-none font-semibold"
                    />
                  )}
                  {ann.type === 'highlight' && (
                    <div
                      style={{ width: ann.width, height: ann.height, backgroundColor: ann.color }}
                      className="rounded-xs border border-yellow-300"
                    />
                  )}
                  {ann.type === 'shape' && (
                    <div
                      style={{ width: ann.width, height: ann.height, borderColor: ann.color }}
                      className="border-2 border-slate-900 rounded-sm"
                    />
                  )}
                  {ann.type === 'watermark' && (
                    <div className="transform -rotate-45 pointer-events-none select-none">
                      <span className="text-5xl font-black text-slate-400/25 uppercase tracking-widest">
                        {ann.text}
                      </span>
                    </div>
                  )}
                  {ann.type === 'signature' && ann.dataUrl && (
                    <img src={ann.dataUrl} alt="Signature" className="w-36 h-auto pointer-events-none" />
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* RIGHT PANEL (Properties Inspector & AI Assistant) */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-4 h-[680px] overflow-y-auto text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              Properties Inspector
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {selectedElement ? 'Element Selected' : 'Page Context'}
            </span>
          </div>

          {selectedElement ? (
            <div className="space-y-4">
              {/* Detected Font Matching Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Original Font:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedElement.fontInfo.fontName}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Matched Web Font:</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400 truncate max-w-[130px]">
                    {selectedElement.fontInfo.matchedFamily.split(',')[0].replace(/'/g, '')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500 font-medium">Script / Category:</span>
                  <span className="uppercase text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                    {selectedElement.fontInfo.script} · {selectedElement.fontInfo.category}
                  </span>
                </div>
              </div>

              {/* Font Family Override */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Font Family:
                </label>
                <select
                  value={selectedElement.fontInfo.matchedFamily}
                  onChange={(e) => {
                    const chosen = e.target.value;
                    setTextElements((prev) =>
                      prev.map((item) =>
                        item.id === selectedElement.id
                          ? { ...item, fontInfo: { ...item.fontInfo, matchedFamily: chosen } }
                          : item
                      )
                    );
                  }}
                  className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                >
                  <optgroup label="Sans-Serif">
                    <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Helvetica, sans-serif">Helvetica</option>
                    <option value="Calibri, sans-serif">Calibri</option>
                    <option value="Roboto, sans-serif">Roboto</option>
                  </optgroup>
                  <optgroup label="Serif">
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="Cambria, serif">Cambria</option>
                  </optgroup>
                  <optgroup label="Hindi / Devanagari">
                    <option value="'Noto Sans Devanagari', sans-serif">Noto Sans Devanagari (हिंदी)</option>
                    <option value="'Noto Serif Devanagari', serif">Noto Serif Devanagari</option>
                  </optgroup>
                  <optgroup label="Monospace">
                    <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                    <option value="'Courier New', monospace">Courier New</option>
                  </optgroup>
                </select>
              </div>

              {/* Font Size & Weight */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Size: {Math.round(selectedElement.fontSize)}px
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="64"
                    value={selectedElement.fontSize}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      setTextElements((prev) =>
                        prev.map((item) => (item.id === selectedElement.id ? { ...item, fontSize: val } : item))
                      );
                    }}
                    className="w-full accent-rose-600"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Style & Weight:
                  </label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setTextElements((prev) =>
                          prev.map((item) =>
                            item.id === selectedElement.id
                              ? {
                                  ...item,
                                  fontInfo: {
                                    ...item.fontInfo,
                                    isBold: !item.fontInfo.isBold,
                                    estimatedWeight: item.fontInfo.isBold ? 400 : 700
                                  }
                                }
                              : item
                          )
                        );
                      }}
                      className={`p-1.5 rounded border ${
                        selectedElement.fontInfo.isBold
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'border-slate-300 text-slate-600'
                      }`}
                      title="Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        setTextElements((prev) =>
                          prev.map((item) =>
                            item.id === selectedElement.id
                              ? {
                                  ...item,
                                  fontInfo: {
                                    ...item.fontInfo,
                                    isItalic: !item.fontInfo.isItalic
                                  }
                                }
                              : item
                          )
                        );
                      }}
                      className={`p-1.5 rounded border ${
                        selectedElement.fontInfo.isItalic
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'border-slate-300 text-slate-600'
                      }`}
                      title="Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Text Color Picker */}
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Text Color:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedElement.color.startsWith('#') ? selectedElement.color : '#000000'}
                    onChange={(e) => {
                      const c = e.target.value;
                      setTextElements((prev) =>
                        prev.map((item) => (item.id === selectedElement.id ? { ...item, color: c } : item))
                      );
                    }}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
                  <input
                    type="text"
                    value={selectedElement.color}
                    onChange={(e) => {
                      const c = e.target.value;
                      setTextElements((prev) =>
                        prev.map((item) => (item.id === selectedElement.id ? { ...item, color: c } : item))
                      );
                    }}
                    className="w-24 px-2 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Inpainting Color Preview */}
              <div className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Smart Background Inpainting:
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-4 h-4 rounded-full border border-slate-400"
                    style={{ backgroundColor: selectedElement.bgColor }}
                  />
                  <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400">
                    Sampled: {selectedElement.bgColor} (Non-destructive)
                  </span>
                </div>
              </div>

              {/* AI Assistant for Selected Text */}
              <div className="border-t border-slate-200 dark:border-slate-800 pt-3 space-y-2">
                <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Text Assistant</span>
                </span>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    disabled={aiActionLoading}
                    onClick={() => handleAiAssist('proofread')}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    ✨ Proofread & Fix Grammar
                  </button>
                  <button
                    disabled={aiActionLoading}
                    onClick={() => handleAiAssist('professional')}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    ✨ Rewrite in Executive Tone
                  </button>
                  <button
                    disabled={aiActionLoading}
                    onClick={() => handleAiAssist('translate-hindi')}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    ✨ Translate to Hindi (हिंदी)
                  </button>
                  <button
                    disabled={aiActionLoading}
                    onClick={() => handleAiAssist('translate-english')}
                    className="text-left px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    ✨ Translate to English
                  </button>
                </div>

                {aiActionLoading && (
                  <div className="flex items-center gap-1.5 text-[11px] text-rose-600">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing with Gemini 3.8 Flash...</span>
                  </div>
                )}
                {aiMessage && (
                  <p className="text-[10px] text-emerald-600 font-medium">{aiMessage}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-400 space-y-2">
              <Type className="w-8 h-8 text-slate-300 dark:text-slate-700" />
              <p className="font-semibold text-slate-600 dark:text-slate-300">No Element Selected</p>
              <p className="text-[11px] max-w-[200px]">
                Click on any word or text line on the PDF canvas to inspect its matched font, size, weight, and inpainting background.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Signature Draw Modal */}
      {showSignatureModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Draw Your Signature</h3>
            <p className="text-xs text-slate-500 mb-4">Use mouse or touch screen to draw your electronic signature.</p>

            <div className="border border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-950 overflow-hidden mb-4">
              <canvas
                ref={sigCanvasRef}
                width={380}
                height={160}
                onMouseDown={startDrawingSig}
                onMouseMove={drawSig}
                onMouseUp={() => setIsDrawingSig(false)}
                onMouseLeave={() => setIsDrawingSig(false)}
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
                className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900"
              >
                Clear Pad
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignatureModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600"
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
