import React from 'react';
import { formatSpeed } from '../utils/format';
import { ChevronDown } from 'lucide-react';
import { useUI } from '../context/UIContext';
import logoUrl from '../assets/logo.svg';

interface StatusBarProps {
  globalStat: any;
}

export const StatusBar: React.FC<StatusBarProps> = ({ globalStat }) => {
  const { t } = useUI();
  const downloadSpeed = parseInt(globalStat.downloadSpeed || '0');
  const uploadSpeed = parseInt(globalStat.uploadSpeed || '0');
  const numActive = parseInt(globalStat.numActive || '0');
  const numWaiting = parseInt(globalStat.numWaiting || '0');

  return (
    <footer className="grid h-[34px] grid-cols-[180px_minmax(0,1fr)_42px] items-center gap-8">
      <div className="flex h-[34px] items-center gap-2 rounded-[12px] border border-[#F2DED6] bg-white/78 px-3 shadow-sm">
        <img src={logoUrl} alt="" className="h-[25px] w-[25px] object-contain" />
        <span className="truncate text-[12px] font-medium text-[#6B5448]">
          {t('statusMessage')}
        </span>
      </div>

      <div className="flex h-[34px] min-w-0 items-center justify-center gap-6 rounded-[12px] border border-[#F2DED6] bg-white/78 px-4 text-[12px] shadow-sm">
        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>{t('downloadSpeed')}:</span>
          <span className="font-semibold text-[#FF5C78]">{formatSpeed(downloadSpeed)}</span>
        </div>

        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>{t('uploadSpeed')}:</span>
          <span className="font-semibold text-[#5AA0D6]">{formatSpeed(uploadSpeed)}</span>
        </div>

        <div className="flex items-center gap-2 text-[#6B5448]">
          <span>{t('active')}:</span>
          <span className="font-semibold text-[#2D2522]">{numActive}</span>
          <span className="text-zinc-300">/</span>
          <span>{numWaiting}</span>
        </div>
      </div>

      <button
        className="flex h-[34px] items-center justify-center gap-1 rounded-[12px] border border-[#F2DED6] bg-white/78 px-2 text-[12px] font-semibold text-[#6B5448] shadow-sm"
        title={t('maxConcurrent')}
      >
        <span>{numActive + numWaiting}</span>
        <ChevronDown size={14} className="text-[#9A8276]" />
      </button>
    </footer>
  );
};
