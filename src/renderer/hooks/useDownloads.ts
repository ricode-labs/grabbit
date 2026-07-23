import { useState, useCallback } from 'react';

export interface DownloadsData {
  active: any[];
  waiting: any[];
  stopped: any[];
}

export function useDownloads() {
  const [downloads, setDownloads] = useState<DownloadsData>({
    active: [],
    waiting: [],
    stopped: []
  });

  const refreshDownloads = useCallback(async () => {
    try {
      const data = await window.electronAPI.getDownloads();
      setDownloads(data);
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  }, []);

  return { downloads, refreshDownloads };
}
