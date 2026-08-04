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
        className={`flex max-h-[calc(100vh-48px)] w-full flex-col gap-0 overflow-hidden rounded-[18px] border border-[#F8EAE4] bg-[#FFFBF8] p-0 shadow-[0_18px_42px_rgba(107,84,72,0.10)] ${className}`}
        showCloseButton={showCloseButton}
      >
        {(title || showCloseButton) && (
          <DialogHeader className="flex-shrink-0 border-b border-[#F8EAE4] px-4 py-3">
            <DialogTitle className="text-lg font-bold text-[#2D2522]">
              {title}
            </DialogTitle>
          </DialogHeader>
        )}
        {description && (
          <DialogDescription className="px-4 pt-2 text-sm text-[#8B6A5D]">
            {description}
          </DialogDescription>
        )}
        <div
          className={
            contentClassName ??
            `flex min-h-0 flex-1 flex-col overflow-y-auto p-4 ${description ? "pt-2" : ""}`
          }
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  )
}
