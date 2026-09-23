import { describe, expect, it } from 'vitest';
import { MAX_CARD_PRODUCTS } from './grid';

describe('grid', () => {
  it('limita o card aos 9 produtos do pôster', () => {
    expect(MAX_CARD_PRODUCTS).toBe(9);
  });
});