import { useState } from 'react';
import { STORE_LABELS, STORES, type Product, type ProductInput, type StoreCode } from '../../domain/product';
import { fileToDataUrl, generatePlaceholderImage } from '../../utils/image';
import { parsePrice } from '../../utils/parse';

interface ProductFormProps {
  product: Product | null;
  onSave: (input: ProductInput) => void;
  onCancel: () => void;
}

interface PrecoState {
  preco: string;
  cv: string;
}

function toInputValue(value: number | undefined): string {
  return value ? String(value).replace('.', ',') : '';
}

export function ProductForm({ product, onSave, onCancel }: ProductFormProps) {
  const [nome, setNome] = useState(product?.nome ?? '');
  const [unidade, setUnidade] = useState(product?.unidade ?? 'KG');
  const [categoria, setCategoria] = useState(product?.categoria ?? '');
  const [ativo, setAtivo] = useState(product?.ativo ?? true);
  const [imagem, setImagem] = useState(product?.imagem ?? '');
  const [preview, setPreview] = useState(product?.imagem ?? '');
  const [precos, setPrecos] = useState<Record<StoreCode, PrecoState>>(() => {
    const init: Record<StoreCode, PrecoState> = {
      matriz: { preco: '', cv: '' },
      loja2: { preco: '', cv: '' },
      summit: { preco: '', cv: '' },
    };
    if (product) {
      STORES.forEach((store) => {
        init[store] = {
          preco: toInputValue(product.precos[store]?.preco),
          cv: toInputValue(product.precos[store]?.cv),
        };
      });
    }
    return init;
  });

  function setStorePrice(store: StoreCode, key: 'preco' | 'cv', value: string) {
    setPrecos((prev) => ({ ...prev, [store]: { ...prev[store], [key]: value } }));
  }

  function handleImageFile(file: File | undefined) {
    if (!file) return;
    fileToDataUrl(file).then((dataUrl) => {
      setImagem(dataUrl);
      setPreview(dataUrl);
    });
  }

  const hasAnyPrice = STORES.some(
    (store) => parsePrice(precos[store].preco) !== undefined || parsePrice(precos[store].cv) !== undefined,
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const built: Product['precos'] = {};
    STORES.forEach((store) => {
      const preco = parsePrice(precos[store].preco);
      const cv = parsePrice(precos[store].cv);
      if (preco === undefined) return;
      built[store] = { preco, ...(cv !== undefined ? { cv } : {}) };
    });
    onSave({
      nome: nome.trim(),
      precos: built,
      unidade: unidade.trim().toUpperCase(),
      categoria: categoria.trim(),
      ativo,
      imagem,
    });
  }

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>{product ? 'Editar produto' : 'Novo produto'}</h2>

      <label className="field">
        <span>Nome</span>
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Acém com osso" required />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Unidade</span>
          <input value={unidade} onChange={(e) => setUnidade(e.target.value)} placeholder="KG" required />
        </label>
        <label className="field">
          <span>Categoria (opcional)</span>
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} placeholder="Ex.: Bovinos" />
        </label>
      </div>

      <div className="store-prices">
        {STORES.map((store) => (
          <fieldset key={store} className="store-prices-block">
            <legend>{STORE_LABELS[store]}</legend>
            <div className="field-row">
              <label className="field">
                <span>Preço (R$)</span>
                <input
                  inputMode="decimal"
                  value={precos[store].preco}
                  onChange={(e) => setStorePrice(store, 'preco', e.target.value)}
                  placeholder="0,00"
                />
              </label>
              <label className="field">
                <span>Preço CV (R$)</span>
                <input
                  inputMode="decimal"
                  value={precos[store].cv}
                  onChange={(e) => setStorePrice(store, 'cv', e.target.value)}
                  placeholder="0,00"
                />
              </label>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="field">
        <span className="field-label">Imagem</span>
        {preview ? (
          <div className="img-preview">
            <img src={preview} alt="" />
            <button type="button" className="btn ghost sm" onClick={() => { setPreview(''); setImagem(''); }}>
              Remover
            </button>
          </div>
        ) : (
          <div className="img-actions">
            <button type="button" className="btn ghost" onClick={() => {
              const dataUrl = generatePlaceholderImage(nome.trim() || 'Produto');
              setImagem(dataUrl);
              setPreview(dataUrl);
            }}>
              Gerar imagem de teste
            </button>
            <label className="btn ghost file">
              Enviar arquivo
              <input type="file" accept="image/*" onChange={(e) => handleImageFile(e.target.files?.[0])} />
            </label>
          </div>
        )}
      </div>

      <label className="check">
        <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
        Produto ativo
      </label>

      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn primary" disabled={!hasAnyPrice}>Salvar</button>
      </div>
    </form>
  );
}