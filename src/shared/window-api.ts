export const WINDOW_API_CHANNELS = {
  minimize: "window:minimize",
  toggleMaximize: "window:toggle-maximize",
  close: "window:close",
} as const

export type WindowPlatform = "darwin" | "win32" | "linux"

export type WindowApi = {
  minimize: () => Promise<void>
  toggleMaximize: () => Promise<boolean>
  close: () => Promise<void>
  platform: WindowPlatform
}
