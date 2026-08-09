import React, { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import { useUI } from "../context/useUI"
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

export const SettingsPage: React.FC<SettingsPageProps> = () => {
  const { theme, language, setTheme, setLanguage, t } = useUI()

  const [settings, setSettings] = useState<Settings>({
    maxDownloadSpeed: 0,
    maxUploadSpeed: 0,
    defaultDownloadDir: "",
  })

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
  } | null>(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const toAria2Speed = (value: string, unit: "KB/s" | "MB/s") => {
    const amount = Number(value)
    if (!Number.isFinite(amount) || amount <= 0) {
      return 0
    }
    return amount * (unit === "MB/s" ? 1024 * 1024 : 1024)
  }

  const buildPreferences = (overrides: Partial<Preferences> = {}): Preferences => ({
    maxOverallDownloadLimit: toAria2Speed(downloadSpeedValue, downloadSpeedUnit),
    maxOverallUploadLimit: toAria2Speed(uploadSpeedValue, uploadSpeedUnit),
    downloadDirectoryPath: settings.defaultDownloadDir,
    theme: localTheme,
    language: localLanguage,
    ...overrides,
  })

  const savePreferences = async (nextPreferences: Preferences) => {
    try {
      await window.grabbit.savePreferences(nextPreferences)
    } catch (error) {
      console.error("Failed to save settings:", error)
      setNotice({
        message: t("saveFailed"),
        variant: "error",
      })
    }
  }

  const loadSettings = async () => {
    try {
      const preferences = await window.grabbit.getPreferences()
      const loadedSettings = mapPreferencesToSettings(preferences)
      setSettings(loadedSettings)
      setLocalTheme(preferences.theme)
      setLocalLanguage(preferences.language)

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

  const handleSelectFolder = async () => {
    try {
      const folder = await window.grabbit.selectFolder()
      if (folder) {
        setSettings({ ...settings, defaultDownloadDir: folder })
        void savePreferences(buildPreferences({ downloadDirectoryPath: folder }))
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
    }
  }

  const handleDownloadSpeedValueChange = (value: string) => {
    setDownloadSpeedValue(value)
    void savePreferences(
      buildPreferences({
        maxOverallDownloadLimit: toAria2Speed(value, downloadSpeedUnit),
      })
    )
  }

  const handleDownloadSpeedUnitChange = (unit: "KB/s" | "MB/s") => {
    setDownloadSpeedUnit(unit)
    void savePreferences(
      buildPreferences({
        maxOverallDownloadLimit: toAria2Speed(downloadSpeedValue, unit),
      })
    )
  }

  const handleUploadSpeedValueChange = (value: string) => {
    setUploadSpeedValue(value)
    void savePreferences(
      buildPreferences({
        maxOverallUploadLimit: toAria2Speed(value, uploadSpeedUnit),
      })
    )
  }

  const handleUploadSpeedUnitChange = (unit: "KB/s" | "MB/s") => {
    setUploadSpeedUnit(unit)
    void savePreferences(
      buildPreferences({
        maxOverallUploadLimit: toAria2Speed(uploadSpeedValue, unit),
      })
    )
  }

  const handleThemeChange = (nextTheme: Theme) => {
    setLocalTheme(nextTheme)
    setTheme(nextTheme)
    void savePreferences(buildPreferences({ theme: nextTheme }))
  }

  const handleLanguageChange = (nextLanguage: Language) => {
    setLocalLanguage(nextLanguage)
    setLanguage(nextLanguage)
    void savePreferences(buildPreferences({ language: nextLanguage }))
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#FFF8F7]">
      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {/* Download Settings Section */}
          <div className="rounded-[14px] border border-[#F6D7D3] bg-white/78 p-3 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[#2D2522]">
              {t("downloadSettings")}
            </h2>

            {/* Download Speed */}
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-[#2D2522]">
                  {t("downloadSpeedLimit")}
                </label>
                <p className="mt-1 text-xs text-[#8B6A5D]">
                  {t("zeroMeansUnlimited")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={downloadSpeedValue}
                  onChange={(e) => handleDownloadSpeedValueChange(e.target.value)}
                  className="w-28 rounded-lg border border-[#F0DED8] bg-white px-3 py-1.5 text-xs text-[#2D2522] placeholder-[#B7A59C] transition-all focus:border-[#FFC3CF] focus:ring-2 focus:ring-[#FFE6EC] focus:outline-none"
                  placeholder="0"
                />
                <ListboxWrapper
                  value={downloadSpeedUnit}
                  onChange={(value) =>
                    handleDownloadSpeedUnitChange(value as "KB/s" | "MB/s")
                  }
                  options={["KB/s", "MB/s"]}
                  className="w-24"
                />
              </div>
            </div>

            {/* Upload Speed */}
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-[#2D2522]">
                  {t("uploadSpeedLimit")}
                </label>
                <p className="mt-1 text-xs text-[#8B6A5D]">
                  {t("zeroMeansUnlimited")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={uploadSpeedValue}
                  onChange={(e) => handleUploadSpeedValueChange(e.target.value)}
                  className="w-28 rounded-lg border border-[#F0DED8] bg-white px-3 py-1.5 text-xs text-[#2D2522] placeholder-[#B7A59C] transition-all focus:border-[#FFC3CF] focus:ring-2 focus:ring-[#FFE6EC] focus:outline-none"
                  placeholder="0"
                />
                <ListboxWrapper
                  value={uploadSpeedUnit}
                  onChange={(value) =>
                    handleUploadSpeedUnitChange(value as "KB/s" | "MB/s")
                  }
                  options={["KB/s", "MB/s"]}
                  className="w-24"
                />
              </div>
            </div>

            {/* Default Download Directory */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-[#2D2522]">
                  {t("defaultDownloadFolder")}
                </label>
                <p className="mt-1 text-xs text-[#8B6A5D]">
                  {t("defaultSaveLocation")}
                </p>
              </div>
              <TooltipWrapper
                content={settings.defaultDownloadDir}
                disabled={!settings.defaultDownloadDir}
              >
                <button
                  onClick={handleSelectFolder}
                  className="max-w-[220px] truncate rounded-lg border border-[#F0DED8] bg-white px-3 py-1.5 text-left text-xs font-medium text-[#FF5C78] transition-all hover:bg-[#FFF1F4] hover:text-[#E85068]"
                >
                  {settings.defaultDownloadDir || t("selectFolder")}
                </button>
              </TooltipWrapper>
            </div>
          </div>

          {/* Display Settings Section */}
          <div className="rounded-[14px] border border-[#F6D7D3] bg-white/78 p-3 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[#2D2522]">
              {t("displaySettings")}
            </h2>

            {/* Theme */}
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-[#2D2522]">
                  {t("theme")}
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={`rounded-lg p-1.5 transition-all ${
                    localTheme === "light"
                      ? "bg-[#FF7D90] text-white"
                      : "border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
                  }`}
                  title={t("lightMode")}
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={`rounded-lg p-1.5 transition-all ${
                    localTheme === "dark"
                      ? "bg-[#FF7D90] text-white"
                      : "border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
                  }`}
                  title={t("darkMode")}
                >
                  <Moon size={18} />
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <label className="text-xs font-medium text-[#2D2522]">
                  {t("language")}
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange("zh")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    localLanguage === "zh"
                      ? "bg-[#FF7D90] text-white"
                      : "border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
                  }`}
                >
                  {t("chinese")}
                </button>
                <button
                  onClick={() => handleLanguageChange("en")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    localLanguage === "en"
                      ? "bg-[#FF7D90] text-white"
                      : "border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
                  }`}
                >
                  {t("english")}
                </button>
                <button
                  onClick={() => handleLanguageChange("ja")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    localLanguage === "ja"
                      ? "bg-[#FF7D90] text-white"
                      : "border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
                  }`}
                >
                  {t("japanese")}
                </button>
              </div>
            </div>
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
          onConfirm={() => setNotice(null)}
        />
      )}
    </div>
  )
}
