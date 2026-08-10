import React, { useState } from "react"
import { Toast } from "@base-ui/react/toast"
import { Loader2, Moon, Sun } from "lucide-react"
import { useUI } from "../context/useUI"
import type { Language, Preferences, Theme } from "../../shared/preferences"
import { ListboxWrapper } from "../components/ui/ListboxWrapper"
import { TooltipWrapper } from "../components/ui/TooltipWrapper"
import { NoticeModal } from "../components/ui/NoticeModal"
import { mapPreferencesToSettings } from "../utils/settings"
import { usePreferencesStore } from "../stores/usePreferencesStore"
import { useUpdateStore } from "../stores/useUpdateStore"

const updateHomepageUrl = "https://ricode-labs.github.io/grabbit-homepage/"
const settingsCardClass =
  "rounded-[14px] border border-[#F6D7D3] bg-white/78 p-3 shadow-sm"
const settingsRowClass = "mb-3 flex items-center justify-between gap-4"
const settingsLabelClass = "text-xs font-medium text-[#2D2522]"
const settingsHintClass = "mt-1 text-xs text-[#8B6A5D]"
const speedInputClass =
  "w-28 rounded-lg border border-[#F0DED8] bg-white px-3 py-1.5 text-xs text-[#2D2522] placeholder-[#B7A59C] transition-all focus:border-[#FFC3CF] focus:ring-2 focus:ring-[#FFE6EC] focus:outline-none disabled:cursor-wait disabled:opacity-60"
const disabledSavingClass = "disabled:cursor-wait disabled:opacity-60"

const iconOptionButtonClass = (active: boolean) =>
  `rounded-lg p-1.5 transition-all ${
    active
      ? "bg-[#FF7D90] text-white"
      : "border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
  } ${disabledSavingClass}`

const textOptionButtonClass = (active: boolean) =>
  `rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
    active
      ? "bg-[#FF7D90] text-white"
      : "border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
  } ${disabledSavingClass}`

const toAria2Speed = (value: string, unit: "KB/s" | "MB/s") => {
  const amount = Number(value)
  if (!Number.isFinite(amount) || amount <= 0) {
    return 0
  }
  return amount * (unit === "MB/s" ? 1024 * 1024 : 1024)
}

const getSpeedUnit = (bytes: number): "KB/s" | "MB/s" => {
  if (bytes > 0 && bytes < 1024 * 1024) return "KB/s"
  return "MB/s"
}

const getSpeedValue = (bytes: number) => {
  if (bytes === 0) return "0"
  return bytes >= 1024 * 1024
    ? (bytes / (1024 * 1024)).toString()
    : (bytes / 1024).toString()
}

export const SettingsPage: React.FC = () => {
  const { theme, language, t } = useUI()
  const toastManager = Toast.useToastManager()
  const preferences = usePreferencesStore((state) => state.preferences)
  const savePreferencesPatch = usePreferencesStore(
    (state) => state.savePreferencesPatch
  )
  const updateState = useUpdateStore((state) => state.updateState)
  const checkForUpdates = useUpdateStore((state) => state.checkForUpdates)
  const settings = mapPreferencesToSettings(preferences)
  const downloadSpeedUnit = getSpeedUnit(settings.maxDownloadSpeed)
  const uploadSpeedUnit = getSpeedUnit(settings.maxUploadSpeed)
  const [downloadSpeedDraft, setDownloadSpeedDraft] = useState<string | null>(
    null
  )
  const [uploadSpeedDraft, setUploadSpeedDraft] = useState<string | null>(null)
  const [notice, setNotice] = useState<{
    message: string
    variant?: "info" | "success" | "error"
  } | null>(null)
  const [isSavingPreferences, setIsSavingPreferences] = useState(false)
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false)
  const downloadSpeedValue =
    downloadSpeedDraft ?? getSpeedValue(settings.maxDownloadSpeed)
  const uploadSpeedValue =
    uploadSpeedDraft ?? getSpeedValue(settings.maxUploadSpeed)

  const savePatch = async (patch: Partial<Preferences>) => {
    if (isSavingPreferences) return
    setIsSavingPreferences(true)
    try {
      await savePreferencesPatch(patch)
    } catch (error) {
      console.error("Failed to save settings:", error)
      setNotice({
        message: t("saveFailed"),
        variant: "error",
      })
    } finally {
      setIsSavingPreferences(false)
    }
  }

  const handleSelectFolder = async () => {
    try {
      const folder = await window.grabbit.selectFolder()
      if (folder) {
        void savePatch({ downloadDirectoryPath: folder })
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
    }
  }

  const handleDownloadSpeedCommit = async () => {
    await savePatch({
      maxOverallDownloadLimit: toAria2Speed(
        downloadSpeedValue,
        downloadSpeedUnit
      ),
    })
    setDownloadSpeedDraft(null)
  }

  const handleDownloadSpeedUnitChange = async (unit: "KB/s" | "MB/s") => {
    await savePatch({
      maxOverallDownloadLimit: toAria2Speed(downloadSpeedValue, unit),
    })
    setDownloadSpeedDraft(null)
  }

  const handleUploadSpeedCommit = async () => {
    await savePatch({
      maxOverallUploadLimit: toAria2Speed(uploadSpeedValue, uploadSpeedUnit),
    })
    setUploadSpeedDraft(null)
  }

  const handleUploadSpeedUnitChange = async (unit: "KB/s" | "MB/s") => {
    await savePatch({
      maxOverallUploadLimit: toAria2Speed(uploadSpeedValue, unit),
    })
    setUploadSpeedDraft(null)
  }

  const handleSpeedKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.currentTarget.blur()
    }
  }

  const handleThemeChange = (nextTheme: Theme) => {
    void savePatch({ theme: nextTheme })
  }

  const handleLanguageChange = (nextLanguage: Language) => {
    void savePatch({ language: nextLanguage })
  }

  const handleVersionClick = async () => {
    if (isCheckingUpdate) return

    if (updateState?.available) {
      void window.grabbit.openExternal(updateHomepageUrl)
      return
    }

    try {
      setIsCheckingUpdate(true)
      const result = await checkForUpdates()
      if (!result.available) {
        toastManager.add({
          id: "settings-latest-version",
          title: t("latestVersionAlreadyInstalled"),
          type: "success",
        })
      }
    } catch (error) {
      console.debug("Failed to check for updates:", error)
    } finally {
      setIsCheckingUpdate(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#FFF8F7]">
      <div className="flex-1 overflow-y-auto px-4">
        <div className="mx-auto max-w-3xl space-y-3">
          <div className={settingsCardClass}>
            <h2 className="mb-3 text-sm font-semibold text-[#2D2522]">
              {t("downloadSettings")}
            </h2>

            <div className={settingsRowClass}>
              <div className="flex-shrink-0">
                <label className={settingsLabelClass}>
                  {t("downloadSpeedLimit")}
                </label>
                <p className={settingsHintClass}>{t("zeroMeansUnlimited")}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={downloadSpeedValue}
                  disabled={isSavingPreferences}
                  onChange={(e) => setDownloadSpeedDraft(e.target.value)}
                  onBlur={() => void handleDownloadSpeedCommit()}
                  onKeyDown={handleSpeedKeyDown}
                  className={speedInputClass}
                  placeholder="0"
                />
                <ListboxWrapper
                  value={downloadSpeedUnit}
                  disabled={isSavingPreferences}
                  onChange={(value) =>
                    void handleDownloadSpeedUnitChange(value as "KB/s" | "MB/s")
                  }
                  options={["KB/s", "MB/s"]}
                  className="w-24"
                />
              </div>
            </div>

            <div className={settingsRowClass}>
              <div className="flex-shrink-0">
                <label className={settingsLabelClass}>
                  {t("uploadSpeedLimit")}
                </label>
                <p className={settingsHintClass}>{t("zeroMeansUnlimited")}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={uploadSpeedValue}
                  disabled={isSavingPreferences}
                  onChange={(e) => setUploadSpeedDraft(e.target.value)}
                  onBlur={() => void handleUploadSpeedCommit()}
                  onKeyDown={handleSpeedKeyDown}
                  className={speedInputClass}
                  placeholder="0"
                />
                <ListboxWrapper
                  value={uploadSpeedUnit}
                  disabled={isSavingPreferences}
                  onChange={(value) =>
                    void handleUploadSpeedUnitChange(value as "KB/s" | "MB/s")
                  }
                  options={["KB/s", "MB/s"]}
                  className="w-24"
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <label className={settingsLabelClass}>
                  {t("defaultDownloadFolder")}
                </label>
                <p className={settingsHintClass}>{t("defaultSaveLocation")}</p>
              </div>
              <TooltipWrapper
                content={settings.defaultDownloadDir}
                disabled={!settings.defaultDownloadDir}
              >
                <button
                  onClick={handleSelectFolder}
                  disabled={isSavingPreferences}
                  className="max-w-[220px] truncate rounded-lg border border-[#F0DED8] bg-white px-3 py-1.5 text-left text-xs font-medium text-[#FF5C78] transition-all hover:bg-[#FFF1F4] hover:text-[#E85068] disabled:cursor-wait disabled:opacity-60"
                >
                  {settings.defaultDownloadDir || t("selectFolder")}
                </button>
              </TooltipWrapper>
            </div>
          </div>

          <div className={settingsCardClass}>
            <h2 className="mb-3 text-sm font-semibold text-[#2D2522]">
              {t("displaySettings")}
            </h2>

            <div className={settingsRowClass}>
              <div className="flex-shrink-0">
                <label className={settingsLabelClass}>{t("theme")}</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleThemeChange("light")}
                  disabled={isSavingPreferences}
                  className={iconOptionButtonClass(theme === "light")}
                  title={t("lightMode")}
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  disabled={isSavingPreferences}
                  className={iconOptionButtonClass(theme === "dark")}
                  title={t("darkMode")}
                >
                  <Moon size={18} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div className="flex-shrink-0">
                <label className={settingsLabelClass}>{t("language")}</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLanguageChange("zh")}
                  disabled={isSavingPreferences}
                  className={textOptionButtonClass(language === "zh")}
                >
                  {t("chinese")}
                </button>
                <button
                  onClick={() => handleLanguageChange("en")}
                  disabled={isSavingPreferences}
                  className={textOptionButtonClass(language === "en")}
                >
                  {t("english")}
                </button>
                <button
                  onClick={() => handleLanguageChange("ja")}
                  disabled={isSavingPreferences}
                  className={textOptionButtonClass(language === "ja")}
                >
                  {t("japanese")}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center pt-1 pb-3">
            <button
              type="button"
              onClick={handleVersionClick}
              disabled={isCheckingUpdate}
              className="relative flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium text-[#A28D83] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78] disabled:cursor-wait disabled:opacity-80"
              title={t("checkForUpdates")}
            >
              {isCheckingUpdate ? (
                <Loader2 size={12} className="animate-spin text-[#A28D83]" />
              ) : null}
              <span>
                {t("currentVersion")} {updateState?.currentVersion || "-"}
              </span>
              {updateState?.available && (
                <span
                  className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[#E85068] ring-2 ring-[#FFF8F7]"
                  aria-label={t("updateAvailable")}
                />
              )}
            </button>
          </div>

          {isSavingPreferences && (
            <div className="pointer-events-none fixed right-4 bottom-4 flex items-center gap-2 rounded-full border border-[#F0DED8] bg-white/95 px-3 py-2 text-[12px] font-medium text-[#8B6A5D] shadow-sm">
              <Loader2 size={13} className="animate-spin text-[#FF5C78]" />
              {t("saveSettings")}
            </div>
          )}
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
