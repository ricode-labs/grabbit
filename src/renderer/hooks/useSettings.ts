import { useState, useCallback } from 'react';

export interface AppSettings {
  maxDownloadSpeed: number;
  maxUploadSpeed: number;
  maxConcurrent: number;
  defaultDownloadDir: string;
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    maxDownloadSpeed: 0,
    maxUploadSpeed: 0,
    maxConcurrent: 5,
    defaultDownloadDir: ''
  });

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = await window.electronAPI.getSettings();
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  return { settings, loadSettings };
}
