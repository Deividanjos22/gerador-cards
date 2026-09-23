import { describe, expect, it } from 'vitest';
import {
  findHeaderMap,
  mergeWithExistingPrecos,
  normalizeNomeProduto,
  suggestUnit,
  toColumnMap,
} from './columns';

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

describe('findHeaderMap', () => {
  it('reconhece o cabeçalho do encarte real', () => {
    const map = findHeaderMap(CABECALHO_REAL);
    expect(map).not.toBeNull();
    const columns = toColumnMap(map!);
    expect(columns.produto).toBe(0);
    expect(columns.loja2).toBe(1);
    expect(columns.cvL2).toBe(2);
    expect(columns.matriz).toBe(3);
    expect(columns.cvM).toBe(4);
    expect(columns.summit).toBe(5);
    expect(columns.cvS).toBe(6);
    expect(columns.codInt).toBe(7);
    expect(columns.codigo).toBe(8);
    expect(columns.unidade).toBe(9);
  });

  it('aceita planilha em português com textos soltos', () => {
    const map = findHeaderMap(['Nome', 'Preço Matriz', 'Clube de Vantagens Matriz']);
    expect(map).not.toBeNull();
    const columns = toColumnMap(map!);
    expect(columns.produto).toBe(0);
    expect(columns.matriz).toBe(1);
    expect(columns.cvM).toBe(2);
  });

  it('rejeita sem nome ou sem nenhum preço', () => {
    expect(findHeaderMap(['id', 'foo'])).toBeNull();
    expect(findHeaderMap(['PRODUTO', 'UNIDADE'])).toBeNull();
  });
});

describe('suggestUnit', () => {
  it('reconhece unidades comuns e ignora textos longos', () => {
    expect(suggestUnit('KG')).toBe('KG');
    expect(suggestUnit('PCT')).toBe('PCT');
    expect(suggestUnit('UNID.')).toBe('UNID');
    expect(suggestUnit('CAIXA COM 12')).toBeUndefined();
    expect(suggestUnit('SEM UNIDADE')).toBeUndefined();
  });

  it('aceita unidade com tamanho completo', () => {
    expect(suggestUnit('500ML')).toBe('500ML');
    expect(suggestUnit('1L')).toBe('1L');
    expect(suggestUnit('250G')).toBe('250G');
    expect(suggestUnit('109G')).toBe('109G');
    expect(suggestUnit('L500PG450ML')).toBeUndefined();
    expect(suggestUnit('1,5 KG')).toBe('1,5 KG');
  });
});

describe('normalizeNomeProduto', () => {
  it('ignora caixa e acentos para dupicação', () => {
    expect(normalizeNomeProduto('SUCO SALTON UVA')).toBe(normalizeNomeProduto('Suco Salton Uva'));
    expect(normalizeNomeProduto('FEIJAO')).toBe('feijao');
  });
});

describe('mergeWithExistingPrecos', () => {
  it('mantém cv antigo quando o novo não vem', () => {
    const merged = mergeWithExistingPrecos(
      { matriz: { preco: 10, cv: 8 } },
      { matriz: { preco: 12 } },
    );
    expect(merged.matriz).toEqual({ preco: 12, cv: 8 });
  });

  it('mantém preços de lojas não presentes e ignora entrada sem preco', () => {
    const merged = mergeWithExistingPrecos(
      { matriz: { preco: 10 }, summit: { preco: 20 } },
      { loja2: { preco: 15 } } as never,
    );
    expect(merged.matriz).toEqual({ preco: 10 });
    expect(merged.summit).toEqual({ preco: 20 });
  });

  it('atualiza cv quando vier', () => {
    const merged = mergeWithExistingPrecos({ matriz: { preco: 10, cv: 9 } }, {
      matriz: { preco: 11, cv: 9.5 },
    });
    expect(merged.matriz).toEqual({ preco: 11, cv: 9.5 });
  });
});