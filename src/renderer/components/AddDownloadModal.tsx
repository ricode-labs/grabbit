import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  FileSearch,
  FolderOpen,
  HardDrive,
  Link as LinkIcon,
  Loader2,
  Radio,
  X
} from 'lucide-react';
import { extractFileNameFromUrl, formatBytes } from '../utils/format';
import { useUI } from '../context/UIContext';
import { DialogWrapper } from './ui/DialogWrapper';
import { CheckboxWrapper } from './ui/CheckboxWrapper';
import { TooltipWrapper } from './ui/TooltipWrapper';

interface FileNode {
  name: string;
  selected: boolean;
  children?: FileNode[];
  isExpanded?: boolean;
  index?: string; // aria2 文件索引
  isFile?: boolean;
}

interface AddDownloadModalProps {
  defaultDownloadDir: string;
  lastUsedDir?: string;
  initialUrl?: string;
  onAdd: (url: string, options: any) => void;
  onClose: () => void;
  onDirChange?: (dir: string) => void;
}

interface DownloadMetadata {
  fileName: string;
  totalLength: number;
  contentType?: string;
  acceptRanges?: boolean;
  finalUrl?: string;
  statusCode?: number;
}

interface DiskSpaceInfo {
  available: number;
  total: number;
  path?: string;
}

export const AddDownloadModal: React.FC<AddDownloadModalProps> = ({
  defaultDownloadDir,
  lastUsedDir,
  initialUrl = '',
  onAdd,
  onClose,
  onDirChange
}) => {
  const { t } = useUI();
  const [inputMode, setInputMode] = useState<'link' | 'file'>('link');
  const [url, setUrl] = useState(initialUrl);
  const [fileName, setFileName] = useState('');
  const [downloadDir, setDownloadDir] = useState(lastUsedDir || defaultDownloadDir);
  const [files, setFiles] = useState<FileNode[]>([]);
  const [showFileTree, setShowFileTree] = useState(false);
  const [torrentFile, setTorrentFile] = useState<string>('');
  const [isMultiFile, setIsMultiFile] = useState(false);
  const [torrentName, setTorrentName] = useState('');
  const [createFolder, setCreateFolder] = useState(true);
  const [torrentSize, setTorrentSize] = useState(0);
  const [metadata, setMetadata] = useState<DownloadMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [metadataError, setMetadataError] = useState('');
  const [diskSpace, setDiskSpace] = useState<DiskSpaceInfo | null>(null);
  const [isCheckingSpace, setIsCheckingSpace] = useState(false);

  const isUsingDefaultDir = downloadDir === defaultDownloadDir;
  const hasDownloadData = Boolean(url.trim() || torrentFile);

  // 初始化时读取剪切板
  useEffect(() => {
    const loadClipboard = async () => {
      if (!initialUrl) {
        try {
          const text = await window.electronAPI.getClipboardText();
          // 检查是否为可下载的链接
          if (isDownloadableLink(text)) {
            setUrl(text);
          }
        } catch (error) {
          console.error('Failed to read clipboard:', error);
        }
      }
    };
    loadClipboard();
  }, [initialUrl]);

  // 当 URL 改变时自动提取文件名
  useEffect(() => {
    if (url.trim()) {
      const extracted = extractFileNameFromUrl(url.trim());
      setFileName(extracted);
    } else {
      setMetadata(null);
      setMetadataError('');
    }
  }, [url]);

  useEffect(() => {
    if (inputMode !== 'link' || !isDownloadableLink(url)) return;

    const currentUrl = url.trim();
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setIsLoadingMetadata(true);
      setMetadataError('');
      try {
        const result = await window.electronAPI.getDownloadMetadata(currentUrl);
        if (cancelled) return;
        if (result.success && result.metadata) {
          setMetadata(result.metadata);
          if (result.metadata.fileName) {
            setFileName(result.metadata.fileName);
          }
        } else {
          setMetadata(null);
          setMetadataError(result.error || t('metadataUnavailable'));
        }
      } catch (error: any) {
        if (!cancelled) {
          setMetadata(null);
          setMetadataError(error?.message || t('metadataUnavailable'));
        }
      } finally {
        if (!cancelled) setIsLoadingMetadata(false);
      }
    }, 500);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [inputMode, url]);

  useEffect(() => {
    const expectedSize = metadata?.totalLength || 0;
    if (!downloadDir || expectedSize <= 0) {
      setDiskSpace(null);
      return;
    }

    let cancelled = false;
    const checkSpace = async () => {
      setIsCheckingSpace(true);
      try {
        const result = await window.electronAPI.getDiskSpace(downloadDir);
        if (cancelled) return;
        if (result.success) {
          setDiskSpace({
            available: result.available || 0,
            total: result.total || 0,
            path: result.path
          });
        } else {
          setDiskSpace(null);
        }
      } catch {
        if (!cancelled) setDiskSpace(null);
      } finally {
        if (!cancelled) setIsCheckingSpace(false);
      }
    };

    checkSpace();

    return () => {
      cancelled = true;
    };
  }, [downloadDir, metadata?.totalLength]);

  const hasInsufficientSpace = Boolean(
    (metadata?.totalLength || torrentSize) &&
    diskSpace?.available !== undefined &&
    diskSpace.available > 0 &&
    diskSpace.available < (metadata?.totalLength || torrentSize)
  );

  // 检查是否为可下载的链接
  const isDownloadableLink = (text: string): boolean => {
    const text_trimmed = text.trim();
    return /^(https?:\/\/|magnet:|ftp:\/\/)/.test(text_trimmed);
  };

  // 加载文件树
  const loadFileTree = async (torrentPath: string) => {
    try {
      const result = await window.electronAPI.getTorrentInfo(torrentPath);
      if (result.success && result.info) {
        // 转换后端返回的文件树结构为前端需要的 FileNode 结构
        const convertToFileNodes = (nodes: any[]): FileNode[] => {
          return nodes.map(node => {
            const fileNode: FileNode = {
              name: node.name,
              selected: node.selected !== undefined ? node.selected : true,
              isExpanded: node.isExpanded,
              index: node.index,
              isFile: node.isFile
            };

            if (node.children && node.children.length > 0) {
              fileNode.children = convertToFileNodes(node.children);
            }

            return fileNode;
          });
        };

        const fileNodes = convertToFileNodes(result.info.files);
        setFiles(fileNodes);
        setShowFileTree(fileNodes.length > 0);

        // 设置种子名称和是否多文件
        setTorrentName(result.info.name);
        setIsMultiFile(result.info.isMultiFile || false);
        setTorrentSize(result.info.totalSize || 0);

        // 如果是多文件，自动将文件名设置为种子名称（文件夹名）
        if (result.info.isMultiFile) {
          setFileName(result.info.name);
        }
      } else {
        console.warn('Failed to get torrent info:', result.error);
      }
    } catch (error) {
      console.error('Failed to load file tree:', error);
    }
  };

  // 切换文件选择状态
  const toggleFileSelection = (index: number, parentIndex?: number) => {
    setFiles(prevFiles => {
      const newFiles = JSON.parse(JSON.stringify(prevFiles)); // 深拷贝

      // 递归更新子节点的选中状态
      const updateChildren = (node: FileNode, selected: boolean) => {
        node.selected = selected;
        if (node.children) {
          node.children.forEach(child => updateChildren(child, selected));
        }
      };

      let targetNode: FileNode;
      if (parentIndex !== undefined && newFiles[parentIndex]?.children) {
        targetNode = newFiles[parentIndex].children[index];
      } else {
        targetNode = newFiles[index];
      }

      const newSelected = !targetNode.selected;
      updateChildren(targetNode, newSelected);

      return newFiles;
    });
  };

  // 切换文件夹展开状态
  const toggleExpandFolder = (index: number) => {
    setFiles(prevFiles => {
      const newFiles = JSON.parse(JSON.stringify(prevFiles)); // 深拷贝
      if (newFiles[index].children) {
        newFiles[index].isExpanded = !newFiles[index].isExpanded;
      }
      return newFiles;
    });
  };

  // 全选所有文件
  const selectAllFiles = () => {
    setFiles(prevFiles => {
      const updateSelection = (fileList: FileNode[]): FileNode[] => {
        return fileList.map(file => ({
          ...file,
          selected: true,
          children: file.children ? updateSelection(file.children) : undefined
        }));
      };
      return updateSelection(prevFiles);
    });
  };

  // 取消选择所有文件
  const deselectAllFiles = () => {
    setFiles(prevFiles => {
      const updateSelection = (fileList: FileNode[]): FileNode[] => {
        return fileList.map(file => ({
          ...file,
          selected: false,
          children: file.children ? updateSelection(file.children) : undefined
        }));
      };
      return updateSelection(prevFiles);
    });
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setDownloadDir(folder);
        onDirChange?.(folder);
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleUseDefaultDir = () => {
    setDownloadDir(defaultDownloadDir);
    onDirChange?.(defaultDownloadDir);
  };

  const handleOpenTorrentFile = async () => {
    try {
      const filePath = await window.electronAPI.selectTorrentFile();
      if (filePath) {
        setTorrentFile(filePath);
        // 从文件路径提取文件名
        const name = filePath.split(/[\\/]/).pop() || '';
        setFileName(name.replace('.torrent', ''));
        // 尝试加载文件树
        await loadFileTree(filePath);
      }
    } catch (error) {
      console.error('Failed to open torrent file:', error);
    }
  };

  const handleInputModeChange = (mode: 'link' | 'file') => {
    setInputMode(mode);
    // 切换模式时清空对应的输入
    if (mode === 'link') {
      setTorrentFile('');
    } else {
      setUrl('');
    }
    setFileName('');
    setFiles([]);
    setShowFileTree(false);
    setIsMultiFile(false);
    setTorrentName('');
    setCreateFolder(true);
    setTorrentSize(0);
    setMetadata(null);
    setMetadataError('');
    setDiskSpace(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const source = inputMode === 'link' ? url.trim() : torrentFile;
    if (source) {
      const options: any = {};

      // 处理下载目录
      if (isMultiFile && createFolder) {
        // 多文件种子且需要创建文件夹，直接使用选择的目录
        // aria2 会自动在这个目录下创建以 torrent 名称命名的文件夹
        options.dir = downloadDir;
      } else if (isMultiFile && !createFolder) {
        // 多文件种子但不创建新文件夹，需要手动拼接路径
        // 用户选择的路径应该已经包含了最终的目标文件夹
        options.dir = downloadDir;
      } else {
        // 单文件下载
        options.dir = downloadDir;
      }

      // 设置文件名（仅对单文件有效）
      if (fileName.trim() && !isMultiFile) {
        options.out = fileName.trim();
      }

      // 如果有文件树和选中的文件，添加到选项中
      if (showFileTree && files.length > 0) {
        const selectedIndices = getSelectedFileIndices();
        if (selectedIndices.length > 0) {
          // aria2 的 select-file 选项需要逗号分隔的文件索引
          options['select-file'] = selectedIndices.join(',');
        }
      }

      onAdd(source, options);
    }
  };

  // 获取选中的文件索引列表
  const getSelectedFileIndices = (): string[] => {
    const selected: string[] = [];

    const traverse = (fileList: FileNode[]) => {
      fileList.forEach(file => {
        // 只收集叶子节点（实际文件）的索引
        if (file.selected && file.isFile && file.index !== undefined) {
          selected.push(file.index);
        }
        if (file.children) {
          traverse(file.children);
        }
      });
    };

    traverse(files);
    return selected;
  };

  // 渲染文件树节点
  const renderFileNode = (file: FileNode, index: number, parentIndex?: number) => {
    const isFolder = file.children && file.children.length > 0;
    const level = parentIndex !== undefined ? 2 : 1;

    return (
      <div key={`${parentIndex}-${index}`} className={`ml-${level * 4}`}>
        <div className="flex items-center gap-2 rounded-[10px] p-1.5 hover:bg-[#FFF1F4]">
          {isFolder && (
            <button
              type="button"
              onClick={() => toggleExpandFolder(index)}
              className="rounded p-0 text-[#8B6A5D] hover:bg-[#F7E8E3]"
            >
              {file.isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
          {!isFolder && <div className="w-4" />}

          <CheckboxWrapper
            checked={file.selected}
            onChange={() => toggleFileSelection(index, parentIndex)}
          />
          <TooltipWrapper content={file.name}>
            <span className="truncate text-sm text-[#6B5448]">
              {file.name}
            </span>
          </TooltipWrapper>
        </div>

        {isFolder && file.isExpanded && file.children && (
          <div className="ml-6">
            {file.children.map((child, childIndex) =>
              renderFileNode(child, childIndex, index)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <DialogWrapper
      isOpen={true}
      onClose={onClose}
      title=""
      showCloseButton={false}
      className="max-w-[880px] h-[86vh] max-h-[820px] flex flex-col rounded-[22px] border border-[#F1DDD4] bg-[#FFFBF8]"
    >
      <div className="flex h-full flex-col">
        <header className="flex items-center justify-between border-b border-[#F4E3DE] px-6 py-4">
          <div>
            <h2 className="text-[20px] font-semibold text-[#2D2522]">{t('newTask')}</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-[#8B6A5D] hover:bg-[#FFF1F4] hover:text-[#FF5C78]"
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.05fr)_320px] gap-4 px-6 py-5">
            <div className="min-h-0 space-y-4 overflow-y-auto pr-1">
              <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                <label className="mb-2 block text-[13px] font-medium text-[#6B5448]">
                  {t('selectInputMethod')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleInputModeChange('link')}
                    className={`flex items-center justify-center gap-2 rounded-[14px] border px-4 py-2.5 text-[13px] font-medium transition-all ${
                      inputMode === 'link'
                        ? 'border-[#FFC3CF] bg-[#FFF1F4] text-[#FF5C78]'
                        : 'border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]'
                    }`}
                  >
                    <Clipboard size={15} />
                    {t('pasteLink')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInputModeChange('file')}
                    className={`flex items-center justify-center gap-2 rounded-[14px] border px-4 py-2.5 text-[13px] font-medium transition-all ${
                      inputMode === 'file'
                        ? 'border-[#FFC3CF] bg-[#FFF1F4] text-[#FF5C78]'
                        : 'border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]'
                    }`}
                  >
                    <FolderOpen size={15} />
                    {t('openTorrentFile')}
                  </button>
                </div>
              </section>

              {inputMode === 'link' && (
                <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                    <LinkIcon size={15} />
                    {t('downloadLink')}
                  </div>
                  <textarea
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder={t('linkPlaceholder')}
                    autoFocus
                    rows={4}
                    className="w-full rounded-[14px] border border-[#F0DED8] bg-[#FFFCFB] px-3 py-3 text-[13px] text-[#2D2522] placeholder:text-[#B7A59C] focus:border-[#FFC3CF] focus:outline-none focus:ring-4 focus:ring-[#FFE6EC] resize-none"
                  />

                  {(metadata || isLoadingMetadata || metadataError) && (
                  <div className="mt-3 rounded-[14px] border border-[#F4E3DE] bg-[#FFF8F7] p-3">
                    <div className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#6B5448]">
                      <FileSearch size={14} />
                      {t('metadata')}
                      {isLoadingMetadata && <Loader2 size={14} className="animate-spin text-[#FF5C78]" />}
                    </div>
                    {metadata ? (
                      <div className="space-y-2 text-[12px] text-[#7A6257]">
                        <div className="flex items-start justify-between gap-3">
                          <span>{t('fileName')}</span>
                          <span className="max-w-[72%] break-words text-right text-[#2D2522]">{metadata.fileName}</span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span>{t('fileSize')}</span>
                          <span className="text-right text-[#2D2522]">
                            {metadata.totalLength ? formatBytes(metadata.totalLength) : '-'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span>{t('contentType')}</span>
                          <span className="max-w-[72%] break-words text-right text-[#2D2522]">
                            {metadata.contentType || '-'}
                          </span>
                        </div>
                        <div className="flex items-start justify-between gap-3">
                          <span>{t('supportsResume')}</span>
                          <span className="text-right text-[#2D2522]">
                            {metadata.acceptRanges ? t('supported') : t('unknown')}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[12px] text-[#A89488]">
                        {metadataError || t('loadingFileInfo')}
                      </div>
                    )}
                  </div>
                  )}
                </section>
              )}

              {inputMode === 'file' && (
                <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                  <div className="mb-2 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                    <FolderOpen size={15} />
                    {t('torrentFile')}
                  </div>
                  <button
                    type="button"
                    onClick={handleOpenTorrentFile}
                    className="w-full rounded-[14px] border border-[#F0DED8] bg-[#FFFCFB] px-3 py-2.5 text-left text-[13px] font-medium text-[#FF5C78] transition-all hover:bg-[#FFF1F4]"
                  >
                    {torrentFile || t('selectTorrentFile')}
                  </button>
                  {torrentName && (
                    <div className="mt-3 rounded-[14px] border border-[#F4E3DE] bg-[#FFF8F7] p-3 text-[12px] text-[#7A6257]">
                      <div className="flex items-center justify-between gap-3">
                        <span>{t('torrentName')}</span>
                        <span className="max-w-[72%] break-words text-right text-[#2D2522]">{torrentName}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-3">
                        <span>{t('totalSize')}</span>
                        <span className="text-right text-[#2D2522]">{torrentSize ? formatBytes(torrentSize) : '-'}</span>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {hasDownloadData && (
                <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-[13px] font-medium text-[#6B5448]">
                      {isMultiFile ? t('folderName') : t('fileName')}
                    </label>
                    {isMultiFile && (
                      <span className="rounded-full bg-[#FFF1F4] px-2 py-0.5 text-[11px] font-medium text-[#FF5C78]">
                        {t('multiFile')}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    value={fileName}
                    onChange={e => setFileName(e.target.value)}
                    placeholder={t('autoExtract')}
                    disabled={isMultiFile}
                    className="w-full rounded-[14px] border border-[#F0DED8] bg-[#FFFCFB] px-3 py-2.5 text-[13px] text-[#2D2522] placeholder:text-[#B7A59C] focus:border-[#FFC3CF] focus:outline-none focus:ring-4 focus:ring-[#FFE6EC] disabled:cursor-not-allowed disabled:opacity-60"
                  />

                  {isMultiFile && (
                    <div className="mt-3 flex items-start gap-2">
                      <CheckboxWrapper
                        checked={createFolder}
                        onChange={() => setCreateFolder(!createFolder)}
                      />
                      <div className="min-w-0 flex-1">
                        <label
                          className="cursor-pointer text-[13px] font-medium text-[#6B5448]"
                          onClick={() => setCreateFolder(!createFolder)}
                        >
                          {t('createNewFolder')}
                        </label>
                        <p className="mt-0.5 text-[12px] text-[#A89488]">
                          {t('createFolderHint')}
                        </p>
                      </div>
                    </div>
                  )}
                </section>
              )}

              <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <label className="text-[13px] font-medium text-[#6B5448]">
                      {t('downloadTo')}
                    </label>
                    {!isUsingDefaultDir && (
                      <span className="ml-2 text-[11px] text-[#A89488]">{t('lastUsedLocation')}</span>
                    )}
                  </div>
                  {!isUsingDefaultDir && (
                    <button
                      type="button"
                      onClick={handleUseDefaultDir}
                      className="rounded-full bg-[#FFF1F4] px-3 py-1 text-[11px] font-medium text-[#FF5C78] hover:bg-[#FFE6EC]"
                    >
                      {t('useDefaultPath')}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  className="flex w-full items-center justify-between gap-3 rounded-[14px] border border-[#F0DED8] bg-[#FFFCFB] px-3 py-2.5 text-left text-[13px] font-medium text-[#2D2522] transition-all hover:bg-[#FFF1F4]"
                >
                  <span className="min-w-0 truncate">{downloadDir || t('selectFolder')}</span>
                  <FolderOpen size={15} className="shrink-0 text-[#8B6A5D]" />
                </button>

                {(isCheckingSpace || hasInsufficientSpace) && (
                <div className="mt-3 rounded-[14px] border border-[#F4E3DE] bg-[#FFF8F7] p-3">
                  <div className="flex items-center justify-between gap-3 text-[12px]">
                    <span className="text-[#6B5448]">{t('availableSpace')}</span>
                    <span className="text-[#2D2522]">
                      {isCheckingSpace ? t('checking') : diskSpace ? formatBytes(diskSpace.available) : '-'}
                    </span>
                  </div>
                  {hasInsufficientSpace && (
                    <div className="mt-2 flex items-start gap-2 rounded-[12px] border border-[#FFD8DD] bg-[#FFF0F3] p-2 text-[12px] text-[#E85C61]">
                      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium">{t('insufficientSpace')}</p>
                        <p className="mt-0.5 text-[#C95A64]">
                          {t('insufficientSpaceDetail')
                            .replace('{required}', formatBytes(metadata?.totalLength || torrentSize || 0))
                            .replace('{available}', diskSpace ? formatBytes(diskSpace.available) : '-')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                )}
              </section>

              {showFileTree && files.length > 0 && (
                <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="text-[13px] font-medium text-[#6B5448]">
                      {t('selectFiles')}
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAllFiles}
                        className="rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-medium text-[#FF5C78]"
                      >
                        {t('selectAll')}
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllFiles}
                        className="rounded-full bg-[#FFF1F4] px-2.5 py-1 text-[11px] font-medium text-[#FF5C78]"
                      >
                        {t('deselectAll')}
                      </button>
                    </div>
                  </div>
                  <div className="max-h-40 overflow-y-auto rounded-[14px] border border-[#F4E3DE] bg-[#FFFDFC] p-2">
                    {files.map((file, index) => renderFileNode(file, index))}
                  </div>
                </section>
              )}
            </div>

            <aside className="flex min-h-0 flex-col gap-4 overflow-hidden">
              <section className="rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                  <Radio size={14} />
                  {t('taskSummary')}
                </div>
                <div className="space-y-3 text-[12px]">
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">{t('downloadMethod')}</span>
                    <span className="max-w-[58%] break-words text-right text-[#2D2522]">
                      {inputMode === 'link' ? t('link') : t('torrentFile')}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">{t('fileName')}</span>
                    <span className="max-w-[58%] break-words text-right text-[#2D2522]">
                      {fileName || '-'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">{t('saveDirectory')}</span>
                    <span className="max-w-[58%] break-words text-right text-[#2D2522]">
                      {downloadDir || '-'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[#8B6A5D]">{t('estimatedSize')}</span>
                    <span className="text-right text-[#2D2522]">
                      {formatBytes(metadata?.totalLength || torrentSize || 0)}
                    </span>
                  </div>
                </div>
              </section>

              <section className="min-h-0 flex-1 rounded-[18px] border border-[#F4E3DE] bg-white/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-[13px] font-medium text-[#6B5448]">
                  <HardDrive size={14} />
                  {t('directoryInfo')}
                </div>
                <div className="space-y-2 text-[12px] text-[#7A6257]">
                  <div className="flex items-start justify-between gap-3">
                    <span>{t('currentDirectory')}</span>
                    <span className="max-w-[62%] break-words text-right text-[#2D2522]">{downloadDir || '-'}</span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>{t('spaceStatus')}</span>
                    <span className={`text-right ${hasInsufficientSpace ? 'text-[#E85C61]' : 'text-[#79A45C]'}`}>
                      {hasInsufficientSpace ? t('insufficient') : t('normal')}
                    </span>
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <span>{t('fileTree')}</span>
                    <span className="text-right text-[#2D2522]">
                      {showFileTree ? t('itemCount').replace('{count}', String(files.length)) : '-'}
                    </span>
                  </div>
                </div>
              </section>
            </aside>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-[#F4E3DE] px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-[14px] border border-[#F0DED8] bg-white px-4 py-2.5 text-[13px] font-medium text-[#6B5448] transition-all hover:bg-[#FFF1F4]"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={!hasDownloadData}
              className="rounded-[14px] bg-[#FF7D90] px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-[#FF5C78] disabled:cursor-not-allowed disabled:bg-[#E9DDD8] disabled:text-[#A89488]"
            >
              {t('startDownload')}
            </button>
          </div>
        </form>
      </div>
    </DialogWrapper>
  );
};
