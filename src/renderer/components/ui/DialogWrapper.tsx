import React, { useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X } from 'lucide-react';

interface DialogWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

export const DialogWrapper: React.FC<DialogWrapperProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className = 'max-w-xl',
  showCloseButton = true
}) => {
  // 当弹窗打开时，禁止 body 滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={React.Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={React.Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel
                className={`w-full ${className} transform bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-2xl transition-all overflow-hidden`}
              >
                {(title || showCloseButton) && (
                  <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 flex-shrink-0">
                    <Dialog.Title className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                      {title}
                    </Dialog.Title>
                    {showCloseButton && (
                      <button
                        onClick={onClose}
                        className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                )}
                {description && (
                  <Dialog.Description className="px-4 pt-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {description}
                  </Dialog.Description>
                )}
                <div className={`p-4 flex-1 flex flex-col overflow-hidden ${description ? "pt-2" : ""}`}>
                  {children}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};
