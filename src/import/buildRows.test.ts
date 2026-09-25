import { describe, expect, it } from 'vitest';
import { buildImportRows } from './buildRows';
import { findHeaderMap, type ColKind } from './columns';

const CABECALHO_REAL = [
  'PRODUTO',
  'LOJA 2',
  'CV L2',
  'MATRIZ',
  'CV M.',
  'SUMMIT',
  'CV S',
  'COD.INT',
  'CODIGO',
  'UNIDADE',
];

function header(): Map<ColKind, number> {
  const map = findHeaderMap(CABECALHO_REAL);
  if (!map) throw new Error('cabeçalho não reconhecido');
  return map;
}

describe('buildImportRows', () => {
  it('reconhece o cabeçalho real da planilha do Cartaz Cloud', () => {
    const map = findHeaderMap([
      'PRODUTO ATIVOS ATÉ 19 05 26',
      'ENCARTE/FILIAL 01',
      'ENCARTE/ MATRIZ',
      'ENCARTE/ SUMMIT (LOJA 3)',
      'C. VANTAGENS',
      'Produto',
      'Cod',
    ]);
    expect(map).not.toBeNull();
    expect(map?.get('produto')).toBe(0);
    expect(map?.get('loja2')).toBe(1);
    expect(map?.get('matriz')).toBe(2);
    expect(map?.get('summit')).toBe(3);
    expect(map?.get('codigo')).toBe(6);
  });

  it('parseia preços e cv por loja', () => {
    const map = header();
    const rows = buildImportRows(map, [
      {
        index: 1,
        cells: ['SUCO SALTON UVA TTO INTEGRAL 1,5', '12,99', '11,99', '13,99', '12,99', '14,99', '13,99', '123', '789', 'KG'],
      },
    ]);
    expect(rows[0].nome).toBe('SUCO SALTON UVA TTO INTEGRAL 1,5');
    expect(rows[0].unidade).toBe('KG');
    expect(rows[0].codigoBarras).toBe('789');
    expect(rows[0].precos.loja2).toEqual({ preco: 12.99, cv: 11.99 });
    expect(rows[0].precos.matriz).toEqual({ preco: 13.99, cv: 12.99 });
    expect(rows[0].precos.summit).toEqual({ preco: 14.99, cv: 13.99 });
    expect(rows[0].erros).toEqual([]);
  });

  it('linha sem cv fica só com preco', () => {
    const map = header();
    const rows = buildImportRows(map, [
      { index: 1, cells: ['ARROZ', ' ', ' ', '25,90', '', '', '', '1', '2', '5KG'] },
    ]);
    expect(rows[0].precos.matriz).toEqual({ preco: 25.9 });
    expect(rows[0].precos.loja2).toBeUndefined();
  });

  it('produto sem nenhum preço é importado mesmo assim', () => {
    const map = header();
    const rows = buildImportRows(map, [
      { index: 1, cells: ['MOLHO TOMATE', '', '', '', '', '', '', '1', '2', ''] },
    ]);
    expect(rows[0].precos).toEqual({});
    expect(rows[0].erros).toEqual([]);
  });

  it('preço inválido vira erro e linha sem nome também', () => {
    const map = header();
    const rows = buildImportRows(map, [
      { index: 1, cells: ['', 'ABC', '', '', '', '', '', '1', '2', ''] },
    ]);
    expect(rows[0].erros.some((e) => e.includes('Produto sem nome'))).toBe(true);
    expect(rows[0].erros.some((e) => e.includes('Preço inválido'))).toBe(true);
  });
});