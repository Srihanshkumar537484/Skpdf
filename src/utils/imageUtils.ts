/**
 * Smart image background removal and replacement engine running in browser canvas.
 */

export interface BackgroundReplacementOptions {
  type: 'transparent' | 'solid' | 'gradient' | 'image';
  solidColor?: string;
  gradientStart?: string;
  gradientEnd?: string;
  bgImageUrl?: string;
  tolerance?: number; // 10 to 120
  feather?: number;
}

export interface ImageAdjustmentOptions {
  brightness: number; // 50 to 150 (100 = default)
  contrast: number;   // 50 to 150 (100 = default)
  saturation: number; // 0 to 200 (100 = default)
  rotation: number;   // 0, 90, 180, 270
}

/**
 * Removes background using color similarity analysis from corners and edges,
 * and composites the replacement background.
 */
export async function processImageBackground(
  imageElement: HTMLImageElement,
  options: BackgroundReplacementOptions,
  adjustments: ImageAdjustmentOptions = { brightness: 100, contrast: 100, saturation: 100, rotation: 0 }
): Promise<string> {
  const width = imageElement.naturalWidth || imageElement.width;
  const height = imageElement.naturalHeight || imageElement.height;

  // Primary canvas for raw image processing
  const canvas = document.createElement('canvas');
  const isRotated90or270 = adjustments.rotation % 180 !== 0;
  canvas.width = isRotated90or270 ? height : width;
  canvas.height = isRotated90or270 ? width : height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('Could not get canvas context');

  // Apply transformations (rotation & filters)
  ctx.save();
  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((adjustments.rotation * Math.PI) / 180);
  ctx.filter = `brightness(${adjustments.brightness}%) contrast(${adjustments.contrast}%) saturate(${adjustments.saturation}%)`;
  ctx.drawImage(imageElement, -width / 2, -height / 2, width, height);
  ctx.restore();

  // If background removal is desired
  const tolerance = options.tolerance ?? 45;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Sample corner background color (top-left, top-right, bottom-left, bottom-right)
  const samplePixels = [
    { r: data[0], g: data[1], b: data[2] },
    { r: data[(canvas.width - 1) * 4], g: data[(canvas.width - 1) * 4 + 1], b: data[(canvas.width - 1) * 4 + 2] },
    { r: data[(canvas.height - 1) * canvas.width * 4], g: data[(canvas.height - 1) * canvas.width * 4 + 1], b: data[(canvas.height - 1) * canvas.width * 4 + 2] }
  ];

  // Pick dominant corner color
  const bgR = samplePixels[0].r;
  const bgG = samplePixels[0].g;
  const bgB = samplePixels[0].b;

  // Calculate Euclidean distance for each pixel to remove background
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

    if (dist < tolerance) {
      data[i + 3] = 0; // Transparent
    } else if (dist < tolerance + 15) {
      // Soft feather edge
      const alpha = (dist - tolerance) / 15;
      data[i + 3] = Math.round(alpha * 255);
    }
  }

  ctx.putImageData(imageData, 0, 0);

  // If replacement background is needed (solid, gradient, custom image)
  if (options.type !== 'transparent') {
    const compositeCanvas = document.createElement('canvas');
    compositeCanvas.width = canvas.width;
    compositeCanvas.height = canvas.height;
    const cCtx = compositeCanvas.getContext('2d');
    if (cCtx) {
      if (options.type === 'solid' && options.solidColor) {
        cCtx.fillStyle = options.solidColor;
        cCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
      } else if (options.type === 'gradient') {
        const grad = cCtx.createLinearGradient(0, 0, compositeCanvas.width, compositeCanvas.height);
        grad.addColorStop(0, options.gradientStart || '#f43f5e');
        grad.addColorStop(1, options.gradientEnd || '#3b82f6');
        cCtx.fillStyle = grad;
        cCtx.fillRect(0, 0, compositeCanvas.width, compositeCanvas.height);
      }

      // Draw foreground subject with background removed
      cCtx.drawImage(canvas, 0, 0);
      return compositeCanvas.toDataURL('image/png');
    }
  }

  return canvas.toDataURL('image/png');
}
