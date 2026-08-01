import { useState, useCallback } from 'react';
import { mapPreferencesToSettings, type AppSettings } from '../utils/settings';

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    maxDownloadSpeed: 0,
    maxUploadSpeed: 0,
    defaultDownloadDir: ''
  });

  const loadSettings = useCallback(async () => {
    try {
      const loadedSettings = mapPreferencesToSettings(await window.grabbit.getPreferences());
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }, []);

  return { settings, loadSettings };
}
