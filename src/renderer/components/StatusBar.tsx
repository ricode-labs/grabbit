import React from "react"
import { formatSpeed } from "../utils/format"

interface StatusBarProps {
  globalStat: any
}

export const StatusBar: React.FC<StatusBarProps> = ({ globalStat }) => {
  const downloadSpeed = parseInt(globalStat.downloadSpeed || "0")
  const uploadSpeed = parseInt(globalStat.uploadSpeed || "0")

  return (
    <footer className="grid h-[34px] grid-cols-1 items-center">
      <div className="flex h-[34px] min-w-0 items-center justify-center gap-6 rounded-[12px] border border-[#F2DED6] bg-white/78 px-4 text-[12px] shadow-sm">
        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>Download:</span>
          <span className="font-semibold text-[#FF5C78]">
            {formatSpeed(downloadSpeed)}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>Upload:</span>
          <span className="font-semibold text-[#5AA0D6]">
            {formatSpeed(uploadSpeed)}
          </span>
        </div>

      </div>
    </footer>
  )
}
