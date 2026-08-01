import type { Language, Preferences } from "../shared/types"
import Store from "electron-store"
import { downloadDirectoryPath } from "./paths"
import { app, nativeTheme } from "electron/main"
import { callAria2 } from "./aria2"

const store = new Store<Preferences>({
  name: "preferences",
  defaults: {
    maxOverallDownloadLimit: 0,
    maxOverallUploadLimit: 0,
    downloadDirectoryPath: downloadDirectoryPath,
    theme: nativeTheme.shouldUseDarkColors ? "dark" : "light",
    language: resolveLocaleLanguage(),
  },
})

export function getPreferences() {
  return store.store
}

function resolveLocaleLanguage(): Language {
  const locale = app.getLocale()
  if (locale.startsWith("zh")) {
    return "zh"
  }
  if (locale.startsWith("ja")) {
    return "ja"
  }
  return "en"
}

export async function savePreferences(preferences: Preferences) {
  store.store = preferences
  await callAria2("aria2.changeGlobalOption", [
    {
      dir: preferences.downloadDirectoryPath,
      "max-overall-download-limit": preferences.maxOverallDownloadLimit,
      "max-overall-upload-limit": preferences.maxOverallUploadLimit,
    },
  ])
}
