import type { ProductInput } from '../domain/product';
import { generatePlaceholderImage } from '../utils/image';
import type { ImportRow } from './types';

export function rowToProductInput(row: ImportRow): ProductInput {
  return {
    nome: row.nome.trim(),
    precos: row.precos,
    unidade: row.unidade ?? 'KG',
    categoria: '',
    imagem: generatePlaceholderImage(row.nome),
    ativo: true,
  };
}