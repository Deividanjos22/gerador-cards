import { parseExcelFile } from './parseExcel';
import { parsePdfFile } from './parsePdf';
import type { ImportResult } from './types';

export function isSpreadsheet(fileName: string): boolean {
  return /\.(xlsx|xls|csv|ods)$/i.test(fileName);
}

export function isPdf(fileName: string): boolean {
  return /\.pdf$/i.test(fileName);
}

export async function parseImportFile(file: File): Promise<ImportResult> {
  if (!isSpreadsheet(file.name) && !isPdf(file.name)) {
    return {
      rows: [],
      skipped: ['Formato não suportado. Envie um arquivo .xlsx, .xls, .csv ou .pdf.'],
      fileName: file.name,
    };
  }
  if (isSpreadsheet(file.name)) return parseExcelFile(file);
  return parsePdfFile(file);
}

export { upsertProducts } from './upsert';
export { rowToProductInput } from './mapToProducts';
export type { ImportRow, ImportResult, ImportSummary, StorePrice } from './types';