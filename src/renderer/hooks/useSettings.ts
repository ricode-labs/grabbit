import { useState, useCallback } from 'react';
import { mapGlobalOptionsToSettings, type AppSettings } from '../utils/settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    maxDownloadSpeed: 0,
    maxUploadSpeed: 0,
    maxConcurrent: 5,
    defaultDownloadDir: ''
  });

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = mapGlobalOptionsToSettings(await window.aria2.getGlobalOption());
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  return { settings, loadSettings };
}
