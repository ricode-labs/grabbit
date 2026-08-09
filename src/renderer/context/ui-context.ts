import { createContext } from "react"
import type { TranslationKey } from "../i18n/translations"
import type { Language, Theme } from "../../shared/types"

export interface UIContextType {
  theme: Theme
  language: Language
  setTheme: (theme: Theme) => void
  setLanguage: (language: Language) => void
  t: (key: TranslationKey) => string
}

export const UIContext = createContext<UIContextType | undefined>(undefined)
