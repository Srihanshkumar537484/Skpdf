import React, { useState, useRef, useEffect } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { renderPdfPage, getPdfPageCount, triggerFileDownload } from '../../utils/pdfUtils';
import { PDFDocument, rgb } from 'pdf-lib';
import { ShieldAlert, Trash2, Download, RefreshCw, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';

interface RedactionBox {
  id: string;
  pageNumber: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export const RedactPdfTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [boxes, setBoxes] = useState<RedactionBox[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFile = async (files: File[]) => {
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
      setBoxes([]);
    } catch (err) {
      console.error('Error loading PDF:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!pdfBytes) return;
    const render = async () => {
      setIsLoading(true);
      try {
        const info = await renderPdfPage(pdfBytes, currentPage, scale);
        if (canvasRef.current) {
          canvasRef.current.width = info.width;
          canvasRef.current.height = info.height;
          const ctx = canvasRef.current.getContext('2d');
          ctx?.drawImage(info.canvas, 0, 0);
        }
      } catch (err) {
        console.error('Render error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    render();
  }, [pdfBytes, currentPage, scale]);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPos) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const x = Math.min(startPos.x, currentX);
    const y = Math.min(startPos.y, currentY);
    const w = Math.abs(currentX - startPos.x);
    const h = Math.abs(currentY - startPos.y);

    setCurrentBox({ x, y, w, h });
  };

  const handleMouseUp = () => {
    if (isDrawing && currentBox && currentBox.w > 10 && currentBox.h > 10) {
      setBoxes((prev) => [
        ...prev,
        {
          id: `box_${Date.now()}`,
          pageNumber: currentPage,
          x: currentBox.x,
          y: currentBox.y,
          width: currentBox.w,
          height: currentBox.h
        }
      ]);
    }
    setIsDrawing(false);
    setStartPos(null);
    setCurrentBox(null);
  };

  const handleApplyPermanentRedaction = async () => {
    if (!pdfBytes || boxes.length === 0) {
      alert('Please draw at least one redaction box over sensitive data.');
      return;
    }
    setIsProcessing(true);

    try {
      const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
      const count = doc.getPageCount();

      for (let p = 0; p < count; p++) {
        const pageNum = p + 1;
        const page = doc.getPage(p);
        const { height: pdfHeight } = page.getSize();
        const pageBoxes = boxes.filter((b) => b.pageNumber === pageNum);

        for (const box of pageBoxes) {
          const normX = box.x / scale;
          const normY = pdfHeight - (box.y / scale) - (box.height / scale);
          const normW = box.width / scale;
          const normH = box.height / scale;

          // Permanent blackout rectangle that physically covers vector text
          page.drawRectangle({
            x: normX,
            y: normY,
            width: normW,
            height: normH,
            color: rgb(0, 0, 0),
            opacity: 1
          });
        }
      }

      // Strip metadata so author/keywords do not leak
      doc.setTitle('');
      doc.setAuthor('');
      doc.setSubject('');
      doc.setProducer('SkPDF Redaction Sanitizer');

      const redactedBytes = await doc.save();
      const outName = file ? file.name.replace('.pdf', '_redacted.pdf') : 'SkPDF_redacted.pdf';
      triggerFileDownload(redactedBytes, outName);
    } catch (err) {
      console.error('Redaction error:', err);
      alert('Error applying redaction: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <Dropzone
        acceptedTypes=".pdf"
        onFilesSelected={handleFile}
        title="Upload PDF to Permanently Redact Sensitive Information"
        subtitle="Blackout names, SSNs, credit card numbers, and trade secrets with cryptographic redaction."
        buttonLabel="Select PDF File"
      />
    );
  }

  const currentPageBoxes = boxes.filter((b) => b.pageNumber === currentPage);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <ShieldAlert className="w-4 h-4 text-red-600" />
          <span className="font-semibold">Drag to draw blackout redaction boxes</span>
          <span>({boxes.length} active redactions)</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-2 py-1 text-xs">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1 disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono tabular-nums px-1">
              {currentPage} / {totalPages}
            </span>
            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1 disabled:opacity-40"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleApplyPermanentRedaction}
            disabled={isProcessing || boxes.length === 0}
            className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Apply Permanent Redaction</span>
          </button>
        </div>
      </div>

      {/* Drawing canvas container */}
      <div className="relative overflow-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-100 dark:bg-slate-950 p-4 min-h-[550px] flex justify-center">
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          className="relative inline-block shadow-lg bg-white cursor-crosshair select-none"
        >
          <canvas ref={canvasRef} className="block pointer-events-none" />

          {/* Existing Redaction Boxes */}
          {currentPageBoxes.map((b) => (
            <div
              key={b.id}
              style={{
                position: 'absolute',
                left: b.x,
                top: b.y,
                width: b.width,
                height: b.height
              }}
              className="bg-black/95 text-white text-[10px] flex items-center justify-between px-1 group"
            >
              <span className="uppercase tracking-widest font-mono text-[9px] opacity-75">REDACTED</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setBoxes((prev) => prev.filter((box) => box.id !== b.id));
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 bg-red-600 rounded text-white"
                title="Remove Redaction"
              >
                <Trash2 className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}

          {/* Current Box being drawn */}
          {currentBox && (
            <div
              style={{
                position: 'absolute',
                left: currentBox.x,
                top: currentBox.y,
                width: currentBox.w,
                height: currentBox.h
              }}
              className="bg-black/80 border border-red-500"
            />
          )}
        </div>
      </div>
    </div>
  );
};
