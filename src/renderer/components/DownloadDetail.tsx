import React from "react"
import { FileText, FolderOpen, Trash2, X } from "lucide-react"
import { useUI } from "../context/useUI"
import downloadedUrl from "../assets/downloaded.webp"
import { TooltipWrapper } from "./ui/TooltipWrapper"
import type { Aria2Status } from "../../shared/aria2"

type DownloadTask = Aria2Status & {
  fileName?: string
  url?: string
}

const formatFileProgress = (completedLength: string, length: string) => {
  const completed = Number(completedLength || 0)
  const total = Number(length || 0)
  if (total <= 0) return "0%"

  return `${Math.min((completed / total) * 100, 100).toFixed(1)}%`
}

const splitTorrentPath = (filePath: string) =>
  filePath.split(/[\\/]+/).filter(Boolean)

type TorrentTreeNode = {
  kind: "folder" | "file"
  name: string
  progress?: string
  children?: TorrentTreeNode[]
}

const getTorrentTreeRoot = (
  files: Array<{ path: string }>,
  dir: string,
  torrentName?: string
) => {
  const firstSegments = files
    .map((file) => {
      const relative =
        dir !== "-" && file.path.startsWith(dir)
          ? file.path.slice(dir.length).replace(/^[/\\]+/, "")
          : file.path
      return splitTorrentPath(relative)[0]
    })
    .filter(Boolean)

  if (torrentName && firstSegments.every((segment) => segment === torrentName)) {
    return torrentName
  }

  if (
    firstSegments.length > 1 &&
    firstSegments.every((segment) => segment === firstSegments[0])
  ) {
    return firstSegments[0]
  }

  return null
}

const buildTorrentFileTree = (
  files: Array<{ path: string; completedLength: string; length: string }>,
  dir: string,
  torrentName?: string
) => {
  const rootName = getTorrentTreeRoot(files, dir, torrentName)
  const rootNodes: TorrentTreeNode[] = []

  for (const file of files) {
    const relativePath =
      dir !== "-" && file.path.startsWith(dir)
        ? file.path.slice(dir.length).replace(/^[/\\]+/, "")
        : file.path
    const segments = splitTorrentPath(relativePath)
    const displaySegments =
      rootName && segments[0] === rootName ? segments.slice(1) : segments

    if (displaySegments.length === 0) continue

    let siblings = rootNodes
    for (let index = 0; index < displaySegments.length; index += 1) {
      const name = displaySegments[index]
      const isLeaf = index === displaySegments.length - 1

      if (isLeaf) {
        siblings.push({
          kind: "file",
          name,
          progress: formatFileProgress(file.completedLength, file.length),
        })
        continue
      }

      let folder = siblings.find(
        (node): node is TorrentTreeNode & { children: TorrentTreeNode[] } =>
          node.kind === "folder" && node.name === name
      )

      if (!folder) {
        folder = { kind: "folder", name, children: [] }
        siblings.push(folder)
      }

      siblings = folder.children
    }
  }

  return rootNodes
}

const renderTorrentTreeNode = (
  node: TorrentTreeNode,
  key: React.Key,
  depth: number
) => {
  if (node.kind === "folder") {
    return (
      <div key={key} className="py-0.5">
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-[13px] font-medium text-[#6B5448]"
          style={{ paddingLeft: 12 + depth * 16 }}
        >
          <FolderOpen size={14} className="shrink-0" />
          <TooltipWrapper content={node.name} className="min-w-0 flex-1">
            <span className="block min-w-0 truncate">{node.name}</span>
          </TooltipWrapper>
        </div>
        <div>
          {node.children?.map((child, index) =>
            renderTorrentTreeNode(child, `${key}-${index}`, depth + 1)
          )}
        </div>
      </div>
    )
  }

  return (
    <div
      key={key}
      className="grid min-h-[38px] grid-cols-[minmax(0,1fr)_54px] items-center gap-3 px-3 py-1.5"
      style={{ paddingLeft: 12 + depth * 16 }}
    >
      <div className="flex min-w-0 items-center gap-2">
        <FileText size={14} className="shrink-0 text-[#8B6A5D]" />
        <TooltipWrapper content={node.name} className="min-w-0 flex-1">
          <span className="block min-w-0 truncate text-[13px] leading-relaxed text-[#2D2522]">
            {node.name}
          </span>
        </TooltipWrapper>
      </div>
      <span className="text-right text-[13px] font-semibold text-[#FF5C78]">
        {node.progress}
      </span>
    </div>
  )
}

interface DownloadDetailProps {
  task: DownloadTask | null
  historyTask?: DownloadTask | null
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
  const files = task?.files?.length ? task.files : (historyTask?.files ?? [])
  const torrentName = task?.bittorrent?.info?.name || historyTask?.bittorrent?.info?.name
  const dir = task?.dir || historyTask?.dir || "-"
  const isTorrentTask = Boolean(
    task?.bittorrent ||
      historyTask?.bittorrent ||
      task?.infoHash ||
      historyTask?.infoHash
  )
  const isMultiFileTorrent = Boolean(torrentName && files.length > 1)
  const isFolderDownload = files.length > 1
  const fileName =
    torrentName ||
    files[0]?.path?.split("/").pop() ||
    historyTask?.fileName ||
    t("unknown")
  const url = files[0]?.uris?.[0]?.uri || historyTask?.url || ""
  const filePath = files[0]?.path
  const torrentRootName = isTorrentTask
    ? getTorrentTreeRoot(files, dir, torrentName)
    : null
  const folderPath =
    isTorrentTask && torrentRootName && dir !== "-"
      ? `${dir}/${torrentRootName}`
      : isMultiFileTorrent && dir !== "-"
        ? `${dir}/${torrentName}`
        : dir
  const gid = task?.gid || historyTask?.gid
  const status = task?.status || historyTask?.status || "unknown"
  const selectedTorrentFiles = isTorrentTask
    ? files.filter((file) => file.selected === "true")
    : []
  const torrentFileTree = isTorrentTask
    ? buildTorrentFileTree(selectedTorrentFiles, dir, torrentName)
    : []

  const isPaused = status === "paused"
  const isComplete = status === "complete"
  const isError = status === "error" || status === "removed"

  const getStatusLabel = () => {
    if (isComplete) return t("statusComplete")
    if (status === "active") return t("statusDownloading")
    if (isPaused) return t("statusPaused")
    if (status === "waiting") return t("statusWaiting")
    if (isError) return t("statusFailed")
    return status === "unknown" ? t("unknown") : status
  }

  const getStatusTone = () => {
    if (isComplete) return "bg-[#E9F6DE] text-[#67A94D]"
    if (status === "active") return "bg-[#FFE6EC] text-[#FF5C78]"
    if (isPaused) return "bg-[#FFF3DA] text-[#D49345]"
    if (isError) return "bg-[#FFE4E4] text-[#E85C61]"
    return "bg-[#F4ECE7] text-[#8B6A5D]"
  }

  const infoRows = [
    ...(!isTorrentTask && url
      ? [{ label: t("downloadUrl"), value: url, link: true }]
      : []),
    {
      label: t("savePath"),
      value: folderPath,
      link: Boolean(folderPath && folderPath !== "-"),
    },
  ]

  const handleDelete = async () => {
    if (!gid) return
    await onRemove(gid)
    onClose()
  }

  const handleOpenFile = async () => {
    if (!filePath) return
    await window.grabbit.openFile(filePath)
  }

  const handleOpenFolder = async () => {
    if (folderPath === "-") return
    if (isFolderDownload) {
      await window.grabbit.openFolder(folderPath)
    } else {
      await window.grabbit.showItem(filePath || folderPath)
    }
  }

  return (
    <aside className="flex h-full min-h-0 flex-col overflow-hidden rounded-[18px] border border-[#F2DED6] bg-[#FFFBF8]/98 shadow-[0_18px_46px_rgba(107,84,72,0.18)] backdrop-blur-sm">
      <header className="flex h-[58px] shrink-0 items-center justify-between border-b border-[#F4E3DE] px-5">
        <h2 className="text-[18px] font-semibold text-[#2D2522]">
          {t("downloadDetail")}
        </h2>
        <div className="flex items-center gap-3 text-[#8B6A5D]">
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
            </div>
          </div>
        </section>

        <main className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <div className="overflow-hidden rounded-[12px] border border-[#F4E3DE] bg-white/58">
            {infoRows.map((row) => (
              <div
                key={row.label}
                className="grid min-h-[42px] grid-cols-[96px_minmax(0,1fr)] items-start gap-3 border-b border-[#F4E3DE] px-3 py-3 last:border-b-0"
              >
                <span className="pt-0.5 text-[13px] text-[#6B5448]">
                  {row.label}
                </span>
                <span
                  className={`min-w-0 text-right text-[13px] leading-relaxed break-all whitespace-normal ${row.link ? "text-[#2E8BD6]" : "text-[#7A6257]"}`}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {torrentFileTree.length > 0 && (
            <section className="mt-4 overflow-hidden rounded-[12px] border border-[#F4E3DE] bg-white/58">
              <div className="border-b border-[#F4E3DE] px-3 py-2.5 text-[13px] font-medium text-[#6B5448]">
                {t("files")}
              </div>
              <div className="max-h-[220px] overflow-y-auto py-1">
                {torrentFileTree.map((node, index) =>
                  renderTorrentTreeNode(node, index, 0)
                )}
              </div>
            </section>
          )}

          <img
            src={downloadedUrl}
            alt=""
            className="pointer-events-none float-right -mt-3 h-[94px] w-[94px] object-contain opacity-95"
          />
        </main>

        <footer className={`grid h-[70px] shrink-0 gap-3 border-t border-[#F4E3DE] px-5 py-4 ${isFolderDownload ? "grid-cols-2" : "grid-cols-3"}`}>
          {!isFolderDownload ? (
            <button
              onClick={handleOpenFile}
              disabled={!filePath}
              className="flex items-center justify-center gap-2 rounded-[12px] border border-[#F0DED8] bg-white/82 text-[13px] font-medium text-[#6B5448] hover:bg-[#FFF1F4] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FileText size={16} />
              {t("openFile")}
            </button>
          ) : null}
          <button
            onClick={handleOpenFolder}
            disabled={folderPath === "-"}
            className="flex items-center justify-center gap-2 rounded-[12px] border border-[#F0DED8] bg-white/82 text-[13px] font-medium text-[#6B5448] hover:bg-[#FFF1F4] disabled:cursor-not-allowed disabled:opacity-50"
          >
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
