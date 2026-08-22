import { en } from './en';
import { hi } from './hi';
import { mr } from './mr';
import { Language } from '../types';

export const translations: Record<Language, typeof en> = {
  en,
  hi,
  mr,
};

export function getTranslation(lang: Language): typeof en {
  return translations[lang] || en;
}
