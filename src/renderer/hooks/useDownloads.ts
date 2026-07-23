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
      const [active, waiting, stopped] = await Promise.all([
        window.aria2.tellActive(),
        window.aria2.tellWaiting({ offset: 0, num: 100 }),
        window.aria2.tellStopped({ offset: 0, num: 100 })
      ]);
      setDownloads({ active, waiting, stopped });
    } catch (error) {
      console.error('Failed to fetch downloads:', error);
    }
  }, []);

  return { downloads, refreshDownloads };
}
