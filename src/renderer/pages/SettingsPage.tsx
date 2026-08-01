import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useUI } from '../context/UIContext';
import type { Language } from '../i18n/translations';
import { ListboxWrapper } from '../components/ui/ListboxWrapper';
import { TooltipWrapper } from '../components/ui/TooltipWrapper';
import { NoticeModal } from '../components/ui/NoticeModal';
import { mapGlobalOptionsToSettings } from '../utils/settings';

interface Settings {
  maxDownloadSpeed: number;
  maxUploadSpeed: number;
  defaultDownloadDir: string;
}

interface SettingsPageProps {
  onBack: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onBack }) => {
  const { theme, language, setTheme, setLanguage, t } = useUI();

  const [settings, setSettings] = useState<Settings>({
    maxDownloadSpeed: 0,
    maxUploadSpeed: 0,
    defaultDownloadDir: ''
  });

  // 本地UI设置状态（未保存）
  const [localTheme, setLocalTheme] = useState<'light' | 'dark'>(theme);
  const [localLanguage, setLocalLanguage] = useState<Language>(language);

  const [downloadSpeedValue, setDownloadSpeedValue] = useState('0');
  const [downloadSpeedUnit, setDownloadSpeedUnit] = useState<'KB/s' | 'MB/s'>('MB/s');
  const [uploadSpeedValue, setUploadSpeedValue] = useState('0');
  const [uploadSpeedUnit, setUploadSpeedUnit] = useState<'KB/s' | 'MB/s'>('MB/s');
  const [notice, setNotice] = useState<{ message: string; variant?: 'info' | 'success' | 'error'; onConfirm?: () => void } | null>(null);

  useEffect(() => {
    loadSettings();
    // 同步全局UI设置到本地状态
    setLocalTheme(theme);
    setLocalLanguage(language);
  }, [theme, language]);

  const loadSettings = async () => {
    try {
      const loadedSettings = mapGlobalOptionsToSettings(await window.aria2.getGlobalOption());
      setSettings(loadedSettings);

      // 转换速度单位为可读格式
      if (loadedSettings.maxDownloadSpeed === 0) {
        setDownloadSpeedValue('0');
      } else if (loadedSettings.maxDownloadSpeed >= 1024 * 1024) {
        setDownloadSpeedValue((loadedSettings.maxDownloadSpeed / (1024 * 1024)).toString());
        setDownloadSpeedUnit('MB/s');
      } else {
        setDownloadSpeedValue((loadedSettings.maxDownloadSpeed / 1024).toString());
        setDownloadSpeedUnit('KB/s');
      }

      if (loadedSettings.maxUploadSpeed === 0) {
        setUploadSpeedValue('0');
      } else if (loadedSettings.maxUploadSpeed >= 1024 * 1024) {
        setUploadSpeedValue((loadedSettings.maxUploadSpeed / (1024 * 1024)).toString());
        setUploadSpeedUnit('MB/s');
      } else {
        setUploadSpeedValue((loadedSettings.maxUploadSpeed / 1024).toString());
        setUploadSpeedUnit('KB/s');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      // 转换速度单位为 bytes/s
      const downloadSpeed = downloadSpeedValue === '0' ? 0 :
        parseFloat(downloadSpeedValue) * (downloadSpeedUnit === 'MB/s' ? 1024 * 1024 : 1024);
      const uploadSpeed = uploadSpeedValue === '0' ? 0 :
        parseFloat(uploadSpeedValue) * (uploadSpeedUnit === 'MB/s' ? 1024 * 1024 : 1024);

      const newSettings = {
        'max-overall-download-limit': String(downloadSpeed),
        'max-overall-upload-limit': String(uploadSpeed),
        dir: settings.defaultDownloadDir
      };

      await window.electronAPI.updateSettings(newSettings);

      // 保存UI设置
      setTheme(localTheme);
      setLanguage(localLanguage);

      setNotice({
        message: t('settingsSaved'),
        variant: 'success',
        onConfirm: onBack
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      setNotice({
        message: t('saveFailed'),
        variant: 'error'
      });
    }
  };

  const handleSelectFolder = async () => {
    try {
      const folder = await window.electronAPI.selectFolder();
      if (folder) {
        setSettings({ ...settings, defaultDownloadDir: folder });
      }
    } catch (error) {
      console.error('Failed to select folder:', error);
    }
  };

  const handleReset = () => {
    loadSettings();
    // 重置UI设置到全局状态
    setLocalTheme(theme);
    setLocalLanguage(language);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FFF8F7] overflow-hidden">
      {/* Content */}
      <div className='flex-1 overflow-y-auto px-4 pt-0'>
        <div className="mx-auto space-y-3 max-w-4xl">
          {/* Download Settings Section */}
          <div className="rounded-[16px] border border-[#F6D7D3] bg-white/78 p-4 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[#2D2522]">{t('downloadSettings')}</h2>

            {/* Download Speed */}
            <div className="flex items-center justify-between gap-6 mb-4">
              <div className="flex-shrink-0">
                <label className="text-sm font-medium text-[#2D2522]">{t('downloadSpeedLimit')}</label>
                <p className="mt-1 text-xs text-[#8B6A5D]">{t('zeroMeansUnlimited')}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={downloadSpeedValue}
                  onChange={(e) => setDownloadSpeedValue(e.target.value)}
                  className="w-32 rounded-lg border border-[#F0DED8] bg-white px-3 py-2 text-sm text-[#2D2522] placeholder-[#B7A59C] transition-all focus:border-[#FFC3CF] focus:outline-none focus:ring-2 focus:ring-[#FFE6EC]"
                  placeholder="0"
                />
                <ListboxWrapper
                  value={downloadSpeedUnit}
                  onChange={(value) => setDownloadSpeedUnit(value as 'KB/s' | 'MB/s')}
                  options={['KB/s', 'MB/s']}
                  className="w-24"
                />
              </div>
            </div>

            {/* Upload Speed */}
            <div className="flex items-center justify-between gap-6 mb-4">
              <div className="flex-shrink-0">
                <label className="text-sm font-medium text-[#2D2522]">{t('uploadSpeedLimit')}</label>
                <p className="mt-1 text-xs text-[#8B6A5D]">{t('zeroMeansUnlimited')}</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={uploadSpeedValue}
                  onChange={(e) => setUploadSpeedValue(e.target.value)}
                  className="w-32 rounded-lg border border-[#F0DED8] bg-white px-3 py-2 text-sm text-[#2D2522] placeholder-[#B7A59C] transition-all focus:border-[#FFC3CF] focus:outline-none focus:ring-2 focus:ring-[#FFE6EC]"
                  placeholder="0"
                />
                <ListboxWrapper
                  value={uploadSpeedUnit}
                  onChange={(value) => setUploadSpeedUnit(value as 'KB/s' | 'MB/s')}
                  options={['KB/s', 'MB/s']}
                  className="w-24"
                />
              </div>
            </div>

            {/* Default Download Directory */}
            <div className="flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <label className="text-sm font-medium text-[#2D2522]">{t('defaultDownloadFolder')}</label>
                <p className="mt-1 text-xs text-[#8B6A5D]">{t('defaultSaveLocation')}</p>
              </div>
              <TooltipWrapper content={settings.defaultDownloadDir} disabled={!settings.defaultDownloadDir}>
                <button
                  onClick={handleSelectFolder}
                  className="max-w-xs truncate rounded-lg border border-[#F0DED8] bg-white px-3 py-2 text-left text-sm font-medium text-[#FF5C78] transition-all hover:bg-[#FFF1F4] hover:text-[#E85068]"
                >
                  {settings.defaultDownloadDir || t('selectFolder')}
                </button>
              </TooltipWrapper>
            </div>
          </div>

          {/* Display Settings Section */}
          <div className="rounded-[16px] border border-[#F6D7D3] bg-white/78 p-4 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-[#2D2522]">{t('displaySettings')}</h2>

            {/* Theme */}
            <div className="flex items-center justify-between gap-6 mb-4">
              <div className="flex-shrink-0">
                <label className="text-sm font-medium text-[#2D2522]">{t('theme')}</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalTheme('light')}
                  className={`p-2 rounded-lg transition-all ${
                    localTheme === 'light'
                      ? 'bg-[#FF7D90] text-white'
                      : 'border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]'
                  }`}
                  title={t('lightMode')}
                >
                  <Sun size={18} />
                </button>
                <button
                  onClick={() => setLocalTheme('dark')}
                  className={`p-2 rounded-lg transition-all ${
                    localTheme === 'dark'
                      ? 'bg-[#FF7D90] text-white'
                      : 'border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]'
                  }`}
                  title={t('darkMode')}
                >
                  <Moon size={18} />
                </button>
              </div>
            </div>

            {/* Language */}
            <div className="flex items-center justify-between gap-6">
              <div className="flex-shrink-0">
                <label className="text-sm font-medium text-[#2D2522]">{t('language')}</label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setLocalLanguage('zh')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localLanguage === 'zh'
                      ? 'bg-[#FF7D90] text-white'
                      : 'border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]'
                  }`}
                >
                  {t('chinese')}
                </button>
                <button
                  onClick={() => setLocalLanguage('en')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localLanguage === 'en'
                      ? 'bg-[#FF7D90] text-white'
                      : 'border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]'
                  }`}
                >
                  {t('english')}
                </button>
                <button
                  onClick={() => setLocalLanguage('ja')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    localLanguage === 'ja'
                      ? 'bg-[#FF7D90] text-white'
                      : 'border border-[#F0DED8] bg-white text-[#6B5448] hover:bg-[#FFF1F4]'
                  }`}
                >
                  {t('japanese')}
                </button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={handleReset}
              className="flex-1 rounded-lg border border-[#F0DED8] bg-white px-4 py-2 text-sm font-medium text-[#6B5448] transition-all duration-200 hover:bg-[#FFF1F4]"
            >
              {t('reset')}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 rounded-lg bg-[#FF7D90] px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:bg-[#FF5C78] hover:shadow-lg hover:shadow-[#FF7D90]/25"
            >
              {t('saveSettings')}
            </button>
          </div>
        </div>
      </div>

      {notice && (
        <NoticeModal
          isOpen={true}
          title={t('noticeTitle')}
          message={notice.message}
          variant={notice.variant}
          onClose={() => setNotice(null)}
          onConfirm={() => notice.onConfirm?.()}
        />
      )}
    </div>
  );
};
