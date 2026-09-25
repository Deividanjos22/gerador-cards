import { describe, expect, it } from 'vitest';
import {
  buildLayout,
  buildPdfResult,
  buildRowsFromLines,
  detectHeaderLine,
  type PdfWord,
} from './pdfLayout';

function w(text: string, x: number, y: number, size = 10): PdfWord {
  return { text, x, y, h: size, w: text.length * size * 0.55 };
}

const HEADER: PdfWord[] = [
  w('PRODUTO 19 09 26', 39, -1),
  w(' ', 100, -1),
  w('LOJA 2', 235, -1),
  w(' ', 252, -1),
  w('CV L2', 264, -1),
  w(' ', 281, -1),
  w('MATRIZ', 290, -1),
  w(' ', 309, -1),
  w('CV M.', 318, -1),
  w(' ', 336, -1),
  w('SUMMIT', 344, -1),
  w(' ', 365, -1),
  w('CV S', 376, -1),
  w(' ', 391, -1),
  w('COD.INT', 417, -1),
  w(' ', 439, -1),
  w('CODIGO UNIDADE', 458, -1),
];

describe('detectHeaderLine / buildLayout', () => {
  it('reconhece o cabeÃ§alho multipalavra do encarte real', () => {
    const lines = [HEADER];
    expect(detectHeaderLine(lines)).toBe(0);

    const layout = buildLayout(HEADER);
    expect(layout.starts).toEqual([235, 264, 290, 318, 344, 376]);
    expect(layout.codeStart).toBe(417);
    expect(layout.columns.map((c) => `${c.store}:${c.field}`)).toEqual([
      'loja2:preco',
      'loja2:cv',
      'matriz:preco',
      'matriz:cv',
      'summit:preco',
      'summit:cv',
    ]);
  });

  it('considera linha repetida do cabeÃ§alho como cabeÃ§alho', () => {
    const line = [...HEADER.slice(0, 7), w('MATRIZ', 290, -60), w('SUMMIT', 344, -60)];
    expect(detectHeaderLine([line])).toBe(0);
  });
});

describe('buildRowsFromLines', () => {
  it('mapeia 6 valores de preÃ§o nas colunas certas', () => {
    const layout = buildLayout(HEADER);
    const row: PdfWord[] = [
      w('ARROZ SAFRA PARBOILIZADO KG', 39, -10),
      w('4,29', 237, -10),
      w(' ', 251, -10),
      w('3,89', 266, -10),
      w(' ', 279, -10),
      w('4,19', 293, -10),
      w(' ', 306, -10),
      w('3,99', 321, -10),
      w(' ', 334, -10),
      w('4,19', 348, -10),
      w(' ', 361, -10),
      w('3,99', 377, -10),
      w(' ', 390, -10),
      w('9077', 421, -10),
      w(' ', 434, -10),
      w('7898213390031', 471, -10),
    ];
    const rows = buildRowsFromLines([HEADER, row], layout, 0);

    expect(rows).toHaveLength(1);
    const cells = rows[0].cells;
    expect(cells[0]).toBe('ARROZ SAFRA PARBOILIZADO');
    expect(cells[7]).toBe('KG');
    expect(cells[1]).toBe('4,29');
    expect(cells[2]).toBe('3,89');
    expect(cells[3]).toBe('4,19');
    expect(cells[4]).toBe('3,99');
    expect(cells[5]).toBe('4,19');
    expect(cells[6]).toBe('3,99');
  });

  it('deixa colunas vazias quando o produto nÃ£o tem preÃ§o naquela loja', () => {
    const layout = buildLayout(HEADER);
    const row: PdfWord[] = [
      w('ACUCAR CRISTAL SO DOCE KG', 39, -10),
      w('2,95', 237, -10),
      w(' ', 251, -10),
      w('2,95', 266, -10),
      w(' ', 279, -10),
      w('3,29', 293, -10),
      w(' ', 306, -10),
      w('3,29', 348, -10),
      w(' ', 361, -10),
      w('4637/ 67780/62553', 402, -10),
    ];
    const rows = buildRowsFromLines([HEADER, row], layout, 0);
    const cells = rows[0].cells;
    expect(cells[1]).toBe('2,95');
    expect(cells[2]).toBe('2,95');
    expect(cells[3]).toBe('3,29');
    expect(cells[4]).toBe('');
    expect(cells[5]).toBe('3,29');
    expect(cells[6]).toBe('');
  });

  it('extrai unidade com tamanho completo (500ML)', () => {
    const layout = buildLayout(HEADER);
    const row: PdfWord[] = [w('AZEITE OLIVA EXTRA VIRGEM 500ML', 39, -10)];
    const rows = buildRowsFromLines([HEADER, row], layout, 0);
    expect(rows[0].cells[0]).toBe('AZEITE OLIVA EXTRA VIRGEM');
    expect(rows[0].cells[7]).toBe('500ML');
  });

  it('nÃ£o quebra nomes com "1,5" nem cÃ³digos com sublinhado', () => {
    const layout = buildLayout(HEADER);
    const row: PdfWord[] = [
      w('SUCO SALTON UVA TTO INTEGRAL 1,5', 39, -10),
      w('12,99', 237, -10),
      w('47199/_9866', 411, -10),
      w(' ', 443, -10),
      w('7896089012637', 471, -10),
    ];
    const rows = buildRowsFromLines([HEADER, row], layout, 0);
    expect(rows[0].cells[0]).toBe('SUCO SALTON UVA TTO INTEGRAL 1,5');
    expect(rows[0].cells[1]).toBe('12,99');
  });
});

describe('buildPdfResult', () => {
  it('gera ImportResult completo (nome, unidade e 6 preÃ§os)', () => {
    const url = buildPdfResult([HEADER, [w('ARROZ SAFRA PARBOILIZADO KG', 39, -10), w('4,29', 237, -10), w('3,89', 266, -10), w('4,19', 293, -10), w('3,99', 321, -10), w('4,19', 348, -10), w('3,99', 377, -10), w('9077', 421, -10), w('7898213390031', 471, -10)]]);
    expect(url.skipped).toEqual([]);
    expect(url.rows).toHaveLength(1);
    const row = url.rows[0];
    expect(row.nome).toBe('ARROZ SAFRA PARBOILIZADO');
    expect(row.unidade).toBe('KG');
    expect(row.precos.loja2).toEqual({ preco: 4.29, cv: 3.89 });
    expect(row.precos.matriz).toEqual({ preco: 4.19, cv: 3.99 });
    expect(row.precos.summit).toEqual({ preco: 4.19, cv: 3.99 });
    expect(row.codigoBarras).toBe('7898213390031');
    expect(row.erros).toEqual([]);
  });

  it('retorna skipped quando nÃ£o hÃ¡ cabeÃ§alho', () => {
    const result = buildPdfResult([[w('FEIRA LIVRE', 10, -10), w('12,99', 100, -10)]]);
    expect(result.rows).toEqual([]);
    expect(result.skipped.length).toBeGreaterThan(0);
  });
});
