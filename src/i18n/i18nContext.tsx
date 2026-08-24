import React, { createContext, useContext, useState } from 'react';
import { translations, type Language } from './translations';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, fallback?: string) => string;
}

export const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    return (localStorage.getItem('app_language') as Language) || 'es';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.es;
    return langDict[key] || fallback || translations.es[key] || key;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};
