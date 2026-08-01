import en from "./en"
import ja from "./ja"
import zh from "./zh"

export const translations = {
  zh,
  en,
  ja,
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.zh
