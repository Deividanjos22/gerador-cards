import { describe, expect, it } from 'vitest';
import { normalizeText, parsePrice } from './parse';

describe('parsePrice', () => {
  it('aceita número direto', () => {
    expect(parsePrice(9.9)).toBe(9.9);
    expect(parsePrice(0)).toBeUndefined();
    expect(parsePrice(-1)).toBeUndefined();
  });

  it('aceita vírgula como separador decimal', () => {
    expect(parsePrice('12,99')).toBe(12.99);
    expect(parsePrice('R$ 12,99')).toBeCloseTo(12.99);
  });

  it('trata ponto como separador de milhar quando há vírgula', () => {
    expect(parsePrice('1.234,56')).toBe(1234.56);
  });

  it('trata ponto como decimal quando não há vírgula', () => {
    expect(parsePrice('1.5')).toBe(1.5);
    expect(parsePrice('9.99')).toBe(9.99);
  });

  it('rejeita textos inválidos', () => {
    expect(parsePrice('abc')).toBeUndefined();
    expect(parsePrice('')).toBeUndefined();
    expect(parsePrice(null)).toBeUndefined();
    expect(parsePrice('R$')).toBeUndefined();
  });
});

describe('normalizeText', () => {
  it('remova acentos e normalize maiúsculas/espaços', () => {
    expect(normalizeText('  SUCO   SALTON  ')).toBe('suco salton');
    expect(normalizeText('CRUZEIRO')).toBe('cruzeiro');
  });
});