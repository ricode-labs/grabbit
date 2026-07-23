import React from 'react';
import { List, Settings, Trash2 } from 'lucide-react';
import { useUI } from '../context/UIContext';
import faviconUrl from '../assets/favicon.webp';
import logoUrl from '../assets/logo.svg';
import sidebarBgUrl from '../assets/sidebar-bg.webp';

export type CategoryType = 'downloading' | 'completed' | 'paused' | 'all' | 'deleted';

interface SidebarProps {
  currentCategory: CategoryType;
  currentView: 'list' | 'detail' | 'settings';
  onCategoryChange: (category: CategoryType) => void;
  onSettingsClick: () => void;
  categoryUpdates: {
    downloading: number;
    completed: number;
    paused: number;
    all: number;
    deleted: number;
  };
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentCategory,
  currentView,
  onCategoryChange,
  onSettingsClick,
  categoryUpdates
}) => {
  const { t } = useUI();

  const categories = [
    {
      id: 'downloading' as CategoryType,
      label: t('downloading'),
      icon: null,
      count: categoryUpdates.downloading,
    },
    {
      id: 'completed' as CategoryType,
      label: t('completed'),
      icon: null,
      count: categoryUpdates.completed,
    },
    {
      id: 'paused' as CategoryType,
      label: t('paused'),
      icon: null,
      count: categoryUpdates.paused,
    },
    {
      id: 'all' as CategoryType,
      label: t('allTasks'),
      icon: List,
      count: categoryUpdates.all,
    },
    {
      id: 'deleted' as CategoryType,
      label: t('trash'),
      icon: Trash2,
      count: categoryUpdates.deleted,
    }
  ];

  const activeStyle = 'bg-[#FFE6EC] text-[#FF5C78] shadow-[0_10px_22px_rgba(255,124,148,0.18)] border-[#FFD5DE]';
  const inactiveStyle = 'text-[#6B5448] hover:bg-[#FFF1F4] hover:text-[#FF5C78] border-transparent';

  return (
    <aside className="flex h-full w-[208px] flex-shrink-0 flex-col border-r border-[#F2DED6] bg-[#FFFBF8]/95">
      <div className="flex h-[104px] items-center gap-3 px-7">
        <div className="flex h-16 w-16 items-center justify-center">
          <img src={logoUrl} alt="Grabbit" className="h-16 w-16 object-contain" />
        </div>
        <span className="text-[28px] font-semibold leading-none text-[#6B5448]">grabbit</span>
      </div>

      <div className="flex-1 space-y-4 overflow-hidden px-5 py-1">
        {categories.map(category => {
          const Icon = category.icon;
          const isActive = (currentView === 'list' || currentView === 'detail') && currentCategory === category.id;

          return (
            <button
              key={category.id}
              onClick={() => onCategoryChange(category.id)}
              className={`relative flex h-11 w-full items-center gap-4 rounded-[16px] border px-4 text-[15px] font-medium transition-all duration-200 ${
                isActive ? activeStyle : inactiveStyle
              }`}
            >
              {Icon ? (
                <Icon size={20} strokeWidth={1.8} className="flex-shrink-0 text-[#8B6A5D]" />
              ) : (
                <img src={faviconUrl} alt="" className="h-[26px] w-[26px] flex-shrink-0 object-contain" />
              )}
              <span className="min-w-0 flex-1 whitespace-nowrap text-left">{category.label}</span>
              {category.count > 0 && (
                <span className={`ml-auto flex min-w-[20px] justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold ${
                  isActive ? 'bg-[#FF89A0] text-white' : 'bg-[#F3ECE7] text-[#9B857A]'
                }`}>
                  {category.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div
        className="mx-7 mb-8 h-[118px] bg-contain bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${sidebarBgUrl})` }}
        aria-hidden="true"
      />

      <div className="px-5 pb-5">
        <button
          onClick={onSettingsClick}
          className={`flex h-11 w-full items-center gap-4 rounded-[16px] border px-4 text-[15px] font-medium transition-all duration-200 ${
            currentView === 'settings' ? activeStyle : inactiveStyle
          }`}
        >
          <Settings size={20} strokeWidth={1.8} className="flex-shrink-0 text-[#8B6A5D]" />
          <span className="whitespace-nowrap">{t('settings')}</span>
        </button>
      </div>
    </aside>
  );
};
