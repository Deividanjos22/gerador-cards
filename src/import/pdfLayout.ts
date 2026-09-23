import type { StoreCode } from '../domain/product';
import { normalizeText } from '../utils/parse';
import { buildImportRows, type SourceRow } from './buildRows';
import type { ColKind } from './columns';
import type { ImportResult } from './types';

export interface PdfWord {
  text: string;
  x: number;
  y: number;
  h: number;
  w: number;
}

export interface PdfPriceColumn {
  store: StoreCode;
  field: 'preco' | 'cv';
  start: number;
}

export interface PdfLayout {
  columns: PdfPriceColumn[];
  starts: number[];
  codeStart: number;
}

const UNIT_RE = /^(?:\d+(?:[.,]\d+)?\s*)?(?:KG|G|ML|L|PCT|UNID|UNIDADE|UND|PC|CX|BN)$/i;

const COLUMN_KIND: Record<string, ColKind> = {
  'loja2\u0000preco': 'loja2',
  'loja2\u0000cv': 'cvL2',
  'matriz\u0000preco': 'matriz',
  'matriz\u0000cv': 'cvM',
  'summit\u0000preco': 'summit',
  'summit\u0000cv': 'cvS',
};

const KIND_INDEX: Record<ColKind, number> = {
  produto: 0,
  loja2: 1,
  cvL2: 2,
  matriz: 3,
  cvM: 4,
  summit: 5,
  cvS: 6,
  unidade: 7,
  codInt: 8,
  codigo: 9,
};

const COLUMN_ORDER: { store: StoreCode; field: 'preco' | 'cv' }[] = [
  { store: 'loja2', field: 'preco' },
  { store: 'loja2', field: 'cv' },
  { store: 'matriz', field: 'preco' },
  { store: 'matriz', field: 'cv' },
  { store: 'summit', field: 'preco' },
  { store: 'summit', field: 'cv' },
];

export function groupWordsIntoLines(words: PdfWord[]): PdfWord[][] {
  const sorted = [...words].sort((a, b) => b.y - a.y);
  const lines: PdfWord[][] = [];
  let current: PdfWord[] = [];
  let lastY: number | null = null;

  for (const word of sorted) {
    if (lastY === null || Math.abs(word.y - lastY) <= 4) {
      current.push(word);
    } else {
      lines.push([...current].sort((a, b) => a.x - b.x));
      current = [word];
    }
    lastY = word.y;
  }
  if (current.length > 0) lines.push([...current].sort((a, b) => a.x - b.x));
  return lines;
}

type HeaderColumn = { store: StoreCode; field: 'preco' | 'cv' } | 'cod' | 'produto' | null;

function headerColumn(word: PdfWord): HeaderColumn {
  const c = normalizeText(word.text).replace(/[^a-z0-9]/g, '');
  if (c === 'loja2' || c === 'loja02' || c === 'loja' || c === 'precoloj2' || c === 'precoloj02') {
    return { store: 'loja2', field: 'preco' };
  }
  if (c === 'cvl2' || c === 'cvl02' || c === 'cvloja2') {
    return { store: 'loja2', field: 'cv' };
  }
  if (c === 'matriz' || c === 'precomatriz' || c === 'lojamatriz') {
    return { store: 'matriz', field: 'preco' };
  }
  if (c === 'cvm' || c === 'cvmatriz') {
    return { store: 'matriz', field: 'cv' };
  }
  if (c === 'summit' || c === 'precosummit' || c === 'lojasummit') {
    return { store: 'summit', field: 'preco' };
  }
  if (c === 'cvs' || c === 'cvsummit') {
    return { store: 'summit', field: 'cv' };
  }
  if (c.startsWith('cod')) return 'cod';
  if (c.startsWith('produto')) return 'produto';
  return null;
}

export function isHeaderLikeLine(line: PdfWord[]): boolean {
  let matriz = false;
  let summit = false;
  let loja = false;
  let cv = false;

  for (const word of line) {
    const col = headerColumn(word);
    if (!col || col === 'cod' || col === 'produto') continue;
    if (col.store === 'matriz') matriz = true;
    if (col.store === 'summit') summit = true;
    if (col.store === 'loja2') loja = true;
    if (col.field === 'cv') cv = true;
  }

  return (matriz && summit) || (matriz && loja && cv);
}

export function detectHeaderLine(lines: PdfWord[][]): number {
  return lines.findIndex(isHeaderLikeLine);
}

export function buildLayout(headerLine: PdfWord[]): PdfLayout {
  const columns: PdfPriceColumn[] = [];

  for (const wanted of COLUMN_ORDER) {
    const hit = headerLine.find((w) => {
      const col = headerColumn(w);
      return (
        col !== null && col !== 'cod' && col !== 'produto' &&
        col.store === wanted.store &&
        col.field === wanted.field
      );
    });
    if (hit) columns.push({ ...wanted, start: hit.x });
  }

  if (columns.length === 0) {
    throw new Error('Não identifiquei as colunas de preço no cabeçalho do PDF.');
  }

  const codeWords = headerLine.filter((w) => headerColumn(w) === 'cod');
  const codeStart = codeWords.length > 0 ? Math.min(...codeWords.map((w) => w.x)) : Number.POSITIVE_INFINITY;
  const starts = columns.map((c) => c.start).sort((a, b) => a - b);

  return { columns, starts, codeStart };
}

export function buildPdfResult(lines: PdfWord[][], fileName = 'arquivo.pdf'): ImportResult {
  const headerIndex = detectHeaderLine(lines);
  if (headerIndex < 0) {
    return {
      rows: [],
      skipped: [
        'Não identifiquei o cabeçalho do PDF (PRODUTO, MATRIZ, LOJA 2, SUMMIT e colunas CV).',
      ],
      fileName,
    };
  }

  let layout: PdfLayout;
  try {
    layout = buildLayout(lines[headerIndex]);
  } catch (error) {
    return {
      rows: [],
      skipped: [error instanceof Error ? error.message : 'Não identifiquei as colunas de preço do PDF.'],
      fileName,
    };
  }

  const rows = buildRowsFromLines(lines, layout, headerIndex);
  const header = new Map<ColKind, number>();
  (Object.keys(KIND_INDEX) as ColKind[]).forEach((kind) => header.set(kind, KIND_INDEX[kind]));
  return { rows: buildImportRows(header, rows), skipped: [], fileName };
}

interface Candidate {
  nome: string;
  unidade?: string;
  cells: unknown[];
  hasValues: boolean;
}

export function buildRowsFromLines(
  lines: PdfWord[][],
  layout: PdfLayout,
  headerIndex: number,
): SourceRow[] {
  const candidates: Candidate[] = [];

  lines.forEach((line, index) => {
    if (index === headerIndex || isHeaderLikeLine(line)) return;
    const candidate = candidateFromLine(line, layout);
    if (!candidate.nome && !candidate.hasValues) return;
    candidates.push(candidate);
  });

  const rows: Candidate[] = [];
  let open: Candidate | null = null;

  candidates.forEach((candidate) => {
    if (candidate.hasValues) {
      if (open) {
        open.nome = [open.nome, candidate.nome].filter(Boolean).join(' ');
        open.unidade = open.unidade ?? candidate.unidade;
        open.cells = candidate.cells;
        rows.push(open);
        open = null;
      } else {
        rows.push(candidate);
      }
    } else if (open) {
      open.nome = [open.nome, candidate.nome].filter(Boolean).join(' ');
    } else {
      open = candidate;
    }
  });
  if (open) rows.push(open);

  let seq = 0;
  return rows.map((row) => ({ index: ++seq, cells: row.cells }));
}

function candidateFromLine(line: PdfWord[], layout: PdfLayout): Candidate {
  const nomeParts: string[] = [];
  const cellTexts = new Map<string, string>();
  let hasValues = false;

  line.forEach((word) => {
    const text = word.text.trim();
    if (!text) return;
    const region = regionOf(word, layout);

    if (region === 'nome') {
      nomeParts.push(text);
      return;
    }
    if (region === 'code') {
      hasValues = true;
      return;
    }
    const col = layout.columns[region];
    if (isCodeLike(word.text)) {
      hasValues = true;
      return;
    }
    const key = col.store + '\u0000' + col.field;
    cellTexts.set(key, [cellTexts.get(key), text].filter(Boolean).join(' '));
    hasValues = true;
  });

  const nome = nomeParts.join(' ').trim();
  const tokens = nome.split(/\s+/);
  const last = tokens[tokens.length - 1] ?? '';
  let unidade: string | undefined;
  let finalNome = nome;
  if (last && UNIT_RE.test(last)) {
    unidade = last.toUpperCase();
    finalNome = tokens.slice(0, -1).join(' ').trim();
  }

  const cells = new Array<unknown>(10).fill('');
  layout.columns.forEach((col) => {
    const key = col.store + '\u0000' + col.field;
    const text = cellTexts.get(key);
    if (text) cells[KIND_INDEX[COLUMN_KIND[`${col.store}\u0000${col.field}`]]] = text;
  });
  if (unidade) cells[KIND_INDEX.unidade] = unidade;
  cells[KIND_INDEX.produto] = finalNome;

  return { nome: finalNome, unidade, cells, hasValues };
}

function regionOf(word: PdfWord, layout: PdfLayout): 'nome' | 'code' | number {
  if (word.x < layout.starts[0]) return 'nome';
  const mid = word.x + word.w / 2;
  if (mid >= layout.codeStart) return 'code';
  let index = 0;
  while (index < layout.starts.length && mid >= layout.starts[index]) index++;
  return index - 1;
}

function isCodeLike(text: string): boolean {
  if (text.includes(',')) return false;
  return /^[\d\s/.]+$/.test(text) && text.replace(/[^\d]/g, '').length > 0;
}