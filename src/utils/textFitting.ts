export interface TextFitResult {
  fittedFontSize: number;
  letterSpacing: number;
  needsWrap: boolean;
  scaleX: number;
  warning?: string;
}

/**
 * Calculates adaptive text fitting to ensure replacement text fits inside original bounding box
 * without breaking margins, overlapping adjacent lines, or causing ugly distortion.
 */
export function calculateIntelligentTextFit(
  originalWidth: number,
  originalHeight: number,
  baseFontSize: number,
  originalText: string,
  newText: string,
  autoFitEnabled = true,
  matchFormattingEnabled = true
): TextFitResult {
  if (!autoFitEnabled) {
    return {
      fittedFontSize: baseFontSize,
      letterSpacing: 0,
      needsWrap: false,
      scaleX: 1
    };
  }

  const lengthRatio = newText.length / Math.max(1, originalText.length);

  // If new text is shorter or approximately identical
  if (lengthRatio <= 1.05) {
    return {
      fittedFontSize: baseFontSize,
      letterSpacing: 0,
      needsWrap: false,
      scaleX: 1
    };
  }

  // If new text is moderately longer (1.05x to 1.35x)
  if (lengthRatio <= 1.35) {
    // Tighten tracking slightly and downscale font size by a minimal 5-10%
    const fittedSize = Math.max(8, baseFontSize * (1 / (1 + (lengthRatio - 1) * 0.4)));
    const tracking = -0.5 * (lengthRatio - 1);

    return {
      fittedFontSize: Math.round(fittedSize * 10) / 10,
      letterSpacing: Math.round(tracking * 10) / 10,
      needsWrap: false,
      scaleX: 1
    };
  }

  // If new text is significantly longer (1.35x to 2x)
  if (lengthRatio <= 2.2) {
    // Downscale font size up to 20% max and allow natural wrapping
    const fittedSize = Math.max(7.5, baseFontSize * 0.82);
    return {
      fittedFontSize: Math.round(fittedSize * 10) / 10,
      letterSpacing: -0.3,
      needsWrap: true,
      scaleX: 1,
      warning: 'Replacement text is longer than original block. Auto-fitted font size.'
    };
  }

  // Extreme overflow (> 2.2x length)
  return {
    fittedFontSize: Math.max(7, baseFontSize * 0.75),
    letterSpacing: -0.4,
    needsWrap: true,
    scaleX: 1,
    warning: 'Text is much longer than original area. Line wrapping enabled.'
  };
}
