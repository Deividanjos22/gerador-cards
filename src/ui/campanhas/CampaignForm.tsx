import { useState } from 'react';
import { STORE_LABELS, STORES, type StoreCode } from '../../domain/product';
import type { Campaign, CampaignInput } from '../../domain/campaign';
import { listTemplates, saveCustomTemplate } from '../../generator/templates';
import { fileToDataUrl } from '../../utils/image';

interface CampaignFormProps {
  campaign: Campaign | null;
  onSave: (input: CampaignInput) => void;
  onCancel: () => void;
}

export function CampaignForm({ campaign, onSave, onCancel }: CampaignFormProps) {
  const [titulo, setTitulo] = useState(campaign?.titulo ?? '');
  const [dataInicio, setDataInicio] = useState(campaign?.dataInicio ?? '');
  const [dataFim, setDataFim] = useState(campaign?.dataFim ?? '');
  const [lojas, setLojas] = useState<StoreCode[]>(() =>
    campaign?.lojas && campaign.lojas.length > 0 ? campaign.lojas : ['matriz'],
  );
  const [priceStore, setPriceStore] = useState<StoreCode>(
    campaign?.priceStore ?? campaign?.lojas?.[0] ?? 'matriz',
  );
  const [priceType, setPriceType] = useState<'preco' | 'cv'>(campaign?.priceType ?? 'preco');
  const [templates, setTemplates] = useState(() => listTemplates());
  const [templateId, setTemplateId] = useState(campaign?.templateId ?? 'barao');
  const [templateName, setTemplateName] = useState('');
  const [templateError, setTemplateError] = useState('');

  function toggleLoja(store: StoreCode) {
    setLojas((prev) =>
      prev.includes(store) ? prev.filter((x) => x !== store) : [...prev, store],
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      titulo: titulo.trim(),
      dataInicio,
      dataFim,
      lojas: lojas.length > 0 ? lojas : ['matriz'],
      produtoIds: campaign?.produtoIds ?? [],
      nomesProdutos: campaign?.nomesProdutos,
      templateId,
      priceStore,
      priceType,
    });
  }

  function handleTemplateFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setTemplateError('Selecione um arquivo de imagem.');
      return;
    }
    if (!templateName.trim()) {
      setTemplateError('Informe um nome para o novo template.');
      return;
    }
    fileToDataUrl(file)
      .then((imageUrl) => {
        const template = saveCustomTemplate(templateName, imageUrl);
        setTemplates((prev) => [...prev, template]);
        setTemplateId(template.id);
        setTemplateName('');
        setTemplateError('');
      })
      .catch((error: unknown) => {
        setTemplateError(error instanceof Error ? error.message : 'Não foi possível carregar o template.');
      });
  }

  const hasLoja = lojas.length > 0;

  return (
    <form className="panel form" onSubmit={handleSubmit}>
      <h2>{campaign ? 'Editar campanha' : 'Nova campanha'}</h2>

      <label className="field">
        <span>Título</span>
        <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Promoção de Carnes" required />
      </label>

      <div className="field-row">
        <label className="field">
          <span>Data inicial</span>
          <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} required />
        </label>
        <label className="field">
          <span>Data final</span>
          <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} required />
        </label>
      </div>

      <label className="field">
        <span>Template do card</span>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)}>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>{template.name}</option>
          ))}
        </select>
      </label>

      <div className="field template-upload">
        <span className="field-label">Adicionar outro template</span>
        <input
          value={templateName}
          onChange={(e) => { setTemplateName(e.target.value); setTemplateError(''); }}
          placeholder="Nome do template"
        />
        <label className="btn ghost file">
          Carregar imagem do template
          <input type="file" accept="image/*" onChange={(e) => handleTemplateFile(e.target.files?.[0])} />
        </label>
        {templateError && <span className="hint-error">{templateError}</span>}
        <small className="template-hint">O novo modelo usará a mesma grade de 9 produtos.</small>
      </div>

      <div className="field-row">
        <label className="field">
          <span>Loja do preço no card</span>
          <select value={priceStore} onChange={(e) => setPriceStore(e.target.value as StoreCode)}>
            {STORES.map((store) => (
              <option key={store} value={store}>{STORE_LABELS[store]}</option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Tipo de preço</span>
          <select value={priceType} onChange={(e) => setPriceType(e.target.value as 'preco' | 'cv')}>
            <option value="preco">Preço normal</option>
            <option value="cv">Preço Clube de Vantagens (CV)</option>
          </select>
        </label>
      </div>

      <div className="field">
        <span className="field-label">Lojas do card</span>
        <div className="chip-list">
          {STORES.map((store) => (
            <label key={store} className={`chip${lojas.includes(store) ? ' on' : ''}`}>
              <input type="checkbox" checked={lojas.includes(store)} onChange={() => toggleLoja(store)} />
              {STORE_LABELS[store]}
            </label>
          ))}
        </div>
        {!hasLoja && <span className="hint-error">Selecione ao menos uma loja.</span>}
      </div>

      <div className="actions">
        <button type="button" className="btn ghost" onClick={onCancel}>Cancelar</button>
        <button type="submit" className="btn primary" disabled={!hasLoja}>Salvar</button>
      </div>
    </form>
  );
}