import React, { useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./dialog"

interface DialogWrapperProps {
  isOpen: boolean
  onClose: () => void
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  contentClassName?: string
  showCloseButton?: boolean
}

export const DialogWrapper: React.FC<DialogWrapperProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = "max-w-xl",
  contentClassName,
  showCloseButton = true,
}) => {
  // 当弹窗打开时，禁止 body 滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={`w-full gap-0 overflow-hidden rounded-lg border border-zinc-200 bg-white p-0 shadow-2xl dark:border-zinc-700 dark:bg-zinc-800 ${className}`}
        showCloseButton={showCloseButton}
      >
        {(title || showCloseButton) && (
          <DialogHeader className="flex-shrink-0 border-b border-zinc-200 p-4 dark:border-zinc-700">
            <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        {description && (
          <DialogDescription className="px-4 pt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {description}
          </DialogDescription>
        )}
        <div
          className={
            contentClassName ??
            `flex flex-1 flex-col overflow-hidden p-4 ${description ? "pt-2" : ""}`
          }
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
