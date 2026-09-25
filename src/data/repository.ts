import type { Campaign, CampaignInput } from '../domain/campaign';
import type { Product, ProductInput } from '../domain/product';
import type { Theme } from '../generator/theme';

export interface ProductRepository {
  list(): Product[];
  clear(): void;
  create(input: ProductInput): Product;
  update(product: Product): Product;
  remove(id: string): void;
}

export interface CampaignRepository {
  list(): Campaign[];
  create(input: CampaignInput): Campaign;
  update(campaign: Campaign): Campaign;
  remove(id: string): void;
}

export interface ThemeStorage {
  get(): Theme;
  save(theme: Theme): void;
}