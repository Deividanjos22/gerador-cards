export interface Theme {
  canvas: { width: number; height: number };
  logo?: string;
  colors: {
    background: string;
    primary: string;
    onPrimary: string;
    accent: string;
    onAccent: string;
    price: string;
    onPrice: string;
    text: string;
    muted: string;
    cellBackground: string;
    cellBorder: string;
  };
  fonts: {
    title: string;
    period: string;
    name: string;
    price: string;
    unit: string;
    footer: string;
  };
  priceSymbol: string;
  unitSymbol: string;
  header: { height: number };
  period: { height: number };
  footer: { height: number; text: string };
  grid: {
    marginX: number;
    marginTop: number;
    marginBottom: number;
    gap: number;
  };
  cell: {
    padding: number;
    radius: number;
    imageRadius: number;
    nameLines: number;
    nameLineHeight: number;
    pricePillHeight: number;
    pricePillGap: number;
  };
}

export function mergeTheme(raw: unknown): Theme {
  if (!raw || typeof raw !== 'object') return baseTheme;
  const patch = raw as Record<string, unknown>;

  const theme: Theme = {
    ...baseTheme,
    canvas: { ...baseTheme.canvas },
    colors: { ...baseTheme.colors },
    fonts: { ...baseTheme.fonts },
    header: { ...baseTheme.header },
    period: { ...baseTheme.period },
    footer: { ...baseTheme.footer },
    grid: { ...baseTheme.grid },
    cell: { ...baseTheme.cell },
  };

  if (typeof patch.logo === 'string' && patch.logo.length > 0) theme.logo = patch.logo;

  const canvas = patch.canvas as Record<string, unknown> | undefined;
  if (canvas) {
    if (typeof canvas.width === 'number' && canvas.width > 0) theme.canvas.width = canvas.width;
    if (typeof canvas.height === 'number' && canvas.height > 0) theme.canvas.height = canvas.height;
  }

  const colors = patch.colors as Record<string, unknown> | undefined;
  if (colors) {
    (Object.keys(theme.colors) as (keyof Theme['colors'])[]).forEach((key) => {
      const value = colors[key];
      if (typeof value === 'string' && value) theme.colors[key] = value;
    });
  }

  const fonts = patch.fonts as Record<string, unknown> | undefined;
  if (fonts) {
    (Object.keys(theme.fonts) as (keyof Theme['fonts'])[]).forEach((key) => {
      const value = fonts[key];
      if (typeof value === 'string' && value) theme.fonts[key] = value;
    });
  }

  const header = patch.header as Record<string, unknown> | undefined;
  if (header && typeof header.height === 'number' && header.height > 0) theme.header.height = header.height;

  const period = patch.period as Record<string, unknown> | undefined;
  if (period && typeof period.height === 'number' && period.height > 0) theme.period.height = period.height;

  const footer = patch.footer as Record<string, unknown> | undefined;
  if (footer) {
    if (typeof footer.height === 'number' && footer.height > 0) theme.footer.height = footer.height;
    if (typeof footer.text === 'string') theme.footer.text = footer.text;
  }

  const grid = patch.grid as Record<string, unknown> | undefined;
  if (grid) {
    (['marginX', 'marginTop', 'marginBottom', 'gap'] as const).forEach((key) => {
      const value = grid[key];
      if (typeof value === 'number' && value >= 0) theme.grid[key] = value;
    });
  }

  const cell = patch.cell as Record<string, unknown> | undefined;
  if (cell) {
    (
      [
        'padding',
        'radius',
        'imageRadius',
        'nameLines',
        'nameLineHeight',
        'pricePillHeight',
        'pricePillGap',
      ] as const
    ).forEach((key) => {
      const value = cell[key];
      if (typeof value === 'number' && value >= 0) theme.cell[key] = value;
    });
  }

  return theme;
}

export function readableOn(hex: string): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return '#ffffff';
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? '#1d1810' : '#ffffff';
}

export const baseTheme: Theme = {
  canvas: { width: 1080, height: 1350 },
  colors: {
    background: '#f4f0ea',
    primary: '#c1272d',
    onPrimary: '#ffffff',
    accent: '#ffd200',
    onAccent: '#2a1d00',
    price: '#c1272d',
    onPrice: '#ffffff',
    text: '#222222',
    muted: '#6f6a61',
    cellBackground: '#ffffff',
    cellBorder: '#e6e0d6',
  },
  fonts: {
    title: '700 60px Poppins, sans-serif',
    period: '600 30px Poppins, sans-serif',
    name: '600 25px Poppins, sans-serif',
    price: '800 38px Poppins, sans-serif',
    unit: '600 23px Poppins, sans-serif',
    footer: '600 26px Poppins, sans-serif',
  },
  priceSymbol: 'R$',
  unitSymbol: '/',
  header: { height: 122 },
  period: { height: 52 },
  footer: { height: 104, text: '' },
  grid: {
    marginX: 40,
    marginTop: 44,
    marginBottom: 48,
    gap: 18,
  },
  cell: {
    padding: 14,
    radius: 18,
    imageRadius: 12,
    nameLines: 2,
    nameLineHeight: 32,
    pricePillHeight: 62,
    pricePillGap: 8,
  },
};