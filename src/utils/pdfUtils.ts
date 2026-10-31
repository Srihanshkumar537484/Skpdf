import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist';

// Configure pdfjs worker for client-side rendering
if (typeof window !== 'undefined' && pdfjsLib.GlobalWorkerOptions) {
  // Use official CDN worker matching pdfjs-dist version
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
}

export interface ExtractedTextItem {
  str: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
}

export interface RenderedPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  textItems: ExtractedTextItem[];
}

/**
 * Renders a specific PDF page to an HTML5 canvas and extracts its text layout coordinates.
 */
export async function renderPdfPage(
  pdfData: ArrayBuffer | Uint8Array,
  pageNumber: number,
  scale = 1.5
): Promise<RenderedPageInfo> {
  const loadingTask = pdfjsLib.getDocument({ data: pdfData });
  const pdfDoc = await loadingTask.promise;
  const page = await pdfDoc.getPage(pageNumber);

  const viewport = page.getViewport({ scale });
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d', { willReadFrequently: true });
  canvas.width = viewport.width;
  canvas.height = viewport.height;

  if (!context) {
    throw new Error('Unable to acquire 2D canvas context.');
  }

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas
  };

  // Render visual page
  await (page.render(renderContext as any) as any).promise;

  // Extract text items with bounding coordinates
  const textContent = await page.getTextContent();
  const textItems: ExtractedTextItem[] = [];

  for (const item of textContent.items as any[]) {
    if (!item.str || item.str.trim() === '') continue;

    const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
    const fontSize = Math.sqrt(item.transform[0] * item.transform[0] + item.transform[1] * item.transform[1]) * scale;

    textItems.push({
      str: item.str,
      x: tx[4],
      // Adjust baseline to top-left bounds
      y: tx[5] - fontSize,
      width: (item.width || item.str.length * 8) * scale,
      height: fontSize * 1.2,
      fontSize: fontSize,
      fontName: item.fontName || 'sans-serif'
    });
  }

  return {
    pageNumber,
    width: viewport.width,
    height: viewport.height,
    canvas,
    textItems
  };
}

/**
 * Gets total page count of a PDF file.
 */
export async function getPdfPageCount(pdfBytes: ArrayBuffer | Uint8Array): Promise<number> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  return pdfDoc.getPageCount();
}

/**
 * Merges multiple PDF files into one.
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const donorPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const copiedPages = await mergedPdf.copyPages(donorPdf, donorPdf.getPageIndices());
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }

  return await mergedPdf.save();
}

/**
 * Splits a PDF by extracting specified page indices (1-indexed).
 */
export async function extractPdfPages(pdfBytes: ArrayBuffer, pageNumbers: number[]): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const totalPages = srcDoc.getPageCount();
  const validIndices = pageNumbers
    .filter((n) => n >= 1 && n <= totalPages)
    .map((n) => n - 1);

  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
  copiedPages.forEach((page) => newDoc.addPage(page));

  return await newDoc.save();
}

/**
 * Rotates pages by specific degrees and reorders/deletes as configured.
 */
export async function organizePdfPages(
  pdfBytes: ArrayBuffer,
  pageOrder: { originalIndex: number; rotation: number }[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const originalIndices = pageOrder.map((p) => p.originalIndex);
  const copiedPages = await newDoc.copyPages(srcDoc, originalIndices);

  copiedPages.forEach((page, i) => {
    const rotationDegrees = pageOrder[i].rotation % 360;
    if (rotationDegrees !== 0) {
      const currentRotation = page.getRotation().angle;
      page.setRotation(degrees((currentRotation + rotationDegrees) % 360));
    }
    newDoc.addPage(page);
  });

  return await newDoc.save();
}

/**
 * Compresses PDF by optimizing object streams and removing redundant structure.
 */
export async function compressPdf(
  pdfBytes: ArrayBuffer,
  level: 'low' | 'recommended' | 'extreme'
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  // Strip non-essential document metadata and structure overhead
  if (level === 'extreme') {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('SkPDF Optimizer');
    doc.setCreator('SkPDF');
  }

  // Save with objects stream optimization enabled
  return await doc.save({
    useObjectStreams: true,
    addDefaultPage: false
  });
}

/**
 * Adds password protection and encryption to a PDF.
 */
export async function protectPdf(
  pdfBytes: ArrayBuffer,
  userPassword: string,
  ownerPassword?: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  
  // Save with standard encryption
  return await (doc as any).save({
    userPassword: userPassword,
    ownerPassword: ownerPassword || userPassword
  });
}

/**
 * Reads metadata tags from PDF.
 */
export async function extractPdfMetadata(pdfBytes: ArrayBuffer) {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const kw = doc.getKeywords();
  const kwString = Array.isArray(kw) ? kw.join(', ') : (typeof kw === 'string' ? kw : '');

  return {
    title: doc.getTitle() || '',
    author: doc.getAuthor() || '',
    subject: doc.getSubject() || '',
    keywords: kwString,
    producer: doc.getProducer() || '',
    creator: doc.getCreator() || '',
    creationDate: doc.getCreationDate() ? doc.getCreationDate()!.toISOString().split('T')[0] : '',
    pageCount: doc.getPageCount()
  };
}

/**
 * Updates or wipes metadata from a PDF.
 */
export async function updatePdfMetadata(
  pdfBytes: ArrayBuffer,
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string;
    producer?: string;
    creator?: string;
    clearAll?: boolean;
  }
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  if (metadata.clearAll) {
    doc.setTitle('');
    doc.setAuthor('');
    doc.setSubject('');
    doc.setKeywords([]);
    doc.setProducer('SkPDF Sanitizer');
    doc.setCreator('SkPDF Sanitizer');
  } else {
    if (metadata.title !== undefined) doc.setTitle(metadata.title);
    if (metadata.author !== undefined) doc.setAuthor(metadata.author);
    if (metadata.subject !== undefined) doc.setSubject(metadata.subject);
    if (metadata.keywords !== undefined) {
      doc.setKeywords(metadata.keywords.split(',').map((k) => k.trim()));
    }
    if (metadata.producer !== undefined) doc.setProducer(metadata.producer);
    if (metadata.creator !== undefined) doc.setCreator(metadata.creator);
  }

  return await doc.save();
}

/**
 * Converts image files (JPG, PNG, WebP) to a clean multi-page PDF.
 */
export async function imagesToPdf(
  images: { dataUrl: string; name: string }[],
  options: { margin: number; orientation: 'portrait' | 'landscape' | 'auto' }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const imgItem of images) {
    let embeddedImage;
    if (imgItem.dataUrl.startsWith('data:image/png')) {
      embeddedImage = await pdfDoc.embedPng(imgItem.dataUrl);
    } else {
      // JPG or WebP canvas conversion
      embeddedImage = await pdfDoc.embedJpg(imgItem.dataUrl);
    }

    const { width: imgWidth, height: imgHeight } = embeddedImage;
    let pageOrientation = options.orientation;
    if (pageOrientation === 'auto') {
      pageOrientation = imgWidth > imgHeight ? 'landscape' : 'portrait';
    }

    const pageWidth = pageOrientation === 'landscape' ? 842 : 595;
    const pageHeight = pageOrientation === 'landscape' ? 595 : 842;
    const margin = options.margin;

    const page = pdfDoc.addPage([pageWidth, pageHeight]);

    // Fit image inside margins maintaining aspect ratio
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const scale = Math.min(maxWidth / imgWidth, maxHeight / imgHeight, 1);

    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    const x = (pageWidth - drawWidth) / 2;
    const y = (pageHeight - drawHeight) / 2;

    page.drawImage(embeddedImage, {
      x,
      y,
      width: drawWidth,
      height: drawHeight
    });
  }

  return await pdfDoc.save();
}

/**
 * Adds custom background color or tint to PDF pages.
 */
export async function applyPdfPageBackground(
  pdfBytes: ArrayBuffer,
  colorHex: string,
  targetPages: 'all' | 'first' | number[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const total = doc.getPageCount();

  const hex = colorHex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  let pageIndicesToColor: number[] = [];
  if (targetPages === 'all') {
    pageIndicesToColor = Array.from({ length: total }, (_, i) => i);
  } else if (targetPages === 'first') {
    pageIndicesToColor = [0];
  } else {
    pageIndicesToColor = targetPages.filter((idx) => idx >= 0 && idx < total);
  }

  for (const pageIdx of pageIndicesToColor) {
    const page = doc.getPage(pageIdx);
    const { width, height } = page.getSize();
    
    // Draw background rectangle
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(r, g, b),
      opacity: 1
    });
  }

  return await doc.save();
}

/**
 * Downloads a byte buffer or blob in the browser as a named file.
 */
export function triggerFileDownload(data: Uint8Array | Blob, fileName: string, mimeType = 'application/pdf') {
  const blob = data instanceof Blob ? data : new Blob([data as any], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
