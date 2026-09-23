import * as XLSX from 'xlsx';
import { findHeaderMap, type ColKind } from './columns';
import { buildImportRows, type SourceRow } from './buildRows';
import type { ImportResult } from './types';

export async function parseExcelFile(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { rows: [], skipped: ['O arquivo não contém abas com dados.'], fileName: file.name };
  }

  const sheet = workbook.Sheets[sheetName];
  const grid = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true });

  let header: Map<ColKind, number> | null = null;
  let start = -1;
  for (let i = 0; i < grid.length; i++) {
    const mapped = findHeaderMap(grid[i] ?? []);
    if (mapped) {
      header = mapped;
      start = i + 1;
      break;
    }
  }

  if (!header) {
    return {
      rows: [],
      skipped: ['Não encontrei o cabeçalho esperado (PRODUTO, MATRIZ, LOJA 2, SUMMIT, CV e UNIDADE).'],
      fileName: file.name,
    };
  }

  const rows: SourceRow[] = [];
  for (let i = start; i < grid.length; i++) {
    const cells = grid[i] ?? [];
    if (cells.every((cell) => cell === null || cell === undefined || String(cell).trim() === '')) continue;
    rows.push({ index: i + 1, cells });
  }

  const isEmpty = rows.length === 0;
  return {
    rows: isEmpty ? [] : buildImportRows(header, rows),
    skipped: isEmpty ? ['Nenhuma linha de produto encontrada após o cabeçalho.'] : [],
    fileName: file.name,
  };
}