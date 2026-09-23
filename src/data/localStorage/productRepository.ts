import type { Product, ProductInput } from '../../domain/product';
import type { ProductRepository } from '../repository';

const STORAGE_KEY = 'gerador-cards:products';

interface LegacyProduct {
  id: string;
  nome: string;
  preco: number;
  unidade: string;
  categoria?: string;
  imagem?: string;
  ativo: boolean;
}

function readAll(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? (JSON.parse(raw) as unknown[]) : [];
    return items.map(migrateProduct);
  } catch {
    return [];
  }
}

function migrateProduct(raw: unknown): Product {
  if (!raw || typeof raw !== 'object') return raw as Product;
  const p = raw as Product;
  if (p.precos && typeof p.precos === 'object') return p;

  const legacy = raw as LegacyProduct;
  return {
    id: legacy.id,
    nome: legacy.nome,
    precos: typeof legacy.preco === 'number' ? { matriz: { preco: legacy.preco } } : {},
    unidade: legacy.unidade ?? 'KG',
    categoria: legacy.categoria,
    imagem: legacy.imagem,
    ativo: legacy.ativo,
  };
}

function writeAll(items: Product[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export class LocalStorageProductRepository implements ProductRepository {
  list(): Product[] {
    return readAll();
  }

  create(input: ProductInput): Product {
    const items = readAll();
    const product: Product = { ...input, id: crypto.randomUUID() };
    items.push(product);
    writeAll(items);
    return product;
  }

  update(product: Product): Product {
    const items = readAll().map((p) => (p.id === product.id ? product : p));
    writeAll(items);
    return product;
  }

  remove(id: string): void {
    writeAll(readAll().filter((p) => p.id !== id));
  }
}