import React from "react"
import { formatBytes, formatSpeed } from "../utils/format"
import {
  CheckCircle2,
  FolderOpen,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
} from "lucide-react"
import { FileIcon } from "@untitledui/file-icons"
import { useUI } from "../context/useUI"
import { TooltipWrapper } from "./ui/TooltipWrapper"
import { CarrotProgress } from "./CarrotProgress"
import deletingUrl from "../assets/deleting.webp"
import downloadedUrl from "../assets/downloaded.webp"
import downloadingUrl from "../assets/downloading.webp"
import errorUrl from "../assets/error.webp"
import pausedUrl from "../assets/paused.webp"
import pendingUrl from "../assets/pending.webp"
import type { Aria2Status } from "../../shared/aria2"

type DownloadTask = Aria2Status & {
  fileName?: string
}

const getFileIconType = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || ""

  const aliases: Record<string, string> = {
    "7z": "zip",
    aac: "audio",
    aep: "aep",
    bz2: "zip",
    flac: "audio",
    gz: "zip",
    m4a: "audio",
    markdown: "code",
    md: "code",
    mov: "video",
    mpg: "mpeg",
    ogg: "audio",
    tar: "zip",
    ts: "code",
    tsx: "code",
    webm: "video",
    yaml: "code",
    yml: "code",
  }

  return aliases[extension] || extension || "empty"
}

const isFolderDownload = (download: DownloadTask) =>
  Boolean(
    download.bittorrent || download.infoHash || download.files?.length > 1
  )

interface DownloadItemProps {
  download: DownloadTask
  isSelected: boolean
  onPause: (gid: string) => void
  onResume: (gid: string) => void
  onRemove: (gid: string) => void
  onSelect: (gid: string) => void
}

export const DownloadItem: React.FC<DownloadItemProps> = ({
  download,
  isSelected,
  onPause,
  onResume,
  onRemove,
  onSelect,
}) => {
  const { t } = useUI()
  const fileName =
    download.bittorrent?.info?.name ||
    download.files?.[0]?.path?.split("/").pop() ||
    download.fileName ||
    t("unknown")
  const files = download.files ?? []
  const torrentName = download.bittorrent?.info?.name
  const filePath = files[0]?.path
  const isMultiFileTorrent = Boolean(torrentName && files.length > 1)
  const folderPath =
    isMultiFileTorrent && download.dir
      ? `${download.dir}/${torrentName}`
      : download.dir
  const completedLength = Number(download.completedLength || 0)
  const totalLength = Number(download.totalLength || 0)
  const speed = Number(download.downloadSpeed || 0)
  const progress = totalLength > 0 ? (completedLength / totalLength) * 100 : 0

  const isActive = download.status === "active"
  const isPaused = download.status === "paused"
  const isWaiting = download.status === "waiting"
  const isComplete = download.status === "complete"
  const isError = download.status === "error" || download.status === "removed"

  const getStatusLabel = () => {
    if (isComplete) return t("statusComplete")
    if (isActive) return t("statusDownloading")
    if (isPaused) return t("statusPaused")
    if (isWaiting) return t("statusWaiting")
    if (isError) return t("statusFailed")
    return download.status
  }

  const getStatusColor = () => {
    if (isComplete) return "bg-[#E9F6DE] text-[#67A94D]"
    if (isActive) return "bg-[#FFE6EC] text-[#FF5C78]"
    if (isPaused) return "bg-[#FFF3DA] text-[#D49345]"
    if (isError) return "bg-[#FFE4E4] text-[#E85C61]"
    return "bg-[#F4ECE7] text-[#8B6A5D]"
  }

  const getMascotUrl = () => {
    if (download.status === "removed") return deletingUrl
    if (isComplete) return downloadedUrl
    if (isActive) return downloadingUrl
    if (isPaused) return pausedUrl
    if (isError) return errorUrl
    return pendingUrl
  }

  const formatRemainingTime = () => {
    if (!isActive || speed <= 0 || totalLength <= completedLength) return ""
    const seconds = Math.ceil((totalLength - completedLength) / speed)
    if (seconds < 60) return `${seconds} ${t("seconds")}`
    const minutes = Math.ceil(seconds / 60)
    if (minutes < 60) return `${minutes} ${t("minutes")}`
    return `${Math.ceil(minutes / 60)} ${t("hours")}`
  }

  const remainingTime = formatRemainingTime()
  const fileIconType = isFolderDownload(download)
    ? "folder"
    : getFileIconType(fileName)
  const canOpenLocation = Boolean(folderPath || filePath)
  const rowState = isSelected
    ? "bg-[#FFF1F4] ring-1 ring-[#FFB9C6]"
    : "bg-white/35 hover:bg-[#FFFBF8]"
  const actionButtonClass =
    "flex h-7 w-7 items-center justify-center rounded-full text-[#8B6A5D] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78] disabled:cursor-not-allowed disabled:opacity-40"

  const handleOpenLocation = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation()
    if (!canOpenLocation) return

    if (files.length > 1 && folderPath) {
      await window.grabbit.openFolder(folderPath)
      return
    }

    await window.grabbit.showItem(filePath || folderPath || "")
  }

  return (
    <div
      onClick={() => onSelect(download.gid)}
      className={`group grid h-[84px] cursor-pointer grid-cols-[38px_minmax(0,1fr)_62px_54px_64px] items-center gap-2 border-b border-[#F4E3DE] px-4 transition-colors last:border-b-0 ${rowState}`}
    >
      <div className="flex h-9 w-9 items-center justify-center">
        <FileIcon
          type={fileIconType}
          variant="default"
          theme="light"
          size={36}
        />
      </div>

      <div className="min-w-0">
        <div className="mb-1 flex min-w-0 items-center gap-2">
          <TooltipWrapper content={fileName} className="min-w-0 flex-1">
            <h3 className="w-full truncate text-[13px] leading-tight font-semibold text-[#2D2522]">
              {fileName}
            </h3>
          </TooltipWrapper>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold ${getStatusColor()}`}
          >
            {getStatusLabel()}
          </span>
        </div>

        <div className="mb-1.5 flex items-center gap-2 text-[11px] text-[#7F6A5F]">
          <span>{formatBytes(completedLength)}</span>
          {totalLength > 0 && (
            <>
              <span>/</span>
              <span>{formatBytes(totalLength)}</span>
            </>
          )}
          {remainingTime && (
            <>
              <span>&middot;</span>
              <span>
                {t("remaining")} {remainingTime}
              </span>
            </>
          )}
        </div>

        <CarrotProgress progress={progress} isActive={isActive} />
      </div>

      <div className="flex min-w-0 items-center justify-end">
        {isComplete ? (
          <CheckCircle2 size={19} className="text-[#79C96B]" />
        ) : isActive && speed > 0 ? (
          <span className="truncate text-[11px] font-semibold text-[#FF5C78]">
            {formatSpeed(speed)}
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-[#BDAAA0]">--</span>
        )}
      </div>

      <div className="flex h-12 items-center justify-center">
        <img
          src={getMascotUrl()}
          alt=""
          className={`h-12 w-12 object-contain ${
            isActive ? "animate-[rabbit-ride_1.2s_ease-in-out_infinite]" : ""
          }`}
        />
      </div>

      <div className="flex items-center justify-end gap-1.5">
        {isActive && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onPause(download.gid)
            }}
            className={actionButtonClass}
            title={t("pause")}
          >
            <Pause size={17} />
          </button>
        )}

        {isPaused && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onResume(download.gid)
            }}
            className={actionButtonClass}
            title={t("resume")}
          >
            <Play size={17} />
          </button>
        )}

        {isComplete && (
          <button
            onClick={handleOpenLocation}
            disabled={!canOpenLocation}
            className={actionButtonClass}
            title={t("saveLocation")}
          >
            <FolderOpen size={16} />
          </button>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(download.gid)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#8B6A5D] transition-colors hover:bg-[#FFE4E4] hover:text-[#E85C61]"
          title={t("delete")}
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect(download.gid)
          }}
          className="flex h-7 w-7 items-center justify-center rounded-full text-[#8B6A5D] transition-colors hover:bg-[#F7F0EA]"
          title={t("downloadDetail")}
        >
          <MoreHorizontal size={17} />
        </button>
      </div>
    </div>
  )
}
