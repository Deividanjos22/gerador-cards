import type { Campaign } from '../domain/campaign';
import type { Product, StoreCode } from '../domain/product';
import { formatPrice } from '../utils/format';
import {
  POSTER_HEIGHT,
  POSTER_WIDTH,
  MAX_POSTER_PRODUCTS,
  productImageArea,
  productImageBox,
  rowSlots,
  type PosterSlot,
} from './template';
import { FEED_TEMPLATE, getTemplate } from './templates';
import { getCardFormat, type CardFormat } from './format';
import { feedProductImageArea, feedProductLabelBox, feedProductBox } from './feedTemplate';

export interface CardData {
  campaign: Campaign;
  products: Product[];
  format?: CardFormat;
}

export async function renderCardToCanvas(
  canvas: HTMLCanvasElement,
  card: CardData,
): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível.');

  const format = getCardFormat(card.format ?? 'story');
  const isFeed = (card.format ?? 'story') === 'feed';
  const templateDefinition = isFeed ? FEED_TEMPLATE : getTemplate(card.campaign.templateId);
  canvas.width = format.width;
  canvas.height = format.height;

  await document.fonts.ready;

  const template = await loadImage(templateDefinition.imageUrl);
  const products = card.products.slice(0, MAX_POSTER_PRODUCTS);
  const images = await imagesForProducts(products);
  const scale = isFeed ? format.width / templateDefinition.width : 1;

  ctx.save();
  ctx.translate(0, 0);
  ctx.scale(scale, scale);
  ctx.drawImage(template, 0, 0, templateDefinition.width, templateDefinition.height);
  if (isFeed) {
    drawFeedProducts(ctx, card, products, images);
  } else {
    drawCampaignValidity(ctx, card.campaign);
    products.forEach((product, index) => {
      const row = Math.floor(index / 3);
      const column = index % 3;
      drawProductCard(
        ctx,
        product,
        row,
        column,
        images[index],
        card.campaign.nomesProdutos?.[product.id],
        card.campaign.priceStore ?? card.campaign.lojas[0] ?? 'matriz',
        card.campaign.priceType ?? 'preco',
      );
    });
  }
  ctx.restore();
}

async function imagesForProducts(products: Product[]): Promise<(HTMLImageElement | undefined)[]> {
  return Promise.all(
    products.slice(0, MAX_POSTER_PRODUCTS).map((product) =>
      product.imagem ? loadImage(product.imagem) : Promise.resolve(undefined),
    ),
  );
}

function drawFeedProducts(
  ctx: CanvasRenderingContext2D,
  card: CardData,
  products: Product[],
  images: (HTMLImageElement | undefined)[],
): void {
  const store = card.campaign.priceStore ?? card.campaign.lojas[0] ?? 'matriz';
  const priceType = card.campaign.priceType ?? 'preco';

  products.forEach((product, index) => {
    const row = Math.floor(index / 3);
    const column = index % 3;
    const box = feedProductBox(row, column);
    const imageArea = feedProductImageArea(row, column);
    const labelBox = feedProductLabelBox(row, column);
    if (!box || !imageArea || !labelBox) return;
    if (images[index]) drawProductImage(ctx, images[index]!, imageArea);

    const displayName = card.campaign.nomesProdutos?.[product.id]?.trim() || product.nome;
    drawFeedLabel(ctx, [displayName, product.unidade].filter(Boolean).join(' · '), labelBox);
    drawFeedPrice(ctx, product, store, priceType, box.x + 88, box.y + 145);
  });

  const validity = formatCampaignValidity(card.campaign.dataInicio, card.campaign.dataFim);
  if (validity) {
    drawValidityWithinBox(ctx, validity, { x: 430, y: 900, width: 180, height: 38 }, 14, true);
  }
}

function drawFeedLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  box: { x: number; y: number; width: number; height: number },
): void {
  ctx.font = '700 16px Poppins, sans-serif';
  ctx.fillStyle = '#01327c';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(fitText(ctx, text, box.width), box.x + box.width / 2, box.y + 16);
}

function drawFeedPrice(
  ctx: CanvasRenderingContext2D,
  product: Product,
  store: StoreCode,
  priceType: 'preco' | 'cv',
  x: number,
  y: number,
): void {
  const price = product.precos[store]?.[priceType];
  if (typeof price !== 'number' || price <= 0) return;
  const [whole, cents] = formatPrice(price).split(',');
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.font = '800 28px Poppins, sans-serif';
  ctx.fillText(whole, x, y);
  const wholeWidth = ctx.measureText(whole).width;
  ctx.font = '800 16px Poppins, sans-serif';
  ctx.fillText(`,${cents ?? '00'}`, x + wholeWidth + 2, y - 7);
}

function drawValidityWithinBox(
  ctx: CanvasRenderingContext2D,
  validity: string,
  box: { x: number; y: number; width: number; height: number },
  fontSize: number,
  forceTwoLines = false,
): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.font = `700 ${fontSize}px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const lines = fitTextLines(ctx, validity, box.width - 8, forceTwoLines ? 2 : 1);
  if (forceTwoLines && lines.length === 1) {
    const words = validity.trim().split(/\s+/);
    const splitAt = Math.ceil(words.length / 2);
    lines.splice(0, 1, words.slice(0, splitAt).join(' '), words.slice(splitAt).join(' '));
  }
  const lineHeight = fontSize + 2;
  const firstLineY = box.y + box.height / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, box.x + box.width / 2, firstLineY + index * lineHeight);
  });
  ctx.restore();
}

function drawCampaignValidity(ctx: CanvasRenderingContext2D, campaign: Campaign): void {
  const validity = formatCampaignValidity(campaign.dataInicio, campaign.dataFim);
  if (!validity) return;

  drawValidityWithinBox(ctx, validity, { x: 500, y: 1572, width: 250, height: 48 }, 22, true);
}

function formatCampaignValidity(startDate: string, endDate: string): string {
  const start = parseDateParts(startDate);
  const end = parseDateParts(endDate);
  if (!start || !end) return '';

  if (start.month === end.month && start.year === end.year) {
    return `${start.day} A ${end.day} de ${start.monthName}`;
  }
  return `${start.day} de ${start.monthName} A ${end.day} de ${end.monthName}`;
}

function parseDateParts(date: string): {
  day: string;
  month: number;
  monthName: string;
  year: number;
} | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const monthName = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'][month - 1];
  if (!monthName || day < 1 || day > 31) return null;

  return { day: String(day), month, monthName, year };
}

/* ------------------------------------------------------------------ */
/* Cartão do produto                                                   */
/* ------------------------------------------------------------------ */

function drawProductCard(
  ctx: CanvasRenderingContext2D,
  product: Product,
  row: number,
  column: number,
  productImage: HTMLImageElement | undefined,
  customName: string | undefined,
  priceStore: StoreCode,
  priceType: 'preco' | 'cv',
): void {
  const slot = rowSlots(row)[column];
  const imageBox = productImageBox(row, column);
  if (!slot || !imageBox) return;

  const imageArea = productImageArea(row, column);
  if (productImage && imageArea) drawProductImage(ctx, productImage, imageArea);
  const displayName = customName?.trim() || product.nome;
  drawLabel(ctx, [displayName, product.unidade].filter(Boolean).join(' · '), imageBox);

  drawPrice(ctx, product, priceStore, priceType, slot);
}

function drawProductImage(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  box: { x: number; y: number; width: number; height: number },
): void {
  const scale = Math.min(box.width / image.naturalWidth, box.height / image.naturalHeight);
  const width = image.naturalWidth * scale;
  const height = image.naturalHeight * scale;
  const x = box.x + (box.width - width) / 2;
  const y = box.y + (box.height - height) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.drawImage(image, x, y, width, height);
  ctx.restore();
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  box: { x: number; y: number; width: number; height: number },
): void {
  const fontSize = 24;
  const lineHeight = 28;
  ctx.font = `700 ${fontSize}px Poppins, sans-serif`;
  const maxTextWidth = box.width - 16;
  const lines = fitTextLines(ctx, text, maxTextWidth, 2);
  const centerX = box.x + box.width / 2;
  const firstBaseline = box.y + fontSize + 10;

  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.fillStyle = '#01327C';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((line, index) => {
    ctx.fillText(line, centerX, firstBaseline + index * lineHeight);
  });
  ctx.restore();
}

function fitTextLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [''];

  const lines: string[] = [];
  let current = '';
  words.forEach((word) => {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else if (current) {
      lines.push(current);
      current = word;
    } else {
      lines.push(fitText(ctx, word, maxWidth));
      current = '';
    }
  });
  if (current) lines.push(current);

  if (lines.length <= maxLines) return lines;
  const visible = lines.slice(0, maxLines);
  visible[maxLines - 1] = fitText(ctx, `${visible[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxWidth);
  return visible;
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  const ellipsis = '…';
  let fitted = text;
  while (fitted.length > 0 && ctx.measureText(`${fitted}${ellipsis}`).width > maxWidth) {
    fitted = fitted.slice(0, -1);
  }
  return `${fitted.trimEnd()}${ellipsis}`;
}

function drawPrice(
  ctx: CanvasRenderingContext2D,
  product: Product,
  store: StoreCode,
  priceType: 'preco' | 'cv',
  slot: PosterSlot,
): void {
  const preco = product.precos[store]?.[priceType];
  if (typeof preco !== 'number' || preco <= 0) return;

  const bx = slot.x * POSTER_WIDTH;
  const by = slot.y * POSTER_HEIGHT;
  const cv = product.precos[store]?.cv;

  const [whole, cents] = formatPrice(preco).split(',');
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 44px Poppins, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(whole, bx + 32, by + 21);

  const wholeWidth = ctx.measureText(whole).width;
  ctx.font = '800 27px Poppins, sans-serif';
  ctx.fillText(`,${cents ?? '00'}`, bx + 32 + wholeWidth + 2, by + 12);

  if (priceType === 'preco' && typeof cv === 'number' && cv > 0) {
    ctx.fillStyle = '#3a3f4d';
    ctx.font = '700 16px Poppins, sans-serif';
    ctx.fillText(`CV ${formatPrice(cv)}`, bx + 32, by + 46);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Falha ao carregar a imagem do template.'));
    image.src = src;
  });
}
