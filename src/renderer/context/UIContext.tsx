import React, { useEffect } from "react"
import type { ReactNode } from "react"
import { translations } from "../i18n/translations"
import type { TranslationKey } from "../i18n/translations"
import type { Language, Theme } from "../../shared/preferences"
import { UIContext } from "./ui-context"
import { usePreferencesStore } from "../stores/usePreferencesStore"

export const UIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const theme = usePreferencesStore((state) => state.preferences.theme)
  const language = usePreferencesStore((state) => state.preferences.language)
  const loadPreferences = usePreferencesStore((state) => state.loadPreferences)
  const savePreferencesPatch = usePreferencesStore(
    (state) => state.savePreferencesPatch
  )

  useEffect(() => {
    void loadPreferences()
  }, [loadPreferences])

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    void savePreferencesPatch({ theme: newTheme })
  }

  const setLanguage = (newLanguage: Language) => {
    void savePreferencesPatch({ language: newLanguage })
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
