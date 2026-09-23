export const POSTER_WIDTH = 941;
export const POSTER_HEIGHT = 1671;

export const MAX_POSTER_PRODUCTS = 9;

const ROW_YS = [866, 1175, 1454].map((y) => y / POSTER_HEIGHT);
const COL_XS = [94, 376, 656].map((x) => x / POSTER_WIDTH);

export interface PosterSlot {
  x: number;
  y: number;
}

export function rowSlots(row: number): PosterSlot[] {
  return COL_XS.map((x) => ({ x, y: ROW_YS[row] }));
}

export interface ProductImageBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const PRODUCT_NAME_HEIGHT = 58;

const IMAGE_BOXES: ProductImageBox[][] = [
  [
    { x: 54, y: 605, width: 268, height: 237 },
    { x: 337, y: 605, width: 267, height: 237 },
    { x: 619, y: 605, width: 269, height: 237 },
  ],
  [
    { x: 54, y: 920, width: 268, height: 231 },
    { x: 337, y: 920, width: 267, height: 231 },
    { x: 619, y: 920, width: 269, height: 231 },
  ],
  [
    { x: 54, y: 1231, width: 268, height: 200 },
    { x: 337, y: 1231, width: 267, height: 200 },
    { x: 619, y: 1231, width: 269, height: 200 },
  ],
];

export function productImageBox(row: number, column: number): ProductImageBox | undefined {
  return IMAGE_BOXES[row]?.[column];
}

export function productImageArea(row: number, column: number): ProductImageBox | undefined {
  const box = productImageBox(row, column);
  if (!box) return undefined;
  return {
    x: box.x,
    y: box.y + PRODUCT_NAME_HEIGHT,
    width: box.width,
    height: box.height - PRODUCT_NAME_HEIGHT,
  };
}