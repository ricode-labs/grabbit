import React from "react"
import { formatSpeed } from "../utils/format"
import { useUI } from "../context/UIContext"

interface StatusBarProps {
  globalStat: any
}

export const StatusBar: React.FC<StatusBarProps> = ({ globalStat }) => {
  const { t } = useUI()
  const downloadSpeed = parseInt(globalStat.downloadSpeed || "0")
  const uploadSpeed = parseInt(globalStat.uploadSpeed || "0")

  return (
    <footer className="grid h-[30px] grid-cols-1 items-center">
      <div className="flex h-[30px] min-w-0 items-center justify-center gap-5 rounded-[10px] border border-[#F2DED6] bg-white/78 px-3 text-[11px] shadow-sm">
        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>{t("downloadSpeed")}:</span>
          <span className="font-semibold text-[#FF5C78]">
            {formatSpeed(downloadSpeed)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>{t("uploadSpeed")}:</span>
          <span className="font-semibold text-[#5AA0D6]">
            {formatSpeed(uploadSpeed)}
          </span>
        </div>

      </div>
    </footer>
  )
}
