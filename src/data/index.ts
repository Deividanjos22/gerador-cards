import { LocalStorageCampaignRepository } from './localStorage/campaignRepository';
import { LocalStorageProductRepository } from './localStorage/productRepository';
import { LocalStorageThemeRepository } from './localStorage/themeRepository';
import type { CampaignRepository, ProductRepository, ThemeStorage } from './repository';
import { initializeSeed } from './seed';

export function getProductRepository(): ProductRepository {
  return new LocalStorageProductRepository();
}

export function getCampaignRepository(): CampaignRepository {
  return new LocalStorageCampaignRepository();
}

export function getThemeRepository(): ThemeStorage {
  return new LocalStorageThemeRepository();
}

export function initializeData(): void {
  initializeSeed();
}