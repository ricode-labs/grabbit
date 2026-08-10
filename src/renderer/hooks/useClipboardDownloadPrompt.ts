import { useEffect, useRef, useState } from "react"

const promptedClipboardUrls = new Set<string>()

const isDownloadableLink = (text: string) =>
  /^(https?:\/\/|magnet:|ftp:\/\/)/.test(text)

export function useClipboardDownloadPrompt() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [clipboardUrl, setClipboardUrl] = useState("")
  const isAddModalOpenRef = useRef(false)

  const openAddModal = (url = "") => {
    isAddModalOpenRef.current = true
    setClipboardUrl(url)
    setIsAddModalOpen(true)
  }

  const closeAddModal = () => {
    isAddModalOpenRef.current = false
    setIsAddModalOpen(false)
    setClipboardUrl("")
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

  return {
    clipboardUrl,
    isAddModalOpen,
    openAddModal,
    closeAddModal,
    closeAndMarkClipboardUrl,
    markClipboardUrlHandled,
  }
}
