import { describe, expect, it } from 'vitest';
import type { Product, ProductInput } from '../domain/product';
import type { ProductRepository } from '../data/repository';
import { upsertProducts } from './upsert';

class Memoria implements ProductRepository {
  private items: Product[] = [];

  list(): Product[] {
    return [...this.items];
  }

  create(input: ProductInput): Product {
    const product: Product = { id: String(this.items.length + 1), ...input, precos: input.precos };
    this.items.push(product);
    return product;
  }

  update(product: Product): Product {
    const index = this.items.findIndex((p) => p.id === product.id);
    if (index >= 0) this.items[index] = product;
    return product;
  }

  remove(id: string): void {
    this.items = this.items.filter((p) => p.id !== id);
  }
}

describe('upsertProducts', () => {
  it('cria produtos novos e soma semPreco', () => {
    const repo = new Memoria();
    const summary = upsertProducts(repo, [
      { nome: 'SUCO SALTON', precos: { matriz: { preco: 12.99 } }, unidade: 'KG', ativo: true },
      { nome: 'BARRA CHOCOLATE', precos: {}, unidade: 'UND', ativo: true },
    ]);
    expect(summary.created).toBe(2);
    expect(summary.updated).toBe(0);
    expect(summary.semPreco).toBe(1);
    expect(repo.list()).toHaveLength(2);
  });

  it('atualiza produto existente por nome ignorando acentos/caixa', () => {
    const repo = new Memoria();
    repo.create({ nome: 'Feijão Carioca', precos: { matriz: { preco: 8, cv: 7 } }, unidade: 'KG', ativo: true });

    const summary = upsertProducts(repo, [
      { nome: 'FEIJAO CARIOCA', precos: { matriz: { preco: 9.5 } }, unidade: '', ativo: true },
    ]);
    expect(summary.created).toBe(0);
    expect(summary.updated).toBe(1);
    const [product] = repo.list();
    expect(product.nome).toBe('Feijão Carioca');
    expect(product.precos.matriz).toEqual({ preco: 9.5, cv: 7 });
    expect(product.unidade).toBe('KG');
  });

  it('nova linha dá preço de loja diferente sem apagar as demais', () => {
    const repo = new Memoria();
    repo.create({ nome: 'AZEITE', precos: { matriz: { preco: 40 } }, unidade: 'UNID', ativo: true });

    upsertProducts(repo, [
      { nome: 'Azeite', precos: { summit: { preco: 42, cv: 40 } }, unidade: '', ativo: true },
    ]);
    const [product] = repo.list();
    expect(product.precos.matriz).toEqual({ preco: 40 });
    expect(product.precos.summit).toEqual({ preco: 42, cv: 40 });
  });
});