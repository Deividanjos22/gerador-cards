export const CARD_FORMATS = {
  story: { id: 'story', label: 'Story (941 x 1671)', width: 941, height: 1671 },
  feed: { id: 'feed', label: 'Feed vertical 4:5 (1080 x 1350)', width: 1080, height: 1350 },
} as const;

export type CardFormat = keyof typeof CARD_FORMATS;

export function getCardFormat(format: CardFormat): (typeof CARD_FORMATS)[CardFormat] {
  return CARD_FORMATS[format];
}
