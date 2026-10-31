export interface InpaintingResult {
  patchCanvas: HTMLCanvasElement;
  primaryBgHex: string;
  primaryBgRgb: { r: number; g: number; b: number };
  isGradient: boolean;
  textureNoise: number;
}

/**
 * Smart background reconstruction engine.
 * Samples neighboring perimeter pixels around the text bounding box,
 * detects solid tints, paper grain, or gradients, and synthesizes a seamless inpainting patch.
 */
export function reconstructBackgroundPatch(
  sourceCanvas: HTMLCanvasElement,
  box: { x: number; y: number; width: number; height: number },
  padding = 4
): InpaintingResult {
  const patchCanvas = document.createElement('canvas');
  const patchWidth = Math.ceil(box.width + padding * 2);
  const patchHeight = Math.ceil(box.height + padding * 2);
  patchCanvas.width = patchWidth;
  patchCanvas.height = patchHeight;

  const patchCtx = patchCanvas.getContext('2d');
  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });

  if (!patchCtx || !srcCtx) {
    const fallbackCanvas = document.createElement('canvas');
    fallbackCanvas.width = patchWidth;
    fallbackCanvas.height = patchHeight;
    return {
      patchCanvas: fallbackCanvas,
      primaryBgHex: '#ffffff',
      primaryBgRgb: { r: 1, g: 1, b: 1 },
      isGradient: false,
      textureNoise: 0
    };
  }

  // Define perimeter sampling strips (outside the old text glyphs)
  const leftX = Math.max(0, Math.floor(box.x - padding * 2));
  const rightX = Math.min(sourceCanvas.width - 2, Math.floor(box.x + box.width + padding));
  const topY = Math.max(0, Math.floor(box.y - padding * 2));
  const bottomY = Math.min(sourceCanvas.height - 2, Math.floor(box.y + box.height + padding));

  // Sample top perimeter row
  let topR = 0, topG = 0, topB = 0, topCount = 0;
  try {
    const topData = srcCtx.getImageData(leftX, topY, Math.max(1, rightX - leftX), 2).data;
    for (let i = 0; i < topData.length; i += 4) {
      topR += topData[i];
      topG += topData[i + 1];
      topB += topData[i + 2];
      topCount++;
    }
  } catch (e) {}

  // Sample bottom perimeter row
  let botR = 0, botG = 0, botB = 0, botCount = 0;
  try {
    const botData = srcCtx.getImageData(leftX, bottomY, Math.max(1, rightX - leftX), 2).data;
    for (let i = 0; i < botData.length; i += 4) {
      botR += botData[i];
      botG += botData[i + 1];
      botB += botData[i + 2];
      botCount++;
    }
  } catch (e) {}

  // Compute averages
  const avgTopR = topCount > 0 ? Math.round(topR / topCount) : 255;
  const avgTopG = topCount > 0 ? Math.round(topG / topCount) : 255;
  const avgTopB = topCount > 0 ? Math.round(topB / topCount) : 255;

  const avgBotR = botCount > 0 ? Math.round(botR / botCount) : avgTopR;
  const avgBotG = botCount > 0 ? Math.round(botG / botCount) : avgTopG;
  const avgBotB = botCount > 0 ? Math.round(botB / botCount) : avgTopB;

  // Overall average
  const meanR = Math.round((avgTopR + avgBotR) / 2);
  const meanG = Math.round((avgTopG + avgBotG) / 2);
  const meanB = Math.round((avgTopB + avgBotB) / 2);

  const rgbToHex = (r: number, g: number, b: number) =>
    `#${[r, g, b].map((c) => Math.min(255, Math.max(0, c)).toString(16).padStart(2, '0')).join('')}`;

  const primaryBgHex = rgbToHex(meanR, meanG, meanB);

  // Gradient delta check
  const deltaLuminance = Math.abs(
    (0.299 * avgTopR + 0.587 * avgTopG + 0.114 * avgTopB) -
    (0.299 * avgBotR + 0.587 * avgBotG + 0.114 * avgBotB)
  );

  const isGradient = deltaLuminance > 8;

  if (isGradient) {
    // Render smooth vertical gradient matching page shading
    const grad = patchCtx.createLinearGradient(0, 0, 0, patchHeight);
    grad.addColorStop(0, `rgb(${avgTopR}, ${avgTopG}, ${avgTopB})`);
    grad.addColorStop(1, `rgb(${avgBotR}, ${avgBotG}, ${avgBotB})`);
    patchCtx.fillStyle = grad;
    patchCtx.fillRect(0, 0, patchWidth, patchHeight);
  } else {
    // Solid background tint (cream, aged yellow, light gray, custom fill)
    patchCtx.fillStyle = `rgb(${meanR}, ${meanG}, ${meanB})`;
    patchCtx.fillRect(0, 0, patchWidth, patchHeight);
  }

  // Apply subtle micro-texture / grain for aged or scanned paper
  const patchImgData = patchCtx.getImageData(0, 0, patchWidth, patchHeight);
  const pData = patchImgData.data;

  // Slight edge feathering (soft alpha roll-off on outer 2px perimeter)
  for (let y = 0; y < patchHeight; y++) {
    for (let x = 0; x < patchWidth; x++) {
      const idx = (y * patchWidth + x) * 4;
      const distFromEdge = Math.min(x, patchWidth - 1 - x, y, patchHeight - 1 - y);

      // Micro paper grain jitter
      const grain = (Math.random() - 0.5) * 4;
      pData[idx] = Math.min(255, Math.max(0, pData[idx] + grain));
      pData[idx + 1] = Math.min(255, Math.max(0, pData[idx + 1] + grain));
      pData[idx + 2] = Math.min(255, Math.max(0, pData[idx + 2] + grain));

      if (distFromEdge < 2) {
        pData[idx + 3] = Math.round(((distFromEdge + 1) / 3) * 255);
      }
    }
  }

  patchCtx.putImageData(patchImgData, 0, 0);

  return {
    patchCanvas,
    primaryBgHex,
    primaryBgRgb: {
      r: meanR / 255,
      g: meanG / 255,
      b: meanB / 255
    },
    isGradient,
    textureNoise: 4
  };
}
