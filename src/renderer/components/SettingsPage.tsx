import React, { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import { useUI } from "../context/UIContext"
import type { Language, Preferences, Theme } from "../../shared/types"
import { ListboxWrapper } from "./ui/ListboxWrapper"
import { TooltipWrapper } from "./ui/TooltipWrapper"
import { NoticeModal } from "./ui/NoticeModal"
import { mapPreferencesToSettings } from "../utils/settings"

interface Settings {
  maxDownloadSpeed: number
  maxUploadSpeed: number
  defaultDownloadDir: string
}

interface SettingsPageProps {
  onBack: () => void
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { theme, language, setTheme, setLanguage, t } = useUI()

  const [settings, setSettings] = useState<Settings>({
    maxDownloadSpeed: 0,
    maxUploadSpeed: 0,
    defaultDownloadDir: "",
  })

  // 本地UI设置状态（未保存）
  const [localTheme, setLocalTheme] = useState<Theme>(theme)
  const [localLanguage, setLocalLanguage] = useState<Language>(language)

  const [downloadSpeedValue, setDownloadSpeedValue] = useState("0")
  const [downloadSpeedUnit, setDownloadSpeedUnit] = useState<"KB/s" | "MB/s">(
    "MB/s"
  )
  const [uploadSpeedValue, setUploadSpeedValue] = useState("0")
  const [uploadSpeedUnit, setUploadSpeedUnit] = useState<"KB/s" | "MB/s">(
    "MB/s"
  )
  const [notice, setNotice] = useState<{
    message: string
    variant?: "info" | "success" | "error"
    onConfirm?: () => void
  } | null>(null)

  useEffect(() => {
    loadSettings()
    // 同步全局UI设置到本地状态
    setLocalTheme(theme)
    setLocalLanguage(language)
  }, [theme, language])

  const loadSettings = async () => {
    try {
      const loadedSettings = mapPreferencesToSettings(
        await window.grabbit.getPreferences()
      )
      setSettings(loadedSettings)

      // 转换速度单位为可读格式
      if (loadedSettings.maxDownloadSpeed === 0) {
        setDownloadSpeedValue("0")
      } else if (loadedSettings.maxDownloadSpeed >= 1024 * 1024) {
        setDownloadSpeedValue(
          (loadedSettings.maxDownloadSpeed / (1024 * 1024)).toString()
        )
        setDownloadSpeedUnit("MB/s")
      } else {
        setDownloadSpeedValue(
          (loadedSettings.maxDownloadSpeed / 1024).toString()
        )
        setDownloadSpeedUnit("KB/s")
      }

      if (loadedSettings.maxUploadSpeed === 0) {
        setUploadSpeedValue("0")
      } else if (loadedSettings.maxUploadSpeed >= 1024 * 1024) {
        setUploadSpeedValue(
          (loadedSettings.maxUploadSpeed / (1024 * 1024)).toString()
        )
        setUploadSpeedUnit("MB/s")
      } else {
        setUploadSpeedValue((loadedSettings.maxUploadSpeed / 1024).toString())
        setUploadSpeedUnit("KB/s")
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  const handleSave = async () => {
    try {
      // 转换速度单位为 bytes/s
      const downloadSpeed =
        downloadSpeedValue === "0"
          ? 0
          : parseFloat(downloadSpeedValue) *
            (downloadSpeedUnit === "MB/s" ? 1024 * 1024 : 1024)
      const uploadSpeed =
        uploadSpeedValue === "0"
          ? 0
          : parseFloat(uploadSpeedValue) *
            (uploadSpeedUnit === "MB/s" ? 1024 * 1024 : 1024)

      const newPreferences: Preferences = {
        maxOverallDownloadLimit: downloadSpeed,
        maxOverallUploadLimit: uploadSpeed,
        downloadDirectoryPath: settings.defaultDownloadDir,
        theme: localTheme,
        language: localLanguage,
      }

      await window.grabbit.savePreferences(newPreferences)

      setTheme(localTheme)
      setLanguage(localLanguage)

      setNotice({
        message: t("settingsSaved"),
        variant: "success",
        onConfirm: onBack,
      })
    } catch (error) {
      console.error("Failed to save settings:", error)
      setNotice({
        message: t("saveFailed"),
        variant: "error",
      })
    }
  }

  const handleSelectFolder = async () => {
    try {
      const folder = await window.grabbit.selectFolder()
      if (folder) {
        setSettings({ ...settings, defaultDownloadDir: folder })
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
    }
  }

  const handleReset = () => {
    loadSettings()
    // 重置UI设置到全局状态
    setLocalTheme(theme)
    setLocalLanguage(language)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-gradient-to-b from-zinc-50 to-zinc-100 pt-12 dark:from-zinc-900 dark:to-zinc-800">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pt-0">
        <div className="mx-auto max-w-4xl space-y-4">
          {/* Download Settings Section */}
          <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t("downloadSettings")}
            </h2>

            {/* Download Speed */}
            <div className="mb-4 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {t("downloadSpeedLimit")}
                </label>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {t("zeroMeansUnlimited")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={downloadSpeedValue}
                  onChange={(e) => setDownloadSpeedValue(e.target.value)}
                  className="w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
                  placeholder="0"
                />
                <ListboxWrapper
                  value={downloadSpeedUnit}
                  onChange={(value) =>
                    setDownloadSpeedUnit(value as "KB/s" | "MB/s")
                  }
                  options={["KB/s", "MB/s"]}
                  className="w-24"
                />
              </div>
            </div>

            {/* Upload Speed */}
            <div className="mb-4 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {t("uploadSpeedLimit")}
                </label>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {t("zeroMeansUnlimited")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={uploadSpeedValue}
                  onChange={(e) => setUploadSpeedValue(e.target.value)}
                  className="w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs text-zinc-900 placeholder-zinc-500 transition-all focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-100 dark:placeholder-zinc-400"
                  placeholder="0"
                />
                <ListboxWrapper
                  value={uploadSpeedUnit}
                  onChange={(value) =>
                    setUploadSpeedUnit(value as "KB/s" | "MB/s")
                  }
                  options={["KB/s", "MB/s"]}
                  className="w-24"
                />
              </div>
            </div>

            {/* Default Download Directory */}
            <div className="flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {t("defaultDownloadFolder")}
                </label>
                <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                  {t("defaultSaveLocation")}
                </p>
              </div>
              <TooltipWrapper
                content={settings.defaultDownloadDir}
                disabled={!settings.defaultDownloadDir}
              >
                <button
                  onClick={handleSelectFolder}
                  className="max-w-xs truncate rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-xs font-medium text-indigo-600 transition-all hover:bg-indigo-50 hover:text-indigo-700 dark:border-zinc-600 dark:bg-zinc-700 dark:text-indigo-400 dark:hover:bg-indigo-900/20 dark:hover:text-indigo-300"
                >
                  {settings.defaultDownloadDir || t("selectFolder")}
                </button>
              </TooltipWrapper>
            </div>
          </div>

          {/* Display Settings Section */}
          <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800">
            <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {t("displaySettings")}
            </h2>

            {/* Theme */}
            <div className="mb-4 flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {t("theme")}
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalTheme("light")}
                  className={`rounded-lg p-2 transition-all ${
                    localTheme === "light"
                      ? "bg-indigo-500 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                  title={t("lightMode")}
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => setLocalTheme("dark")}
                  className={`rounded-lg p-2 transition-all ${
                    localTheme === "dark"
                      ? "bg-indigo-500 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                  title={t("darkMode")}
                >
                  <Moon size={18} />
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-zinc-900 dark:text-zinc-100">
                  {t("language")}
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalLanguage("zh")}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    localLanguage === "zh"
                      ? "bg-indigo-500 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  {t("chinese")}
                </button>
                <button
                  onClick={() => setLocalLanguage("en")}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    localLanguage === "en"
                      ? "bg-indigo-500 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  {t("english")}
                </button>
                <button
                  onClick={() => setLocalLanguage("ja")}
                  className={`rounded-lg px-4 py-2 text-xs font-medium transition-all ${
                    localLanguage === "ja"
                      ? "bg-indigo-500 text-white"
                      : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  {t("japanese")}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg bg-zinc-200 px-4 py-2 text-xs font-medium text-zinc-700 transition-all duration-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              {t("reset")}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-xs font-medium text-white transition-all duration-200 hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-500/30"
            >
              {t("saveSettings")}
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <NoticeModal
          isOpen={true}
          title={t("noticeTitle")}
          message={notice.message}
          variant={notice.variant}
          onClose={() => setNotice(null)}
          onConfirm={() => notice.onConfirm?.()}
        />
      )}
    </div>
  )
}
