import { useState } from 'react';
import { STORE_LABELS, STORES, type ProductInput, type StoreCode } from '../../domain/product';
import { parseImportFile, type ImportResult } from '../../import';
import type { ImportSummary } from '../../import/types';
import { generatePlaceholderImage } from '../../utils/image';
import { parsePrice } from '../../utils/parse';

interface ImportPanelProps {
  onImport: (inputs: ProductInput[]) => ImportSummary;
  onClose: () => void;
}

interface RowEdit {
  index: number;
  nome: string;
  codigoBarras?: string;
  unidade: string;
  precos: Record<StoreCode, { preco: string; cv: string }>;
  erros: string[];
}

function rowToEdit(index: number, nome: string, codigoBarras: string | undefined, unidade: string | undefined, precos: RowEdit['precos'], erros: string[]): RowEdit {
  return { index, nome, codigoBarras, unidade: unidade ?? 'KG', precos, erros };
}

export function ImportPanel({ onImport, onClose }: ImportPanelProps) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [rows, setRows] = useState<RowEdit[]>([]);
  const [included, setIncluded] = useState<boolean[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);

  function handleFileChange(file: File | undefined) {
    if (!file) return;
    setSummary(null);
    setResult(null);
    setBusy(true);
    parseImportFile(file)
      .then((res) => {
        setResult(res);
        setRows(
          res.rows.map((row) =>
            rowToEdit(
              row.index,
              row.nome,
              row.codigoBarras,
              row.unidade,
              {
                matriz: { preco: priceToInput(row.precos.matriz?.preco), cv: priceToInput(row.precos.matriz?.cv) },
                loja2: { preco: priceToInput(row.precos.loja2?.preco), cv: priceToInput(row.precos.loja2?.cv) },
                summit: { preco: priceToInput(row.precos.summit?.preco), cv: priceToInput(row.precos.summit?.cv) },
              },
              row.erros,
            ),
          ),
        );
        setIncluded(res.rows.map((row) => !row.erros.includes('Produto sem nome.')));
      })
      .catch((error: unknown) => {
        setResult({ rows: [], skipped: [error instanceof Error ? error.message : 'Falha ao ler o arquivo.'], fileName: file.name });
      })
      .finally(() => setBusy(false));
  }

  function setNome(i: number, value: string) {
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, nome: value } : row)));
  }

  function setUnidade(i: number, value: string) {
    setRows((prev) => prev.map((row, idx) => (idx === i ? { ...row, unidade: value } : row)));
  }

  function setPrice(i: number, store: StoreCode, field: 'preco' | 'cv', value: string) {
    setRows((prev) =>
      prev.map((row, idx) =>
        idx === i
          ? { ...row, precos: { ...row.precos, [store]: { ...row.precos[store], [field]: value } } }
          : row,
      ),
    );
  }

  function buildInputs(): ProductInput[] {
    return rows
      .map((row, i) => (included[i] ? editToInput(row) : null))
      .filter((input): input is ProductInput => input !== null && input.nome.trim() !== '');
  }

  function handleImport() {
    const inputs = buildInputs();
    if (inputs.length === 0) return;
    const sum = onImport(inputs);
    setSummary(sum);
  }

  const selectedCount = buildInputs().length;

  if (summary) {
    return (
      <section className="panel import-panel">
        <h2>Importação concluída</h2>
        <ul className="import-summary">
          <li>{summary.created} produto(s) novo(s) adicionado(s).</li>
          <li>{summary.updated} produto(s) já cadastrado(s) com os preços atualizados.</li>
          {summary.semPreco > 0 && <li>{summary.semPreco} produto(s) importado(s) sem preço.</li>}
        </ul>
        <div className="actions">
          <button type="button" className="btn ghost file">
            Importar outro arquivo
            <input type="file" accept=".xlsx,.xls,.csv,.pdf" onChange={(e) => handleFileChange(e.target.files?.[0])} />
          </button>
          <button type="button" className="btn primary" onClick={onClose}>Fechar</button>
        </div>
      </section>
    );
  }

  return (
    <section className="panel import-panel">
      <div className="panel-head">
        <h2>Importar PDF / Excel</h2>
        <button type="button" className="btn ghost sm" onClick={onClose}>Fechar</button>
      </div>

      {!result && (
        <>
          <p className="ok-hint">
            Envie um arquivo (.xlsx, .xls, .csv ou .pdf) com as colunas{' '}
            <strong>PRODUTO, MATRIZ, CV M., LOJA 2, CV L2, SUMMIT, CV S, UNIDADE</strong>.
          </p>
          <label className="btn primary file drop-zone">
            {busy ? 'Lendo arquivo...' : 'Escolher arquivo'}
            <input type="file" accept=".xlsx,.xls,.csv,.pdf" disabled={busy} onChange={(e) => handleFileChange(e.target.files?.[0])} />
          </label>
        </>
      )}

      {busy && !result && <p className="ok-hint">Processando...</p>}

      {result && result.rows.length === 0 && (
        <div className="import-empty">
          <p className="ok-hint">Nenhum produto foi lido do arquivo.</p>
          <ul className="import-skipped">
            {result.skipped.map((msg, i) => (
              <li key={i} className="issue">{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {result && result.rows.length > 0 && (
        <>
          <p className="ok-hint">
            Confira os dados antes de importar. Linhas marcadas atualizam preços de produtos com o mesmo nome.
          </p>

          <div className="import-table-wrap">
            <table className="import-table">
              <thead>
                <tr>
                  <th className="import-check" aria-label="Incluir">Incluir</th>
                  <th>Produto</th>
                  {STORES.map((store) => (
                    <th key={store}>{STORE_LABELS[store]}</th>
                  ))}
                  <th>Un.</th>
                  <th className="import-errors">Observações</th>
                  <th>Código de barras / EAN</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={row.index} className={included[i] ? '' : 'import-row-off'}>
                    <td className="import-check">
                      <input type="checkbox" checked={included[i]} onChange={() => {
                        setIncluded((prev) => prev.map((inc, idx) => (idx === i ? !inc : inc)));
                      }} />
                    </td>
                    <td>
                      <input value={row.nome} onChange={(e) => setNome(i, e.target.value)} />
                      {row.erros.map((erro, k) => (
                        <span key={k} className="import-badge warn">{erro}</span>
                      ))}
                    </td>
                    {STORES.map((store) => (
                      <td key={store}>
                        <div className="import-prices">
                          <span className="import-label">R$</span>
                          <input inputMode="decimal" value={row.precos[store].preco} onChange={(e) => setPrice(i, store, 'preco', e.target.value)} placeholder="0,00" />
                          <span className="import-label">CV</span>
                          <input inputMode="decimal" value={row.precos[store].cv} onChange={(e) => setPrice(i, store, 'cv', e.target.value)} placeholder="0,00" />
                        </div>
                      </td>
                    ))}
                    <td>
                      <input className="import-unit" value={row.unidade} onChange={(e) => setUnidade(i, e.target.value)} />
                    </td>
                    <td className="import-errors" />
                    <td>
                      <input
                        value={row.codigoBarras ?? ''}
                        onChange={(e) => setRows((prev) => prev.map((item, idx) => (
                          idx === i ? { ...item, codigoBarras: e.target.value } : item
                        )))}
                        placeholder="Não informado"
                        inputMode="numeric"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="actions">
            <span className="ok-hint">{selectedCount} produto(s) selecionado(s).</span>
            <button type="button" className="btn primary" disabled={selectedCount === 0} onClick={handleImport}>
              Importar {selectedCount > 0 ? `(${selectedCount})` : ''}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

function priceToInput(value: number | undefined): string {
  return value ? String(value).replace('.', ',') : '';
}

function editToInput(row: RowEdit): ProductInput {
  const precos: ProductInput['precos'] = {};
  STORES.forEach((store) => {
    const preco = parsePrice(row.precos[store].preco);
    const cv = parsePrice(row.precos[store].cv);
    if (preco === undefined) return;
    precos[store] = { preco, ...(cv !== undefined ? { cv } : {}) };
  });
  return {
    nome: row.nome.trim(),
    precos,
    unidade: row.unidade.trim().toUpperCase() || 'KG',
    categoria: '',
    codigoBarras: row.codigoBarras,
    imagem: generatePlaceholderImage(row.nome),
    ativo: true,
  };
}