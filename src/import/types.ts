import type { StoreCode } from '../domain/product';

export type PriceField = 'preco' | 'cv';

export interface StorePrice {
  preco: number;
  cv?: number;
}

export interface ImportRow {
  index: number;
  nome: string;
  precos: Partial<Record<StoreCode, StorePrice>>;
  unidade?: string;
  erros: string[];
}

export interface ImportResult {
  rows: ImportRow[];
  skipped: string[];
  fileName: string;
}

export interface ImportSummary {
  created: number;
  updated: number;
  semPreco: number;
}