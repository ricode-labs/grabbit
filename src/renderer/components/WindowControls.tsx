import React, { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { useUI } from '../context/UIContext';

export const WindowControls: React.FC = () => {
  const { t } = useUI();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    const checkMaximized = async () => {
      const maximized = await window.electronAPI.isMaximized();
      setIsMaximized(maximized);
    };
    checkMaximized();
  }, []);

  const handleMinimize = async () => {
    await window.grabbit.minimizeWindow();
  };

  const handleMaximize = async () => {
    await window.grabbit.maximizeWindow();
    const maximized = await window.electronAPI.isMaximized();
    setIsMaximized(maximized);
  };

  const handleClose = async () => {
    await window.grabbit.closeWindow();
  };

  return (
    <div className="flex items-center gap-4 px-5 py-3" style={{ WebkitAppRegion: 'no-drag' } as any}>
      <button
        onClick={handleMinimize}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
        title={t('minimize')}
      >
        <Minus size={15} strokeWidth={2.2} />
      </button>
      <button
        onClick={handleMaximize}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
        title={isMaximized ? t('restore') : t('maximize')}
      >
        <Square size={14} strokeWidth={2.1} />
      </button>
      <button
        onClick={handleClose}
        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-md text-[#2D2522] transition-colors hover:bg-[#FFE4E4] hover:text-[#E85C61]"
        title={t('close')}
      >
        <X size={16} strokeWidth={2.1} />
      </button>
    </div>
  );
};
