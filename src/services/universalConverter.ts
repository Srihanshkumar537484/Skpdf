import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { extractFromDocx, convertDocxToPdf, createWordDocumentFromText } from '../utils/docxUtils';

export interface ConversionOptions {
  imageQuality?: number; // 0.1 to 1.0 (default 0.92)
  imageWidth?: number;
  imageHeight?: number;
  sheetIndex?: number;
  csvDelimiter?: string;
  pdfPageSize?: 'A4' | 'Letter';
  includeSlideNumbers?: boolean;
}

export interface ConversionResult {
  fileName: string;
  blob: Blob;
  mimeType: string;
  previewUrl?: string;
  extractedFiles?: { name: string; blob: Blob }[];
  textPreview?: string;
  tableData?: any[][];
}

/**
 * Encodes raw canvas RGBA pixel data into a standard uncompressed 24-bit BMP image.
 */
function createBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable.');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const width = canvas.width;
  const height = canvas.height;

  // BMP rows are padded to multiple of 4 bytes
  const rowSize = Math.floor((24 * width + 31) / 32) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;

  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // Bitmap File Header (14 bytes)
  view.setUint16(0, 0x424d, false); // 'BM'
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true); // reserved
  view.setUint32(10, 54, true); // offset to pixel array

  // DIB Header (BITMAPINFOHEADER - 40 bytes)
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true); // bottom-up
  view.setUint16(26, 1, true); // color planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(30, 0, true); // BI_RGB (no compression)
  view.setUint32(34, pixelArraySize, true);
  view.setInt32(38, 2835, true); // 72 DPI horizontal
  view.setInt32(42, 2835, true); // 72 DPI vertical
  view.setUint32(46, 0, true);
  view.setUint32(50, 0, true);

  // Write pixel array (BGR order, bottom-to-top)
  const data = imgData.data;
  let offset = 54;
  for (let y = height - 1; y >= 0; y--) {
    let rowStart = offset;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const b = data[srcIdx + 2];
      const g = data[srcIdx + 1];
      const r = data[srcIdx];
      view.setUint8(offset++, b);
      view.setUint8(offset++, g);
      view.setUint8(offset++, r);
    }
    // Pad to 4 bytes
    while ((offset - rowStart) % 4 !== 0) {
      view.setUint8(offset++, 0);
    }
  }

  return new Blob([buffer], { type: 'image/bmp' });
}

/**
 * Creates an ICO file containing PNG payload (Standard Vista/Windows 7+ ICO container).
 */
function createIcoBlob(pngBlob: Blob, width: number, height: number): Promise<Blob> {
  return pngBlob.arrayBuffer().then((pngBuffer) => {
    const icoHeaderSize = 6;
    const dirEntrySize = 16;
    const totalSize = icoHeaderSize + dirEntrySize + pngBuffer.byteLength;

    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);

    // ICO Header
    view.setUint16(0, 0, true); // Reserved
    view.setUint16(2, 1, true); // 1 = ICO format
    view.setUint16(4, 1, true); // 1 image count

    // Directory Entry
    view.setUint8(6, width > 255 ? 0 : width);
    view.setUint8(7, height > 255 ? 0 : height);
    view.setUint8(8, 0); // Palette count
    view.setUint8(9, 0); // Reserved
    view.setUint16(10, 1, true); // Color planes
    view.setUint16(12, 32, true); // Bits per pixel
    view.setUint32(14, pngBuffer.byteLength, true); // Size of PNG payload
    view.setUint32(18, 22, true); // Offset of PNG payload (6 + 16 = 22)

    // Copy PNG payload
    new Uint8Array(buffer, 22).set(new Uint8Array(pngBuffer));

    return new Blob([buffer], { type: 'image/x-icon' });
  });
}

/**
 * Image Conversion Engine (Supports JPG, PNG, WEBP, BMP, ICO, PDF, SVG).
 */
export async function convertImage(
  file: File,
  targetFormat: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const quality = options.imageQuality ?? 0.92;

  // Load image into HTMLImageElement
  const imgUrl = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Failed to decode image file.'));
    img.src = imgUrl;
  });
  URL.revokeObjectURL(imgUrl);

  const canvas = document.createElement('canvas');
  canvas.width = options.imageWidth || img.naturalWidth;
  canvas.height = options.imageHeight || img.naturalHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not initialize canvas context.');

  // If converting to JPEG, fill white background to prevent black transparency
  if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let outputBlob: Blob;
  let mimeType = 'application/octet-stream';

  switch (targetFormat) {
    case 'jpg':
    case 'jpeg':
      mimeType = 'image/jpeg';
      outputBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/jpeg', quality));
      break;

    case 'png':
      mimeType = 'image/png';
      outputBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
      break;

    case 'webp':
      mimeType = 'image/webp';
      outputBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/webp', quality));
      break;

    case 'bmp':
      mimeType = 'image/bmp';
      outputBlob = createBmpBlob(canvas);
      break;

    case 'ico': {
      mimeType = 'image/x-icon';
      // Icons typically 32x32 to 256x256
      const icoCanvas = document.createElement('canvas');
      icoCanvas.width = Math.min(256, Math.max(32, canvas.width));
      icoCanvas.height = Math.min(256, Math.max(32, canvas.height));
      const icoCtx = icoCanvas.getContext('2d')!;
      icoCtx.drawImage(canvas, 0, 0, icoCanvas.width, icoCanvas.height);
      const pngForIco = await new Promise<Blob>((res) => icoCanvas.toBlob((b) => res(b!), 'image/png'));
      outputBlob = await createIcoBlob(pngForIco, icoCanvas.width, icoCanvas.height);
      break;
    }

    case 'pdf': {
      mimeType = 'application/pdf';
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([canvas.width, canvas.height]);
      const pngBlob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), 'image/png'));
      const pngBytes = await pngBlob.arrayBuffer();
      const pdfImage = await pdfDoc.embedPng(pngBytes);
      page.drawImage(pdfImage, {
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height
      });
      const pdfBytes = await pdfDoc.save();
      outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      break;
    }

    case 'svg': {
      mimeType = 'image/svg+xml';
      const dataUrl = canvas.toDataURL('image/png');
      const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
  <image width="${canvas.width}" height="${canvas.height}" xlink:href="${dataUrl}" />
</svg>`;
      outputBlob = new Blob([svgContent], { type: 'image/svg+xml' });
      break;
    }

    default:
      throw new Error(`Unsupported image target format: ${targetFormat}`);
  }

  return {
    fileName: `${baseName}.${targetFormat === 'jpeg' ? 'jpg' : targetFormat}`,
    blob: outputBlob,
    mimeType,
    previewUrl: URL.createObjectURL(outputBlob)
  };
}

/**
 * Spreadsheet Conversion Engine (Supports XLSX, XLS, CSV, TSV, ODS).
 */
export async function convertSpreadsheet(
  file: File,
  targetFormat: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const sheetName = workbook.SheetNames[options.sheetIndex ?? 0] || workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error('Spreadsheet has no readable sheets.');
  }

  const rawTableData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

  let outputBlob: Blob;
  let mimeType = 'application/octet-stream';
  let textPreview = '';

  switch (targetFormat) {
    case 'xlsx': {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const outBuf = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      outputBlob = new Blob([outBuf], { type: mimeType });
      break;
    }

    case 'csv': {
      mimeType = 'text/csv';
      const delimiter = options.csvDelimiter || ',';
      const csvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: delimiter });
      textPreview = csvContent.slice(0, 1000);
      outputBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      break;
    }

    case 'tsv': {
      mimeType = 'text/tab-separated-values';
      const tsvContent = XLSX.utils.sheet_to_csv(worksheet, { FS: '\t' });
      textPreview = tsvContent.slice(0, 1000);
      outputBlob = new Blob([tsvContent], { type: 'text/tab-separated-values;charset=utf-8' });
      break;
    }

    case 'json': {
      mimeType = 'application/json';
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      const jsonStr = JSON.stringify(jsonData, null, 2);
      textPreview = jsonStr.slice(0, 1000);
      outputBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
      break;
    }

    case 'html': {
      mimeType = 'text/html';
      const tableHtml = XLSX.utils.sheet_to_html(worksheet);
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${baseName} - Spreadsheet</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background: #f8fafc; }
    table { border-collapse: collapse; width: 100%; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; font-size: 13px; }
    tr:nth-child(even) { background-color: #f1f5f9; }
    tr:hover { background-color: #e2e8f0; }
  </style>
</head>
<body>
  <h2>${baseName} (${sheetName})</h2>
  ${tableHtml}
</body>
</html>`;
      textPreview = fullHtml.slice(0, 1000);
      outputBlob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
      break;
    }

    case 'txt': {
      mimeType = 'text/plain';
      // Format as nicely padded plain text table
      const rows = rawTableData.filter((r) => r.length > 0);
      const colWidths: number[] = [];
      rows.forEach((row) => {
        row.forEach((cell, idx) => {
          const str = String(cell ?? '');
          colWidths[idx] = Math.max(colWidths[idx] || 0, str.length);
        });
      });

      const formattedLines = rows.map((row) => {
        return row
          .map((cell, idx) => String(cell ?? '').padEnd(colWidths[idx] + 2))
          .join(' | ');
      });

      const formattedTxt = formattedLines.join('\n');
      textPreview = formattedTxt.slice(0, 1000);
      outputBlob = new Blob([formattedTxt], { type: 'text/plain;charset=utf-8' });
      break;
    }

    case 'pdf': {
      mimeType = 'application/pdf';
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595.28; // A4 Portrait
      const pageHeight = 841.89;
      const margin = 40;
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      // Title
      currentPage.drawText(`${baseName} - ${sheetName}`, {
        x: margin,
        y: currentY,
        size: 16,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      currentY -= 25;

      const rows = rawTableData.slice(0, 100); // Up to 100 rows
      const rowHeight = 16;

      for (let rIdx = 0; rIdx < rows.length; rIdx++) {
        const row = rows[rIdx];
        if (currentY < margin + rowHeight) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        const isHeader = rIdx === 0;
        const lineText = row.map((c) => String(c ?? '')).join('  |  ');
        const truncatedText = lineText.length > 90 ? lineText.substring(0, 87) + '...' : lineText;

        currentPage.drawText(truncatedText, {
          x: margin,
          y: currentY,
          size: isHeader ? 10 : 9,
          font: isHeader ? boldFont : font,
          color: isHeader ? rgb(0.1, 0.2, 0.5) : rgb(0.2, 0.2, 0.2)
        });

        currentY -= rowHeight;
      }

      const pdfBytes = await pdfDoc.save();
      outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
      break;
    }

    default:
      throw new Error(`Unsupported spreadsheet target format: ${targetFormat}`);
  }

  return {
    fileName: `${baseName}.${targetFormat}`,
    blob: outputBlob,
    mimeType,
    textPreview,
    tableData: rawTableData.slice(0, 15) // First 15 rows for visual preview
  };
}

/**
 * Presentation Engine: Extracts slides and text from PPTX files using JSZip.
 */
export async function convertPresentation(
  file: File,
  targetFormat: string
): Promise<ConversionResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // Extract all slide XML files
  const slideFiles = Object.keys(zip.files).filter((name) =>
    name.match(/^ppt\/slides\/slide\d+\.xml$/)
  );

  // Sort numerically by slide number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
    return numA - numB;
  });

  const slidesData: { slideNum: number; texts: string[] }[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const xmlContent = await zip.files[slideFiles[i]].async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'application/xml');

    // Extract all <a:t> text tags
    const textNodes = doc.getElementsByTagNameNS('*', 't');
    const texts: string[] = [];
    for (let t = 0; t < textNodes.length; t++) {
      const val = textNodes[t].textContent?.trim();
      if (val) texts.push(val);
    }

    slidesData.push({
      slideNum: i + 1,
      texts
    });
  }

  let outputBlob: Blob;
  let mimeType = 'text/plain';
  let textPreview = '';

  if (targetFormat === 'txt') {
    const fullText = slidesData
      .map((s) => `--- Slide ${s.slideNum} ---\n${s.texts.join('\n')}`)
      .join('\n\n');
    textPreview = fullText.slice(0, 1000);
    outputBlob = new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  } else if (targetFormat === 'html') {
    mimeType = 'text/html';
    const htmlSlides = slidesData
      .map(
        (s) => `<section class="slide" style="border:1px solid #e2e8f0; border-radius:12px; padding:24px; margin-bottom:24px; background:#fff;">
          <h3 style="color:#e11d48; margin-top:0;">Slide ${s.slideNum}</h3>
          <div style="line-height:1.6; font-size:15px; color:#1e293b;">
            ${s.texts.map((t) => `<p>${t}</p>`).join('')}
          </div>
        </section>`
      )
      .join('\n');

    const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${baseName} - Slides</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:30px auto;background:#f8fafc;padding:0 20px;}</style></head><body><h1>${baseName}</h1>${htmlSlides}</body></html>`;
    textPreview = fullHtml.slice(0, 1000);
    outputBlob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
  } else if (targetFormat === 'docx') {
    mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    const docParagraphs: string[] = [];
    slidesData.forEach((s) => {
      docParagraphs.push(`=== SLIDE ${s.slideNum} ===`);
      docParagraphs.push(...s.texts);
      docParagraphs.push('');
    });
    outputBlob = await createWordDocumentFromText(`${baseName} - Presentation Outline`, docParagraphs);
  } else {
    // PDF
    mimeType = 'application/pdf';
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 792; // US Letter Landscape for presentation feel
    const pageHeight = 612;
    const margin = 50;

    slidesData.forEach((s) => {
      const page = pdfDoc.addPage([pageWidth, pageHeight]);
      let curY = pageHeight - margin;

      // Slide header
      page.drawText(`${baseName} — Slide ${s.slideNum}`, {
        x: margin,
        y: curY,
        size: 18,
        font: boldFont,
        color: rgb(0.88, 0.11, 0.28)
      });
      curY -= 35;

      s.texts.forEach((txt) => {
        if (curY > margin + 15) {
          const truncated = txt.length > 100 ? txt.substring(0, 97) + '...' : txt;
          page.drawText(truncated, {
            x: margin + 15,
            y: curY,
            size: 13,
            font: font,
            color: rgb(0.15, 0.2, 0.25)
          });
          curY -= 22;
        }
      });
    });

    const pdfBytes = await pdfDoc.save();
    outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  }

  return {
    fileName: `${baseName}.${targetFormat}`,
    blob: outputBlob,
    mimeType,
    textPreview
  };
}

/**
 * Document & Text Conversion Engine (DOCX, TXT, MD, HTML to PDF, DOCX, etc.).
 */
export async function convertDocument(
  file: File,
  targetFormat: string
): Promise<ConversionResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  let outputBlob: Blob;
  let mimeType = 'application/octet-stream';
  let textPreview = '';

  if (ext === 'docx') {
    const arrayBuffer = await file.arrayBuffer();
    if (targetFormat === 'pdf') {
      mimeType = 'application/pdf';
      const pdfBytes = await convertDocxToPdf(arrayBuffer, baseName);
      outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    } else if (targetFormat === 'html') {
      mimeType = 'text/html';
      const { html } = await extractFromDocx(arrayBuffer);
      textPreview = html.slice(0, 1000);
      outputBlob = new Blob([html], { type: 'text/html;charset=utf-8' });
    } else {
      // txt
      mimeType = 'text/plain';
      const { text } = await extractFromDocx(arrayBuffer);
      textPreview = text.slice(0, 1000);
      outputBlob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    }
  } else if (ext === 'txt' || ext === 'md' || ext === 'html') {
    const textContent = await file.text();
    textPreview = textContent.slice(0, 1000);

    if (targetFormat === 'pdf') {
      mimeType = 'application/pdf';
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
      let currentY = pageHeight - margin;

      currentPage.drawText(baseName, {
        x: margin,
        y: currentY,
        size: 18,
        font: boldFont,
        color: rgb(0.1, 0.1, 0.1)
      });
      currentY -= 30;

      const lines = textContent.split('\n');
      for (const line of lines) {
        if (currentY < margin + 18) {
          currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
          currentY = pageHeight - margin;
        }

        const safeLine = line.replace(/\r/g, '').substring(0, 95);
        currentPage.drawText(safeLine || ' ', {
          x: margin,
          y: currentY,
          size: 11,
          font: font,
          color: rgb(0.2, 0.2, 0.2)
        });
        currentY -= 16;
      }

      const pdfBytes = await pdfDoc.save();
      outputBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
    } else if (targetFormat === 'docx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const paragraphs = textContent.split('\n').filter((l) => l.trim().length > 0);
      outputBlob = await createWordDocumentFromText(baseName, paragraphs);
    } else if (targetFormat === 'html') {
      mimeType = 'text/html';
      const htmlBody = textContent
        .split('\n\n')
        .map((p) => `<p>${p.replace(/\n/g, '<br/>')}</p>`)
        .join('');
      const fullHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${baseName}</title><style>body{font-family:system-ui;max-width:800px;margin:40px auto;line-height:1.6;padding:0 20px;}</style></head><body><h1>${baseName}</h1>${htmlBody}</body></html>`;
      outputBlob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
    } else if (targetFormat === 'json') {
      mimeType = 'application/json';
      const paragraphs = textContent.split('\n\n').filter((p) => p.trim());
      const jsonStr = JSON.stringify({ documentTitle: baseName, paragraphs }, null, 2);
      outputBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    } else {
      // txt
      mimeType = 'text/plain';
      outputBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    }
  } else {
    throw new Error(`Unsupported document input format: ${ext}`);
  }

  return {
    fileName: `${baseName}.${targetFormat}`,
    blob: outputBlob,
    mimeType,
    textPreview
  };
}

/**
 * Data Conversion Engine (JSON, XML, YAML to CSV, XLSX, XML, YAML, TXT).
 */
export async function convertData(
  file: File,
  targetFormat: string
): Promise<ConversionResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const content = await file.text();

  let outputBlob: Blob;
  let mimeType = 'application/octet-stream';
  let textPreview = '';

  if (ext === 'json') {
    const parsed = JSON.parse(content);
    const items = Array.isArray(parsed) ? parsed : [parsed];

    if (targetFormat === 'csv' || targetFormat === 'tsv') {
      const delimiter = targetFormat === 'tsv' ? '\t' : ',';
      mimeType = targetFormat === 'tsv' ? 'text/tab-separated-values' : 'text/csv';

      // Extract unique headers
      const headers = Array.from(new Set(items.flatMap((item) => (typeof item === 'object' && item !== null ? Object.keys(item) : ['value']))));
      const csvLines = [headers.join(delimiter)];

      items.forEach((item) => {
        const row = headers.map((h) => {
          const val = typeof item === 'object' && item !== null ? item[h] : item;
          const str = String(val ?? '');
          return str.includes(delimiter) || str.includes('"') || str.includes('\n')
            ? `"${str.replace(/"/g, '""')}"`
            : str;
        });
        csvLines.push(row.join(delimiter));
      });

      const csvContent = csvLines.join('\n');
      textPreview = csvContent.slice(0, 1000);
      outputBlob = new Blob([csvContent], { type: `${mimeType};charset=utf-8` });
    } else if (targetFormat === 'xlsx') {
      mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      const ws = XLSX.utils.json_to_sheet(items);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Data');
      const outBuf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      outputBlob = new Blob([outBuf], { type: mimeType });
    } else if (targetFormat === 'xml') {
      mimeType = 'application/xml';
      const xmlItems = items
        .map((it) => {
          if (typeof it === 'object' && it !== null) {
            const props = Object.entries(it)
              .map(([k, v]) => `    <${k}>${String(v ?? '')}</${k}>`)
              .join('\n');
            return `  <item>\n${props}\n  </item>`;
          }
          return `  <item>${String(it)}</item>`;
        })
        .join('\n');
      const xmlDoc = `<?xml version="1.0" encoding="UTF-8"?>\n<root>\n${xmlItems}\n</root>`;
      textPreview = xmlDoc.slice(0, 1000);
      outputBlob = new Blob([xmlDoc], { type: 'application/xml;charset=utf-8' });
    } else if (targetFormat === 'yaml') {
      mimeType = 'text/yaml';
      // Simple clean YAML serialization
      const yamlItems = items
        .map((it) => {
          if (typeof it === 'object' && it !== null) {
            return (
              '- ' +
              Object.entries(it)
                .map(([k, v], idx) => `${idx > 0 ? '  ' : ''}${k}: ${JSON.stringify(v)}`)
                .join('\n')
            );
          }
          return `- ${JSON.stringify(it)}`;
        })
        .join('\n');
      textPreview = yamlItems.slice(0, 1000);
      outputBlob = new Blob([yamlItems], { type: 'text/yaml;charset=utf-8' });
    } else {
      // txt
      mimeType = 'text/plain';
      textPreview = content.slice(0, 1000);
      outputBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    }
  } else if (ext === 'xml') {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, 'application/xml');

    if (targetFormat === 'json') {
      mimeType = 'application/json';
      const items: any[] = [];
      const itemNodes = xmlDoc.getElementsByTagName('item');
      if (itemNodes.length > 0) {
        for (let i = 0; i < itemNodes.length; i++) {
          const obj: any = {};
          const children = itemNodes[i].children;
          for (let c = 0; c < children.length; c++) {
            obj[children[c].tagName] = children[c].textContent;
          }
          items.push(obj);
        }
      } else {
        // Fallback root
        items.push({ text: xmlDoc.documentElement.textContent });
      }
      const jsonStr = JSON.stringify(items, null, 2);
      textPreview = jsonStr.slice(0, 1000);
      outputBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    } else {
      // txt
      mimeType = 'text/plain';
      textPreview = content.slice(0, 1000);
      outputBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    }
  } else {
    // YAML
    mimeType = 'text/plain';
    outputBlob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    textPreview = content.slice(0, 1000);
  }

  return {
    fileName: `${baseName}.${targetFormat}`,
    blob: outputBlob,
    mimeType,
    textPreview
  };
}

/**
 * Archive Engine: Unpack ZIP files.
 */
export async function convertArchive(file: File): Promise<ConversionResult> {
  const baseName = file.name.replace(/\.[^/.]+$/, '');
  const buffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  const extractedFiles: { name: string; blob: Blob }[] = [];
  const entries = Object.keys(zip.files).filter((k) => !zip.files[k].dir);

  for (const entryName of entries) {
    const entryData = await zip.files[entryName].async('blob');
    extractedFiles.push({
      name: entryName.split('/').pop() || entryName,
      blob: entryData
    });
  }

  const manifest = `Archive: ${file.name}\nTotal Files: ${extractedFiles.length}\n\n` +
    extractedFiles.map((f, i) => `${i + 1}. ${f.name} (${(f.blob.size / 1024).toFixed(1)} KB)`).join('\n');

  return {
    fileName: `${baseName}_extracted.txt`,
    blob: new Blob([manifest], { type: 'text/plain' }),
    mimeType: 'text/plain',
    textPreview: manifest,
    extractedFiles
  };
}

/**
 * Master Universal Conversion Pipeline.
 * Determines the category of the file and invokes the verified client-side engine.
 */
export async function executeUniversalConversion(
  file: File,
  targetFormat: string,
  options: ConversionOptions = {}
): Promise<ConversionResult> {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. Image Formats
  if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif', 'svg', 'ico'].includes(ext)) {
    return await convertImage(file, targetFormat, options);
  }

  // 2. Spreadsheets
  if (['xlsx', 'xls', 'csv', 'tsv', 'ods'].includes(ext)) {
    return await convertSpreadsheet(file, targetFormat, options);
  }

  // 3. Presentations
  if (['pptx'].includes(ext)) {
    return await convertPresentation(file, targetFormat);
  }

  // 4. Documents
  if (['docx', 'doc', 'txt', 'md', 'html'].includes(ext)) {
    return await convertDocument(file, targetFormat);
  }

  // 5. Data & Structured
  if (['json', 'xml', 'yaml', 'yml'].includes(ext)) {
    return await convertData(file, targetFormat);
  }

  // 6. Archives
  if (['zip'].includes(ext)) {
    return await convertArchive(file);
  }

  throw new Error(`Unsupported input format ".${ext}". Please check the compatibility registry.`);
}

/**
 * Creates a downloadable ZIP archive containing multiple converted files.
 */
export async function bundleResultsIntoZip(
  results: { fileName: string; blob: Blob }[],
  zipName = 'converted_files.zip'
): Promise<Blob> {
  const zip = new JSZip();
  results.forEach((r) => {
    zip.file(r.fileName, r.blob);
  });
  return await zip.generateAsync({ type: 'blob' });
}
