import { baseTheme, mergeTheme } from '../../generator/theme';
import type { Theme } from '../../generator/theme';
import type { ThemeStorage } from '../repository';

const STORAGE_KEY = 'gerador-cards:theme';

export class LocalStorageThemeRepository implements ThemeStorage {
  get(): Theme {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return baseTheme;
      return mergeTheme(JSON.parse(raw));
    } catch {
      return baseTheme;
    }
  }

  save(theme: Theme): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
  }
}