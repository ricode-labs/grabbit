import React from "react"
import { formatSpeed } from "../utils/format"
import { ChevronDown } from "lucide-react"

interface StatusBarProps {
  globalStat: any
}

export const StatusBar: React.FC<StatusBarProps> = ({ globalStat }) => {
  const downloadSpeed = parseInt(globalStat.downloadSpeed || "0")
  const uploadSpeed = parseInt(globalStat.uploadSpeed || "0")
  const numActive = parseInt(globalStat.numActive || "0")
  const numWaiting = parseInt(globalStat.numWaiting || "0")

  return (
    <footer className="grid h-[34px] grid-cols-[minmax(0,1fr)_42px] items-center gap-8">
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

        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>Active:</span>
          <span className="font-semibold text-[#2D2522]">{numActive}</span>
          <span className="text-zinc-300">/</span>
          <span>{numWaiting}</span>
        </div>
      </div>

      <button
        className="flex h-[34px] items-center justify-center gap-1 rounded-[12px] border border-[#F2DED6] bg-white/78 px-2 text-[12px] font-semibold text-[#6B5448] shadow-sm"
      >
        <span>{numActive + numWaiting}</span>
        <ChevronDown size={14} className="text-[#9A8276]" />
      </button>
    </footer>
  )
}
