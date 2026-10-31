import * as pdfjsLib from 'pdfjs-dist';

export interface DetectedFontInfo {
  fontName: string;
  category: 'sans-serif' | 'serif' | 'monospace' | 'devanagari-sans' | 'devanagari-serif';
  matchedFamily: string;
  isBold: boolean;
  isItalic: boolean;
  estimatedWeight: number; // 400 or 700
  script: 'latin' | 'devanagari' | 'mixed';
}

export interface IntelligentTextElement {
  id: string;
  pageNumber: number;
  str: string;
  originalStr: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  color: string;
  bgColor: string;
  alignment: 'left' | 'center' | 'right';
  fontInfo: DetectedFontInfo;
  isScannedText?: boolean;
  isDeleted?: boolean;
  confidence?: number;
}

/**
 * Detects whether a string contains Devanagari script (Hindi/Sanskrit/Marathi).
 */
export function detectScript(text: string): 'latin' | 'devanagari' | 'mixed' {
  const hasDevanagari = /[\u0900-\u097F]/.test(text);
  const hasLatin = /[a-zA-Z]/.test(text);

  if (hasDevanagari && hasLatin) return 'mixed';
  if (hasDevanagari) return 'devanagari';
  return 'latin';
}

/**
 * Matches an embedded PDF font name to the visually closest web-safe / Google Font.
 */
export function matchFontFamily(rawFontName: string, textSample: string): DetectedFontInfo {
  const script = detectScript(textSample);
  const lower = (rawFontName || '').toLowerCase();

  const isBold = lower.includes('bold') || lower.includes('black') || lower.includes('heavy') || lower.includes('b-');
  const isItalic = lower.includes('italic') || lower.includes('oblique') || lower.includes('it-');
  const isMono = lower.includes('mono') || lower.includes('courier') || lower.includes('consolas');
  const isSerif = !isMono && (lower.includes('times') || lower.includes('serif') || lower.includes('georgia') || lower.includes('cambria') || lower.includes('garamond') || lower.includes('roman'));

  let category: DetectedFontInfo['category'] = 'sans-serif';
  let matchedFamily = "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif";

  if (script === 'devanagari' || script === 'mixed') {
    if (isSerif) {
      category = 'devanagari-serif';
      matchedFamily = "'Noto Serif Devanagari', 'Kokila', serif";
    } else {
      category = 'devanagari-sans';
      matchedFamily = "'Noto Sans Devanagari', 'Mangal', 'Plus Jakarta Sans', sans-serif";
    }
  } else if (isMono) {
    category = 'monospace';
    matchedFamily = "'JetBrains Mono', 'Courier New', monospace";
  } else if (isSerif) {
    category = 'serif';
    matchedFamily = "'Times New Roman', 'Georgia', 'Cambria', serif";
  } else {
    // Sans-serif matching
    if (lower.includes('arial')) {
      matchedFamily = "Arial, 'Plus Jakarta Sans', sans-serif";
    } else if (lower.includes('calibri')) {
      matchedFamily = "Calibri, 'Plus Jakarta Sans', sans-serif";
    } else if (lower.includes('roboto')) {
      matchedFamily = "Roboto, 'Plus Jakarta Sans', sans-serif";
    } else {
      matchedFamily = "'Plus Jakarta Sans', Helvetica, Arial, sans-serif";
    }
  }

  return {
    fontName: rawFontName || 'Default',
    category,
    matchedFamily,
    isBold,
    isItalic,
    estimatedWeight: isBold ? 700 : 400,
    script
  };
}

/**
 * Samples the text color from canvas pixels by inspecting ink values within the bounding box.
 */
export function sampleTextColorFromCanvas(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
): { textColor: string; bgColor: string } {
  try {
    const rx = Math.max(0, Math.floor(x));
    const ry = Math.max(0, Math.floor(y));
    const rw = Math.min(ctx.canvas.width - rx, Math.max(4, Math.floor(width)));
    const rh = Math.min(ctx.canvas.height - ry, Math.max(4, Math.floor(height)));

    const imgData = ctx.getImageData(rx, ry, rw, rh);
    const data = imgData.data;

    let darkestLuminance = 255;
    let darkR = 20, darkG = 20, darkB = 20;

    let brightestLuminance = 0;
    let brightR = 255, brightG = 255, brightB = 255;

    for (let i = 0; i < data.length; i += 16) { // sample every 4th pixel
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      if (lum < darkestLuminance) {
        darkestLuminance = lum;
        darkR = r; darkG = g; darkB = b;
      }
      if (lum > brightestLuminance) {
        brightestLuminance = lum;
        brightR = r; brightG = g; brightB = b;
      }
    }

    const rgbToHex = (r: number, g: number, b: number) =>
      `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;

    // If background is light, text is dark; if background is dark, text is light
    const isLightBg = brightestLuminance > 128;
    const textHex = isLightBg ? rgbToHex(darkR, darkG, darkB) : rgbToHex(brightR, brightG, brightB);
    const bgHex = isLightBg ? rgbToHex(brightR, brightG, brightB) : rgbToHex(darkR, darkG, darkB);

    return {
      textColor: textHex || '#000000',
      bgColor: bgHex || '#ffffff'
    };
  } catch (e) {
    return { textColor: '#000000', bgColor: '#ffffff' };
  }
}
