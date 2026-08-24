import { useContext } from 'react';
import { translations, type Language } from './translations';
import { I18nContext } from './i18nContext';

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      language: 'es' as Language,
      setLanguage: () => {},
      t: (key: string, fallback?: string) => translations.es[key] || fallback || key,
    };
  }
  return context;
};
