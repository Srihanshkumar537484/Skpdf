import React, { useState, useRef } from 'react';
import { Dropzone } from '../../components/Dropzone';
import { processImageBackground, BackgroundReplacementOptions, ImageAdjustmentOptions } from '../../utils/imageUtils';
import { imagesToPdf, triggerFileDownload } from '../../utils/pdfUtils';
import { Wand2, Download, RotateCw, Sliders, Image as ImageIcon, FileText, Check } from 'lucide-react';

export const ImageBackgroundTool: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Replacement type
  const [bgType, setBgType] = useState<'transparent' | 'solid' | 'gradient' | 'image'>('transparent');
  const [solidColor, setSolidColor] = useState<string>('#ffffff');
  const [gradientStart, setGradientStart] = useState<string>('#f43f5e');
  const [gradientEnd, setGradientEnd] = useState<string>('#3b82f6');
  const [customBgUrl, setCustomBgUrl] = useState<string | undefined>(undefined);
  const [tolerance, setTolerance] = useState<number>(45);

  // Adjustments
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);

  const imgRef = useRef<HTMLImageElement>(null);

  const handleFile = (files: File[]) => {
    if (files.length === 0) return;
    const f = files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setImageSrc(url);
    setProcessedSrc(null);
  };

  const handleProcessBackground = async () => {
    if (!imgRef.current) return;
    setIsProcessing(true);

    try {
      const options: BackgroundReplacementOptions = {
        type: bgType,
        solidColor,
        gradientStart,
        gradientEnd,
        bgImageUrl: customBgUrl,
        tolerance
      };

      const adjustments: ImageAdjustmentOptions = {
        brightness,
        contrast,
        saturation,
        rotation
      };

      const resultDataUrl = await processImageBackground(imgRef.current, options, adjustments);
      setProcessedSrc(resultDataUrl);
    } catch (err) {
      console.error('Image processing error:', err);
      alert('Error processing image: ' + (err as any).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPng = () => {
    if (!processedSrc || !file) return;
    const link = document.createElement('a');
    link.href = processedSrc;
    link.download = file.name.replace(/\.[^/.]+$/, '_nobg.png');
    link.click();
  };

  const handleDownloadPdf = async () => {
    if (!processedSrc || !file) return;
    const pdfBytes = await imagesToPdf(
      [{ dataUrl: processedSrc, name: file.name }],
      { margin: 20, orientation: 'auto' }
    );
    triggerFileDownload(pdfBytes, file.name.replace(/\.[^/.]+$/, '_nobg.pdf'));
  };

  if (!file || !imageSrc) {
    return (
      <Dropzone
        acceptedTypes="image/*"
        onFilesSelected={handleFile}
        title="Upload Photo to Remove or Change Background"
        subtitle="Extract foreground subjects, make transparent PNGs, or apply vibrant color gradients."
        buttonLabel="Select Photo"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden reference img */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt="Original"
        className="hidden"
        crossOrigin="anonymous"
        onLoad={() => {
          handleProcessBackground();
        }}
      />

      {/* Control panel */}
      <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Background Replacement Choices */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Replacement Backdrop:
          </label>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              onClick={() => {
                setBgType('transparent');
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                bgType === 'transparent'
                  ? 'border-rose-600 bg-rose-50 text-rose-600 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              Transparent PNG
            </button>
            <button
              onClick={() => {
                setBgType('solid');
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                bgType === 'solid'
                  ? 'border-rose-600 bg-rose-50 text-rose-600 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              Solid Color
            </button>
            <button
              onClick={() => {
                setBgType('gradient');
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                bgType === 'gradient'
                  ? 'border-rose-600 bg-rose-50 text-rose-600 font-bold'
                  : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              Modern Gradient
            </button>
            <label className="cursor-pointer p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-center hover:bg-slate-100 flex items-center justify-center">
              <span>Upload Custom</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const url = URL.createObjectURL(e.target.files[0]);
                    setCustomBgUrl(url);
                    setBgType('image');
                  }
                }}
              />
            </label>
          </div>

          {bgType === 'solid' && (
            <div className="flex items-center gap-2 pt-1">
              <span className="text-xs text-slate-500">Pick Color:</span>
              <input
                type="color"
                value={solidColor}
                onChange={(e) => setSolidColor(e.target.value)}
                className="w-8 h-8 rounded border-0 cursor-pointer"
              />
            </div>
          )}

          {bgType === 'gradient' && (
            <div className="flex items-center gap-3 pt-1">
              <input
                type="color"
                value={gradientStart}
                onChange={(e) => setGradientStart(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="color"
                value={gradientEnd}
                onChange={(e) => setGradientEnd(e.target.value)}
                className="w-7 h-7 rounded cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Color Key Sensitivity & Tolerance */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center justify-between">
            <span>Color Tolerance:</span>
            <span className="font-mono text-rose-600">{tolerance}</span>
          </label>
          <input
            type="range"
            min="10"
            max="120"
            value={tolerance}
            onChange={(e) => setTolerance(parseInt(e.target.value, 10))}
            className="w-full accent-rose-600"
          />
          <p className="text-[11px] text-slate-500">
            Increase slider if background remnants persist, or decrease if edges get clipped.
          </p>

          <button
            onClick={() => setRotation((r) => (r + 90) % 360)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Rotate 90°</span>
          </button>
        </div>

        {/* Adjustments: Brightness, Contrast, Saturation */}
        <div className="space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Filter Adjustments:
          </label>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Brightness</span>
              <input
                type="range"
                min="50"
                max="150"
                value={brightness}
                onChange={(e) => setBrightness(parseInt(e.target.value, 10))}
                className="w-28 accent-rose-600"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Contrast</span>
              <input
                type="range"
                min="50"
                max="150"
                value={contrast}
                onChange={(e) => setContrast(parseInt(e.target.value, 10))}
                className="w-28 accent-rose-600"
              />
            </div>
          </div>

          <button
            onClick={handleProcessBackground}
            disabled={isProcessing}
            className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Processing Pixels...' : 'Apply Adjustments'}</span>
          </button>
        </div>
      </div>

      {/* Preview Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 text-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-3">Original Image</span>
          <div className="max-h-80 flex items-center justify-center overflow-hidden rounded-xl bg-slate-50 dark:bg-slate-950 p-2">
            <img src={imageSrc} alt="Original" className="max-h-72 object-contain rounded" />
          </div>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 text-center">
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block mb-3">Processed Output</span>
          <div className="max-h-80 flex items-center justify-center overflow-hidden rounded-xl bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:12px_12px] bg-slate-50 dark:bg-slate-950 p-2">
            {processedSrc ? (
              <img src={processedSrc} alt="Processed" className="max-h-72 object-contain rounded" />
            ) : (
              <span className="text-xs text-slate-400">Rendering preview...</span>
            )}
          </div>
        </div>
      </div>

      {/* Download Options */}
      {processedSrc && (
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
          <button
            onClick={handleDownloadPng}
            className="flex items-center gap-2 px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Save Directly as PDF</span>
          </button>

          <button
            onClick={() => {
              setFile(null);
              setImageSrc(null);
              setProcessedSrc(null);
            }}
            className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 ml-4"
          >
            Upload Another Photo
          </button>
        </div>
      )}
    </div>
  );
};
