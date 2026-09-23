import { baseTheme, mergeTheme, readableOn } from '../../generator/theme';
import type { Theme } from '../../generator/theme';
import { fileToDataUrl } from '../../utils/image';

interface ThemeEditorProps {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

const COLOR_FIELDS: { key: keyof Theme['colors']; label: string }[] = [
  { key: 'background', label: 'Fundo' },
  { key: 'primary', label: 'Principal (cabeçalho/rodapé)' },
  { key: 'accent', label: 'Destaque (faixa de datas)' },
  { key: 'price', label: 'Preço' },
  { key: 'text', label: 'Texto (nomes dos produtos)' },
  { key: 'cellBackground', label: 'Fundo da célula' },
  { key: 'cellBorder', label: 'Borda da célula' },
];

export function ThemeEditor({ theme, onChange }: ThemeEditorProps) {
  function setColor(key: keyof Theme['colors'], value: string) {
    const derived =
      key === 'primary'
        ? { onPrimary: readableOn(value) }
        : key === 'accent'
          ? { onAccent: readableOn(value) }
          : key === 'price'
            ? { onPrice: readableOn(value) }
            : {};
    onChange(
      mergeTheme({
        ...theme,
        colors: { ...theme.colors, [key]: value, ...derived },
      }),
    );
  }

  function handleLogoFile(file: File | undefined) {
    if (!file) return;
    fileToDataUrl(file).then((dataUrl) => onChange(mergeTheme({ ...theme, logo: dataUrl })));
  }

  function removeLogo() {
    onChange(mergeTheme({ ...theme, logo: undefined }));
  }

  function resetTheme() {
    onChange(mergeTheme(baseTheme));
  }

  return (
    <details className="panel theme-editor" open>
      <summary>Personalizar o card</summary>
      <div className="theme-editor-body">
        <div className="theme-group">
          <span className="field-label">Cores</span>
          <div className="swatch-grid">
            {COLOR_FIELDS.map(({ key, label }) => (
              <label key={key} className="swatch">
                <span>{label}</span>
                <input
                  type="color"
                  value={theme.colors[key]}
                  onChange={(e) => setColor(key, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="theme-group">
          <span className="field-label">Rodapé do card</span>
          <input
            className="theme-text"
            value={theme.footer.text}
            onChange={(e) =>
              onChange(mergeTheme({ ...theme, footer: { ...theme.footer, text: e.target.value } }))
            }
            placeholder="Ex.: Açougue do João · (11) 9999-9999"
          />
        </div>

        <div className="theme-group">
          <span className="field-label">Logo do cabeçalho</span>
          {theme.logo ? (
            <div className="logo-preview">
              <img src={theme.logo} alt="" />
              <button type="button" className="btn ghost sm danger" onClick={removeLogo}>
                Remover logo
              </button>
            </div>
          ) : (
            <label className="btn ghost file">
              Carregar logo
              <input type="file" accept="image/*" onChange={(e) => handleLogoFile(e.target.files?.[0])} />
            </label>
          )}
        </div>

        <div className="actions">
          <button type="button" className="btn ghost sm" onClick={resetTheme}>
            Restaurar padrão
          </button>
        </div>
      </div>
    </details>
  );
}