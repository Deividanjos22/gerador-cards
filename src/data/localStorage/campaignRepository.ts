import type { Campaign, CampaignInput } from '../../domain/campaign';
import type { CampaignRepository } from '../repository';

const STORAGE_KEY = 'gerador-cards:campaigns';

function readAll(): Campaign[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? (JSON.parse(raw) as Campaign[]) : [];
    return items.map((campaign) => ({
      ...campaign,
      lojas: campaign.lojas && campaign.lojas.length > 0 ? campaign.lojas : ['matriz'],
      templateId: campaign.templateId ?? 'barao',
      priceStore: campaign.priceStore ?? campaign.lojas?.[0] ?? 'matriz',
      priceType: campaign.priceType ?? 'preco',
    }));
  } catch {
    return [];
  }
}

function writeAll(items: Campaign[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export class LocalStorageCampaignRepository implements CampaignRepository {
  list(): Campaign[] {
    return readAll();
  }

  create(input: CampaignInput): Campaign {
    const items = readAll();
    const campaign: Campaign = { ...input, id: crypto.randomUUID() };
    items.push(campaign);
    writeAll(items);
    return campaign;
  }

  update(campaign: Campaign): Campaign {
    const items = readAll().map((c) => (c.id === campaign.id ? campaign : c));
    writeAll(items);
    return campaign;
  }

  remove(id: string): void {
    writeAll(readAll().filter((c) => c.id !== id));
  }
}