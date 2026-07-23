import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useUI } from '../context/UIContext';
import { DialogWrapper } from './ui/DialogWrapper';
import { CheckboxWrapper } from './ui/CheckboxWrapper';

interface DeleteConfirmModalProps {
  task: {
    gid: string;
    fileName: string;
    filePath: string;
    status: string;
    isLiveTask: boolean;
  };
  onConfirm: (deleteFile: boolean) => void;
  onCancel: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  task,
  onConfirm,
  onCancel
}) => {
  const { t } = useUI();
  const [deleteFile, setDeleteFile] = useState(false);

  return (
    <DialogWrapper
      isOpen={true}
      onClose={onCancel}
      title={t('confirmDelete')}
      className="max-w-sm"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 bg-red-500/20 rounded-lg">
          <AlertTriangle size={24} className="text-red-500" />
        </div>
        <div>
          <p className="text-zinc-700 dark:text-zinc-300">
            {t('confirmDeleteTask')} <span className="font-semibold text-zinc-900 dark:text-zinc-100">{task.fileName}</span>?
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3 mb-6">
        <div className="bg-zinc-100 dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg p-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">{t('fileLocation')}</p>
          <p className="text-sm text-zinc-900 dark:text-zinc-100 break-all font-mono">
            {task.filePath || '-'}
          </p>
        </div>

        <label className="flex items-center gap-3 cursor-pointer p-3 bg-red-500/10 border border-red-500/40 rounded-lg hover:bg-red-500/15 transition-all">
          <CheckboxWrapper
            checked={deleteFile}
            onChange={setDeleteFile}
            accent="red"
          />
          <span className="text-red-500 dark:text-red-400 font-medium">{t('deleteFile')}</span>
        </label>
      </div>

      <div className="flex items-center gap-3 mt-6">
        <button
          onClick={() => onConfirm(deleteFile)}
          className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-red-500/30"
        >
          {t('confirmDeleteBtn')}
        </button>
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 rounded-lg text-zinc-700 dark:text-zinc-300 font-semibold transition-all duration-200"
        >
          {t('cancel')}
        </button>
      </div>
    </DialogWrapper>
  );
};
