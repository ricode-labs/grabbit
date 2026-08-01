import React, { useState } from "react"
import { AlertTriangle } from "lucide-react"
import { useUI } from "../context/UIContext"
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
  onConfirm: (deleteFile: boolean) => void
  onCancel: () => void
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  task,
  onConfirm,
  onCancel,
}) => {
  const { t } = useUI()
  const [deleteFile, setDeleteFile] = useState(false)

  return (
    <DialogWrapper
      isOpen={true}
      onClose={onCancel}
      title={t("confirmDelete")}
      className="max-w-sm"
    >
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-red-500/20 p-2.5">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <div>
          <p className="text-zinc-700 dark:text-zinc-300">
            {t("confirmDeleteTask")}{" "}
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {task.fileName}
            </span>
            ?
          </p>
        </div>
      </div>

      <div className="mt-4 mb-6 space-y-3">
        <div className="rounded-lg border border-zinc-300 bg-zinc-100 p-4 dark:border-zinc-600 dark:bg-zinc-700">
          <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
            {t("fileLocation")}
          </p>
          <p className="font-mono text-sm break-all text-zinc-900 dark:text-zinc-100">
            {task.filePath || "-"}
          </p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-red-500/40 bg-red-500/10 p-3 transition-all hover:bg-red-500/15">
          <CheckboxWrapper
            checked={deleteFile}
            onChange={setDeleteFile}
            accent="red"
          />
          <span className="font-medium text-red-500 dark:text-red-400">
            {t("deleteFile")}
          </span>
        </label>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={() => onConfirm(deleteFile)}
          className="flex-1 rounded-lg bg-red-500 px-4 py-3 font-semibold text-white transition-all duration-200 hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/30"
        >
          {t("confirmDeleteBtn")}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 rounded-lg bg-zinc-200 px-4 py-3 font-semibold text-zinc-700 transition-all duration-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-600"
        >
          {t("cancel")}
        </button>
      </div>
    </DialogWrapper>
  )
}
