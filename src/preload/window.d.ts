import type { DownloadApi } from "../shared/download-api"
import type { WindowApi } from "../shared/window-api"

declare global {
  interface Window {
    grabbit: {
      downloads: DownloadApi
      window: WindowApi
    }
  }
}

export {}
