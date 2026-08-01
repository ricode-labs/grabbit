import React from "react"
import { formatBytes, formatSpeed } from "../utils/format"
import {
  Archive,
  CheckCircle2,
  File,
  FileAudio,
  FileImage,
  FileText,
  FileVideo,
  FolderOpen,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
} from "lucide-react"
import { useUI } from "../context/UIContext"
import { TooltipWrapper } from "./ui/TooltipWrapper"
import deletingUrl from "../assets/deleting.webp"
import downloadedUrl from "../assets/downloaded.webp"
import downloadingUrl from "../assets/downloading.webp"
import errorUrl from "../assets/error.webp"
import pausedUrl from "../assets/paused.webp"
import pendingUrl from "../assets/pending.webp"

interface DownloadItemProps {
  download: any
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
    download.files?.[0]?.path?.split("/").pop() ||
    download.fileName ||
    t("unknown")
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

  const getProgressBarColor = () => {
    if (isComplete) return "bg-[#79C96B]"
    if (isPaused) return "bg-[#F7A94A]"
    if (isError) return "bg-[#E85C61]"
    return "bg-[#FF7D90]"
  }

  const getFileIcon = () => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension && ["zip", "rar", "7z", "tar", "gz"].includes(extension))
      return Archive
    if (extension && ["mp4", "mov", "mkv", "avi", "webm"].includes(extension))
      return FileVideo
    if (extension && ["mp3", "wav", "flac", "aac", "ogg"].includes(extension))
      return FileAudio
    if (
      extension &&
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)
    )
      return FileImage
    if (extension && ["pdf", "doc", "docx", "txt", "md"].includes(extension))
      return FileText
    return File
  }

  const getFileTone = () => {
    const extension = fileName.split(".").pop()?.toLowerCase()

    if (extension && ["mp3", "wav", "flac", "aac", "ogg"].includes(extension))
      return "border-[#BFE3A8] bg-[#F0FAE9] text-[#79C96B]"
    if (extension && ["pdf", "doc", "docx", "txt", "md"].includes(extension))
      return "border-[#FFD4A6] bg-[#FFF5E9] text-[#F7A94A]"
    if (
      extension &&
      ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(extension)
    )
      return "border-[#D6C9F2] bg-[#F4F0FF] text-[#9B82D6]"
    if (extension && ["zip", "rar", "7z", "tar", "gz"].includes(extension))
      return "border-[#FFC8D1] bg-[#FFF1F4] text-[#FF6B80]"
    if (extension && ["mp4", "mov", "mkv", "avi", "webm"].includes(extension))
      return "border-[#FFC8D1] bg-[#FFF1F4] text-[#FF6B80]"
    return "border-[#F0D2CB] bg-[#FFFBF7] text-[#8B6A5D]"
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

  const FileIcon = getFileIcon()
  const remainingTime = formatRemainingTime()
  const extension = fileName.split(".").pop()?.toUpperCase() || ""
  const rowState = isSelected
    ? "bg-[#FFF1F4] ring-1 ring-[#FFB9C6]"
    : "bg-white/35 hover:bg-[#FFFBF8]"
  const actionButtonClass =
    "flex h-8 w-8 items-center justify-center rounded-full text-[#8B6A5D] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78]"

  return (
    <div
      onClick={() => onSelect(download.gid)}
      className={`group grid h-[72px] cursor-pointer grid-cols-[44px_minmax(0,1fr)_70px_76px_70px] items-center gap-3 border-b border-[#F4E3DE] px-5 transition-colors last:border-b-0 ${rowState}`}
    >
      <div
        className={`relative flex h-10 w-10 items-center justify-center rounded-[7px] border ${getFileTone()}`}
      >
        <FileIcon size={22} strokeWidth={1.7} />
        {extension && (
          <span className="absolute bottom-[5px] max-w-[31px] truncate text-[9px] leading-none font-bold">
            {extension.slice(0, 4)}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <div className="mb-1.5 flex items-center gap-2">
          <TooltipWrapper content={fileName} className="min-w-0">
            <h3 className="truncate text-[13px] leading-tight font-semibold text-[#2D2522]">
              {fileName}
            </h3>
          </TooltipWrapper>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] leading-none font-semibold ${getStatusColor()}`}
          >
            {getStatusLabel()}
          </span>
        </div>

        <div className="mb-2 flex items-center gap-2 text-[11px] text-[#7F6A5F]">
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

        <div className="h-[4px] overflow-hidden rounded-full bg-[#F0ECE9]">
          <div
            className={`h-full rounded-full transition-all duration-300 ${getProgressBarColor()}`}
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
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

      <div className="flex h-[58px] items-center justify-center">
        <img
          src={getMascotUrl()}
          alt=""
          className="h-[58px] w-[58px] object-contain"
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
            onClick={(e) => e.stopPropagation()}
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
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B6A5D] transition-colors hover:bg-[#FFE4E4] hover:text-[#E85C61]"
          title={t("delete")}
        >
          <Trash2 size={16} />
        </button>

        <button
          onClick={(e) => e.stopPropagation()}
          className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B6A5D] transition-colors hover:bg-[#F7F0EA]"
          title={fileName}
        >
          <MoreHorizontal size={17} />
        </button>
      </div>
    </div>
  )
}
