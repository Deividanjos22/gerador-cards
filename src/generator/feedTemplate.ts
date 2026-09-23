export const FEED_TEMPLATE_WIDTH = 768;
export const FEED_TEMPLATE_HEIGHT = 960;

const FEED_COLUMNS = [34, 280, 526];
const FEED_ROWS = [367, 535, 703];

export interface FeedBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function feedProductBox(row: number, column: number): FeedBox | undefined {
  const x = FEED_COLUMNS[column];
  const y = FEED_ROWS[row];
  if (x === undefined || y === undefined) return undefined;
  return { x, y, width: 208, height: 158 };
}

export function feedProductLabelBox(row: number, column: number): FeedBox | undefined {
  const box = feedProductBox(row, column);
  if (!box) return undefined;
  return { x: box.x + 10, y: box.y + 8, width: 188, height: 25 };
}

export function feedProductImageArea(row: number, column: number): FeedBox | undefined {
  const box = feedProductBox(row, column);
  if (!box) return undefined;
  return { x: box.x + 12, y: box.y + 34, width: 184, height: 78 };
}
