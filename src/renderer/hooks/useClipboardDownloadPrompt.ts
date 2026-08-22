import { useEffect, useRef, useState } from "react"
import type { LaunchInput } from "../../shared/aria2"

const promptedClipboardUrls = new Set<string>()

const isDownloadableLink = (text: string) =>
  /^(https?:\/\/|magnet:|ftp:\/\/)/.test(text)

export function useClipboardDownloadPrompt() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [clipboardUrl, setClipboardUrl] = useState("")
  const [launchHeaders, setLaunchHeaders] = useState<string[]>([])
  const [torrentPath, setTorrentPath] = useState("")
  const [modalKey, setModalKey] = useState(0)
  const isAddModalOpenRef = useRef(false)
  const launchQueueRef = useRef<LaunchInput[]>([])

  const showLaunchInput = (input: LaunchInput) => {
    setClipboardUrl(input.kind === "url" ? input.value : "")
    setLaunchHeaders(input.header || [])
    setTorrentPath(input.kind === "torrent" ? input.value : "")
    setModalKey((current) => current + 1)
    setIsAddModalOpen(true)
    isAddModalOpenRef.current = true
  }

  const openAddModal = (
    url = "",
    launchTorrentPath = "",
    headers: string[] = []
  ) => {
    isAddModalOpenRef.current = true
    launchQueueRef.current = []
    setModalKey((current) => current + 1)
    setClipboardUrl(url)
    setLaunchHeaders(headers)
    setTorrentPath(launchTorrentPath)
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    const [nextInput, ...remainingInputs] = launchQueueRef.current
    if (nextInput) {
      launchQueueRef.current = remainingInputs
      showLaunchInput(nextInput)
      return
    }

    launchQueueRef.current = []
    isAddModalOpenRef.current = false
    setIsAddModalOpen(false)
    setClipboardUrl("")
    setLaunchHeaders([])
    setTorrentPath("")
  }

  const markClipboardUrlHandled = (url: string) => {
    const handledUrl = url.trim()
    if (handledUrl) {
      promptedClipboardUrls.add(handledUrl)
    }
  }

  const closeAndMarkClipboardUrl = () => {
    markClipboardUrlHandled(clipboardUrl)
    closeAddModal()
  }

  useEffect(() => {
    let mounted = true

    const checkClipboard = async () => {
      try {
        const text = await window.grabbit.getClipboardText()
        const clipboardUrl = text.trim()
        if (
          mounted &&
          !isAddModalOpenRef.current &&
          clipboardUrl &&
          isDownloadableLink(clipboardUrl) &&
          !promptedClipboardUrls.has(clipboardUrl)
        ) {
          promptedClipboardUrls.add(clipboardUrl)
          openAddModal(clipboardUrl)
        }
      } catch (error) {
        console.error("Failed to check clipboard:", error)
      }
    }

    void checkClipboard()
    const interval = window.setInterval(checkClipboard, 3000)

    return () => {
      mounted = false
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let mounted = true
    const enqueueLaunchInputs = (inputs: LaunchInput[]) => {
      if (!mounted || inputs.length === 0) return
      launchQueueRef.current = [...launchQueueRef.current, ...inputs]
      if (!isAddModalOpenRef.current) {
        const nextInput = launchQueueRef.current.shift()
        if (nextInput) {
          showLaunchInput(nextInput)
        }
      }
    }

    const removeLaunchInputListener =
      window.grabbit.onLaunchInputs(enqueueLaunchInputs)
    void window.grabbit
      .takePendingLaunchInputs()
      .then(enqueueLaunchInputs)

    return () => {
      mounted = false
      removeLaunchInputListener()
    }
  }, [])

  return {
    clipboardUrl,
    launchHeaders,
    torrentPath,
    modalKey,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    closeAndMarkClipboardUrl,
    markClipboardUrlHandled,
  }
}
