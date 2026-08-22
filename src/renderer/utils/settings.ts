import type { Options } from "../../shared/aria2"
import type { Preferences } from "../../shared/preferences"

export interface AppSettings {
  maxDownloadSpeed: number
  maxUploadSpeed: number
  defaultDownloadDir: string
}

const parseAria2Size = (value: string | undefined) => {
  if (!value) {
    return 0
  }

  const match = value.trim().match(/^(\d+(?:\.\d+)?)([KMG])?$/i)
  if (!match) {
    return Number(value) || 0
  }

  const amount = Number(match[1])
  const unit = match[2]?.toUpperCase()
  if (unit === "G") {
    return amount * 1024 * 1024 * 1024
  }
  if (unit === "M") {
    return amount * 1024 * 1024
  }
  if (unit === "K") {
    return amount * 1024
  }

  return amount
}

const getStringOption = (options: Options, name: string) => {
  const value = options[name]
  return typeof value === "string" ? value : undefined
}

export const mapGlobalOptionsToSettings = (options: Options): AppSettings => ({
  maxDownloadSpeed: parseAria2Size(
    getStringOption(options, "max-overall-download-limit") ??
      getStringOption(options, "max-download-limit")
  ),
  maxUploadSpeed: parseAria2Size(
    getStringOption(options, "max-overall-upload-limit") ??
      getStringOption(options, "max-upload-limit")
  ),
  defaultDownloadDir: getStringOption(options, "dir") ?? "",
})

export const mapPreferencesToSettings = (
  preferences: Preferences
): AppSettings => ({
  maxDownloadSpeed: preferences.maxOverallDownloadLimit,
  maxUploadSpeed: preferences.maxOverallUploadLimit,
  defaultDownloadDir: preferences.downloadDirectoryPath,
})
