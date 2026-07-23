import { useState, useCallback } from 'react';

export function useHistory() {
  const [historyTasks, setHistoryTasks] = useState<any[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const refreshHistory = useCallback(async () => {
    try {
      const history = await window.electronAPI.getHistory();
      setHistoryTasks(history);
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  }, []);

  return { historyTasks, refreshHistory, isLoaded };
}
