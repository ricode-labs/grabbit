import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { translations } from '../i18n/translations';
import type { Language, TranslationKey } from '../i18n/translations';

interface UIContextType {
  theme: 'light' | 'dark';
  language: Language;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');
  const [language, setLanguageState] = useState<Language>('zh');

  // 加载UI设置
  useEffect(() => {
    const loadUISettings = async () => {
      try {
        const settings = await window.electronAPI.getUISettings();
        setThemeState(settings.theme);
        setLanguageState(settings.language);

        // 应用主题
        if (settings.theme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } catch (error) {
        console.error('Failed to load UI settings:', error);
      }
    };

    loadUISettings();
  }, []);

  const setTheme = async (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    try {
      await window.electronAPI.updateUISettings({ theme: newTheme });

      // 应用主题
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (error) {
      console.error('Failed to update theme:', error);
    }
  };

  const setLanguage = async (newLanguage: Language) => {
    setLanguageState(newLanguage);
    try {
      await window.electronAPI.updateUISettings({ language: newLanguage });
    } catch (error) {
      console.error('Failed to update language:', error);
    }
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <UIContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within UIProvider');
  }
  return context;
};
