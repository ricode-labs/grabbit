import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TitleBar } from './components/TitleBar';
import { StatusBar } from './components/StatusBar';
import { DownloadPage, SettingsPage } from './pages';
import type { CategoryType } from './components/DownloadList';
import { NoticeModal } from './components';
import { useUI } from './context/UIContext';
import {
  useDownloads,
  useAria2Status,
  useSettings,
  useHistory,
  useGlobalStat
} from './hooks';
import type {
  AddTorrentPayload,
  AddUriPayload,
  Aria2GlobalStat,
  Aria2Status,
  GidPayload,
  Language,
  Options,
  Preferences,
  TellRangePayload,
  Theme
} from '../shared/types';

interface ElectronAPI {
  getAria2Status: () => Promise<{ connected: boolean; message: string }>;
  reconnectAria2: () => Promise<{ success: boolean; message: string }>;
  addDownload: (url: string, options: any) => Promise<string>;
  pauseDownload: (gid: string) => Promise<string>;
  resumeDownload: (gid: string) => Promise<string>;
  removeDownload: (gid: string) => Promise<string>;
  getDownloads: () => Promise<any>;
  getGlobalStat: () => Promise<any>;
  setGlobalSpeedLimit: (downloadLimit: number, uploadLimit: number) => Promise<void>;
  getHistory: () => Promise<any[]>;
  removeFromHistory: (gid: string) => Promise<void>;
  deleteDownloadFile: (filePath: string) => Promise<any>;
  updateSettings: (settings: any) => Promise<any>;
  getUISettings: () => Promise<{ theme: Theme; language: Language }>;
  updateUISettings: (settings: any) => Promise<any>;
  selectFolder: () => Promise<string | null>;
  selectTorrentFile: () => Promise<string | null>;
  getClipboardText: () => Promise<string>;
  getTorrentInfo: (torrentPath: string) => Promise<any>;
  getDownloadMetadata: (url: string) => Promise<any>;
  getDiskSpace: (dir: string) => Promise<any>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
  isMaximized: () => Promise<boolean>;
}

interface Aria2API {
  addUri: (payload: AddUriPayload) => Promise<string>;
  addTorrent: (payload: AddTorrentPayload) => Promise<string>;
  remove: (payload: GidPayload) => Promise<string>;
  removeDownloadResult: (payload: GidPayload) => Promise<'OK'>;
  pause: (payload: GidPayload) => Promise<string>;
  unpause: (payload: GidPayload) => Promise<string>;
  tellStatus: (payload: GidPayload) => Promise<Aria2Status>;
  tellActive: (keys?: string[]) => Promise<Aria2Status[]>;
  tellWaiting: (payload: TellRangePayload) => Promise<Aria2Status[]>;
  tellStopped: (payload: TellRangePayload) => Promise<Aria2Status[]>;
  getGlobalOption: () => Promise<Options>;
  getGlobalStat: () => Promise<Aria2GlobalStat>;
  changeGlobalOption: (payload: Options) => Promise<'OK'>;
}

interface GrabbitAPI {
  getPreferences: () => Promise<Preferences>;
  minimizeWindow: () => Promise<void>;
  maximizeWindow: () => Promise<void>;
  closeWindow: () => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    aria2: Aria2API;
    grabbit: GrabbitAPI;
  }
}

type ViewType = 'list' | 'detail' | 'settings';
type CategoryUpdates = Record<CategoryType, number>;
type NoticeState = {
  message: string;
  variant?: 'info' | 'success' | 'error';
  title?: string;
  onConfirm?: () => void;
};

const App: React.FC = () => {
  const { t } = useUI();

  // 业务逻辑 Hooks
  const { downloads, refreshDownloads } = useDownloads();
  const { globalStat, refreshGlobalStat } = useGlobalStat();
  const { aria2Status, checkAria2Status } = useAria2Status();
  const { settings, loadSettings } = useSettings();
  const { historyTasks, refreshHistory, isLoaded: isHistoryLoaded } = useHistory();

  // UI 状态
  const [currentCategory, setCurrentCategory] = useState<CategoryType>('downloading');
  const [currentView, setCurrentView] = useState<ViewType>('list');
  const [selectedTaskGid, setSelectedTaskGid] = useState<string | null>(null);
  const [deleteConfirmTask, setDeleteConfirmTask] = useState<any | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [clipboardUrl, setClipboardUrl] = useState('');
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [categoryUpdates, setCategoryUpdates] = useState<CategoryUpdates>({
    downloading: 0,
    completed: 0,
    paused: 0,
    all: 0,
    deleted: 0
  });
  const previousCompletedIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!isHistoryLoaded) return;

    const completedIds = new Set(
      historyTasks
        .filter(task => task.status === 'complete' && task.gid)
        .map(task => task.gid)
    );

    if (previousCompletedIds.current === null) {
      previousCompletedIds.current = completedIds;
      return;
    }

    let newlyCompletedCount = 0;
    completedIds.forEach(gid => {
      if (!previousCompletedIds.current?.has(gid)) {
        newlyCompletedCount += 1;
      }
    });

    if (newlyCompletedCount > 0) {
      setCategoryUpdates(previous => ({
        ...previous,
        completed: previous.completed + newlyCompletedCount
      }));
    }

    previousCompletedIds.current = completedIds;
  }, [historyTasks, isHistoryLoaded]);

  // 检测剪切板中的可下载链接
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await window.electronAPI.getClipboardText();
        if (text && isDownloadableLink(text) && text !== clipboardUrl) {
          setClipboardUrl(text);
          setShowAddModal(true);
        }
      } catch (error) {
        console.error('Failed to check clipboard:', error);
      }
    };

    // 每 3 秒检查一次剪切板
    const clipboardInterval = setInterval(checkClipboard, 3000);

    return () => clearInterval(clipboardInterval);
  }, [clipboardUrl]);

  const isDownloadableLink = (text: string): boolean => {
    const text_trimmed = text.trim();
    return /^(https?:\/\/|magnet:|ftp:\/\/)/.test(text_trimmed) && text_trimmed.length > 10;
  };

  useEffect(() => {
    let mounted = true;
    let retryCount = 0;
    const maxRetries = 30;

    const initializeApp = async () => {
      // 加载设置
      await loadSettings();

      // 等待 aria2 连接
      while (mounted && retryCount < maxRetries) {
        const connected = await checkAria2Status();
        if (connected) {
          break;
        }
        retryCount++;
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      if (mounted) {
        refreshDownloads();
        refreshGlobalStat();
        refreshHistory();

        const interval = setInterval(() => {
          if (mounted) {
            checkAria2Status();
            refreshDownloads();
            refreshGlobalStat();
            refreshHistory();
          }
        }, 1000);

        return () => {
          clearInterval(interval);
        };
      }
    };

    const cleanupPromise = initializeApp();

    return () => {
      mounted = false;
      cleanupPromise.then(cleanup => cleanup?.());
    };
  }, [loadSettings, checkAria2Status, refreshDownloads, refreshGlobalStat, refreshHistory]);

  const handleAddDownload = async (url: string, options: any) => {
    try {
      if (/\.torrent(?:$|[?#])/i.test(url)) {
        await window.aria2.addTorrent({ torrentPath: url, options });
      } else {
        await window.aria2.addUri({
          uris: url.trim().split(/\s+/),
          options
        });
      }
      await refreshDownloads();
      await refreshHistory();
      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add download:', error);
      setNotice({
        title: t('noticeTitle'),
        message: `${t('failedToAddDownload')}: ${error}`,
        variant: 'error'
      });
    }
  };

  const handlePause = async (gid: string) => {
    try {
      await window.aria2.pause({ gid });
      await refreshDownloads();
    } catch (error) {
      console.error('Failed to pause download:', error);
    }
  };

  const handleResume = async (gid: string) => {
    try {
      await window.aria2.unpause({ gid });
      await refreshDownloads();
    } catch (error) {
      console.error('Failed to resume download:', error);
    }
  };

  const handleRemove = async (gid: string) => {
    try {
      // 查找任务
      const allTasks = [...downloads.active, ...downloads.waiting, ...downloads.stopped];
      const task = allTasks.find(t => t.gid === gid) || historyTasks.find(t => t.gid === gid);

      if (!task) return;

      const fileName = task.files?.[0]?.path?.split('/').pop() || task.fileName || t('unknown');
      const filePath = task.files?.[0]?.path || (
        task.dir && task.fileName ? `${task.dir}/${task.fileName}` : ''
      );

      setDeleteConfirmTask({
        gid: task.gid,
        fileName,
        filePath,
        status: task.status,
        isLiveTask: allTasks.some(item => item.gid === task.gid)
      });
    } catch (error) {
      console.error('Failed to prepare task deletion:', error);
    }
  };

  const handleDeleteConfirm = async (deleteFile: boolean) => {
    if (!deleteConfirmTask) return;

    try {
      // 删除本地文件
      if (deleteFile && deleteConfirmTask.filePath) {
        const result = await window.electronAPI.deleteDownloadFile(deleteConfirmTask.filePath);
        if (!result.success) {
          if (result.error === 'File not found') {
            setNotice({
              title: t('noticeTitle'),
              message: t('fileNotFound'),
              variant: 'error'
            });
          } else {
            console.error('Failed to delete file:', result.error);
            setNotice({
              title: t('noticeTitle'),
              message: `${t('deleteFileFailed')}: ${result.error}`,
              variant: 'error'
            });
          }
        }
      }

      // 只对仍在 aria2 中的任务调用移除接口，已结束或历史任务只清理历史记录
      if (deleteConfirmTask.isLiveTask && ['active', 'waiting', 'paused'].includes(deleteConfirmTask.status)) {
        await window.aria2.remove({ gid: deleteConfirmTask.gid });
      }

      // 删除任务记录
      if (!['active', 'waiting', 'paused'].includes(deleteConfirmTask.status)) {
        await window.aria2.removeDownloadResult({ gid: deleteConfirmTask.gid });
      }
      await refreshDownloads();
      await refreshHistory();

      // 如果删除的是当前选中的任务，返回列表
      if (selectedTaskGid === deleteConfirmTask.gid) {
        setCurrentView('list');
        setSelectedTaskGid(null);
      }

      setDeleteConfirmTask(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
      setNotice({
        title: t('noticeTitle'),
        message: `${t('deleteTaskFailed')}: ${error}`,
        variant: 'error'
      });
    }
  };

  const handleSelectTask = (gid: string) => {
    setSelectedTaskGid(gid);
  };

  const handleBackToList = () => {
    setCurrentView('list');
    setSelectedTaskGid(null);
  };

  const handleShowSettings = () => {
    setSelectedTaskGid(null);
    setCurrentView('settings');
  };

  const handleBackFromSettings = () => {
    setCurrentView('list');
    loadSettings(); // 重新加载设置
  };

  return (
    <div className="app-window flex h-screen flex-col overflow-hidden bg-[#FFF8F7] text-[#2D2522]">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          currentCategory={currentCategory}
          currentView={currentView}
          onCategoryChange={(c) => {
            setCurrentView('list')
            setSelectedTaskGid(null)
            setCurrentCategory(c)
            setCategoryUpdates(previous => ({
              ...previous,
              [c]: 0
            }))
          }}
          onSettingsClick={handleShowSettings}
          categoryUpdates={categoryUpdates}
        />

        <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#FFF8F7] pt-[67px]">
          <main className="flex flex-1 flex-col overflow-hidden px-5">
            {currentView === 'settings' ? (
              <SettingsPage onBack={handleBackFromSettings} />
            ) : (
              <DownloadPage
                downloads={downloads}
                historyTasks={historyTasks}
                globalStat={globalStat}
                aria2Status={aria2Status}
                settings={settings}
                currentCategory={currentCategory}
                selectedTaskGid={selectedTaskGid}
                deleteConfirmTask={deleteConfirmTask}
                initialModalOpen={showAddModal}
                initialModalUrl={clipboardUrl}
                onCategoryChange={setCurrentCategory}
                onSelectTask={handleSelectTask}
                onBackToList={handleBackToList}
                onPause={handlePause}
                onResume={handleResume}
                onRemove={handleRemove}
                onAddDownload={handleAddDownload}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setDeleteConfirmTask(null)}
                onModalClose={() => {
                  setShowAddModal(false);
                  setClipboardUrl('');
                }}
              />
            )}
          </main>

          {currentView === 'list' && (
            <div className="px-5 pb-4 pt-4">
              <StatusBar globalStat={globalStat} />
            </div>
          )}
        </div>
      </div>

      {notice && (
        <NoticeModal
          isOpen={true}
          title={notice.title}
          message={notice.message}
          variant={notice.variant}
          onClose={() => setNotice(null)}
          onConfirm={() => notice.onConfirm?.()}
        />
      )}
    </div>
  );
};

export default App;
