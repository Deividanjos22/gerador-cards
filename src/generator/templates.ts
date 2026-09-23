import templateBaraoUrl from '../assets/template-barao.png';
import templateFeedUrl from '../assets/template-feed.png';

export const TEMPLATE_IDS = ['barao'] as const;
export type TemplateId = string;

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  imageUrl: string;
  width: number;
  height: number;
}

export const TEMPLATES: Record<TemplateId, TemplateDefinition> = {
  barao: {
    id: 'barao',
    name: 'Hiper Baratão',
    imageUrl: templateBaraoUrl,
    width: 941,
    height: 1671,
  },
};

export const FEED_TEMPLATE: TemplateDefinition = {
  id: 'feed-barao',
  name: 'Feed Hiper Baratão',
  imageUrl: templateFeedUrl,
  width: 768,
  height: 960,
};

const STORAGE_KEY = 'gerador-cards:templates';

function customTemplates(): TemplateDefinition[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items = raw ? (JSON.parse(raw) as TemplateDefinition[]) : [];
    return items.filter(
      (item) =>
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.imageUrl === 'string' &&
        item.imageUrl.length > 0,
    );
  } catch {
    return [];
  }
}

export function listTemplates(): TemplateDefinition[] {
  return [TEMPLATES.barao, ...customTemplates()];
}

export function saveCustomTemplate(name: string, imageUrl: string): TemplateDefinition {
  const template: TemplateDefinition = {
    id: `custom-${crypto.randomUUID()}`,
    name: name.trim(),
    imageUrl,
    width: 941,
    height: 1671,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...customTemplates(), template]));
  return template;
}

export function getTemplate(id: TemplateId | undefined): TemplateDefinition {
  return listTemplates().find((template) => template.id === id) ?? TEMPLATES.barao;
}
