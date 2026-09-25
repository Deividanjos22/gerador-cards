import type { Product, StoreCode } from '../domain/product';
import { normalizeText } from '../utils/parse';

export const COLUMN_KINDS = [
  'produto',
  'loja2',
  'cvL2',
  'matriz',
  'cvM',
  'summit',
  'cvS',
  'unidade',
  'codInt',
  'codigo',
] as const;

export type ColKind = (typeof COLUMN_KINDS)[number];

export const PRICE_COLUMNS: { kind: ColKind; store: StoreCode; field: 'preco' | 'cv' }[] = [
  { kind: 'loja2', store: 'loja2', field: 'preco' },
  { kind: 'cvL2', store: 'loja2', field: 'cv' },
  { kind: 'matriz', store: 'matriz', field: 'preco' },
  { kind: 'cvM', store: 'matriz', field: 'cv' },
  { kind: 'summit', store: 'summit', field: 'preco' },
  { kind: 'cvS', store: 'summit', field: 'cv' },
];

const ALIASES: Record<ColKind, string[]> = {
  produto: ['produto', 'produto ativos', 'nome', 'descricao', 'item'],
  loja2: ['loja 2', 'loja 02', 'loja2', 'encarte filial 01', 'preco loja 2', 'preco loja2', 'preco loja 02', 'preco l2'],
  cvL2: ['cv l2', 'cv l 2', 'cv loja 2', 'cvloja2', 'c vantagens', 'c vantagens'],
  matriz: ['matriz', 'encarte matriz', 'preco matriz', 'loja matriz', 'preco da loja matriz', 'loja 1'],
  cvM: ['cv m', 'cv m.', 'cv matriz', 'cv m matriz', 'c vantagens', 'clube de vantagens matriz', 'clube matriz'],
  summit: ['summit', 'encarte summit loja 3', 'preco summit', 'loja summit', 'preco loja summit', 'loja 3'],
  cvS: ['cv s', 'cv s.', 'cv summit', 'cv s summit', 'c vantagens', 'clube de vantagens summit', 'clube summit'],
  unidade: ['unidade', 'und'],
  codInt: ['cod int', 'cod. int', 'cod. int.', 'codint', 'codigo interno', 'cod interna'],
  codigo: ['codigo', 'cod', 'cod. de barras', 'codigo de barras', 'cod. barras', 'ean'],
};

export interface ColumnMap {
  produto?: number;
  loja2?: number;
  cvL2?: number;
  matriz?: number;
  cvM?: number;
  summit?: number;
  cvS?: number;
  unidade?: number;
  codInt?: number;
  codigo?: number;
}

const PRICE_KINDS: ColKind[] = ['loja2', 'cvL2', 'matriz', 'cvM', 'summit', 'cvS'];

export function findHeaderMap(headers: unknown[]): Map<ColKind, number> | null {
  const normalized = headers.map((cell) => normalizeText(String(cell ?? '')));
  const map = new Map<ColKind, number>();

  for (let kind of COLUMN_KINDS) {
    const aliases = ALIASES[kind].map(normalizeText);
    const index = normalized.findIndex((text) => {
      if (!text) return false;
      const soft = text.replace(/[./()]/g, ' ').replace(/\s+/g, ' ').trim();
      return aliases.includes(soft) || aliases.includes(text) || (
        kind === 'produto' && text.startsWith('produto ativos')
      );
    });
    if (index >= 0) map.set(kind, index);
  }

  const hasName = map.has('produto');
  const priceMatches = PRICE_KINDS.filter((k) => map.has(k)).length;
  if (!hasName || priceMatches === 0) return null;

  return map;
}

export function toColumnMap(map: Map<ColKind, number>): ColumnMap {
  const result: ColumnMap = {};
  COLUMN_KINDS.forEach((kind) => {
    const index = map.get(kind);
    if (index !== undefined) {
      (result as Record<string, number | undefined>)[kind] = index;
    }
  });
  return result;
}

const FULL_UNIT_RE = /^(?:\d+(?:[.,]\d+)?\s*)?(?:KG|G|ML|L|PCT|UNID|UNIDADE|UND|PC|CX|BN)$/;

export function suggestUnit(candidate: unknown): string | undefined {
  const normalized = normalizeText(String(candidate ?? '')).toUpperCase().replace(/\.+$/, '');
  if (!normalized || normalized.length > 8) return undefined;
  if (FULL_UNIT_RE.test(normalized)) return normalized;
  return undefined;
}

export function normalizeNomeProduto(nome: string): string {
  return normalizeText(nome);
}

export function mergeWithExistingPrecos(
  existing: Product['precos'],
  incoming: Product['precos'],
): Product['precos'] {
  const merged: Product['precos'] = { ...existing };
  (Object.keys(incoming) as StoreCode[]).forEach((store) => {
    const novo = incoming[store];
    if (!novo || typeof novo.preco !== 'number') return;
    const atual = merged[store];
    merged[store] = {
      preco: novo.preco,
      cv: typeof novo.cv === 'number' ? novo.cv : atual?.cv,
    };
  });
  return merged;
}