import React, { useState, useEffect } from "react"
import { Clipboard, FolderOpen, Link as LinkIcon, X } from "lucide-react"
import type { HttpInfo, TorrentInfo } from "../../shared/aria2"
import { formatBytes } from "../utils/format"
import { useUI } from "../context/useUI"
import { DialogWrapper } from "./ui/DialogWrapper"
import { CheckboxWrapper } from "./ui/CheckboxWrapper"
// import { TooltipWrapper } from "./ui/TooltipWrapper"

// interface FileNode {
//   name: string
//   selected: boolean
//   children?: FileNode[]
//   isExpanded?: boolean
//   index?: string // aria2 文件索引
//   isFile?: boolean
// }

interface AddDownloadModalProps {
  defaultDownloadDir: string
  lastUsedDir?: string
  initialUrl?: string
  onAdd: (url: string, options: Record<string, string>) => void | Promise<void>
  onClose: () => void
  onDirChange?: (dir: string) => void
}

const isDownloadableLink = (text: string): boolean => {
  const text_trimmed = text.trim()
  return /^(https?:\/\/|magnet:|ftp:\/\/)/.test(text_trimmed)
}

const isHttpLink = (text: string): boolean => /^https?:\/\//.test(text.trim())

const isMagnetLink = (text: string): boolean => /^magnet:/i.test(text.trim())

const getSavedTorrentPath = (dir: string, infoHash: string) => {
  const separator = dir.includes("\\") ? "\\" : "/"
  const normalizedDir =
    dir.endsWith("/") || dir.endsWith("\\") ? dir : `${dir}${separator}`
  return `${normalizedDir}${infoHash}.torrent`
}

const formatContentLength = (contentLength: string | null): string => {
  if (!contentLength) return "-"

  const bytes = Number(contentLength)
  return Number.isFinite(bytes) ? formatBytes(bytes) : contentLength
}

// interface DownloadMetadata {
//   fileName: string
//   totalLength: number
//   contentType?: string
//   acceptRanges?: boolean
//   finalUrl?: string
//   statusCode?: number
// }

// interface DiskSpaceInfo {
//   available: number
//   total: number
//   path?: string
// }

export const AddDownloadModal: React.FC<AddDownloadModalProps> = ({
  defaultDownloadDir,
  lastUsedDir,
  initialUrl = "",
  onAdd,
  onClose,
  onDirChange,
}) => {
  const { t } = useUI()
  const [inputMode, setInputMode] = useState<"link" | "file">("link")
  const [url, setUrl] = useState(initialUrl)
  // const [fileName, setFileName] = useState("")
  const [downloadDir, setDownloadDir] = useState(
    lastUsedDir || defaultDownloadDir
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [torrentFile, setTorrentFile] = useState<string>("")
  const [torrentInfo, setTorrentInfo] = useState<TorrentInfo | null>(null)
  const [selectedTorrentFiles, setSelectedTorrentFiles] = useState<number[]>([])
  const [isLoadingTorrentInfo, setIsLoadingTorrentInfo] = useState(false)
  const [isLoadingMagnetMetadata, setIsLoadingMagnetMetadata] = useState(false)
  const [metadata, setMetadata] = useState<{
    url: string
    info: HttpInfo
  } | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)
  // const [metadataError, setMetadataError] = useState("")
  const [availableDiskSpace, setAvailableDiskSpace] = useState<number | null>(
    null
  )
  const [isCheckingSpace, setIsCheckingSpace] = useState(false)

  const isUsingDefaultDir = downloadDir === defaultDownloadDir
  const hasDownloadData =
    inputMode === "file"
      ? Boolean(torrentFile && torrentInfo && selectedTorrentFiles.length > 0)
      : Boolean(url.trim())
  const trimmedUrl = url.trim()
  const shouldLoadMetadata = inputMode === "link" && isHttpLink(trimmedUrl)
  const currentMetadata = metadata?.url === trimmedUrl ? metadata.info : null

  const loadTorrentInfo = async (torrentPath: string) => {
    const info = await window.grabbit.getTorrentInfo(torrentPath)
    setTorrentInfo(info)
    setSelectedTorrentFiles(info.files.map((file) => file.index))
    return info
  }

  const loadSavedTorrentInfo = async (dir: string, infoHash: string) => {
    const torrentPath = getSavedTorrentPath(dir, infoHash)
    const info = await loadTorrentInfo(torrentPath)
    return { torrentPath, info }
  }

  const waitForMagnetMetadata = async (magnetUrl: string) => {
    const gid = await window.aria2.addUri({
      uris: [magnetUrl],
      options: { dir: downloadDir },
    })
    const startedAt = Date.now()
    const timeoutMs = 5 * 60 * 1000

    while (Date.now() - startedAt < timeoutMs) {
      const status = await window.aria2.tellStatus({ gid })
      if (status.status === "complete" && status.infoHash) {
        try {
          const result = await loadSavedTorrentInfo(
            downloadDir,
            status.infoHash
          )
          try {
            await window.aria2.removeDownloadResult({ gid })
          } catch {
            /* cleanup is best-effort; the saved .torrent is enough to continue */
          }
          return result
        } catch {
          /* aria2 can expose infoHash before the .torrent file is flushed */
        }
      }

      if (status.status === "error" || status.status === "removed") {
        throw new Error(status.errorMessage || status.status)
      }

      await new Promise((resolve) => window.setTimeout(resolve, 1000))
    }

    throw new Error(t("metadataUnavailable"))
  }

  // 初始化时读取剪切板
  useEffect(() => {
    const loadClipboard = async () => {
      if (!initialUrl) {
        try {
          const text = await window.grabbit.getClipboardText()
          // 检查是否为可下载的链接
          if (isDownloadableLink(text)) {
            setUrl(text)
          }
        } catch (error) {
          console.error("Failed to read clipboard:", error)
        }
      }
    }
    loadClipboard()
  }, [initialUrl])

  useEffect(() => {
    if (!shouldLoadMetadata) return

    let cancelled = false
    const timeoutId = window.setTimeout(async () => {
      setIsLoadingMetadata(true)
      try {
        const info = await window.grabbit.getHttpInfo(trimmedUrl)
        if (!cancelled) setMetadata({ url: trimmedUrl, info })
      } catch {
        if (!cancelled) setMetadata(null)
      } finally {
        if (!cancelled) setIsLoadingMetadata(false)
      }
    }, 300)

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [shouldLoadMetadata, trimmedUrl])

  useEffect(() => {
    if (!torrentFile) return

    let cancelled = false
    window.grabbit
      .getTorrentInfo(torrentFile)
      .then((info) => {
        if (cancelled) return
        setTorrentInfo(info)
        setSelectedTorrentFiles(info.files.map((file) => file.index))
      })
      .catch(() => {
        if (!cancelled) {
          setTorrentInfo(null)
          setSelectedTorrentFiles([])
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingTorrentInfo(false)
      })

    return () => {
      cancelled = true
    }
  }, [torrentFile])

  useEffect(() => {
    if ((!shouldLoadMetadata && !torrentInfo) || !downloadDir) return

    let cancelled = false
    const checkSpace = async () => {
      setIsCheckingSpace(true)
      try {
        const available = await window.grabbit.getDiskSpace(downloadDir)
        if (!cancelled) setAvailableDiskSpace(available)
      } catch {
        if (!cancelled) setAvailableDiskSpace(null)
      } finally {
        if (!cancelled) setIsCheckingSpace(false)
      }
    }

    checkSpace()

    return () => {
      cancelled = true
    }
  }, [downloadDir, shouldLoadMetadata, torrentInfo])

  // useEffect(() => { ... }, [inputMode, url])

  // useEffect(() => {
  //   const expectedSize = metadata?.totalLength || 0
  //   if (!downloadDir || expectedSize <= 0) {
  //     setDiskSpace(null)
  //     return
  //   }

  //   let cancelled = false
  //   const checkSpace = async () => {
  //     setIsCheckingSpace(true)
  //     try {
  //       const result = await window.electronAPI.getDiskSpace(downloadDir)
  //       if (cancelled) return
  //       if (result.success) {
  //         setDiskSpace({
  //           available: result.available || 0,
  //           total: result.total || 0,
  //           path: result.path,
  //         })
  //       } else {
  //         setDiskSpace(null)
  //       }
  //     } catch {
  //       if (!cancelled) setDiskSpace(null)
  //     } finally {
  //       if (!cancelled) setIsCheckingSpace(false)
  //     }
  //   }

  //   checkSpace()

  //   return () => {
  //     cancelled = true
  //   }
  // }, [downloadDir, metadata?.totalLength])

  // const hasInsufficientSpace = Boolean(
  //   (metadata?.totalLength || torrentSize) &&
  //   diskSpace?.available !== undefined &&
  //   diskSpace.available > 0 &&
  //   diskSpace.available < (metadata?.totalLength || torrentSize)
  // )

  // 加载文件树
  // const loadFileTree = async (torrentPath: string) => { ... }

  // 切换文件选择状态
  // const toggleFileSelection = (index: number, parentIndex?: number) => { ... }

  // 切换文件夹展开状态
  // const toggleExpandFolder = (index: number) => { ... }

  // 全选所有文件
  // const selectAllFiles = () => { ... }

  // 取消选择所有文件
  // const deselectAllFiles = () => { ... }

  const handleSelectFolder = async () => {
    try {
      const folder = await window.grabbit.selectFolder()
      if (folder) {
        setDownloadDir(folder)
        onDirChange?.(folder)
      }
    } catch (error) {
      console.error("Failed to select folder:", error)
    }
  }

  const handleUseDefaultDir = () => {
    setDownloadDir(defaultDownloadDir)
    onDirChange?.(defaultDownloadDir)
  }

  const handleOpenTorrentFile = async () => {
    try {
      const filePath = await window.grabbit.selectTorrentFile()
      if (filePath) {
        setTorrentInfo(null)
        setSelectedTorrentFiles([])
        setIsLoadingTorrentInfo(true)
        setTorrentFile(filePath)
        // 从文件路径提取文件名
        // const name = filePath.split(/[\\/]/).pop() || ""
        // setFileName(name.replace(".torrent", ""))
        // 不预解析种子文件，提交后直接交给 aria2 处理。
        // setTorrentSize(0)
      }
    } catch (error) {
      console.error("Failed to open torrent file:", error)
    }
  }

  const handleInputModeChange = (mode: "link" | "file") => {
    setInputMode(mode)
    // 切换模式时清空对应的输入
    if (mode === "link") {
      setTorrentFile("")
    } else {
      setUrl("")
    }
    // setFileName("")
    // setFiles([])
    // setShowFileTree(false)
    // setIsMultiFile(false)
    // setTorrentName("")
    // setCreateFolder(true)
    // setTorrentSize(0)
    setMetadata(null)
    setIsLoadingMetadata(false)
    setTorrentInfo(null)
    setSelectedTorrentFiles([])
    setIsLoadingTorrentInfo(false)
    setIsLoadingMagnetMetadata(false)
    setAvailableDiskSpace(null)
    setIsCheckingSpace(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const source = inputMode === "link" ? url.trim() : torrentFile
    if (source) {
      if (inputMode === "link" && isMagnetLink(source)) {
        setIsSubmitting(true)
        setIsLoadingMagnetMetadata(true)
        try {
          const result = await waitForMagnetMetadata(source)
          setInputMode("file")
          setTorrentFile(result.torrentPath)
          setTorrentInfo(result.info)
          setUrl("")
        } finally {
          setIsLoadingMagnetMetadata(false)
          setIsSubmitting(false)
        }
        return
      }

      const options: Record<string, string> = { dir: downloadDir }
      if (inputMode === "file") {
        options["select-file"] = selectedTorrentFiles.join(",")
      }

      setIsSubmitting(true)
      try {
        await onAdd(source, options)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const selectedTorrentSize =
    torrentInfo?.files
      .filter((file) => selectedTorrentFiles.includes(file.index))
      .reduce((total, file) => total + file.length, 0) || 0
  const expectedDownloadSize =
    inputMode === "file"
      ? selectedTorrentSize
      : Number(metadata?.info.contentLength || 0)
  const hasInsufficientSpace = Boolean(
    availableDiskSpace !== null &&
    expectedDownloadSize > 0 &&
    availableDiskSpace < expectedDownloadSize
  )

  return (
    <DialogWrapper
      isOpen={true}
      onClose={onClose}
      title=""
      showCloseButton={false}
      className="flex h-[calc(100vh-48px)] max-h-[552px] w-[min(620px,calc(100vw-2rem))] max-w-none flex-col rounded-[18px] !border-[#F8EAE4] !bg-[#FFFBF8] sm:max-w-none dark:!border-[#F8EAE4] dark:!bg-[#FFFBF8]"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-hidden p-0"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-[#F8EAE4] px-5 py-3">
          <div>
            <h2 className="text-[18px] font-semibold text-[#2D2522]">
              {t("newTask")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B6A5D] hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 px-5 py-4">
            <div className="min-h-0 space-y-3 overflow-y-auto pr-1">
              <section className="rounded-[14px] border border-[#F8EAE4] bg-white/70 p-3">
                <label className="mb-2 block text-[13px] font-medium text-[#6B5448]">
                  {t("selectInputMethod")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputModeChange("link")}
                    className={`flex items-center justify-center gap-2 rounded-[12px] border px-3 py-2 text-[13px] font-medium transition-all ${
                      inputMode === "link"
                        ? "border-[#FFC3CF] bg-[#FFF1F4] text-[#FF5C78]"
                        : "border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
                    }`}
                  >
                    <Clipboard size={15} />
                    {t("pasteLink")}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputModeChange("file")}
                    className={`flex items-center justify-center gap-2 rounded-[12px] border px-3 py-2 text-[13px] font-medium transition-all ${
                      inputMode === "file"
                        ? "border-[#FFC3CF] bg-[#FFF1F4] text-[#FF5C78]"
                        : "border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]"
                    }`}
                  >
                    <FolderOpen size={15} />
                    {t("openTorrentFile")}
                  </button>
                </div>
              </section>

              {inputMode === "link" && (
                <section className="rounded-[14px] border border-[#F8EAE4] bg-white/70 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                    <LinkIcon size={15} />
                    {t("downloadLink")}
                  </div>
                  <textarea
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={t("linkPlaceholder")}
                    autoFocus
                    rows={3}
                    className="w-full resize-none rounded-[12px] border border-[#F0DED8] bg-[#FFFCFB] px-3 py-2.5 text-[13px] text-[#2D2522] placeholder:text-[#B7A59C] focus:border-[#FFC3CF] focus:ring-4 focus:ring-[#FFE6EC] focus:outline-none"
                  />

                  {shouldLoadMetadata &&
                    (currentMetadata || isLoadingMetadata) && (
                      <div className="mt-3 rounded-[14px] border border-[#F4E3DE] bg-[#FFF8F7] p-3">
                        {currentMetadata ? (
                          <div className="space-y-2 text-[12px] text-[#7A6257]">
                            <div className="flex items-start justify-between gap-3">
                              <span>{t("fileName")}</span>
                              <span className="max-w-[72%] text-right break-words text-[#2D2522]">
                                {currentMetadata.filename}
                              </span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                              <span>{t("fileSize")}</span>
                              <span className="text-right text-[#2D2522]">
                                {formatContentLength(
                                  currentMetadata.contentLength
                                )}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[12px] text-[#A89488]">
                            {t("loadingFileInfo")}
                          </div>
                        )}
                      </div>
                    )}
                  {isLoadingMagnetMetadata && (
                    <div className="mt-3 rounded-[14px] border border-[#F4E3DE] bg-[#FFF8F7] p-3 text-[12px] text-[#A89488]">
                      {t("loadingFileInfo")}
                    </div>
                  )}
                </section>
              )}

              {inputMode === "file" && (
                <section className="rounded-[14px] border border-[#F8EAE4] bg-white/70 p-3">
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                    <FolderOpen size={15} />
                    {t("torrentFile")}
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenTorrentFile}
                    className="w-full rounded-[12px] border border-[#F0DED8] bg-[#FFFCFB] px-3 py-2.5 text-left text-[13px] font-medium text-[#FF5C78] transition-all hover:bg-[#FFF1F4]"
                  >
                    {torrentFile || t("selectTorrentFile")}
                  </button>
                  {(isLoadingTorrentInfo || torrentInfo) && (
                    <div className="mt-3 rounded-[14px] border border-[#F4E3DE] bg-[#FFF8F7] p-3 text-[12px] text-[#7A6257]">
                      {isLoadingTorrentInfo ? (
                        <div>{t("loadingFileInfo")}</div>
                      ) : torrentInfo ? (
                        <>
                          <div className="flex items-start justify-between gap-3">
                            <span>{t("torrentName")}</span>
                            <span className="max-w-[72%] text-right break-words text-[#2D2522]">
                              {torrentInfo.filename}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span>{t("totalSize")}</span>
                            <span className="text-[#2D2522]">
                              {formatBytes(torrentInfo.totalLength)}
                            </span>
                          </div>
                        </>
                      ) : null}
                    </div>
                  )}
                </section>
              )}

              {inputMode === "file" && torrentInfo && (
                <section className="rounded-[14px] border border-[#F8EAE4] bg-white/70 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-[13px] font-medium text-[#6B5448]">
                      {t("selectFiles")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedTorrentFiles(
                            torrentInfo.files.map((file) => file.index)
                          )
                        }
                        className="rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-medium text-[#FF5C78]"
                      >
                        {t("selectAll")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedTorrentFiles([])}
                        className="rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-medium text-[#FF5C78]"
                      >
                        {t("deselectAll")}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-[12px] border border-[#F0DED8] bg-[#FFFCFB] p-2">
                    {torrentInfo.files.map((file) => (
                      <CheckboxWrapper
                        key={file.index}
                        checked={selectedTorrentFiles.includes(file.index)}
                        onChange={(checked) =>
                          setSelectedTorrentFiles((current) =>
                            checked
                              ? [...current, file.index]
                              : current.filter((index) => index !== file.index)
                          )
                        }
                        label={`${file.path} (${formatBytes(file.length)})`}
                        className="min-w-0 py-1"
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[12px] text-[#7A6257]">
                    <span>{t("selectedSize")}</span>
                    <span className="text-[#2D2522]">
                      {formatBytes(selectedTorrentSize)}
                    </span>
                  </div>
                </section>
              )}

              <section className="rounded-[14px] border border-[#F8EAE4] bg-white/70 p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-[#6B5448]">
                      {t("downloadTo")}
                    </label>
                    {!isUsingDefaultDir && (
                      <span className="ml-2 text-[11px] text-[#A89488]">
                        {t("lastUsedLocation")}
                      </span>
                    )}
                  </div>
                  {!isUsingDefaultDir && (
                    <button
                      type="button"
                      onClick={handleUseDefaultDir}
                      className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[11px] font-medium text-[#FF5C78] hover:bg-[#FFE6EC]"
                    >
                      {t("useDefaultPath")}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="flex w-full items-center justify-between gap-3 rounded-[12px] border border-[#F0DED8] bg-[#FFFCFB] px-3 py-2.5 text-left text-[13px] font-medium text-[#2D2522] transition-all hover:bg-[#FFF1F4]"
                >
                  <span className="min-w-0 truncate">
                    {downloadDir || t("selectFolder")}
                  </span>
                  <FolderOpen size={15} className="shrink-0 text-[#8B6A5D]" />
                </button>

                {(shouldLoadMetadata || torrentInfo) &&
                  (isCheckingSpace || availableDiskSpace !== null) && (
                    <div className="mt-3 rounded-[14px] border border-[#F4E3DE] bg-[#FFF8F7] p-3">
                      <div className="flex items-center justify-between gap-3 text-[12px]">
                        <span className="text-[#6B5448]">
                          {t("availableSpace")}
                        </span>
                        <span className="text-[#2D2522]">
                          {isCheckingSpace
                            ? t("checking")
                            : availableDiskSpace === null
                              ? "-"
                              : formatBytes(availableDiskSpace)}
                        </span>
                      </div>
                      {hasInsufficientSpace && (
                        <div className="mt-2 text-[11px] text-[#E85C61]">
                          {t("insufficientSpace")}
                        </div>
                      )}
                    </div>
                  )}
              </section>

              {/* {showFileTree && files.length > 0 && (
                <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-[13px] font-medium text-[#6B5448]">
                      {t("selectFiles")}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllFiles}
                        className="rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-medium text-[#FF5C78]"
                      >
                        {t("selectAll")}
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFiles}
                        className="rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-medium text-[#FF5C78]"
                      >
                        {t("deselectAll")}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-[14px] border border-[#F4E3DE] bg-[#FFFDFC] p-2">
                    {files.map((file, index) => renderFileNode(file, index))}
                  </div>
                </section>
              )} */}
            </div>

            {/* <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
              <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                  <Radio size={14} />
                  {t("taskSummary")}
                </div>
                <div className="space-y-3 text-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">
                      {t("downloadMethod")}
                    </span>
                    <span className="max-w-[58%] text-right break-words text-[#2D2522]">
                      {inputMode === "link" ? t("link") : t("torrentFile")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">{t("fileName")}</span>
                    <span className="max-w-[58%] text-right break-words text-[#2D2522]">
                      {fileName || "-"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">{t("saveDirectory")}</span>
                    <span className="max-w-[58%] text-right break-words text-[#2D2522]">
                      {downloadDir || "-"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">{t("estimatedSize")}</span>
                    <span className="text-right text-[#2D2522]">
                      {formatBytes(metadata?.totalLength || torrentSize || 0)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="min-h-0 flex-1 rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                  <HardDrive size={14} />
                  {t("directoryInfo")}
                </div>
                <div className="space-y-2 text-[12px] text-[#7A6257]">
                  <div className="flex items-start justify-between gap-3">
                    <span>{t("currentDirectory")}</span>
                    <span className="max-w-[62%] text-right break-words text-[#2D2522]">
                      {downloadDir || "-"}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>{t("spaceStatus")}</span>
                    <span
                      className={`text-right ${hasInsufficientSpace ? "text-[#E85C61]" : "text-[#79A45C]"}`}
                    >
                      {hasInsufficientSpace ? t("insufficient") : t("normal")}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>{t("fileTree")}</span>
                    <span className="text-right text-[#2D2522]">
                      {showFileTree
                        ? t("itemCount").replace(
                            "{count}",
                            String(files.length)
                          )
                        : "-"}
                    </span>
                  </div>
                </div>
              </section>
            </aside> */}
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2.5 border-t border-[#F8EAE4] px-5 py-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-[12px] border border-[#F0DED8] bg-white px-4 py-2 text-[13px] font-medium text-[#6B5448] transition-all hover:bg-[#FFF1F4] disabled:cursor-wait disabled:opacity-60"
            >
              {t("cancel")}
            </button>
            <button
              type="submit"
              disabled={!hasDownloadData || isSubmitting}
              className="rounded-[12px] bg-[#FF7D90] px-5 py-2 text-[13px] font-medium text-white transition-all hover:bg-[#FF5C78] disabled:cursor-not-allowed disabled:bg-[#E9DDD8] disabled:text-[#A89488]"
            >
              {t("startDownload")}
            </button>
          </div>
        </form>
      </div>
    </DialogWrapper>
  )
}
