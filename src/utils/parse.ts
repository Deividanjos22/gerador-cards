export function parsePrice(raw: unknown): number | undefined {
  if (raw === null || raw === undefined) return undefined;
  const text = String(raw).trim().replace(/^[^0-9.,-]+/, '');
  if (!text) return undefined;

  const numeric = Number(text);
  if (Number.isFinite(numeric)) return numeric > 0 ? numeric : undefined;

  const hasComma = text.includes(',');
  const hasDot = text.includes('.');
  let normalized = text;
  if (hasComma && hasDot) {
    normalized = text.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = text.replace(',', '.');
  } else if (hasDot) {
    normalized = text.replace('.', ',');
  }

  const value = Number(normalized);
  if (!Number.isFinite(value)) return undefined;
  return value > 0 ? value : undefined;
}

export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}