import { createWorker } from 'tesseract.js';

export interface OcrResultBlock {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrJobResult {
  fullText: string;
  confidence: number;
  blocks: OcrResultBlock[];
  language: string;
}

export type OcrProgressCallback = (progress: {
  status: string;
  percent: number;
}) => void;

/**
 * Runs Tesseract OCR on an image URL, canvas, or blob.
 * Supports English ('eng'), Hindi ('hin'), and bilingual ('eng+hin').
 */
export async function runOcrRecognition(
  imageSource: string | HTMLCanvasElement | Blob,
  language: 'eng' | 'hin' | 'hin+eng' = 'eng',
  onProgress?: OcrProgressCallback
): Promise<OcrJobResult> {
  const worker = await createWorker(language, 1, {
    logger: (m) => {
      if (onProgress && m.status) {
        const percent = Math.round((m.progress || 0) * 100);
        let humanStatus = 'Initializing OCR engine...';
        if (m.status === 'loading tesseract core') humanStatus = 'Loading OCR core engine...';
        else if (m.status.includes('loading language')) humanStatus = `Loading ${language.toUpperCase()} language model...`;
        else if (m.status === 'initializing api') humanStatus = 'Calibrating text segmentation...';
        else if (m.status === 'recognizing text') humanStatus = `Recognizing text (${percent}%)...`;

        onProgress({ status: humanStatus, percent });
      }
    }
  });

  try {
    const ret = await worker.recognize(imageSource);
    await worker.terminate();

    const blocks: OcrResultBlock[] = [];
    const dataAny = ret.data as any;
    if (dataAny && dataAny.paragraphs) {
      for (const p of dataAny.paragraphs) {
        if (p.text && p.text.trim()) {
          blocks.push({
            text: p.text.trim(),
            confidence: Math.round(p.confidence || 0),
            bbox: p.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
          });
        }
      }
    }

    return {
      fullText: ret.data.text || '',
      confidence: Math.round(ret.data.confidence || 0),
      blocks,
      language
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}
