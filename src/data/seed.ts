import { generatePlaceholderImage } from '../utils/image';
import { LocalStorageProductRepository } from './localStorage/productRepository';

const STORAGE_KEY = 'gerador-cards:products';

interface SeedItem {
  nome: string;
  preco: number;
  unidade: string;
  categoria: string;
}

const SEED_ITEMS: SeedItem[] = [
  { nome: 'Acém com osso', preco: 22.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Ossobuco', preco: 24.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Coxa de frango', preco: 12.9, unidade: 'KG', categoria: 'Aves' },
  { nome: 'Costela bovina', preco: 29.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Paulista', preco: 21.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Agulha', preco: 18.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Picanha', preco: 54.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Maminha', preco: 42.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Alcatra', preco: 45.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Contra-filé', preco: 38.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Fraldinha', preco: 34.9, unidade: 'KG', categoria: 'Bovinos' },
  { nome: 'Peito de frango', preco: 16.9, unidade: 'KG', categoria: 'Aves' },
];

export function initializeSeed(): void {
  if (localStorage.getItem(STORAGE_KEY) !== null) return;

  const repo = new LocalStorageProductRepository();
  SEED_ITEMS.forEach((item) => {
    repo.create({
      nome: item.nome,
      precos: { matriz: { preco: item.preco } },
      unidade: item.unidade,
      categoria: item.categoria,
      imagem: generatePlaceholderImage(item.nome),
      ativo: true,
    });
  });
}