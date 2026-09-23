import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { buildPdfResult, groupWordsIntoLines, type PdfWord } from './pdfLayout';
import type { ImportResult } from './types';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function parsePdfFile(file: File): Promise<ImportResult> {
  const data = await file.arrayBuffer();
  return extractProductsFromData(new Uint8Array(data), file.name);
}

export async function extractProductsFromData(
  data: Uint8Array,
  fileName = 'arquivo.pdf',
): Promise<ImportResult> {
  const doc = await pdfjsLib.getDocument({ data }).promise;

  const lines: PdfWord[][] = [];
  for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
    const page = await doc.getPage(pageNum);
    const content = await page.getTextContent();
    const items = (content.items as Array<{ str?: string; transform?: number[]; width?: number }>).filter(
      (item) => typeof item.str === 'string' && item.transform !== undefined,
    );
    const words: PdfWord[] = items.map((item) => {
      const h = Math.abs(item.transform![3]) || 10;
      return {
        text: item.str ?? '',
        x: item.transform![4],
        y: item.transform![5],
        h,
        w: typeof item.width === 'number' ? item.width : String(item.str ?? '').length * h * 0.55,
      };
    });
    lines.push(...groupWordsIntoLines(words));
  }

  return buildPdfResult(lines, fileName);
}