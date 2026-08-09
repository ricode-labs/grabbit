import React from "react"
import type { Aria2GlobalStat, Aria2Status } from "../../shared/types"
import { formatSpeed } from "../utils/format"
import { useUI } from "../context/useUI"

type DownloadsState = {
  active?: Aria2Status[]
  waiting?: Aria2Status[]
  stopped?: Aria2Status[]
}

interface StatusBarProps {
  globalStat: Partial<Aria2GlobalStat>
  downloads: DownloadsState
}

export const StatusBar: React.FC<StatusBarProps> = ({
  globalStat,
  downloads,
}) => {
  const { t } = useUI()
  const downloadSpeed = parseInt(globalStat.downloadSpeed || "0")
  const uploadSpeed = parseInt(globalStat.uploadSpeed || "0")
  const liveTasks = [
    ...(downloads.active || []),
    ...(downloads.waiting || []),
    ...(downloads.stopped || []),
  ]
  const btTasks = liveTasks.filter((task) => task.bittorrent || task.infoHash)
  const connectedPeers = btTasks.reduce(
    (total, task) => total + parseInt(task.connections || "0"),
    0
  )
  const seeders = btTasks.reduce(
    (total, task) => total + parseInt(task.numSeeders || "0"),
    0
  )

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

        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>BT Peers:</span>
          <span
            className={`font-semibold ${
              connectedPeers > 0 ? "text-[#67A94D]" : "text-[#9A8276]"
            }`}
            title="Connected BitTorrent peers"
          >
            {connectedPeers}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>Seeders:</span>
          <span
            className={`font-semibold ${
              seeders > 0 ? "text-[#67A94D]" : "text-[#9A8276]"
            }`}
            title="Known seeders from active BitTorrent tasks"
          >
            {seeders}
          </span>
        </div>
      </div>
    </footer>
  )
}
