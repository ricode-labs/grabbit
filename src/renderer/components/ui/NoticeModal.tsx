import React from "react"
import { AlertCircle, CheckCircle2, TriangleAlert } from "lucide-react"
import { useUI } from "../../context/UIContext"
import { DialogWrapper } from "./DialogWrapper"

interface NoticeModalProps {
  isOpen: boolean
  message: string
  title?: string
  variant?: "info" | "success" | "error"
  confirmLabel?: string
  onConfirm: () => void
  onClose: () => void
}

export const NoticeModal: React.FC<NoticeModalProps> = ({
  isOpen,
  message,
  title,
  variant = "info",
  confirmLabel,
  onConfirm,
  onClose,
}) => {
  const { t } = useUI()

  const iconConfig = {
    info: {
      icon: AlertCircle,
      box: "bg-[#EAF3FF]",
      color: "text-[#4C8ED6]",
    },
    success: {
      icon: CheckCircle2,
      box: "bg-[#EAF8ED]",
      color: "text-[#67A94D]",
    },
    error: {
      icon: TriangleAlert,
      box: "bg-[#FFE8EA]",
      color: "text-[#E85C61]",
    },
  }[variant]

  const Icon = iconConfig.icon

  const handleConfirm = () => {
    onClose()
    onConfirm()
  }

  return (
    <DialogWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={title || t("noticeTitle")}
      className="max-w-sm"
      showCloseButton={false}
    >
      <div className="flex items-start gap-3">
        <div className={`rounded-[12px] p-2.5 ${iconConfig.box}`}>
          <Icon size={22} className={iconConfig.color} />
        </div>
        <p className="min-w-0 flex-1 pt-0.5 text-[13px] leading-6 text-[#4E4038]">
          {message}
        </p>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleConfirm}
          className="rounded-[12px] bg-[#FF7D90] px-4 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-[#FF5C78]"
        >
          {confirmLabel || t("ok")}
        </button>
      </div>
    </DialogWrapper>
  )
}
