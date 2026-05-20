/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

import { supportedLocales, type Locale, type Messages } from "./types"
import en from "./locales/en"
import zhCN from "./locales/zh-CN"
import es from "./locales/es"
import fr from "./locales/fr"
import de from "./locales/de"
import ja from "./locales/ja"
import ko from "./locales/ko"
import pt from "./locales/pt"
import ru from "./locales/ru"

const messages: Record<Locale, Messages> = {
  en,
  "zh-CN": zhCN,
  es,
  fr,
  de,
  ja,
  ko,
  pt,
  ru,
}

type Primitive = string | number | boolean | null | undefined

type Paths<T> = {
  [K in keyof T & string]: T[K] extends Primitive
    ? K
    : T[K] extends Record<string, unknown>
      ? K | `${K}.${Paths<T[K]>}`
      : K
}[keyof T & string]

type TranslationKey = Paths<Messages>

type Translator = (key: TranslationKey) => string

function getMessage(messagesForLocale: Messages, key: TranslationKey) {
  return key.split(".").reduce<unknown>((value, part) => {
    if (value && typeof value === "object" && part in value) {
      return (value as Record<string, unknown>)[part]
    }

    return undefined
  }, messagesForLocale) as string | undefined
}

function createTranslator(locale: Locale): Translator {
  const currentMessages = messages[locale]
  const fallbackMessages = messages.en

  return (key) => getMessage(currentMessages, key) ?? getMessage(fallbackMessages, key) ?? key
}

type I18nValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translator
  labels: Messages["languageOptions"]
}

const storageKey = "grabbit.locale"
const I18nContext = createContext<I18nValue | null>(null)

function isLocale(value: string): value is Locale {
  return (supportedLocales as readonly string[]).includes(value)
}

function resolveLocale() {
  if (typeof window === "undefined") {
    return "en"
  }

  const stored = window.localStorage.getItem(storageKey)
  if (stored && isLocale(stored)) {
    return stored
  }

  const candidates = [navigator.language, ...navigator.languages]
    .filter(Boolean)
    .map((value) => value.toLowerCase())

  for (const candidate of candidates) {
    if (candidate.startsWith("zh")) return "zh-CN"
    if (candidate.startsWith("es")) return "es"
    if (candidate.startsWith("fr")) return "fr"
    if (candidate.startsWith("de")) return "de"
    if (candidate.startsWith("ja")) return "ja"
    if (candidate.startsWith("ko")) return "ko"
    if (candidate.startsWith("pt")) return "pt"
    if (candidate.startsWith("ru")) return "ru"
    if (candidate.startsWith("en")) return "en"
  }

  return "en"
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(resolveLocale)

  useEffect(() => {
    window.localStorage.setItem(storageKey, locale)
    document.documentElement.lang = locale
  }, [locale])

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        labels: messages[locale].languageOptions,
        t: createTranslator(locale),
      }}
    >
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const value = useContext(I18nContext)

  if (!value) {
    throw new Error("useI18n must be used within I18nProvider")
  }

  return value
}
