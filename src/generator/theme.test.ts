import { describe, expect, it } from 'vitest';
import { baseTheme, mergeTheme, readableOn } from './theme';

describe('mergeTheme', () => {
  it('aplica alterações sobre o tema base', () => {
    const tema = mergeTheme({ colors: { primary: '#000000' } });
    expect(tema.colors.primary).toBe('#000000');
    expect(tema.colors.background).toBe(baseTheme.colors.background);
  });

  it('ignora campos inválidos', () => {
    const tema = mergeTheme({ header: { height: -5 }, colors: { primary: '' } } as never);
    expect(tema.header.height).toBe(baseTheme.header.height);
    expect(tema.colors.primary).toBe(baseTheme.colors.primary);
  });

  it('retorna o tema base para entradas inválidas', () => {
    expect(mergeTheme(null)).toEqual(baseTheme);
    expect(mergeTheme('abc' as never)).toEqual(baseTheme);
  });
});

describe('readableOn', () => {
  it('escolhe cor legível sobre o fundo', () => {
    expect(readableOn('#000000')).toBe('#ffffff');
    expect(readableOn('#ffffff')).toBe('#1d1810');
  });

  it('retorna branco para hex inválido', () => {
    expect(readableOn('#12')).toBe('#ffffff');
    expect(readableOn('vermelho')).toBe('#ffffff');
  });
});
