import { PDFPage, rgb, degrees } from 'pdf-lib';

export interface PageBackgroundConfig {
  type: 'none' | 'solid' | 'gradient' | 'image';
  solidColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  gradientAngle?: number;
  imageUrl?: string;
  imageFit?: 'cover' | 'contain' | 'fill';
  imageOpacity?: number;
}

export const SOLID_COLOR_PRESETS = [
  { name: 'Pure White', hex: '#ffffff' },
  { name: 'Warm Cream / Ivory', hex: '#fdfbf7' },
  { name: 'Parchment / Antique', hex: '#fbf4ea' },
  { name: 'Soft Gray', hex: '#f1f5f9' },
  { name: 'Cool Slate', hex: '#e2e8f0' },
  { name: 'Sky Tint', hex: '#f0f9ff' },
  { name: 'Soft Mint', hex: '#f0fdf4' },
  { name: 'Rose Quartz', hex: '#fff1f2' },
  { name: 'Subtle Lavender', hex: '#faf5ff' },
  { name: 'Executive Dark Slate', hex: '#0f172a' }
];

export const GRADIENT_PRESETS = [
  { name: 'Warm Sunset', start: '#fff1eb', end: '#ace0f9' },
  { name: 'Subtle Slate', start: '#f8fafc', end: '#e2e8f0' },
  { name: 'Morning Mist', start: '#fdfbfb', end: '#ebedee' },
  { name: 'Executive Ivory', start: '#ffecd2', end: '#fcb69f' },
  { name: 'Nordic Frost', start: '#e0c3fc', end: '#8ec5fc' }
];

export function hexToRgb01(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.substring(0, 2), 16) / 255 || 0;
  const g = parseInt(clean.substring(2, 4), 16) / 255 || 0;
  const b = parseInt(clean.substring(4, 6), 16) / 255 || 0;
  return { r, g, b };
}

/**
 * Draws background layer directly onto PDF page buffer.
 * Positioned underneath foreground text and images.
 */
export async function applyBackgroundToPdfDocPage(
  page: PDFPage,
  config: PageBackgroundConfig,
  embedImageFn?: (dataUrl: string) => Promise<any>
) {
  if (config.type === 'none') return;

  const { width, height } = page.getSize();

  if (config.type === 'solid' && config.solidColor) {
    const { r, g, b } = hexToRgb01(config.solidColor);
    page.drawRectangle({
      x: 0,
      y: 0,
      width,
      height,
      color: rgb(r, g, b),
      opacity: 1
    });
  } else if (config.type === 'gradient' && config.gradientStart && config.gradientEnd) {
    // In PDF-lib, multi-stop gradients are approximated with stepped bands or blended solid base
    const start = hexToRgb01(config.gradientStart);
    const end = hexToRgb01(config.gradientEnd);
    const bands = 24;
    const bandHeight = height / bands;

    for (let i = 0; i < bands; i++) {
      const t = i / (bands - 1);
      const r = start.r + (end.r - start.r) * t;
      const g = start.g + (end.g - start.g) * t;
      const b = start.b + (end.b - start.b) * t;

      page.drawRectangle({
        x: 0,
        y: i * bandHeight,
        width,
        height: bandHeight + 1,
        color: rgb(r, g, b),
        opacity: 1
      });
    }
  } else if (config.type === 'image' && config.imageUrl && embedImageFn) {
    try {
      const embeddedImg = await embedImageFn(config.imageUrl);
      page.drawImage(embeddedImg, {
        x: 0,
        y: 0,
        width,
        height,
        opacity: config.imageOpacity ?? 0.8
      });
    } catch (e) {
      console.error('Failed to embed background image:', e);
    }
  }
}
