import { describe, expect, it } from 'vitest';
import type { Campaign } from './campaign';
import type { Product } from './product';
import { MAX_CARD_PRODUCTS } from './grid';
import { validateCardData } from './validation';

function product(overrides: Partial<Product> = {}): Product {
  return {
    id: 'p1',
    nome: 'Picanha',
    precos: { matriz: { preco: 59.9 } },
    unidade: 'KG',
    ativo: true,
    ...overrides,
  };
}

function campaign(overrides: Partial<Campaign> = {}): Campaign {
  return {
    id: 'c1',
    titulo: 'Promoção da Semana',
    dataInicio: '2026-09-18',
    dataFim: '2026-09-24',
    lojas: ['matriz'],
    produtoIds: ['p1'],
    ...overrides,
  };
}

describe('validateCardData', () => {
  it('aceita um card válido', () => {
    const result = validateCardData(campaign(), [product()]);
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });

  it('reporta campanha inexistente', () => {
    const result = validateCardData(null, [product()]);
    expect(result.valid).toBe(false);
    expect(result.issues.map((i) => i.code)).toContain('campanha-inexistente');
  });

  it('reporta título vazio', () => {
    const result = validateCardData(campaign({ titulo: '  ' }), [product()]);
    expect(result.issues.map((i) => i.code)).toContain('titulo-vazio');
  });

  it('reporta datas ausentes', () => {
    const result = validateCardData(campaign({ dataInicio: '', dataFim: '' }), [product()]);
    const codes = result.issues.map((i) => i.code);
    expect(codes).toContain('inicio-vazio');
    expect(codes).toContain('fim-vazio');
  });

  it('reporta período invertido', () => {
    const result = validateCardData(
      campaign({ dataInicio: '2026-09-24', dataFim: '2026-09-18' }),
      [product()],
    );
    expect(result.issues.map((i) => i.code)).toContain('periodo-invalido');
  });

  it('reporta campanha sem lojas', () => {
    const result = validateCardData(campaign({ lojas: [] }), [product()]);
    expect(result.issues.map((i) => i.code)).toContain('lojas-vazio');
  });

  it('reporta card sem produtos', () => {
    const result = validateCardData(campaign(), []);
    expect(result.issues.map((i) => i.code)).toContain('sem-produtos');
  });

  it('reporta excesso de produtos no card', () => {
    const produtos = Array.from({ length: MAX_CARD_PRODUCTS + 1 }, () =>
      product({ precos: { matriz: { preco: 10 } } }),
    );
    const result = validateCardData(campaign(), produtos);
    expect(result.issues.map((i) => i.code)).toContain('muitos-produtos');
  });

  it('reporta produto sem nome e sem preço nas lojas selecionadas', () => {
    const result = validateCardData(campaign(), [
      product({ nome: '  ', precos: {} }),
    ]);
    const codes = result.issues.map((i) => i.code);
    expect(codes).toContain('produto-sem-nome');
    expect(codes).toContain('produto-sem-preco');
  });

  it('não exige preço em todas as lojas, apenas em alguma das selecionadas', () => {
    const result = validateCardData(
      campaign({ lojas: ['loja2', 'summit'] }),
      [product({ precos: { loja2: { preco: 42.9 } } })],
    );
    expect(result.valid).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});