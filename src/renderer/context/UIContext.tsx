import React, { createContext, useContext, useState, useEffect } from "react"
import type { ReactNode } from "react"
import { translations } from "../i18n/translations"
import type { TranslationKey } from "../i18n/translations"
import type { Language, Theme } from "../../shared/types"

interface UIContextType {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

const UIContext = createContext<UIContextType | undefined>(undefined)

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>("light")
  const [language, setLanguageState] = useState<Language>("zh")

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const preferences = await window.grabbit.getPreferences()
        setThemeState(preferences.theme)
        setLanguageState(preferences.language)

        document.documentElement.classList.toggle(
          "dark",
          preferences.theme === "dark"
        )
      } catch (error) {
        console.error("Failed to load preferences:", error)
      }
    }

    loadPreferences()
  }, [])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    document.documentElement.classList.toggle("dark", newTheme === "dark")
  }

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage)
  }

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key
  }

  return (
    <UIContext.Provider value={{ theme, language, setTheme, setLanguage, t }}>
      {children}
    </UIContext.Provider>
  )
}

export const useUI = () => {
  const context = useContext(UIContext)
  if (!context) {
    throw new Error("useUI must be used within UIProvider")
  }
  return context
}
