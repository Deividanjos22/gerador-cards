// @vitest-environment node
import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { buildPdfResult, groupWordsIntoLines, type PdfWord } from './pdfLayout';

const PDF_PATH = process.env.CALIBRATE_PDF ?? 'C:/Users/user/Desktop/Encarte alterado 19 09 26.pdf';
const hasFile = fs.existsSync(PDF_PATH);

describe.runIf(hasFile)('calibração com o encarte real do Baratão', () => {
  it('extrai linhas, preços e unidades do PDF real', async () => {
    const data = new Uint8Array(fs.readFileSync(PDF_PATH));
    const doc = await getDocument({ data, useSystemFonts: false }).promise;

    const lines: PdfWord[][] = [];
    for (let page = 1; page <= doc.numPages; page++) {
      const pdfPage = await doc.getPage(page);
      const content = await pdfPage.getTextContent();
      const items = content.items as Array<{ str?: string; transform?: number[]; width?: number }>;
      const words: PdfWord[] = items
        .filter((item) => typeof item.str === 'string' && item.transform !== undefined)
        .map((item) => {
          const h = Math.abs(item.transform![3]) || 10;
          return {
            text: item.str ?? '',
            x: item.transform![4],
            y: item.transform![5],
            h,
            w: typeof item.width === 'number' ? item.width : 0,
          };
        });
      lines.push(...groupWordsIntoLines(words));
    }

    const result = buildPdfResult(lines);
    expect(result.skipped).toEqual([]);
    expect(result.rows.length).toBeGreaterThan(100);

    console.log('TOTAL_LINHAS', result.rows.length);
    console.log(
      'AMOSTRA',
      JSON.stringify(
        result.rows.slice(0, 8).map((r) => ({ nome: r.nome, unidade: r.unidade, precos: r.precos, erros: r.erros })),
        null,
        2,
      ),
    );
  });
});