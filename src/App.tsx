import { useEffect, useMemo, useRef, useState } from 'react';
import type { Campaign, CampaignInput } from './domain/campaign';
import type { Product, ProductInput, StoreCode } from './domain/product';
import { precosPreenchidos, STORE_LABELS } from './domain/product';
import { MAX_CARD_PRODUCTS } from './domain/grid';
import { validateCardData } from './domain/validation';
import { getCampaignRepository, getProductRepository, initializeData } from './data';
import type { CampaignRepository, ProductRepository } from './data/repository';
import { renderCardToCanvas } from './generator/cardRenderer';
import { productImageArea, productImageBox, POSTER_HEIGHT, POSTER_WIDTH } from './generator/template';
import { canvasToJpegBlob, canvasToPngBlob, downloadBlob } from './export/exporter';
import { upsertProducts } from './import';
import type { ImportSummary } from './import/types';
import { ProductForm } from './ui/produtos/ProductForm';
import { CampaignForm } from './ui/campanhas/CampaignForm';
import { ImportPanel } from './ui/import/ImportPanel';
import { formatPrice, formatDatePtBr, slugify } from './utils/format';
import { fileToDataUrl } from './utils/image';
import { CARD_FORMATS, type CardFormat, getCardFormat } from './generator/format';
import {
  FEED_TEMPLATE_HEIGHT,
  FEED_TEMPLATE_WIDTH,
  feedProductImageArea,
  feedProductLabelBox,
} from './generator/feedTemplate';

initializeData();

const productRepo: ProductRepository = getProductRepository();
const campaignRepo: CampaignRepository = getCampaignRepository();

export default function App() {
  const [products, setProducts] = useState<Product[]>(() => productRepo.list());
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => campaignRepo.list());

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [showCampaignForm, setShowCampaignForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [page, setPage] = useState<'card' | 'products'>('card');
  const [productPageSearch, setProductPageSearch] = useState('');
  const [productPageCategory, setProductPageCategory] = useState('');

  const [selectedCampaignId, setSelectedCampaignId] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [productSearch, setProductSearch] = useState('');

  const [busy, setBusy] = useState<'png' | 'jpg' | null>(null);
  const [cardFormat, setCardFormat] = useState<CardFormat>('story');
  const [editingLabel, setEditingLabel] = useState<{ productId: string; row: number; column: number; value: string } | null>(null);
  const [editingImageProductId, setEditingImageProductId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const activeProducts = useMemo(() => products.filter((p) => p.ativo), [products]);
  const productCategories = useMemo(
    () =>
      [...new Set(products.map((product) => product.categoria?.trim()).filter((category): category is string => Boolean(category)))]
        .sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(productPageSearch);
    return products.filter((product) => {
      const matchesCategory = !productPageCategory || product.categoria?.trim() === productPageCategory;
      const searchable = normalizeSearch(
        [product.nome, product.categoria, product.unidade].filter(Boolean).join(' '),
      );
      return matchesCategory && (!query || searchable.includes(query));
    });
  }, [products, productPageCategory, productPageSearch]);
  const visibleProducts = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!query) return activeProducts;
    return activeProducts.filter((product) =>
      selectedProductIds.includes(product.id) ||
      [product.nome, product.categoria, product.unidade]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .includes(query),
    );
  }, [activeProducts, productSearch, selectedProductIds]);
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) ?? null;

  const selectedProducts = useMemo(
    () =>
      selectedProductIds
        .map((id) => products.find((p) => p.id === id))
        .filter((p): p is Product => Boolean(p)),
    [selectedProductIds, products],
  );

  const validation = useMemo(
    () => validateCardData(selectedCampaign, selectedProducts),
    [selectedCampaign, selectedProducts],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context?.clearRect(0, 0, canvas.width, canvas.height);
    if (!selectedCampaign) return;
    renderCardToCanvas(canvas, { campaign: selectedCampaign, products: selectedProducts, format: cardFormat }).catch(
      () => undefined,
    );
  }, [selectedCampaign, selectedProducts, cardFormat]);

  /* ------------------------------ Produtos ------------------------------ */

  function startNewProduct() {
    setEditingProduct(null);
    setShowProductForm(true);
  }

  function startEditProduct(product: Product) {
    setEditingProduct(product);
    setShowProductForm(false);
  }

  function closeProductForm() {
    setEditingProduct(null);
    setShowProductForm(false);
  }

  function saveProduct(input: ProductInput) {
    if (editingProduct) {
      productRepo.update({ ...input, id: editingProduct.id });
    } else {
      productRepo.create(input);
    }
    setProducts(productRepo.list());
    closeProductForm();
  }

  function removeProduct(id: string) {
    if (!window.confirm('Excluir este produto?')) return;
    productRepo.remove(id);
    setProducts(productRepo.list());
    setSelectedProductIds((prev) => prev.filter((x) => x !== id));
    campaigns.forEach((campaign) => {
      if (!campaign.produtoIds.includes(id)) return;
      const updated: Campaign = { ...campaign, produtoIds: campaign.produtoIds.filter((x) => x !== id) };
      campaignRepo.update(updated);
      setCampaigns((prev) => prev.map((c) => (c.id === campaign.id ? updated : c)));
    });
  }

  /* ----------------------------- Importação --------------------------- */

  function startImport() {
    setShowImport(true);
  }

  function closeImport() {
    setShowImport(false);
  }

  function handleImport(inputs: ProductInput[]): ImportSummary {
    const summary = upsertProducts(productRepo, inputs);
    setProducts(productRepo.list());
    return summary;
  }

  /* ----------------------------- Campanhas ------------------------------ */

  function startNewCampaign() {
    setEditingCampaign(null);
    setShowCampaignForm(true);
  }

  function startEditCampaign(campaign: Campaign) {
    setEditingCampaign(campaign);
    setShowCampaignForm(false);
  }

  function closeCampaignForm() {
    setEditingCampaign(null);
    setShowCampaignForm(false);
  }

  function saveCampaign(input: CampaignInput) {
    let saved: Campaign;
    if (editingCampaign) {
      saved = campaignRepo.update({ ...input, id: editingCampaign.id });
    } else {
      saved = campaignRepo.create(input);
    }
    setCampaigns(campaignRepo.list());
    if (!selectedCampaignId) {
      setSelectedCampaignId(saved.id);
      setSelectedProductIds(saved.produtoIds);
    }
    closeCampaignForm();
  }

  function removeCampaign(id: string) {
    if (!window.confirm('Excluir esta campanha?')) return;
    campaignRepo.remove(id);
    setCampaigns(campaignRepo.list());
    if (selectedCampaignId === id) {
      setSelectedCampaignId('');
      setSelectedProductIds([]);
    }
  }

  /* --------------------------- Construtor ------------------------------- */

  function handleSelectCampaign(id: string) {
    setSelectedCampaignId(id);
    const campaign = campaigns.find((c) => c.id === id);
    setSelectedProductIds(campaign?.produtoIds ?? []);
  }

  function persistCampaignProducts(campaignId: string, ids: string[]) {
    const campaign = campaigns.find((c) => c.id === campaignId);
    if (!campaign || sameIds(campaign.produtoIds, ids)) return;
    const updated: Campaign = { ...campaign, produtoIds: ids };
    campaignRepo.update(updated);
    setCampaigns((prev) => prev.map((c) => (c.id === campaignId ? updated : c)));
  }

  function handleToggleProduct(id: string) {
    if (!selectedCampaignId) return;
    const next = selectedProductIds.includes(id)
      ? selectedProductIds.filter((x) => x !== id)
      : selectedProductIds.length >= MAX_CARD_PRODUCTS
        ? selectedProductIds
        : [...selectedProductIds, id];
    setSelectedProductIds(next);
    persistCampaignProducts(selectedCampaignId, next);
  }

  function handleExport(type: 'png' | 'jpg') {
    const canvas = canvasRef.current;
    if (!canvas || !selectedCampaign) return;
    setBusy(type);
    (type === 'png'
      ? canvasToPngBlob(canvas)
      : canvasToJpegBlob(canvas)
    )
      .then((blob) => {
        const base = slugify(selectedCampaign.titulo) || 'card';
        downloadBlob(blob, `${base}-${selectedCampaign.dataInicio}-${selectedCampaign.dataFim}.${type}`);
      })
      .finally(() => setBusy(null));
  }

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!selectedCampaign) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const canvasWidth = cardFormat === 'feed' ? FEED_TEMPLATE_WIDTH : POSTER_WIDTH;
    const canvasHeight = cardFormat === 'feed' ? FEED_TEMPLATE_HEIGHT : POSTER_HEIGHT;
    const x = ((e.clientX - rect.left) / rect.width) * canvasWidth;
    const y = ((e.clientY - rect.top) / rect.height) * canvasHeight;
    const index = selectedProducts.findIndex((_, i) => {
      const box = cardFormat === 'feed'
        ? feedProductLabelBox(Math.floor(i / 3), i % 3)
        : productImageBox(Math.floor(i / 3), i % 3);
      return Boolean(box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height);
    });
    if (index >= 0) {
      const product = selectedProducts[index];
      setEditingLabel({
        productId: product.id,
        row: Math.floor(index / 3),
        column: index % 3,
        value: selectedCampaign.nomesProdutos?.[product.id] ?? product.nome,
      });
      return;
    }

    const imageIndex = selectedProducts.findIndex((_, i) => {
      const box = cardFormat === 'feed'
        ? feedProductImageArea(Math.floor(i / 3), i % 3)
        : productImageArea(Math.floor(i / 3), i % 3);
      return Boolean(box && x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height);
    });
    if (imageIndex < 0) return;
    setEditingImageProductId(selectedProducts[imageIndex].id);
    imageInputRef.current?.click();
  }

  function handleProductImageChange(file: File | undefined) {
    if (!file || !editingImageProductId) return;
    if (!file.type.startsWith('image/')) return;
    fileToDataUrl(file)
      .then((image) => {
        const product = products.find((item) => item.id === editingImageProductId);
        if (!product) return;
        productRepo.update({ ...product, imagem: image });
        setProducts(productRepo.list());
        setEditingImageProductId(null);
      })
      .catch(() => setEditingImageProductId(null));
  }

  function saveLabel() {
    if (!editingLabel || !selectedCampaign) return;
    const nomesProdutos = { ...(selectedCampaign.nomesProdutos ?? {}) };
    const value = editingLabel.value.trim();
    if (value) nomesProdutos[editingLabel.productId] = value;
    else delete nomesProdutos[editingLabel.productId];
    const updated = { ...selectedCampaign, nomesProdutos };
    campaignRepo.update(updated);
    setCampaigns((prev) => prev.map((campaign) => (campaign.id === updated.id ? updated : campaign)));
    setEditingLabel(null);
  }

  /* ------------------------------ Render -------------------------------- */

  return (
    <div className="app">
      <header className="app-header">
        <div className="brand">
          <span className="brand-badge">GC</span>
          <div>
            <h1>Gerador de Cards</h1>
            <p>Monte cards de ofertas e exporte em PNG ou JPG.</p>
          </div>
        </div>
        <nav className="app-nav" aria-label="Navegação principal">
          <button
            type="button"
            className={`btn ${page === 'card' ? 'primary' : 'ghost'}`}
            onClick={() => { setPage('card'); setShowImport(false); }}
          >
            Card
          </button>
          <button
            type="button"
            className={`btn ${page === 'products' ? 'primary' : 'ghost'}`}
            onClick={() => setPage('products')}
          >
            Produtos
          </button>
        </nav>
      </header>

      {showImport && page === 'products' && (
        <div className="import-section">
          <ImportPanel onImport={handleImport} onClose={closeImport} />
        </div>
      )}

      {page === 'products' ? (
        <main className="products-page">
          <section className="panel">
            <div className="panel-head">
              <h2>Produtos</h2>
              <div className="panel-head-actions">
                <button type="button" className="btn ghost sm" onClick={startImport}>
                  Importar lista
                </button>
                <button type="button" className="btn ghost sm" onClick={startNewProduct}>
                  Adicionar produto
                </button>
              </div>
            </div>
            {showProductForm || editingProduct ? (
              <ProductForm product={editingProduct} onSave={saveProduct} onCancel={closeProductForm} />
            ) : (
              <>
                <div className="product-filters">
                  <input
                    type="search"
                    value={productPageSearch}
                    onChange={(e) => setProductPageSearch(e.target.value)}
                    placeholder="Buscar por nome, categoria ou unidade..."
                    aria-label="Buscar produtos cadastrados"
                  />
                  <select
                    value={productPageCategory}
                    onChange={(e) => setProductPageCategory(e.target.value)}
                    aria-label="Filtrar produtos por categoria"
                  >
                    <option value="">Todas as categorias</option>
                    {productCategories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <ul className="item-list product-page-list">
                {filteredProducts.map((product) => (
                  <li key={product.id} className={`item${product.ativo ? '' : ' inactive'}`}>
                    <div className="item-main">
                      <strong className="item-title">{product.nome}</strong>
                      <span className="item-sub">
                        {resumoPrecos(product)}
                        {product.categoria ? ` · ${product.categoria}` : ''}
                        {product.ativo ? '' : ' · inativo'}
                      </span>
                    </div>
                    <div className="item-actions">
                      <button type="button" className="btn ghost sm" onClick={() => startEditProduct(product)}>
                        Editar
                      </button>
                      <button type="button" className="btn ghost sm danger" onClick={() => removeProduct(product.id)}>
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
                {products.length === 0 && <li className="empty-hint">Nenhum produto cadastrado.</li>}
                {products.length > 0 && filteredProducts.length === 0 && (
                  <li className="empty-hint">Nenhum produto encontrado com esses filtros.</li>
                )}
                </ul>
              </>
            )}
          </section>
        </main>
      ) : (
      <main className="app-main">
        <aside className="app-side">
          <section className="panel campaign-panel">
            <div className="panel-head">
              <h2>Campanhas</h2>
              <button type="button" className="btn ghost sm" onClick={startNewCampaign}>
                Adicionar
              </button>
            </div>

            {showCampaignForm || editingCampaign ? (
              <CampaignForm
                campaign={editingCampaign}
                onSave={saveCampaign}
                onCancel={closeCampaignForm}
              />
            ) : (
              <ul className="item-list">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className="item">
                    <div className="item-main">
                      <strong className="item-title">{campaign.titulo}</strong>
                      <span className="item-sub">
                        {formatDatePtBr(campaign.dataInicio)} a {formatDatePtBr(campaign.dataFim)}
                        {campaign.produtoIds.length > 0
                          ? ` · ${campaign.produtoIds.length} produto(s)`
                          : ''}
                      </span>
                    </div>
                    <div className="item-actions">
                      <button type="button" className="btn ghost sm" onClick={() => startEditCampaign(campaign)}>
                        Editar
                      </button>
                      <button type="button" className="btn ghost sm danger" onClick={() => removeCampaign(campaign.id)}>
                        Excluir
                      </button>
                    </div>
                  </li>
                ))}
                {campaigns.length === 0 && <li className="empty-hint">Nenhuma campanha cadastrada.</li>}
              </ul>
            )}
          </section>
        </aside>

        <section className="app-canvas">
          <div className="panel builder">
            <div className="panel-head">
              <h2>Card</h2>
            </div>

            <div className="field">
              <span className="field-label">Campanha</span>
              <select value={selectedCampaignId} onChange={(e) => handleSelectCampaign(e.target.value)}>
                <option value="">Selecione uma campanha...</option>
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.titulo}
                  </option>
                ))}
              </select>
            </div>

            <label className="field">
              <span>Formato do card</span>
              <select value={cardFormat} onChange={(e) => {
                const next = e.target.value as CardFormat;
                setCardFormat(next);
                setEditingLabel(null);
              }}>
                {Object.values(CARD_FORMATS).map((format) => (
                  <option key={format.id} value={format.id}>{format.label}</option>
                ))}
              </select>
              {cardFormat === 'feed' && (
                <small className="format-hint">No Feed, clique no nome para editar ou na imagem para trocar o arquivo.</small>
              )}
            </label>

            <div className="field">
              <div className="selection-head">
                <span className="field-label">
                  Produtos no card ({selectedProductIds.length}/{MAX_CARD_PRODUCTS})
                </span>
                <button
                  type="button"
                  className="btn ghost sm"
                  onClick={() => {
                    if (!selectedCampaignId || selectedProductIds.length === 0) return;
                    setSelectedProductIds([]);
                    persistCampaignProducts(selectedCampaignId, []);
                  }}
                  disabled={!selectedCampaignId || selectedProductIds.length === 0}
                >
                  Desmarcar todos
                </button>
              </div>
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar por nome, categoria ou unidade..."
                aria-label="Buscar produtos"
              />
              <div className="chip-list">
                {visibleProducts.map((product) => {
                  const checked = selectedProductIds.includes(product.id);
                  return (
                    <label key={product.id} className={`chip${checked ? ' on' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={!selectedCampaignId}
                        onChange={() => handleToggleProduct(product.id)}
                      />
                      {product.nome}
                    </label>
                  );
                })}
                {activeProducts.length === 0 && (
                  <span className="empty-hint">Nenhum produto ativo. Cadastre produtos primeiro.</span>
                )}
                {activeProducts.length > 0 && visibleProducts.length === 0 && (
                  <span className="empty-hint">Nenhum produto encontrado.</span>
                )}
              </div>
            </div>
          </div>

          <div className="canvas-wrap">
            <canvas
              ref={canvasRef}
              className={`card-canvas${cardFormat === 'feed' ? ' feed-preview' : ''}`}
              onClick={handleCanvasClick}
              aria-label={`Preview ${getCardFormat(cardFormat).label}`}
            />
            <input
              ref={imageInputRef}
              className="canvas-image-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleProductImageChange(e.target.files?.[0])}
            />
            {editingLabel && (
              <input
                className="canvas-label-editor"
                autoFocus
                value={editingLabel.value}
                onChange={(e) => setEditingLabel({ ...editingLabel, value: e.target.value })}
                onBlur={saveLabel}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveLabel();
                  if (e.key === 'Escape') setEditingLabel(null);
                }}
                style={{
                  left: `${((cardFormat === 'feed'
                    ? feedProductLabelBox(editingLabel.row, editingLabel.column)
                    : productImageBox(editingLabel.row, editingLabel.column))?.x ?? 0) / canvasWidthForFormat(cardFormat) * 100}%`,
                  top: `${((cardFormat === 'feed'
                    ? feedProductLabelBox(editingLabel.row, editingLabel.column)
                    : productImageBox(editingLabel.row, editingLabel.column))?.y ?? 0) / canvasHeightForFormat(cardFormat) * 100}%`,
                  width: `${((cardFormat === 'feed'
                    ? feedProductLabelBox(editingLabel.row, editingLabel.column)
                    : productImageBox(editingLabel.row, editingLabel.column))?.width ?? 0) / canvasWidthForFormat(cardFormat) * 100}%`,
                }}
              />
            )}
          </div>

          <div className="panel export">
            {validation.issues.length > 0 ? (
              <ul className="issues">
                {validation.issues.map((issue, i) => (
                  <li key={`${issue.code}-${i}`} className="issue">
                    {issue.message}
                  </li>
                ))}
              </ul>
            ) : selectedCampaign ? (
              <p className="ok-hint">Card {getCardFormat(cardFormat).label} pronto para exportar.</p>
            ) : (
              <p className="ok-hint">Selecione uma campanha para começar.</p>
            )}

            <div className="export-actions">
              <button
                type="button"
                className="btn primary"
                disabled={!validation.valid || busy !== null}
                onClick={() => handleExport('png')}
              >
                {busy === 'png' ? 'Gerando...' : 'Baixar PNG'}
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={!validation.valid || busy !== null}
                onClick={() => handleExport('jpg')}
              >
                {busy === 'jpg' ? 'Gerando...' : 'Baixar JPG'}
              </button>
            </div>
          </div>
        </section>
      </main>
      )}
    </div>
  );
}

function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((id, i) => id === b[i]);
}

function resumoPrecos(product: Product): string {
  const partes = precosPreenchidos(product).map((store: StoreCode) => {
    const entry = product.precos[store];
    const cv = entry?.cv ? ` (CV ${formatPrice(entry.cv)})` : '';
    return `${STORE_LABELS[store]} ${formatPrice(entry?.preco ?? 0)}${cv}`;
  });
  return [product.unidade || 'KG', ...partes].join(' · ');
}

function normalizeSearch(value: string | undefined): string {
  return (value ?? '')
    .trim()
    .toLocaleLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function canvasWidthForFormat(format: CardFormat): number {
  return format === 'feed' ? FEED_TEMPLATE_WIDTH : POSTER_WIDTH;
}

function canvasHeightForFormat(format: CardFormat): number {
  return format === 'feed' ? FEED_TEMPLATE_HEIGHT : POSTER_HEIGHT;
}