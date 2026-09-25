export const STORES = ['matriz', 'loja2', 'summit'] as const;

export type StoreCode = (typeof STORES)[number];

export const STORE_LABELS: Record<StoreCode, string> = {
  matriz: 'Matriz',
  loja2: 'Loja 2',
  summit: 'Summit',
};

export interface PrecoPorLoja {
  preco: number;
  cv?: number;
}

export interface Product {
  id: string;
  nome: string;
  precos: Partial<Record<StoreCode, PrecoPorLoja>>;
  unidade: string;
  categoria?: string;
  imagem?: string;
  codigoBarras?: string;
  ativo: boolean;
}

export type ProductInput = Omit<Product, 'id'>;

export function precoDaLoja(product: Product, store: StoreCode): number | undefined {
  return product.precos[store]?.preco;
}

export function cvDaLoja(product: Product, store: StoreCode): number | undefined {
  return product.precos[store]?.cv;
}

export function precosPreenchidos(product: Product): StoreCode[] {
  return STORES.filter((store) => {
    const preco = precoDaLoja(product, store);
    return typeof preco === 'number' && preco > 0;
  });
}