import React from "react"
import {
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Folder,
  FolderOpen,
  Info,
  Link as LinkIcon,
  Pin,
  Trash2,
  X,
} from "lucide-react"
import { formatBytes, formatSpeed } from "../utils/format"
import { useUI } from "../context/UIContext"
import downloadedUrl from "../assets/downloaded.webp"

interface DownloadDetailProps {
  task: any
  historyTask?: any
  onClose: () => void
  onRemove: (gid: string) => Promise<void>
}

export const DownloadDetail: React.FC<DownloadDetailProps> = ({
  task,
  historyTask,
  onClose,
  onRemove,
}) => {
  const { t } = useUI()
  const fileName =
    task?.files?.[0]?.path?.split("/").pop() ||
    historyTask?.fileName ||
    t("unknown")
  const url = task?.files?.[0]?.uris?.[0]?.uri || historyTask?.url || ""
  const dir = task?.dir || historyTask?.dir || "-"
  const gid = task?.gid || historyTask?.gid
  const status = task?.status || historyTask?.status || "unknown"
  const completedLength = Number(
    task?.completedLength || historyTask?.completedLength || 0
  )
  const totalLength = Number(task?.totalLength || historyTask?.totalLength || 0)
  const speed = Number(task?.downloadSpeed || 0)
  const progress =
    totalLength > 0 ? Math.min((completedLength / totalLength) * 100, 100) : 0

  const isActive = status === "active"
  const isPaused = status === "paused"
  const isComplete = status === "complete"
  const isError = status === "error" || status === "removed"

  const getStatusLabel = () => {
    if (isComplete) return t("statusComplete")
    if (isActive) return t("statusDownloading")
    if (isPaused) return t("statusPaused")
    if (status === "waiting") return t("statusWaiting")
    if (isError) return t("statusFailed")
    return status === "unknown" ? t("unknown") : status
  }

  const getStatusTone = () => {
    if (isComplete) return "bg-[#E9F6DE] text-[#67A94D]"
    if (isActive) return "bg-[#FFE6EC] text-[#FF5C78]"
    if (isPaused) return "bg-[#FFF3DA] text-[#D49345]"
    if (isError) return "bg-[#FFE4E4] text-[#E85C61]"
    return "bg-[#F4ECE7] text-[#8B6A5D]"
  }

  const getProtocol = () => {
    if (!url) return "-"
    if (url.startsWith("magnet:")) return "Magnet"
    try {
      return new URL(url).protocol.replace(":", "").toUpperCase()
    } catch {
      return "-"
    }
  }

  const getServer = () => {
    if (!url || url.startsWith("magnet:")) return "-"
    try {
      return new URL(url).hostname || "-"
    } catch {
      return "-"
    }
  }

  const formatTime = (timestamp?: number) => {
    if (!timestamp) return "-"
    return new Date(timestamp).toLocaleString()
  }

  const estimatedTime = () => {
    if (!isActive || speed <= 0 || totalLength <= completedLength) return "-"
    const seconds = Math.ceil((totalLength - completedLength) / speed)
    if (seconds < 60) return `${seconds} ${t("seconds")}`
    const minutes = Math.ceil(seconds / 60)
    if (minutes < 60) return `${minutes} ${t("minutes")}`
    return `${Math.ceil(minutes / 60)} ${t("hours")}`
  }

  const infoRows = [
    { label: t("downloadUrl"), value: url || "-", link: Boolean(url) },
    { label: t("savePath"), value: dir, link: Boolean(dir && dir !== "-") },
    {
      label: t("fileSize"),
      value: `${formatBytes(totalLength)}${totalLength ? ` (${totalLength.toLocaleString()} ${t("bytes")})` : ""}`,
    },
    {
      label: t("downloaded"),
      value: `${formatBytes(completedLength)}${completedLength ? ` (${completedLength.toLocaleString()} ${t("bytes")})` : ""}`,
    },
    { label: t("downloadSpeed"), value: speed > 0 ? formatSpeed(speed) : "-" },
    { label: t("estimatedTime"), value: estimatedTime() },
    { label: t("addedTime"), value: formatTime(historyTask?.addedDate) },
    { label: t("connectionCount"), value: task?.connections ?? "-" },
    { label: t("protocol"), value: getProtocol() },
    {
      label: t("supportsResume"),
      value: isComplete || isActive || isPaused ? t("yes") : "-",
    },
    { label: t("server"), value: getServer() },
    {
      label: t("etag"),
      value: task?.verifiedLength ? `"${task.verifiedLength}"` : "-",
    },
  ]

  const handleDelete = async () => {
    if (!gid) return
    await onRemove(gid)
    onClose()
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#F2DED6] bg-[#FFFBF8]/98 shadow-[0_18px_46px_rgba(107,84,72,0.18)] backdrop-blur-sm">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#F4E3DE] px-5">
        <h2 className="text-[18px] font-semibold text-[#2D2522]">
          {t("downloadDetail")}
        </h2>
        <div className="flex items-center gap-3 text-[#8B6A5D]">
          <button
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#FFF1F4]"
            title={t("pin")}
          >
            <Pin size={16} strokeWidth={1.8} />
          </button>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-[#FFE4E4] hover:text-[#E85C61]"
            title={t("close")}
          >
            <X size={18} strokeWidth={1.8} />
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <section className="shrink-0 px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] border border-[#FFC8D1] bg-[#FFF1F4] text-[#FF6B80]">
              <FileText size={25} strokeWidth={1.7} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-start gap-2">
                <h3 className="min-w-0 flex-1 text-[16px] leading-snug font-semibold break-words text-[#2D2522]">
                  {fileName}
                </h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-[11px] leading-none font-semibold ${getStatusTone()}`}
                >
                  {getStatusLabel()}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#F0ECE9]">
                <div
                  className={`h-full rounded-full ${isComplete ? "bg-[#79C96B]" : "bg-[#FF7D90]"}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        </section>

        <nav className="grid h-11 shrink-0 grid-cols-4 border-b border-[#F4E3DE] px-5 text-[13px] font-medium text-[#6B5448]">
          <button className="relative flex items-center justify-center gap-1.5 text-[#FF5C78]">
            <Info size={16} />
            {t("detailInfo")}
            <span className="absolute right-2 bottom-0 left-2 h-[2px] rounded-full bg-[#FF7D90]" />
          </button>
          <button className="flex items-center justify-center gap-1.5">
            <LinkIcon size={16} />
            {t("connections")}
          </button>
          <button className="flex items-center justify-center gap-1.5">
            <Folder size={16} />
            {t("files")}
          </button>
          <button className="flex items-center justify-center gap-1.5">
            <ClipboardList size={16} />
            {t("logs")}
          </button>
        </nav>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="overflow-hidden rounded-[12px] border border-[#F4E3DE] bg-white/58">
            {infoRows.map((row, index) => (
              <div
                key={row.label}
                className="grid min-h-[42px] grid-cols-[96px_minmax(0,1fr)_20px] items-start gap-3 border-b border-[#F4E3DE] px-3 py-3 last:border-b-0"
              >
                <span className="pt-0.5 text-[13px] text-[#6B5448]">
                  {row.label}
                </span>
                <span
                  className={`min-w-0 text-right text-[13px] leading-relaxed break-all whitespace-normal ${row.link ? "text-[#2E8BD6]" : "text-[#7A6257]"}`}
                >
                  {row.value}
                </span>
                {row.label === t("supportsResume") && row.value === t("yes") ? (
                  <CheckCircle2 size={16} className="mt-0.5 text-[#79C96B]" />
                ) : index === infoRows.length - 1 ? (
                  <ChevronDown size={16} className="mt-0.5 text-[#8B6A5D]" />
                ) : (
                  <span />
                )}
              </div>
            ))}
          </div>

          <img
            src={downloadedUrl}
            alt=""
            className="pointer-events-none float-right -mt-3 h-[94px] w-[94px] object-contain opacity-95"
          />
        </main>

        <footer className="grid h-[70px] shrink-0 grid-cols-3 gap-3 border-t border-[#F4E3DE] px-5 py-4">
          <button className="flex items-center justify-center gap-2 rounded-[12px] border border-[#F0DED8] bg-white/82 text-[13px] font-medium text-[#6B5448] hover:bg-[#FFF1F4]">
            <FileText size={16} />
            {t("openFile")}
          </button>
          <button className="flex items-center justify-center gap-2 rounded-[12px] border border-[#F0DED8] bg-white/82 text-[13px] font-medium text-[#6B5448] hover:bg-[#FFF1F4]">
            <FolderOpen size={16} />
            {t("openFolder")}
          </button>
          <button
            onClick={handleDelete}
            disabled={!gid}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-[#FFD8DD] bg-[#FFECEE] text-[13px] font-semibold text-[#FF5C78] hover:bg-[#FFE2E7] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 size={16} />
            {t("deleteTask")}
          </button>
        </footer>
      </div>
    </aside>
  )
}
