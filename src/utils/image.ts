export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler o arquivo de imagem.'));
    reader.readAsDataURL(file);
  });
}

export function generatePlaceholderImage(label: string, size = 320): string {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const hue = hashHue(label);
  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, `hsl(${hue} 70% 48%)`);
  gradient.addColorStop(1, `hsl(${hue + 40} 75% 34%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const initials = label
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => (word[0] ?? '').toUpperCase())
    .join('');

  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.font = `700 ${Math.round(size * 0.24)}px Poppins, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(initials || '?', size / 2, size / 2);

  return canvas.toDataURL('image/jpeg', 0.8);
}

function hashHue(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash * 31 + text.charCodeAt(i)) % 360;
  }
  return hash;
}