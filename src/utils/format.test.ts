import { describe, expect, it } from 'vitest';
import { formatPrice, formatDatePtBr, slugify } from './format';

describe('formatPrice', () => {
  it('formata preço com vírgula e duas casas', () => {
    expect(formatPrice(59.9)).toBe('59,90');
    expect(formatPrice(0)).toBe('0,00');
  });

  it('retorna zero para valores não finitos', () => {
    expect(formatPrice(Number.NaN)).toBe('0,00');
    expect(formatPrice(Number.POSITIVE_INFINITY)).toBe('0,00');
  });
});

describe('formatDatePtBr', () => {
  it('converte ISO para o formato brasileiro', () => {
    expect(formatDatePtBr('2026-09-18')).toBe('18/09/2026');
  });

  it('ignora valores vazios ou fora do padrão', () => {
    expect(formatDatePtBr('')).toBe('');
    expect(formatDatePtBr('ontem')).toBe('ontem');
  });
});

describe('slugify', () => {
  it('normaliza acentos e minúsculas', () => {
    expect(slugify('Picanha Açougue')).toBe('picanha-acougue');
  });

  it('remove símbolos e espaços redundantes', () => {
    expect(slugify('Promoção! da Semana  !!')).toBe('promocao-da-semana');
    expect(slugify('   ')).toBe('');
  });
});
