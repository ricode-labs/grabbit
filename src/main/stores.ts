import { app } from "electron"
import fs from "node:fs/promises"

import {
  defaultGrabbitPreferences,
  defaultTaskSchedulerRule,
  normalizeDownloadDirectoryHistory,
  normalizeTaskSchedulerRule,
  type EnginePathInfo,
  type GrabbitPreferences,
  type TaskSchedulerRule,
} from "../shared/grabbit"
import { setCloseToTrayEnabled } from "./app-state"
import {
  getAria2Executable,
  getFallbackDownloadDir,
  getPreferencesPath,
  getSchedulerPath,
  getSessionPath,
  getWindowStatePath,
} from "./paths"
import type { WindowState } from "./types"

export const defaultWindowState: WindowState = {
  width: 1120,
  height: 720,
}

export const getEnginePaths = (): EnginePathInfo[] => [
  {
    key: "aria2",
    label: "aria2c 可执行文件",
    path: getAria2Executable(),
    kind: "file",
  },
  {
    key: "session",
    label: "aria2 会话文件",
    path: getSessionPath(),
    kind: "file",
  },
  {
    key: "preferences",
    label: "偏好配置文件",
    path: getPreferencesPath(),
    kind: "file",
  },
  {
    key: "scheduler",
    label: "限速计划文件",
    path: getSchedulerPath(),
    kind: "file",
  },
  {
    key: "userData",
    label: "应用数据目录",
    path: app.getPath("userData"),
    kind: "directory",
  },
  {
    key: "downloads",
    label: "默认下载目录",
    path: getFallbackDownloadDir(),
    kind: "directory",
  },
]

export const readWindowState = async (): Promise<WindowState> => {
  try {
    const raw = await fs.readFile(getWindowStatePath(), "utf8")
    const state = JSON.parse(raw) as Partial<WindowState>
    return {
      width: Math.max(920, Number(state.width) || defaultWindowState.width),
      height: Math.max(600, Number(state.height) || defaultWindowState.height),
      x: Number.isFinite(state.x) ? state.x : undefined,
      y: Number.isFinite(state.y) ? state.y : undefined,
      maximized: state.maximized === true,
    }
  } catch {
    return defaultWindowState
  }
}

export const writeWindowState = async (state: WindowState) => {
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  await fs.writeFile(
    getWindowStatePath(),
    JSON.stringify(state, null, 2),
    "utf8"
  )
}

export const applyLoginItemPreference = (
  preferences: Pick<GrabbitPreferences, "openAtLogin">
) => {
  if (!app.isReady()) {
    return
  }

  app.setLoginItemSettings({
    openAtLogin: preferences.openAtLogin,
    path: process.execPath,
  })
}

export const readPreferences = async (): Promise<GrabbitPreferences> => {
  const defaults = defaultGrabbitPreferences(getFallbackDownloadDir())

  try {
    const raw = await fs.readFile(getPreferencesPath(), "utf8")
    const preferences = JSON.parse(raw) as Partial<GrabbitPreferences>
    const nextPreferences = {
      ...defaults,
      ...preferences,
      downloadDir: preferences.downloadDir || defaults.downloadDir,
      maxConcurrentDownloads:
        preferences.maxConcurrentDownloads ?? defaults.maxConcurrentDownloads,
      maxConnectionPerServer:
        preferences.maxConnectionPerServer ?? defaults.maxConnectionPerServer,
      split: preferences.split ?? defaults.split,
      maxOverallDownloadLimit:
        preferences.maxOverallDownloadLimit ?? defaults.maxOverallDownloadLimit,
      maxOverallUploadLimit:
        preferences.maxOverallUploadLimit ?? defaults.maxOverallUploadLimit,
      continueDownloads:
        preferences.continueDownloads ?? defaults.continueDownloads,
      allProxy: preferences.allProxy ?? defaults.allProxy,
      openAtLogin: preferences.openAtLogin ?? defaults.openAtLogin,
      notifyOnDownloadComplete:
        preferences.notifyOnDownloadComplete ??
        defaults.notifyOnDownloadComplete,
      showDockProgress:
        preferences.showDockProgress ?? defaults.showDockProgress,
      theme:
        preferences.theme === "light" ||
        preferences.theme === "dark" ||
        preferences.theme === "system"
          ? preferences.theme
          : defaults.theme,
      resumeAllOnLaunch:
        preferences.resumeAllOnLaunch ?? defaults.resumeAllOnLaunch,
      closeToTray: preferences.closeToTray ?? defaults.closeToTray,
      downloadDirectoryHistory: normalizeDownloadDirectoryHistory(
        preferences.downloadDir || defaults.downloadDir,
        preferences.downloadDirectoryHistory ??
          defaults.downloadDirectoryHistory
      ),
    }
    setCloseToTrayEnabled(nextPreferences.closeToTray)
    return nextPreferences
  } catch {
    setCloseToTrayEnabled(defaults.closeToTray)
    return defaults
  }
}

export const writePreferences = async (preferences: GrabbitPreferences) => {
  const defaults = defaultGrabbitPreferences(getFallbackDownloadDir())
  const nextPreferences = {
    ...defaults,
    ...preferences,
    downloadDir: preferences.downloadDir || defaults.downloadDir,
    downloadDirectoryHistory: normalizeDownloadDirectoryHistory(
      preferences.downloadDir || defaults.downloadDir,
      preferences.downloadDirectoryHistory ?? defaults.downloadDirectoryHistory
    ),
  }
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  await fs.writeFile(
    getPreferencesPath(),
    JSON.stringify(nextPreferences, null, 2),
    "utf8"
  )

  setCloseToTrayEnabled(nextPreferences.closeToTray)
  applyLoginItemPreference(nextPreferences)

  return nextPreferences
}

export const readSchedulerRule = async (): Promise<TaskSchedulerRule> => {
  try {
    const raw = await fs.readFile(getSchedulerPath(), "utf8")
    return normalizeTaskSchedulerRule(
      JSON.parse(raw) as Partial<TaskSchedulerRule>
    )
  } catch {
    return defaultTaskSchedulerRule()
  }
}

export const writeSchedulerRule = async (rule: TaskSchedulerRule) => {
  const nextRule = normalizeTaskSchedulerRule(rule)
  await fs.mkdir(app.getPath("userData"), { recursive: true })
  await fs.writeFile(
    getSchedulerPath(),
    JSON.stringify(nextRule, null, 2),
    "utf8"
  )
  return nextRule
}

export const getDefaultDownloadDir = async () =>
  (await readPreferences()).downloadDir
