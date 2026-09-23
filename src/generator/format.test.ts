import { describe, expect, it } from 'vitest';
import { CARD_FORMATS, getCardFormat } from './format';

describe('card formats', () => {
  it('mantém Story como formato padrão compatível', () => {
    expect(getCardFormat('story')).toEqual(CARD_FORMATS.story);
    expect(CARD_FORMATS.story.width / CARD_FORMATS.story.height).toBeCloseTo(941 / 1671);
  });

  it('define o Feed vertical em 1080x1350', () => {
    expect(getCardFormat('feed')).toMatchObject({ width: 1080, height: 1350 });
    expect(1080 / 1350).toBeCloseTo(4 / 5);
  });
});
