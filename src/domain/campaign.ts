import type { StoreCode } from './product';
import type { TemplateId } from '../generator/templates';

export interface Campaign {
  id: string;
  titulo: string;
  dataInicio: string;
  dataFim: string;
  lojas: StoreCode[];
  produtoIds: string[];
  nomesProdutos?: Record<string, string>;
  templateId?: TemplateId;
  priceStore?: StoreCode;
  priceType?: 'preco' | 'cv';
}

export type CampaignInput = Omit<Campaign, 'id'>;