export type Preferences = {
  maxOverallDownloadLimit: number
  maxOverallUploadLimit: number
  downloadDirectoryPath: string
  theme: Theme
  language: Language
}

export type Theme = "light" | "dark"

export type Language = "zh" | "en" | "ja"
