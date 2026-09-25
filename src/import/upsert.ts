import type { ProductInput } from '../domain/product';
import type { ProductRepository } from '../data/repository';
import { mergeWithExistingPrecos, normalizeNomeProduto } from './columns';
import type { ImportSummary } from './types';

export function upsertProducts(
  repo: ProductRepository,
  inputs: ProductInput[],
): ImportSummary {
  const existing = repo.list();
  const byKey = new Map(existing.map((p) => [normalizeNomeProduto(p.nome), p]));
  let created = 0;
  let updated = 0;
  let semPreco = 0;

  inputs.forEach((input) => {
    const temPreco = Object.values(input.precos).some((preco) => preco && preco.preco > 0);
    if (!temPreco) semPreco += 1;

    const key = normalizeNomeProduto(input.nome);
    const match = byKey.get(key);
    if (match) {
      repo.update({
        ...match,
        precos: mergeWithExistingPrecos(match.precos, input.precos),
        unidade: input.unidade || match.unidade,
        codigoBarras: input.codigoBarras || match.codigoBarras,
        imagem: match.imagem || input.imagem,
        ativo: true,
      });
      updated += 1;
      return;
    }

    const createdProduct = repo.create({
      nome: input.nome,
      precos: input.precos,
      unidade: input.unidade || 'KG',
      categoria: input.categoria,
      imagem: input.imagem,
      codigoBarras: input.codigoBarras,
      ativo: true,
    });
    byKey.set(key, createdProduct);
    created += 1;
  });

  return { created, updated, semPreco };
}