import type { Language, Preferences } from "../shared/types"
import Store from "electron-store"
import { downloadDirectoryPath } from "./paths"
import { app, nativeTheme } from "electron/main"

const store = new Store<Preferences>()

export const preferences: Preferences = {
  maxOverallDownloadLimit: store.get("maxOverallDownloadLimit", 0),
  maxOverallUploadLimit: store.get("maxOverallUploadLimit", 0),
  downloadDirectoryPath: store.get(
    "downloadDirectoryPath",
    downloadDirectoryPath
  ),
  theme: store.get("theme", nativeTheme.shouldUseDarkColors ? "dark" : "light"),
  language: store.get("language", resolveLocaleLanguage()),
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
