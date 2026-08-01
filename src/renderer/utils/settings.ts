import type { Options } from "../../shared/types"

export interface AppSettings {
  maxDownloadSpeed: number
  maxUploadSpeed: number
  maxConcurrent: number
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

export const mapGlobalOptionsToSettings = (options: Options): AppSettings => ({
  maxDownloadSpeed: parseAria2Size(
    options["max-overall-download-limit"] ?? options["max-download-limit"]
  ),
  maxUploadSpeed: parseAria2Size(
    options["max-overall-upload-limit"] ?? options["max-upload-limit"]
  ),
  maxConcurrent: Number(options["max-concurrent-downloads"]) || 5,
  defaultDownloadDir: options.dir ?? "",
})
