import { createWorker } from 'tesseract.js';

export interface OcrWordBlock {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
}

export interface OcrResultBlock {
  text: string;
  confidence: number;
  bbox: {
    x0: number;
    y0: number;
    x1: number;
    y1: number;
  };
  words?: OcrWordBlock[];
}

export interface OcrJobResult {
  fullText: string;
  confidence: number;
  blocks: OcrResultBlock[];
  language: string;
  extractedTable?: string[][];
}

export type OcrProgressCallback = (progress: {
  status: string;
  percent: number;
}) => void;

/**
 * Heuristic Table Clustering:
 * Takes recognized lines/words and organizes them into a tabular 2D array of rows and columns.
 */
export function reconstructTableFromOcr(lines: { text: string; words?: { text: string; bbox: any }[] }[]): string[][] {
  if (!lines || lines.length === 0) return [];

  const tableRows: string[][] = [];

  for (const line of lines) {
    if (!line.text || !line.text.trim()) continue;

    // If word bounding boxes exist, split by spatial gaps
    if (line.words && line.words.length > 1) {
      const rowCells: string[] = [];
      let currentCellWords: string[] = [line.words[0].text];

      for (let i = 1; i < line.words.length; i++) {
        const prevWord = line.words[i - 1];
        const curWord = line.words[i];
        const gap = curWord.bbox.x0 - prevWord.bbox.x1;

        // If gap is wider than 25px or double standard space, treat as separate column
        if (gap > 24) {
          rowCells.push(currentCellWords.join(' ').trim());
          currentCellWords = [curWord.text];
        } else {
          currentCellWords.push(curWord.text);
        }
      }
      if (currentCellWords.length > 0) {
        rowCells.push(currentCellWords.join(' ').trim());
      }
      tableRows.push(rowCells);
    } else {
      // Split by tab, pipe, or multiple spaces
      const parts = line.text.split(/ {2,}|\t|\|/).map((p) => p.trim()).filter(Boolean);
      tableRows.push(parts.length > 0 ? parts : [line.text.trim()]);
    }
  }

  // Normalize column count
  const maxCols = Math.max(1, ...tableRows.map((r) => r.length));
  return tableRows.map((row) => {
    while (row.length < maxCols) row.push('');
    return row;
  });
}

/**
 * Runs Tesseract OCR on an image URL, canvas, or blob.
 * Supports English ('eng'), Hindi ('hin'), and bilingual ('hin+eng').
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
    const linesForTable: { text: string; words?: { text: string; bbox: any }[] }[] = [];

    const dataAny = ret.data as any;

    if (dataAny && dataAny.lines) {
      for (const line of dataAny.lines) {
        if (line.text && line.text.trim()) {
          const wordBlocks: OcrWordBlock[] = [];
          if (line.words) {
            for (const w of line.words) {
              if (w.text && w.text.trim()) {
                wordBlocks.push({
                  text: w.text.trim(),
                  confidence: Math.round(w.confidence || 0),
                  bbox: w.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 }
                });
              }
            }
          }

          linesForTable.push({
            text: line.text.trim(),
            words: wordBlocks
          });

          blocks.push({
            text: line.text.trim(),
            confidence: Math.round(line.confidence || 0),
            bbox: line.bbox || { x0: 0, y0: 0, x1: 0, y1: 0 },
            words: wordBlocks
          });
        }
      }
    }

    const extractedTable = reconstructTableFromOcr(linesForTable);

    return {
      fullText: ret.data.text || '',
      confidence: Math.round(ret.data.confidence || 0),
      blocks,
      language,
      extractedTable
    };
  } catch (error) {
    await worker.terminate();
    throw error;
  }
}
