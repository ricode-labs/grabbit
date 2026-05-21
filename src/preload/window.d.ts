import type { DownloadApi } from "../shared/download-api"

declare global {
  interface Window {
    grabbit: {
      downloads: DownloadApi
    }
  }
}

export {}
