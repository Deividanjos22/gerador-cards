import { STORE_LABELS } from '../domain/product';
import { parsePrice, normalizeText } from '../utils/parse';
import { PRICE_COLUMNS, suggestUnit, type ColKind } from './columns';
import type { ImportRow } from './types';

export interface SourceRow {
  index: number;
  cells: unknown[];
}

export function buildImportRows(
  header: Map<ColKind, number>,
  rows: SourceRow[],
): ImportRow[] {
  return rows.map((row) => buildRow(header, row));
}

function buildRow(header: Map<ColKind, number>, row: SourceRow): ImportRow {
  const erros: string[] = [];
  const nome = String(cellAt(row.cells, header.get('produto')) ?? '').trim();
  const unidade = suggestUnit(cellAt(row.cells, header.get('unidade')));

  const precos: ImportRow['precos'] = {};
  for (const item of PRICE_COLUMNS) {
    const raw = cellAt(row.cells, header.get(item.kind));
    const label = STORE_LABELS[item.store];
    if (raw === null || raw === undefined || String(raw).trim() === '') continue;
    const value = parsePrice(raw);
    if (value === undefined) {
      erros.push(`Preço inválido (${label}): "${String(raw).trim()}".`);
      continue;
    }
    const entry = precos[item.store] ?? (precos[item.store] = { preco: 0 });
    if (item.field === 'preco') entry.preco = value;
    else if (entry.preco <= 0) entry.preco = value;
    else entry.cv = value;
  }

  if (!normalizeText(nome)) {
    erros.push('Produto sem nome.');
  }

  return {
    index: row.index,
    nome,
    precos,
    unidade: unidade ?? undefined,
    erros,
  };
}

function cellAt(cells: unknown[], index: number | undefined): unknown {
  if (index === undefined) return undefined;
  return cells[index];
}