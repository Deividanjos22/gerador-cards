import type { Campaign } from './campaign';
import { cvDaLoja, precoDaLoja, STORE_LABELS, type Product } from './product';
import { MAX_CARD_PRODUCTS } from './grid';

export interface ValidationIssue {
  code: string;
  message: string;
}

export interface CardValidation {
  valid: boolean;
  issues: ValidationIssue[];
}

export function validateCardData(
  campaign: Campaign | null,
  products: Product[],
): CardValidation {
  const issues: ValidationIssue[] = [];

  if (!campaign) {
    issues.push({
      code: 'campanha-inexistente',
      message: 'Selecione uma campanha para gerar o card.',
    });
  } else {
    if (!campaign.titulo.trim()) {
      issues.push({ code: 'titulo-vazio', message: 'Informe o título da campanha.' });
    }
    if (!campaign.dataInicio) {
      issues.push({ code: 'inicio-vazio', message: 'Informe a data inicial do período.' });
    }
    if (!campaign.dataFim) {
      issues.push({ code: 'fim-vazio', message: 'Informe a data final do período.' });
    }
    if (campaign.dataInicio && campaign.dataFim && campaign.dataInicio > campaign.dataFim) {
      issues.push({
        code: 'periodo-invalido',
        message: 'A data inicial não pode ser maior que a data final.',
      });
    }
    if (!campaign.lojas || campaign.lojas.length === 0) {
      issues.push({
        code: 'lojas-vazio',
        message: 'Selecione ao menos uma loja para a campanha.',
      });
    }
  }

  if (products.length === 0) {
    issues.push({
      code: 'sem-produtos',
      message: 'Selecione ao menos um produto para a campanha.',
    });
  } else {
    if (products.length > MAX_CARD_PRODUCTS) {
      issues.push({
        code: 'muitos-produtos',
        message: `O card suporta no máximo ${MAX_CARD_PRODUCTS} produtos. Você selecionou ${products.length}.`,
      });
    }
    products.forEach((p) => {
      if (!p.nome.trim()) {
        issues.push({
          code: 'produto-sem-nome',
          message: 'Um dos produtos selecionados não possui nome.',
        });
      }
    });
    if (campaign) {
      products.forEach((p) => {
        const store = campaign.priceStore ?? campaign.lojas[0] ?? 'matriz';
        const value = campaign.priceType === 'cv' ? cvDaLoja(p, store) : precoDaLoja(p, store);
        if (typeof value !== 'number' || value <= 0) {
          const priceLabel = campaign.priceType === 'cv' ? 'preço CV' : 'preço normal';
          issues.push({
            code: 'produto-sem-preco',
            message: `"${nomeExibicao(p)}" não possui ${priceLabel} válido para ${STORE_LABELS[store]}.`,
          });
        }
      });
    }
  }

  return { valid: issues.length === 0, issues };
}

function nomeExibicao(p: Product): string {
  return p.nome.trim() || '(produto sem nome)';
}