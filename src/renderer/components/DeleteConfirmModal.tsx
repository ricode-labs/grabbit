import React, { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { useUI } from "../context/useUI"
import { DialogWrapper } from "./ui/DialogWrapper"
import { CheckboxWrapper } from "./ui/CheckboxWrapper"

interface DeleteConfirmModalProps {
  task: {
    gid: string
    fileName: string
    filePath: string
    status: string
    isLiveTask: boolean
  }
  onConfirm: (deleteFile: boolean) => Promise<void>
  onCancel: () => void
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  task,
  onConfirm,
  onCancel,
}) => {
  const { t } = useUI()
  const [deleteFile, setDeleteFile] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleConfirm = async () => {
    setIsDeleting(true)
    try {
      await onConfirm(deleteFile)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <DialogWrapper
      isOpen={true}
      onClose={onCancel}
      title={t("confirmDelete")}
      className="w-[min(420px,calc(100vw-2rem))] max-w-none"
      contentClassName="flex min-h-0 flex-1 flex-col overflow-x-hidden overflow-y-auto p-4"
    >
      <div className="mb-4 flex min-w-0 items-center gap-3">
        <div className="shrink-0 rounded-[14px] bg-[#FFE8EA] p-2.5">
          <AlertTriangle size={24} className="text-[#E85C61]" />
        </div>
        <div className="min-w-0">
          <p className="break-words text-[#6B5448]">
            {t("confirmDeleteTask")}{" "}
            <span className="font-semibold text-[#2D2522]">
              {task.fileName}
            </span>
            ?
          </p>
        </div>
      </div>

      <div className="mt-4 mb-6 space-y-3">
        <div className="min-w-0 rounded-[14px] border border-[#F8EAE4] bg-white/70 p-4">
          <p className="mb-2 text-sm text-[#8B6A5D]">{t("fileLocation")}</p>
          <p className="font-mono text-sm break-all text-[#2D2522]">
            {task.filePath || "-"}
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-[14px] border border-[#FFD8DD] bg-[#FFF0F3] p-3 transition-all hover:bg-[#FFE8EA]">
          <CheckboxWrapper
            checked={deleteFile}
            onChange={setDeleteFile}
            accent="red"
          />
          <span className="font-medium text-[#E85C61]">{t("deleteFile")}</span>
        </label>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          onClick={handleConfirm}
          disabled={isDeleting}
          className="min-w-0 flex-1 rounded-[12px] bg-[#E85C61] px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-[#D94D54] hover:shadow-lg hover:shadow-[#E85C61]/20 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t("confirmDeleteBtn")}
        </button>
        <button
          onClick={onCancel}
          className="min-w-0 flex-1 rounded-[12px] border border-[#F0DED8] bg-white px-4 py-3 font-semibold text-[#6B5448] transition-all duration-200 hover:bg-[#FFF1F4]"
        >
          {t("cancel")}
        </button>
      </div>
    </DialogWrapper>
  )
}
