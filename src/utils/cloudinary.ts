const CLOUDINARY_UPLOAD_URL = 'https://api.cloudinary.com/v1_1/djrmjs58e/image/upload';
const CLOUDINARY_PRESET = 'gerador_cartaz_preset';
const GOOGLE_SEARCH_URL = 'https://customsearch.googleapis.com/customsearch/v1';
const GOOGLE_CX = 'f102ea71b0aed4711';
const GOOGLE_KEY = 'AIzaSyDU7pprGXRdCVNknLvrmSeJlSc0r_qHne0';

export async function uploadProductImage(fileOrUrl: File | string): Promise<string> {
  const body = new FormData();
  body.append('file', fileOrUrl);
  body.append('upload_preset', CLOUDINARY_PRESET);
  const response = await fetch(CLOUDINARY_UPLOAD_URL, { method: 'POST', body });
  if (!response.ok) throw new Error(`Cloudinary upload failed (${response.status})`);
  const data = (await response.json()) as { secure_url?: string };
  if (!data.secure_url) throw new Error('Cloudinary did not return an image URL');
  return data.secure_url;
}

export async function searchProductImages(term: string): Promise<string[]> {
  const cleaned = term.replace(/[0-9]+[gGkKmMlLcC]+\b/g, '').replace(/\b(CX|UN|KG|PCT|LATA)\b/g, '').trim();
  if (!cleaned) return [];
  const request = async (query: string) => {
    const response = await fetch(`${GOOGLE_SEARCH_URL}?q=${encodeURIComponent(query)}&cx=${GOOGLE_CX}&key=${GOOGLE_KEY}&searchType=image&num=8`);
    const data = (await response.json()) as {
      items?: Array<{ link?: string }>;
      error?: { message?: string };
    };
    if (!response.ok) {
      throw new Error(data.error?.message || `Image search failed (${response.status})`);
    }
    return (data.items ?? []).map((item) => item.link).filter((link): link is string => Boolean(link));
  };
  const results = await request(cleaned);
  return results.length > 0 ? results : request(cleaned.split(/\s+/).slice(0, 2).join(' '));
}
