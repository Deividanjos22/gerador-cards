import { describe, expect, it } from 'vitest';
import { rowToProductInput } from './mapToProducts';

describe('rowToProductInput', () => {
  it('preserva o código de barras importado para localizar a imagem', () => {
    const produto = rowToProductInput({
      index: 2,
      nome: 'ARROZ',
      precos: { matriz: { preco: 25.9 } },
      unidade: '5KG',
      codigoBarras: '7891234567890',
      erros: [],
    });

    expect(produto.codigoBarras).toBe('7891234567890');
  });
});
