import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['es']) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_KEY = 'famhealth_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        const saved = localStorage.getItem(LANGUAGE_KEY);
        if (saved === 'es' || saved === 'en') return saved;
      }
      return 'es'; // Default to Spanish for friendly family UX
    } catch {
      return 'es';
    }
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(LANGUAGE_KEY, lang);
      }
    } catch (err) {
      console.error('Error saving language preference:', err);
    }
  };

  const t = (key: keyof typeof translations['es']): string => {
    const dict = translations[language] || translations['es'];
    return dict[key] || translations['es'][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
